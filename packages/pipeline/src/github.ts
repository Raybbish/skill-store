/** GitHub API 薄封装:速率限制感知 + 可选 token */

const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "skill-store-ingest",
  };
  if (TOKEN) h.authorization = `Bearer ${TOKEN}`;
  return h;
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    throw new Error(
      `GitHub API 速率限制。恢复时间:${new Date(reset).toISOString()}。设置 GITHUB_TOKEN 可提升到 5000 次/小时。`,
    );
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`);
  return (await res.json()) as T;
}

export interface RepoInfo {
  default_branch: string;
  stargazers_count: number;
  license: { spdx_id: string | null } | null;
  pushed_at: string;
}

export function getRepo(repo: string): Promise<RepoInfo> {
  return gh<RepoInfo>(`/repos/${repo}`);
}

export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export async function getTree(repo: string, ref: string): Promise<{ sha: string; entries: TreeEntry[] }> {
  const data = await gh<{ sha: string; tree: TreeEntry[]; truncated: boolean }>(
    `/repos/${repo}/git/trees/${ref}?recursive=1`,
  );
  if (data.truncated) console.warn(`⚠ ${repo} 树被截断(>100k 条目),结果可能不完整`);
  return { sha: data.sha, entries: data.tree };
}

/** raw.githubusercontent 拉文件,不消耗 API 配额 */
export async function getRaw(repo: string, ref: string, path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
  const res = await fetch(url, { headers: { "user-agent": "skill-store-ingest" } });
  if (!res.ok) throw new Error(`raw ${res.status}: ${url}`);
  return res.text();
}
