/** 构建时直读 catalog(Git 事实源),SSG 用;不依赖任何环境变量。
 *
 *  P0 性能契约(ADR 0007):catalog 只扫**一次**(模块级缓存),getSkill 走 Map O(1)。
 *  之前 SSG 每个详情页触发一次全目录 find → 构建期 O(n²)。
 *  注意:dev 模式下缓存跟随模块生命周期,catalog 变更后需重启 dev server。
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Collection, Skill } from "./skill-types";

export type { Collection, EvalData, Skill } from "./skill-types";
export { byPopularity, fmtInstalls, normStars } from "./skill-utils";

const CATALOG = join(process.cwd(), "../../catalog/skills");

interface Cache { all: Skill[]; visible: Skill[]; byId: Map<string, Skill> }
let CACHE: Cache | null = null;

function scan(): Cache {
  if (CACHE) return CACHE;
  const all: Skill[] = [];
  for (const owner of readdirSync(CATALOG)) {
    for (const repo of readdirSync(join(CATALOG, owner))) {
      for (const name of readdirSync(join(CATALOG, owner, repo))) {
        try {
          const r = JSON.parse(readFileSync(join(CATALOG, owner, repo, name, "skill-report.json"), "utf8"));
          all.push({
            id: r.meta.id, owner, repo, name: r.meta.name, description: r.meta.description,
            license: r.meta.license, hosting: r.meta.hosting, publisher: r.meta.publisher,
            upstream: r.meta.upstream, category: r.meta.category ?? undefined, tags: r.meta.tags ?? [],
            hasMirror: existsSync(join(CATALOG, owner, repo, name, "mirror")),
            duplicateOf: r.meta.duplicate_of ?? null,
            frontmatterValid: r.frontmatter_valid !== false,
            tokens: r.token_cost?.body_tokens ?? 0, stars: r.signals?.stars_github,
            installs: r.signals?.installs_skills_sh ?? null,
            repoSkillCount: r.signals?.repo_skill_count,
            bulkSource: r.signals?.bulk_source === true,
            curatedBy: r.signals?.curated_by ?? [],
            eval: r.eval ?? null,
          });
        } catch { /* skip */ }
      }
    }
  }
  all.sort((a, b) => a.id.localeCompare(b.id));
  const visible = all.filter((s) => !s.duplicateOf && s.frontmatterValid !== false);
  const byId = new Map(all.map((s) => [s.id, s]));
  CACHE = { all, visible, byId };
  return CACHE;
}

/**
 * 读取 catalog 全部条目(模块级缓存,只扫一次)。默认剔除「采集去重的副本」
 * (duplicate_of != null)与「frontmatter 不合规」(frontmatter_valid === false),
 * 即展示层只出真正的、唯一的、规范的 skill。
 * 传 { includeHidden: true } 可拿到未过滤全集(后台/调试用)。
 */
export function allSkills({ includeHidden = false }: { includeHidden?: boolean } = {}): Skill[] {
  const c = scan();
  return includeHidden ? c.all : c.visible;
}

export function getSkill(owner: string, repo: string, name: string): Skill | undefined {
  return scan().byId.get(`${owner}/${repo}/${name}`);
}

/** 按标签 slug 取 skill:主分类命中或标签命中(分类页与标签页共用同一取数) */
export function skillsByLabel(slug: string): Skill[] {
  return allSkills().filter((s) => s.category === slug || (s.tags ?? []).includes(slug));
}

const COLLECTIONS = join(process.cwd(), "../../catalog/collections");
let COLL_CACHE: Collection[] | null = null;

/** 批量源合集条目,按 skill 总数降序;目录不存在返回空 */
export function allCollections(): Collection[] {
  if (COLL_CACHE) return COLL_CACHE;
  const out: Collection[] = [];
  let owners: string[] = [];
  try { owners = readdirSync(COLLECTIONS); } catch { return out; }
  for (const owner of owners) {
    try {
      for (const f of readdirSync(join(COLLECTIONS, owner))) {
        if (!f.endsWith(".json")) continue;
        try {
          const c = JSON.parse(readFileSync(join(COLLECTIONS, owner, f), "utf8"));
          out.push({ id: c.id, url: c.url, skillCount: c.skill_count, sampledCount: c.sampled_count, stars: c.stars_github });
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }
  out.sort((a, b) => b.skillCount - a.skillCount);
  COLL_CACHE = out;
  return out;
}

/** 同品类已评测的 skill,按评测分降序(横评用) */
export function peersByEval(category: string): Skill[] {
  return allSkills()
    .filter((s) => s.eval?.category === category)
    .sort((a, b) => (b.eval!.score - a.eval!.score));
}
