/**
 * 轻量邮箱 OTP 客户端(ADR 0017 砖二)——手写 GoTrue REST,零新依赖,符合仓风格。
 * 延迟注册:浏览/下载全程匿名;只在「写短评」时走 requestOtp → verifyOtp,
 * 登录成功即调 claimReceipts 把匿名回执(rid / 命令 token)并入账号。
 * 会话存 localStorage;access_token 到期用 refresh_token 静默续期,续不动就退登(用户重输验证码)。
 * 未配置 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 时一切 no-op(与 receipts.ts 同门禁)。
 */
import { rid, ridToken } from "./receipts";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const STORE = "oms_auth";

export interface Session {
  access_token: string;
  refresh_token: string;
  /** Unix 秒 */
  expires_at: number;
  /** github_login:平台验证过的 GitHub 身份(auth.identities),GitHub 登录才有;
   *  署名显示与工作台(/studio)预填用,服务端裁决仍只认 auth.identities,此字段伪造无效 */
  user: { id: string; email?: string; github_login?: string };
}

export const authConfigured = (): boolean => Boolean(URL && KEY);

function load(): Session | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(STORE) ?? "null") as Session | null; } catch { return null; }
}
function save(s: Session | null): void {
  try { s ? localStorage.setItem(STORE, JSON.stringify(s)) : localStorage.removeItem(STORE); } catch { /* 忽略 */ }
  // 会话落盘即广播:导航账号位等常驻组件靠它即时刷新(修「登录后导航仍显示‘登录'」)
  try { window.dispatchEvent(new Event(AUTH_EVENT)); } catch { /* SSR 忽略 */ }
}

/** 会话变更事件名(登录/退出/续期都触发;storage 事件补跨标签页) */
const AUTH_EVENT = "oms:auth";

/**
 * 订阅登录态变化:同页由 save() 广播,跨标签页由 storage 事件兜底。
 * 返回退订函数。仅客户端可调(挂在 useEffect 里天然满足)。
 */
export function onAuthChange(fn: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key === STORE) fn(); };
  window.addEventListener(AUTH_EVENT, fn);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_EVENT, fn);
    window.removeEventListener("storage", onStorage);
  };
}

