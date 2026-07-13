/** Skill Store catalog types — 与 skill-report.schema.json 保持一致(单一来源) */

/** taxonomy 词表(分类 / 标签单一来源) */
export * from "./labels";
/** 场景词治理(别名归一 + 可见性阈值)与微文案 lint(禁用词 + L1-L6) */
export * from "./sceneTags";
export * from "./copyLint";

export type Hosting = "mirrored" | "indexed";

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
  /** v2(2026-07-05,ADR 0012):security_audit 拆出至 catalog/verdicts 账本(@skill-store/verdicts) */
  schema_version: "1" | "2";
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
    /**
     * 退市墓碑(ADR 0020):上游连续缺席 ≥ DELIST_STREAK 个观测日后盖章。
     * 货架隐藏、详情页留事实行;镜像 / 回执 / appearance / 认领全保留(历史事实)。
     * 重新观测到即撤销(复活)——上游改名回滚 / 误判自愈。
     */
    delisted_at?: string | null;
  };
  frontmatter_valid: boolean;
  frontmatter_issues: string[];
  signals: {
    stars_github?: number | null;
    installs_skills_sh?: number | null;
    /** 被哪些社区精选清单收录(Hub 情报:精选信号,内容仍回上游采集) */
    curated_by?: { list: string; category: string }[];
    /** 采集时上游仓库内 SKILL.md 总数(排序降权信号:巨仓 skill 分摊到的 stars 含金量低) */
    repo_skill_count?: number;
    /** 上游仓库 skill 数超过每仓上限(MAX_PER_REPO),本条目来自折叠采样收录 */
    bulk_source?: boolean;
    /**
     * 出现次数(ADR 0019):同内容(content_hash)在其他仓被观测到的拷贝数。
     * 拷贝不再落条目,记账于清单对象的 items(catalog/lists);本字段是其派生缓存,
     * 由 lists.ts 的 recomputeWorkSignals 从 items 重算——幂等,可随时重放,不手写。
     */
    appear_count?: number;
    /**
     * 被清单引用份数(ADR 0019):引用本作品的 distinct 清单数(catalog/lists)。
     * 策展信号,进排序;与 appear_count 同为派生缓存,同一函数重算。
     */
    list_count?: number;
    /** 连续缺席观测日数(ADR 0020):源成功枚举而条目不在候选集,或仓级 404;重新观测到即清 */
    missing_streak?: number;
    /** 最后一次缺席观测时间(ADR 0020):同日多趟(ingest+enrich)只计一次的幂等闸 */
    missing_at?: string;
    fetched_at: string;
    /**
     * 首次进入 catalog 的时间(ISO):驱动「新上架」榜排序(见 ADR 0016)。
     * 不变式:首次写入时盖章,之后**永不覆盖**(与 eval/copy 同,「采集不冲下游」)。
     * 事实源是 catalog git 历史(首个 `--diff-filter=A` commit);本字段是其物化缓存,
     * 缺失可由 `jobs/backfill-first-seen.ts` 从 git 回填。区别于 `fetched_at`(每次采到/变更即刷新)。
     */
    first_seen_at?: string;
    /**
     * 上游仓库最近一次提交时间(ISO,git %cI):维护活性信号(详情页「上游提交 X 前」)。
     * 取自采集时 `--depth 1` clone 的 HEAD commit,故为**仓库级**(monorepo 内各 skill 共享同一 HEAD 时间),
     * 非单 skill 路径级——精确到路径需非浅克隆的 git 历史,留待后续 clone 策略升级。
     * 每次采集刷新(区别于 first_seen_at 盖一次永不覆盖)。
     */
    upstream_commit_at?: string;
  };
  /**
   * 静态上下文体积:只描述可复现的装载边界,不承诺任一模型的真实调用消耗。
   * 可选:存量条目可能尚未回填(缺失 = 前端「待重算」;ingest 幂等闸会外科式补齐)。
   */
  context_size?: ContextSize;
  /** M1 基准评测结果;未评测为 null(与 pipeline eval/types.ts 的 EvalResult 对应) */
  eval: SkillEval | null;
  /**
   * 派生微文案(P0:llm 生成;M1 认领后可被 author 稿替换)。
   * 与 eval 同级挂顶层,不塞进 meta——meta 是采集事实,copy 是我们的转述,生命周期不同:
   * meta 变 = 内容变了;copy 变 = 转述变了。分开后「重算微文案」永不污染采集事实的 diff。
   * 锚 meta.content_hash(与 verdict 账本同构):不一致 = 过期,下次重算。
   */
  copy?: SkillCopy | null;
  /**
   * 「怎么用」板块(ADR 0025):由 SKILL.md 正文转述的双语上手指引,与 copy 同哲学——
   * 商店的话跟语言走(ADR 0022),锚 meta.content_hash,不一致 = 过期下次重算;
   * 生成侧 howto:llm 写入;认领后可被 author 稿替换(来源三层同微文案,ADR 0013)。
   */
  howto?: SkillHowto | null;
}

export type ContextSizeScopeId =
  | "activation_core"
  | "activation_with_declared_refs"
  | "package_total_text";

export interface ContextSizeCounter {
  id: string;
  method: "official-tokenizer" | "heuristic";
  tokenizer?: string;
  description?: string;
}

