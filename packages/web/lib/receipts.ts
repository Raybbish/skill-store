/**
 * 安装回执(ADR 0017 隐形验证 · M1 砖一):web 侧「下载 .skill / .zip」时向 Supabase 插一条匿名回执。
 *
 * 与 analytics.ts 的三事件(行为埋点,只攒不花)彻底分离:回执=「从本店安装」的获取渠道留痕,
 * 表 install_receipts(匿名可插不可读,见 infra/migrations/2026-07-08-install-receipts.sql)。
 *
 * - rid:localStorage 匿名会话 id——跨访问稳定,将来登录后把同 rid 回执并入账号(延迟注册)。
 * - ridToken():rid 派生 8 位短 token,内嵌进「复制安装命令」(--t):CLI 装机回执带回,
 *   即 ADR 0017 §3.2 路径②的绑定线索——绑定藏在复制动作里,用户无感。
 * - 未配置 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 时全部 no-op,绝不影响主流程。
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const RID_KEY = "oms_rid";

/** 匿名回执会话 id(localStorage;隐私模式/禁 storage 时退化为空,回执仍可发只是不串联) */
export function rid(): string {
  if (typeof window === "undefined") return "";
  try {
    let r = localStorage.getItem(RID_KEY);
    if (!r) {
      r = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(RID_KEY, r);
    }
    return r;
  } catch {
    return "";
  }
}

/** 复制命令内嵌短 token(rid 派生 8 位);无 rid 时为空串(命令不带 --t) */
export function ridToken(): string {
  const r = rid();
  return r ? r.replace(/-/g, "").slice(0, 8) : "";
}

/** 发一条回执;下载场景 fire-and-forget(忽略返回值),网页 verify 场景 await 它再查资格 */
export async function postReceipt(skillId: string, channel: "download" | "verify", contentHash?: string): Promise<void> {
  if (!URL || !KEY || typeof window === "undefined") return;
  try {
    await fetch(`${URL}/rest/v1/install_receipts`, {
      method: "POST",
      keepalive: true, // 页面即将跳转/下载时也尽量送达
      headers: {
        apikey: KEY,
        authorization: `Bearer ${KEY}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        skill_id: skillId,
        channel,
        ...(contentHash ? { content_hash: contentHash } : {}),
        rid: rid() || null,
      }),
    });
  } catch {
    /* 回执绝不影响下载主流程 */
  }
}
