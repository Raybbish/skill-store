/** 构建时直读 catalog(Git 事实源),SSG 用;不依赖任何环境变量 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface Factor { present: boolean | null; detail?: string }
export interface EvalData {
  category: string; runner: string; score: number; lift_pp: number;
  tasks: { task: string; with_skill: { score: number }; without_skill: { score: number }; delta: number }[];
}
export interface Skill {
  id: string; owner: string; repo: string; name: string; description?: string;
  license: string; hosting: string; publisher: string; upstream: string;
  /** 主分类 slug(featured 标签);未归类为 "uncategorized"/undefined */
  category?: string;
  /** 标签 slug 列表(featured:false 标签) */
  tags?: string[];
  /** 是否已下载 mirror/ 副本(决定能否提供 zip 下载;否则回上游) */
  hasMirror?: boolean;
  /** 采集去重:非 null 表示本条是另一条(canonical)的副本/搬运;默认列表隐藏 */
  duplicateOf?: string | null;
  /** SKILL.md frontmatter 是否合规;false(不合规)默认列表隐藏 */
  frontmatterValid?: boolean;
  status: string; risk: Record<string, Factor>;
  evidence: { factor: string; file: string; line?: number | null; note?: string }[];
  review?: { verdict: string; by: string; at: string; note: string };
  l3?: { model: string; verdict?: { intent_summary: string } };
  tokens: number; stars?: number | null;
  installs?: number | null;
  /** 上游仓库 SKILL.md 总数(巨仓降权信号) */
  repoSkillCount?: number;
  /** 来自批量源仓库的折叠采样条目 */
  bulkSource?: boolean;
  curatedBy?: { list: string; category: string }[];
  eval?: EvalData | null;
}

/** 批量源仓库合集条目(catalog/collections) */
export interface Collection {
  id: string; url: string; skillCount: number; sampledCount: number; stars?: number | null;
}

const CATALOG = join(process.cwd(), "../../catalog/skills");

/**
 * 读取 catalog 全部条目。默认剔除「采集去重的副本」(duplicate_of != null)
 * 与「frontmatter 不合规」(frontmatter_valid === false),即展示层只出真正的、唯一的、
 * 规范的 skill。传 { includeHidden: true } 可拿到未过滤全集(后台/调试用)。
 */
export function allSkills({ includeHidden = false }: { includeHidden?: boolean } = {}): Skill[] {
  const out: Skill[] = [];
  for (const owner of readdirSync(CATALOG)) {
    for (const repo of readdirSync(join(CATALOG, owner))) {
      for (const name of readdirSync(join(CATALOG, owner, repo))) {
        try {
          const r = JSON.parse(readFileSync(join(CATALOG, owner, repo, name, "skill-report.json"), "utf8"));
          const sa = r.security_audit;
          out.push({
            id: r.meta.id, owner, repo, name: r.meta.name, description: r.meta.description,
            license: r.meta.license, hosting: r.meta.hosting, publisher: r.meta.publisher,
            upstream: r.meta.upstream, category: r.meta.category ?? undefined, tags: r.meta.tags ?? [],
            hasMirror: existsSync(join(CATALOG, owner, repo, name, "mirror")),
            duplicateOf: r.meta.duplicate_of ?? null,
            frontmatterValid: r.frontmatter_valid !== false,
            status: sa.status, risk: sa.risk_factors ?? {},
            evidence: sa.evidence ?? [], review: sa.review, l3: sa.l3,
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
  const visible = includeHidden
    ? out
    : out.filter((s) => !s.duplicateOf && s.frontmatterValid !== false);
  return visible.sort((a, b) => a.id.localeCompare(b.id));
}

export function getSkill(owner: string, repo: string, name: string): Skill | undefined {
  return allSkills().find((s) => s.owner === owner && s.repo === repo && s.name === name);
}

/** 按标签 slug 取 skill:主分类命中或标签命中(分类页与标签页共用同一取数) */
export function skillsByLabel(slug: string): Skill[] {
  return allSkills().filter((s) => s.category === slug || (s.tags ?? []).includes(slug));
}

const COLLECTIONS = join(process.cwd(), "../../catalog/collections");

/** 批量源合集条目,按 skill 总数降序;目录不存在返回空 */
export function allCollections(): Collection[] {
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
  return out.sort((a, b) => b.skillCount - a.skillCount);
}

/** 安装量友好格式:1234567 → 1.2M */
export function fmtInstalls(n: number): string {
  if (n >= 1e6) return `${Math.round(n / 1e5) / 10}M`;
  if (n >= 1e3) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

/** stars 按 repo_skill_count 归一,抑制巨仓(单 skill 仓不变;N-skill 仓 ÷√N);无 stars 记 0 */
export function normStars(s: Skill): number {
  if (s.stars == null) return 0;
  return s.stars / Math.sqrt(Math.max(1, s.repoSkillCount ?? 1));
}

/** 货架统一排序:归一 stars 主键,installs 兜底次键(给仅 skills.sh 有数的少数条目排序) */
export function byPopularity(a: Skill, b: Skill): number {
  const d = normStars(b) - normStars(a);
  return d !== 0 ? d : (b.installs ?? 0) - (a.installs ?? 0);
}

/** 同品类已评测的 skill,按评测分降序(横评用) */
export function peersByEval(category: string): Skill[] {
  return allSkills()
    .filter((s) => s.eval?.category === category)
    .sort((a, b) => (b.eval!.score - a.eval!.score));
}

export const FACTOR_LABELS: Record<string, [string, string]> = {
  scripts: ["📜", "脚本执行"], network: ["🌐", "网络请求"], filesystem: ["📂", "文件读写"],
  env_access: ["🔑", "环境变量"], external_commands: ["⚙️", "外部命令"],
};