/** UI 标签(「最小装载」等)由前端按 scope id 渲染,不固化进 catalog 数据(ADR 0015)。 */
export interface ContextSizeScope {
  /** 被纳入此 scope 的相对文件路径 */
  files: string[];
  /** 文本文件数量;package_total_text 可用它解释包内规模 */
  text_files: number;
  bytes: number;
  chars: number;
  tokens: number;
}

export interface ContextSize {
  version: "1";
  counter: ContextSizeCounter;
  generated_at: string;
  scopes: Record<ContextSizeScopeId, ContextSizeScope>;
}

/** 派生微文案。生成侧 categorize:llm 写入;前端 lint_pass=false 时回退 description 截断(见 copyLint.ts)。 */
export interface SkillCopy {
  /** 一句话用途:动词开头、用户视角、≤40 字 */
  tagline: string;
  /** 场景标签 2~4 个:归一后的词(「什么时候用」,非技术形态) */
  scene_tags: string[];
  /** 「适合你,如果…」一行,仅详情页 */
  fit_line?: string;
  /** 英文转述(ADR 0022 双语):与中文同一次 LLM 调用产出、同锚 content_hash;缺失时前端回退 description 原文 */
  tagline_en?: string;
  scene_tags_en?: string[];
  fit_line_en?: string;
  /** 词的来源:llm | author(M1 认领)。author 稿同样过 lint */
  source: "llm" | "author";
  /** 生成时锚定的 meta.content_hash;不一致 = 过期,下次重算 */
  content_hash: string;
  model: string;
  generated_at: string;
  /** 代码层 lint 结果;false → 前端回退 description 截断,不展示 chips */
  lint_pass: boolean;
}

/** 示例话术:用户装好后可以直接对 Claude 说的一句话;note 可选,说明说了之后会发生什么 */
export interface HowtoSay {
  text: string;
  note?: string;
}

/**
 * 「怎么用」板块内容(ADR 0025)。三段全为事实性转述(文案克制红线):
 * what = 装上后 Claude 的行为怎么变;when = 什么时候触发/接管;say = 示例话术 2~3 条。
 * zh 为主字段(与 SkillCopy 同构),en 可缺——缺失时前端整段回退英文侧不显示、只出原文。
 * 界面署名口径:source=llm 标「商店整理 · 表述以原文为准」,author 标「作者撰写」。
 */
export interface SkillHowto {
  what: string;
  when: string;
  say: HowtoSay[];
  what_en?: string;
  when_en?: string;
  say_en?: HowtoSay[];
  /** 词的来源:llm | author(认领后作者改写;同微文案三来源,行为回填后置) */
  source: "llm" | "author";
  /** 生成时锚定的 meta.content_hash;不一致 = 过期,下次重算(与 copy/verdict 同锚) */
  content_hash: string;
  model?: string;
  generated_at: string;
  /** 代码层 lint 结果;false → 前端整个板块不展示转述段(原文折叠不受影响) */
  lint_pass: boolean;
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
 * 清单对象(ADR 0019):一组对作品的引用,catalog/lists/<owner>/<repo>.json。
 * 聚合仓 / awesome-list / 批量源统一入此;官方场景包(catalog/packs)是同一抽象的
 * editorial 形态,S2 统一渲染。清单仓内容零上架:拷贝不再进 catalog/skills,
 * hash 命中 canonical 的引用记入 items(即 appearance 的 S0 静态账本),
 * 作品条目的 appear_count / list_count 由 items 派生重算(见 pipeline/lists.ts)。
 * 与 list-report.schema.json 保持一致。
 */
export interface ListReport {
  schema_version: "1";
  /** owner/repo(GitHub slug,owner 小写) */
  id: string;
  /** imported = 外来清单。S0 全部只进数据不上架(ADR 0019 裁决);source_repo 对用户隐身 */
  kind: "imported";
  url: string;
  /** 策展人署名:认领后本人填,机器不代写(留空 = 未认领) */
  curator?: string;
  /** 推荐语:同上,留空待本人填 */
  note?: string;
  /** 上游仓自述(GitHub repo description):采集事实,非本店转述;随采集刷新 */
  description?: string;
  /** 仓内 SKILL.md 总数(克隆时点;跳采仓可能缺,沿用上次值) */
  file_count?: number;
  stars_github?: number | null;
  /** 拦截:批量源(生成/搬运,file_count ≥ BULK_SIGNAL_ONLY)零内容上架,仅收录页留痕 */
  blocked?: boolean;
  /** 拦截依据,如 "bulk>=1000" */
  block_reason?: string;
  /** 引用账本:内容 hash 命中 canonical 作品的拷贝,work = 作品三段式 id */
  items?: { work: string; name?: string }[];
  /** = items.length(冗余,读侧方便) */
  resolved_count?: number;
  /** 仍在货架的采样条目数(存量原创大仓遗留);拦截仓恒 0 */
  sampled_count: number;
  fetched_at: string;
}

/**
 * @deprecated ADR 0019:合集记录已升级为清单对象(ListReport,catalog/lists/)。
 * 本类型仅供 migrate-lists 读取存量 catalog/collections/,迁移完成后随目录一并移除。
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
