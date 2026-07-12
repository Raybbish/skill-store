/**
 * 提交未收录仓库(ADR 0023「作者自助导入」第二半):写入只经 submit_repo RPC
 * (SECURITY DEFINER,服务端验证 owner == 平台已验证 GitHub login,客户端不可伪造);
 * 读只读自己的(RLS)。开关与认领共用(claims_enabled),入口跟着自隐藏。
 */
import type { Session } from "./auth";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface Submission {
  repo: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export const submissionsConfigured = (): boolean => Boolean(URL && KEY);

/** 我的提交(工作台显示「已提交,待收录」;RLS 只回自己的行) */
export async function mySubmissions(s: Session): Promise<Submission[]> {
  if (!submissionsConfigured()) return [];
  try {
    const q = new URLSearchParams({ select: "repo,status,created_at", order: "created_at.desc" });
    const r = await fetch(`${URL}/rest/v1/submissions?${q}`, {
      headers: { apikey: KEY, authorization: `Bearer ${s.access_token}` },
    });
    return r.ok ? ((await r.json()) as Submission[]) : [];
  } catch {
    return [];
  }
}

/** 提交一个仓("owner/name"):服务端裁决,返回 ok/reason;reason 枚举见迁移文件 */
export async function submitRepo(s: Session, repo: string): Promise<{ ok: boolean; reason: string }> {
  const r = await fetch(`${URL}/rest/v1/rpc/submit_repo`, {
    method: "POST",
    headers: { apikey: KEY, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ p_repo: repo }),
  });
  if (!r.ok) return { ok: false, reason: `rpc-${r.status}` };
  const rows = (await r.json()) as { ok: boolean; reason: string }[];
  return rows[0] ?? { ok: false, reason: "empty" };
}

/** GitHub 代码搜索:登录者名下含 SKILL.md 的公开仓(用 OAuth 回跳带的 provider token,只查公开数据)。
 *  失败抛错(配额/token 过期),调用方给「重新用 GitHub 登录」或手填出路。 */
export async function scanGithubSkillRepos(login: string, token: string): Promise<string[]> {
  const q = encodeURIComponent(`filename:SKILL.md user:${login}`);
  const r = await fetch(`https://api.github.com/search/code?q=${q}&per_page=100`, {
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`github ${r.status}`);
  const data = (await r.json()) as { items?: { repository?: { full_name?: string; fork?: boolean } }[] };
  const repos = new Set<string>();
  for (const it of data.items ?? []) {
    const full = it.repository?.full_name;
    if (full && !it.repository?.fork) repos.add(full); // 排除 fork:与认领防滥用口径一致(ADR 0006)
  }
  return [...repos];
}