async function gotrue(path: string, body: unknown): Promise<Record<string, unknown>> {
  const r = await fetch(`${URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: KEY, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(String((data.msg ?? data.error_description ?? data.message) || `auth ${r.status}`));
  return data;
}

/** 从 GoTrue user 对象提取 GitHub login(identities 优先,user_metadata 兜底);非 GitHub 登录返回 undefined */
function ghLoginOf(u: Record<string, unknown> | undefined): string | undefined {
  if (!u) return undefined;
  const ids = (u.identities as { provider?: string; identity_data?: Record<string, unknown> }[] | undefined) ?? [];
  const gh = ids.find((i) => i.provider === "github")?.identity_data;
  const meta = (u.user_metadata as Record<string, unknown> | undefined) ?? {};
  const fromMeta =
    ((u.app_metadata as { provider?: string } | undefined)?.provider === "github"
      ? (meta.user_name ?? meta.preferred_username)
      : undefined);
  const v = gh?.user_name ?? gh?.preferred_username ?? fromMeta;
  return typeof v === "string" && v ? v : undefined;
}

function toSession(d: Record<string, unknown>): Session {
  const user = d.user as { id: string; email?: string };
  return {
    access_token: String(d.access_token),
    refresh_token: String(d.refresh_token),
    expires_at: Number(d.expires_at ?? Math.floor(Date.now() / 1000) + Number(d.expires_in ?? 3600)),
    user: { id: user.id, email: user.email, github_login: ghLoginOf(d.user as Record<string, unknown>) },
  };
}

/**
 * 发登录邮件(双轨):默认模板发「登录链接」(点开经 GoTrue verify 重定向回 redirectTo,
 * 令牌在 URL hash,由 sessionFromUrlHash 接住);接了自定义 SMTP 且模板含 {{ .Token }} 时
 * 同一封信会带 6 位码,走 verifyOtp 输码轨。两轨并存,用户哪个到手用哪个。
 */
export async function requestOtp(email: string, redirectTo?: string, locale?: string): Promise<void> {
  const q = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
  // data.locale → 新用户 user_metadata,邮件模板据此分支中英({{ if eq .Data.locale "zh" }});
  // GoTrue 对已存在用户忽略 data(locale 定格在首登语言,可接受——上线时无存量用户)
  await gotrue(`otp${q}`, { email, create_user: true, ...(locale ? { data: { locale } } : {}) });
}

/**
 * 接住魔法链接回跳:GoTrue verify 后把令牌放在 URL hash(#access_token=…&refresh_token=…)。
 * 命中则建会话、并入匿名回执、抹掉 hash(防刷新重放/泄露到浏览历史);未命中返回 null。
 */
export async function sessionFromUrlHash(): Promise<Session | null> {
  if (typeof window === "undefined" || !window.location.hash.includes("access_token=")) return null;
  const h = new URLSearchParams(window.location.hash.slice(1));
  const access_token = h.get("access_token");
  const refresh_token = h.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  // OAuth 回跳会多带 provider_token(GitHub access token):只进 sessionStorage(关标签页即弃),
  // 仅 /studio 扫仓用(公开数据检索);服务端裁决从不信它
  const pt = h.get("provider_token");
  if (pt) { try { sessionStorage.setItem(GH_TOKEN_STORE, pt); } catch { /* 忽略 */ } }
  try {
    const r = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: KEY, authorization: `Bearer ${access_token}` } });
    if (!r.ok) return null;
    const u = (await r.json()) as { id: string; email?: string };
    const s: Session = {
      access_token,
      refresh_token,
      expires_at: Number(h.get("expires_at") ?? Math.floor(Date.now() / 1000) + 3600),
      user: { id: u.id, email: u.email, github_login: ghLoginOf(u as unknown as Record<string, unknown>) },
    };
    save(s);
    void claimReceipts(s);
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return s;
  } catch {
    return null;
  }
}

/** 校验 6 位码 → 建会话 → 并入匿名回执 */
export async function verifyOtp(email: string, code: string): Promise<Session> {
  const s = toSession(await gotrue("verify", { type: "email", email, token: code.trim() }));
  save(s);
  void claimReceipts(s); // 登录即并入,失败不阻塞(资格检查前还会再试)
  return s;
}

/** 取有效会话:临期(60s 内)自动续;续不动清会话返回 null */
export async function getSession(): Promise<Session | null> {
  const s = load();
  if (!s) return null;
  if (s.expires_at - Date.now() / 1000 > 60) return s;
  try {
    const next = toSession(await gotrue("token?grant_type=refresh_token", { refresh_token: s.refresh_token }));
    save(next);
    return next;
  } catch {
    save(null);
    return null;
  }
}

export function signOut(): void {
  save(null);
  try { sessionStorage.removeItem(GH_TOKEN_STORE); } catch { /* 忽略 */ }
}

/**
 * GitHub OAuth 登录跳转地址(全站登录选项,2026-07-12 裁决升级;此前仅认领用):
 * Supabase authorize 端点,回跳后令牌在 hash,由 sessionFromUrlHash 接住——与魔法链接同一条回收管道。
 * 注意:这是「以 GitHub 登录」,不是往邮箱账号上链接身份(手动 linking 需额外配置,M1 不做);
 * 作者用 GitHub 登录产生的账号与其邮箱账号可能是两个,可接受,见 ADR 0006 补充。
 */
export function githubAuthorizeUrl(redirectTo: string): string {
  return `${URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectTo)}`;
}

/** OAuth 回跳捕获的 GitHub provider token(sessionStorage,关标签页即弃);没有 = 需重新 GitHub 登录 */
const GH_TOKEN_STORE = "oms_ghtok";
export function githubToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(GH_TOKEN_STORE); } catch { return null; }
}

/**
 * 把匿名回执并入当前账号(idempotent,随便重复调):
 * rid 覆盖网页下载;token(rid 前 8 位)覆盖「复制命令 → CLI 装机」。
 * 纯 CLI 直装的 machine_id 回执需 CLI 登录(M2),诚实边界。
 */
export async function claimReceipts(s: Session): Promise<number> {
  if (!authConfigured()) return 0;
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/claim_receipts`, {
      method: "POST",
      headers: { apikey: KEY, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
      body: JSON.stringify({ p_rid: rid() || null, p_token: ridToken() || null }),
    });
    return r.ok ? Number(await r.json()) : 0;
  } catch {
    return 0;
  }
}
