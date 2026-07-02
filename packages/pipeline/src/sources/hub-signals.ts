/**
 * Hub 精选信号线(架构图:第三方 Hub → 信号 → 回上游采集)。
 *
 * 情报不当货:我们只读社区精选清单(awesome-list)公开的「哪些 skill 被收录 + 归为什么类」,
 * 内容一律回上游 GitHub 采集。awesome-list 是 MIT 公开 markdown,本就以被引用为目的。
 *
 * 相比 skills.sh 私有安装量:awesome-list 是公开可测、合规、且「被收录=精选」比纯流行度
 * 更契合本店的质量定位;还顺带补上 category(M0 采集拿不到的字段)。
 *
 * 环境:HUB_LISTS 覆盖清单(逗号分隔 owner/repo),默认 VoltAgent/awesome-agent-skills。
 * 注:需拉 raw.githubusercontent 与 clone 上游——本机/CI 运行。
 */
import type { SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "./official.ts";

const LISTS = (process.env.HUB_LISTS ?? "VoltAgent/awesome-agent-skills").split(",").map((s) => s.trim());

export interface CuratedEntry {
  repoSlug: string;
  subpath: string;
  category: string;
  list: string;
}

/** 解析 awesome-list README:提取 `- **[name](github-url)** - desc` 条目 + 最近的分类标题 */
export function parseAwesomeList(md: string, listName: string): CuratedEntry[] {
  const out: CuratedEntry[] = [];
  let category = "";
  for (const line of md.split("\n")) {
    const h = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (h) { category = h[1].replace(/[#*`]/g, "").trim(); continue; }
    // - **[name](https://github.com/owner/repo[/tree/branch/path])** - desc
    const m = line.match(/^\s*[-*]\s+.*?\((https:\/\/github\.com\/[^)]+)\)/);
    if (!m) continue;
    const u = m[1].match(/github\.com\/([^/]+\/[^/#?]+?)(?:\.git)?(?:\/tree\/[^/]+\/(.*))?$/i);
    if (!u) continue;
    out.push({ repoSlug: u[1], subpath: (u[2] ?? "").replace(/\/$/, ""), category, list: listName });
  }
  return out;
}

async function fetchList(repoSlug: string): Promise<CuratedEntry[]> {
  for (const branch of ["main", "master"]) {
    const res = await fetch(`https://raw.githubusercontent.com/${repoSlug}/${branch}/README.md`, {
      headers: { "user-agent": "oh-my-skill-ingest" },
    });
    if (res.ok) return parseAwesomeList(await res.text(), repoSlug);
  }
  throw new Error(`拉取 ${repoSlug} README 失败(需 raw.githubusercontent 可达)`);
}

/** 用精选清单作候选仓,回上游采集,注入 curated_by + category 信号 */
export async function discoverFromHubSignals(limit = 300): Promise<{ candidates: SkillCandidate[]; cleanup: () => Promise<void> }> {
  const entries: CuratedEntry[] = [];
  for (const list of LISTS) {
    try {
      const es = await fetchList(list);
      console.log(`  ${list}: 精选 ${es.length} 条`);
      entries.push(...es);
    } catch (e) {
      console.warn(`  ✗ ${(e as Error).message}`);
    }
  }

  // 按上游仓分组(一个 repo 可能被收录多次/多分类)
  const byRepo = new Map<string, CuratedEntry[]>();
  for (const e of entries) (byRepo.get(e.repoSlug) ?? byRepo.set(e.repoSlug, []).get(e.repoSlug)!).push(e);

  const out: SkillCandidate[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  let repoCount = 0;
  for (const [repoSlug, group] of byRepo) {
    if (out.length >= limit) break;
    if (++repoCount > 500) break; // 防御:awesome-list 可能列上千仓
    try {
      const { candidates, cleanup } = await discoverFromRepo(repoSlug);
      cleanups.push(cleanup);
      for (const c of candidates) {
        const sub = c.report.meta.upstream.match(/\/tree\/[^/]+\/(.*)$/)?.[1] ?? "";
        // 匹配该 skill 对应的收录条目(subpath 命中,或整仓收录)
        const hits = group.filter((g) => g.subpath === sub || g.subpath === "");
        if (!hits.length && group.some((g) => g.subpath)) continue; // 指定了子路径但都不匹配→跳过
        const r = c.report as SkillReport;
        r.signals.curated_by = hits.map((h) => ({ list: h.list, category: h.category }));
        if (!r.meta.category && hits[0]?.category) r.meta.category = hits[0].category;
        out.push(c);
      }
    } catch (e) {
      console.warn(`  ✗ ${repoSlug} 采集失败: ${(e as Error).message}`);
    }
  }
  return { candidates: out, cleanup: async () => { await Promise.all(cleanups.map((f) => f().catch(() => {}))); } };
}
