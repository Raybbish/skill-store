/** Skill Store catalog types — 与 skill-report.schema.json 保持一致(单一来源) */

/** taxonomy 词表(分类 / 标签单一来源) */
export * from "./labels";

export type Hosting = "mirrored" | "indexed";
export type AuditStatus = "pending" | "pass" | "needs_review" | "rejected";

export interface RiskFactor {
  /** null = 尚未审计,无法判断 */
  present: boolean | null;
  detail?: string;
}

export interface RiskFactors {
  scripts?: RiskFactor;
  network?: RiskFactor;
  filesystem?: RiskFactor;
  env_access?: RiskFactor;
  external_commands?: RiskFactor;
}

export interface Evidence {
  factor: keyof RiskFactors | string;
  file: string;
  line?: number | null;
  note?: string;
}

export interface SkillReport {
  schema_version: "1";
  meta: {
    /** owner/repo/name(owner、repo 小写) */
    id: string;
    name: string;
    description?: string;
    upstream: string;
    upstream_commit: string;
    /** sha256 over sorted (path, blob sha) pairs */
    content_hash: string;
    license: string;
    hosting: Hosting;
    mirror_complete?: boolean;
    /** 主分类:featured 标签的 slug(见 labels.ts);未达标为 "uncategorized" 或 null */
    category?: string | null;
    /** 标签:featured:false 标签的 slug 列表(桶内二级筛选;与 category 同一套词表) */
    tags?: string[] | null;
    /** 人工锁定分类:true 时 ingest 不再用启发式覆盖 category/tags(人工补标后置位) */
    category_locked?: boolean;
    version?: string | null;
    publisher: string;
    publisher_verified: boolean;
    duplicate_of?: string | null;
  };
  frontmatter_valid: boolean;
  frontmatter_issues: string[];
  security_audit: {
    status: AuditStatus;
    audited_at: string | null;
    scanner_versions?: Record<string, string>;
    risk_factors: RiskFactors;
    evidence: Evidence[];
  };
  signals: {
    stars_github?: number | null;
    installs_skills_sh?: number | null;
    /** 被哪些社区精选清单收录(Hub 情报:精选信号,内容仍回上游采集) */
    curated_by?: { list: string; category: string }[];
    /** 采集时上游仓库内 SKILL.md 总数(排序降权信号:巨仓 skill 分摊到的 stars 含金量低) */
    repo_skill_count?: number;
    /** 上游仓库 skill 数超过每仓上限(MAX_PER_REPO),本条目来自折叠采样收录 */
    bulk_source?: boolean;
    fetched_at: string;
  };
  token_cost: {
    body_tokens: number;
    method: string;
  };
  /** M1 基准评测结果;未评测为 null(与 pipeline eval/types.ts 的 EvalResult 对应) */
  eval: SkillEval | null;
}

/**
 * M1 评测结果(装/不装双跑,确定性校验器打分)。
 * N/A 语义(产物缺失记 null 不计 0)与写入闸见 pipeline eval/types.ts、jobs/eval.ts。
 */
export interface SkillEval {
  category: string;
  runner: string;
  /** 模型元数据(真实 runner 必填;写入闸拒绝缺失者) */
  model?: string;
  evaluated_at: string;
  /** 0-10;无可评估任务时 null */
  score: number | null;
  /** 相对不装的净增益(百分点);双条件可评估样本不足时 null */
  lift_pp: number | null;
  /** 计入总分的任务数 / 任务总数 */
  evaluable_tasks?: number;
  total_tasks?: number;
  tasks: {
    task: string;
    /** 任务级 N/A(with_skill 未产出) */
    status?: "ok" | "na";
    with_skill: { score: number | null; checks: unknown[]; status?: "ok" | "na"; note?: string };
    without_skill: { score: number | null; checks: unknown[]; status?: "ok" | "na"; note?: string };
    delta: number | null;
  }[];
}

/**
 * 批量源仓库的合集条目:skill 数超过每仓上限(MAX_PER_REPO)时,
 * 除采样收录外,catalog/collections/<owner>/<repo>.json 保留一条仓库级记录指回上游。
 * 与 collection-report.schema.json 保持一致。
 */
export interface CollectionReport {
  schema_version: "1";
  /** owner/repo(GitHub slug,owner 小写) */
  id: string;
  url: string;
  /** 采集时仓库内 SKILL.md 总数 */
  skill_count: number;
  /** 实际采样收录进 catalog/skills 的条数 */
  sampled_count: number;
  stars_github?: number | null;
  fetched_at: string;
}

/** 宽松 licence 集合:可镜像托管 */
export const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Unlicense",
  "CC0-1.0",
  "0BSD",
  "MIT-0",
]);
