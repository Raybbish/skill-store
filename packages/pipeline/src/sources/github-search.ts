/**
 * GitHub 全域采集器(架构图第③源)。用 GitHub 官方搜索 API 找带 skill topic 的仓库,
 * 按 stars 取头部,复用 official 的 clone 逻辑采集 SKILL.md,注入 stars 信号。
 *
 * 相比 skills.sh 私有 registry:GitHub search 是公开稳定 API,可靠可复现。
 * 环境:GH_SEARCH_QUERY 覆盖查询(默认 topic:claude-skills);GITHUB_TOKEN 提升限流。
 * 注:需公网可达 api.github.com——本机/CI 运行(采集沙箱通常只放行 github.com clone)。
 */
import type { SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "./official.ts";

const QUERY = process.env.GH_SEARCH_QUERY ?? "topic:claude-skills";
const TOKEN = process.env.GITHUB_TOKEN;

interface RepoHit { repoSlug: string; stars: number; archived: boolean; fork: boolean }

async function searchRepos(limit: number): Promise<RepoHit[]> {
  const hits: RepoHit[] = [];
  const perPage = Math.min(100, limit);
  for (let page = 1; hits.length < limit; page++) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(QUERY)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "oh-my-skill-ingest",
        ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub search ${res.status}(需 api.github.com 可达,建议本机/CI + GITHUB_TOKEN)`);
    const data = (await res.json()) as { items: { full_name: string; stargazers_count: number; archived: boolean; fork: boolean }[] };
    if (!data.items?.length) break;
    for (const it of data.items) {
      hits.push({ repoSlug: it.full_name, stars: it.stargazers_count, archived: it.archived, fork: it.fork });
      if (hits.length >= limit) break;
    }
    if (data.items.length < perPage) break; // 最后一页
    if (page >= 10) break; // GitHub search 上限 1000 条
  }
  return hits;
}

/** 采集 GitHub 上 skill topic 头部仓库;跳过 fork/archived,注入 stars 信号 */
export async function discoverFromGitHub(limit = 100): Promise<{ candidates: SkillCandidate[]; cleanup: () => Promise<void> }> {
  const repos = (await searchRepos(limit)).filter((r) => !r.fork && !r.archived);
  console.log(`  搜索命中 ${repos.length} 个仓库(query: ${QUERY})`);

  const out: SkillCandidate[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  for (const r of repos) {
    try {
      const { candidates, cleanup } = await discoverFromRepo(r.repoSlug);
      cleanups.push(cleanup);
      for (const c of candidates) {
        (c.report as SkillReport).signals.stars_github = r.stars;
        out.push(c);
      }
      if (candidates.length) console.log(`    ${r.repoSlug}: ${candidates.length} skill(★${r.stars})`);
    } catch (e) {
      console.warn(`  ✗ ${r.repoSlug} 采集失败: ${(e as Error).message}`);
    }
  }
  return { candidates: out, cleanup: async () => { await Promise.all(cleanups.map((f) => f().catch(() => {}))); } };
}
