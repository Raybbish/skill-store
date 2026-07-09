/**
 * 原作者认领(ADR 0006 M1 第①档):归属公开可读;认领只经 claim_skill RPC(服务端比对
 * auth.identities 里平台已验证的 GitHub login 与 skill id 首段,客户端不可伪造)。
 * 身份 ≠ 背书:徽章只陈述「作者本人认领了这条」,不含任何安全/质量担保。
 */
import type { Session } from "./auth";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface Claim {
  skill_id: string;
  github_login: string;
  created_at: string;
}

export const claimsConfigured = (): boolean => Boolean(URL && KEY);

/** 功能开关(服务端 flag,匿名可查):未上线/RPC 不存在/网络失败一律 false → 入口自隐藏 */
export async function claimsEnabled(): Promise<boolean> {
  if (!claimsConfigured()) return false;
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/claims_enabled`, {
      method: "POST",
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: "{}",
    });
    return r.ok ? Boolean(await r.json()) : false;
  } catch {
    return false;
  }
}

/** 该 skill 当前归属(无认领返回 null);匿名可读 */
export async function getClaim(skillId: string): Promise<Claim | null> {
  if (!claimsConfigured()) return null;
  try {
    const q = new URLSearchParams({
      skill_id: `eq.${skillId}`,
      status: "eq.approved",
      select: "skill_id,github_login,created_at",
      limit: "1",
    });
    const r = await fetch(`${URL}/rest/v1/claims?${q}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    const rows = r.ok ? ((await r.json()) as Claim[]) : [];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** 认领(第①档):服务端裁决,返回 ok/reason;reason 见迁移文件枚举 */
export async function claimSkill(s: Session, skillId: string): Promise<{ ok: boolean; reason: string }> {
  const r = await fetch(`${URL}/rest/v1/rpc/claim_skill`, {
    method: "POST",
    headers: { apikey: KEY, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ p_skill_id: skillId }),
  });
  if (!r.ok) return { ok: false, reason: `rpc-${r.status}` };
  const rows = (await r.json()) as { ok: boolean; reason: string }[];
  return rows[0] ?? { ok: false, reason: "empty" };
}
