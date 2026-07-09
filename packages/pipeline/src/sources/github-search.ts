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

/**
 * 批量源阈值(ADR 0019):仓内 skill 数达到此值即判「非单作者原创」(生成或搬运),
 * 零内容上架,只产出清单记录(blocked)。这是 §08 已知局限里那次「仓级判断」的
 * 结构化形态——1000+ 文件不属灰区;50~1000 的灰区按偏置规则照旧采样(偏向收)。
 */
const SIGNAL_ONLY = Number(process.env.BULK_SIGNAL_ONLY) || 1000;

/** 采集侧产出的清单草稿:由 ingest 与既有 catalog/lists 记录合并落盘(保留 items/curator/blocked) */
export interface ListDraft {
  id: string;
  url: string;
  stars_github: number | null;
  /** 上游仓自述(GitHub repo description):采集事实,搜索 API 免克隆即有 */
  description?: string | null;
  /** 克隆时点的 SKILL.md 总数;拦截仓跳采时缺省(沿用上次值) */
  file_count?: number;
  /** 本次采样进候选的条数(仅 >cap 未拦截仓) */
  sampled_count?: number;
  blocked?: boolean;
  block_reason?: string;
}

interface RepoHit { repoSlug: string; stars: number; archived: boolean; fork: boolean; description: string | null }

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
    const data = (await res.json()) as { items: { full_name: string; stargazers_count: number; archived: boolean; fork: boolean; description: string | null }[] };
    if (!data.items?.length) break;
    for (const it of data.items) {
      hits.push({ repoSlug: it.full_name, stars: it.stargazers_count, archived: it.archived, fork: it.fork, description: it.description ?? null });
      if (hits.length >= limit) break;
    }
    if (data.items.length < perPage) break; // 最后一页
    if (page >= 10) break; // GitHub search 上限 1000 条
  }
  return hits;
}

/**
 * 每仓折叠采样:超过上限的仓库视为批量源(生成器灌注/聚合搬运),只取采样 N 条。
 * 参考 buildwithclaude 的 isMarketplace() 折叠思路;与 hub-signals 共用 MAX_PER_REPO。
 * 采样优先级:frontmatter 合规 > 有 description > 原目录顺序(稳定排序)。
 */
function capPerRepo(candidates: SkillCandidate[], cap: number): SkillCandidate[] {
  for (const c of candidates) (c.report as SkillReport).signals.repo_skill_count = candidates.length;
  if (candidates.length <= cap) return candidates;
  const kept = candidates
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const fm = Number(b.c.report.frontmatter_valid) - Number(a.c.report.frontmatter_valid);
      if (fm) return fm;
      const desc = Number(!!b.c.report.meta.description) - Number(!!a.c.report.meta.description);
      if (desc) return desc;
      return a.i - b.i;
    })
    .slice(0, cap)
    .map(({ c }) => c);
  for (const c of kept) (c.report as SkillReport).signals.bulk_source = true;
  return kept;
}

/** 采集 GitHub 上 skill topic 头部仓库;跳过 fork/archived,注入 stars 信号。
 *  ADR 0019 三档处置:已拦截仓(blocked)连克隆都跳过,只刷新清单记录;
 *  新仓 ≥ SIGNAL_ONLY → 零候选 + 拦截清单记录;>cap 灰区 → 折叠采样 + 清单记录。 */
export async function discoverFromGitHub(limit = 100, blockedIds: Set<string> = new Set()): Promise<{
  candidates: SkillCandidate[];
  lists: ListDraft[];
  cleanup: () => Promise<void>;
}> {
  const repos = (await searchRepos(limit)).filter((r) => !r.fork && !r.archived);
  const maxPerRepo = Number(process.env.MAX_PER_REPO) || 50;
  console.log(`  搜索命中 ${repos.length} 个仓库(query: ${QUERY},每仓上限 ${maxPerRepo},拦截阈值 ${SIGNAL_ONLY})`);

  const out: SkillCandidate[] = [];
  const lists: ListDraft[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  for (const r of repos) {
    const [owner, repoName] = r.repoSlug.split("/");
    const listId = `${owner.toLowerCase()}/${repoName}`;
    // 已拦截仓:不克隆(klotzkette 2.6 万文件的 clone 白费),只刷新 stars/fetched_at
    if (blockedIds.has(listId.toLowerCase())) {
      lists.push({ id: listId, url: `https://github.com/${r.repoSlug}`, stars_github: r.stars, description: r.description, blocked: true });
      console.log(`    ${r.repoSlug}: 已拦截(blocked),跳过克隆,仅刷新清单记录(★${r.stars})`);
      continue;
    }
    try {
      const { candidates, cleanup } = await discoverFromRepo(r.repoSlug);
      cleanups.push(cleanup);
      // 新仓命中拦截阈值:零内容上架,清单记录留痕(收录页可见,错拦可被人工纠正=加入 sources.yaml)
      if (candidates.length >= SIGNAL_ONLY) {
        lists.push({
          id: listId, url: `https://github.com/${r.repoSlug}`, stars_github: r.stars, description: r.description,
          file_count: candidates.length, blocked: true, block_reason: `bulk>=${SIGNAL_ONLY}`,
        });
        console.log(`    ${r.repoSlug}: ${candidates.length} skill ≥ ${SIGNAL_ONLY} → 拦截,零候选 + 清单记录(★${r.stars})`);
        continue;
      }
      const kept = capPerRepo(candidates, maxPerRepo);
      for (const c of kept) {
        (c.report as SkillReport).signals.stars_github = r.stars;
        out.push(c);
      }
      if (kept.length < candidates.length) {
        lists.push({
          id: listId, url: `https://github.com/${r.repoSlug}`, stars_github: r.stars, description: r.description,
          file_count: candidates.length, sampled_count: kept.length,
        });
        console.log(`    ${r.repoSlug}: ${candidates.length} skill → 批量源折叠,采样 ${kept.length} + 清单记录(★${r.stars})`);
      } else if (candidates.length) console.log(`    ${r.repoSlug}: ${candidates.length} skill(★${r.stars})`);
    } catch (e) {
      console.warn(`  ✗ ${r.repoSlug} 采集失败: ${(e as Error).message}`);
    }
  }
  return { candidates: out, lists, cleanup: async () => { await Promise.all(cleanups.map((f) => f().catch(() => {}))); } };
}
