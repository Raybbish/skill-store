/**
 * 埋点 beacon —— P0「只攒不花」:schema 今天冻结,前端打点,消费留到 P1(行为回填 scene_tags)。
 *
 * 三事件(与 skill-store-微文案-P0执行方案.html §06 + docs/design/analytics-events.md 对齐,勿改字段名):
 *   { t:"search",  q, sid, ts }
 *   { t:"click",   q, id, pos, sid, ts }
 *   { t:"install", id, ref_q, sid, ts }
 * sid = 匿名会话 id(仅串联 search→click→install,不做用户画像)。
 * install = 复制安装命令 / 下载 zip,P0 能拿到的最强意图信号。
 *
 * 收集端 = Supabase `analytics_events` 表(infra/migrations/2026-07-16-analytics-events.sql,
 * 匿名可插不可读,payload 键=列名,PostgREST 直插零中间层):
 *   NEXT_PUBLIC_ANALYTICS_URL = https://<project>.supabase.co/rest/v1/analytics_events?apikey=<anon>
 *   (apikey 走 URL query 参数,已烘在前端产物里,无新增暴露面。)
 * 未配置时全部 no-op(不阻塞、不报错)。发送用 fetch + keepalive + credentials:"omit":
 * keepalive 保证页面卸载时也能发、不占主线程;credentials:"omit" 使其为非凭据请求 ——
 * 不能用 sendBeacon:它带凭据发出,撞 Supabase REST 的 ACAO:* 通配头,真正的 POST 被浏览器就地拦下(见 send())。
 */

const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL || "";
const SID_KEY = "oms_sid";

type Event =
  | { t: "search"; q: string; sid: string; ts: number }
  | { t: "click"; q?: string; id: string; pos?: number; sid: string; ts: number }
  | { t: "install"; id: string; ref_q?: string; sid: string; ts: number };

function sid(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = sessionStorage.getItem(SID_KEY);
    if (!s) {
      s = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return ""; // 隐私模式/禁用 storage:退化为无 sid,事件仍可发
  }
}

/** 当前 URL 的 ?q=(点击/安装的来源查询,行为回填靠它把「词 → skill」配对) */
function refQ(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search).get("q");
  return q?.trim() || undefined;
}

function send(ev: Event): void {
  if (!ENDPOINT || typeof window === "undefined") return; // collector 未接 = 静默不发
  try {
    // 不能用 sendBeacon:它以「带凭据」模式发出,而 Supabase REST 回 ACAO:* ——
    // 带凭据 + 通配源会被浏览器就地拦下(preflight 过、真正的 POST 根本不发)。
    // 改用 fetch + credentials:"omit"(非凭据),通配源即被接受;keepalive 顶替 beacon 卸载期送达。
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ev),
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    }).catch(() => {});
  } catch {
    /* 埋点绝不影响主流程 */
  }
}

export function trackSearch(q: string): void {
  const query = q.trim();
  if (!query) return;
  send({ t: "search", q: query, sid: sid(), ts: Date.now() });
}

export function trackClick(id: string, pos?: number): void {
  send({ t: "click", q: refQ(), id, ...(pos != null ? { pos } : {}), sid: sid(), ts: Date.now() });
}

export function trackInstall(id: string): void {
  send({ t: "install", id, ref_q: refQ(), sid: sid(), ts: Date.now() });
}
