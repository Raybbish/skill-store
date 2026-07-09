export interface EvalData {
  category: string; runner: string; score: number; lift_pp: number;
  tasks: { task: string; with_skill: { score: number }; without_skill: { score: number }; delta: number }[];
}

export type ContextSizeScopeId =
  | "activation_core"
  | "activation_with_declared_refs"
  | "package_total_text";

export interface ContextSizeScope {
  label: string;
  files: string[];
  text_files: number;
  bytes: number;
  chars: number;
  tokens: number;
}

export interface ContextSize {
  version: "1";
  counter: { id: string; method: "official-tokenizer" | "heuristic"; tokenizer?: string; description?: string };
  generated_at: string;
  scopes: Record<ContextSizeScopeId, ContextSizeScope>;
}

export interface Skill {
  id: string; owner: string; repo: string; name: string; description?: string;
  license: string; hosting: string; publisher: string; upstream: string;
  /** 主分类 slug(featured 标签);未归类为 "uncategorized"/undefined */
  category?: string;
  /** 标签 slug 列表(featured:false 标签) */
  tags?: string[];
  /** 派生微文案标题(仅 copy.lint_pass 时填充;否则 undefined → 前端回退 description)。见 schemas copy 块。 */
  tagline?: string;
  /** 场景词(归一后;详情页全量展示,卡片按词频≥阈值裁 chip) */
  sceneTags?: string[];
  /** 「适合你,如果…」一行,仅详情页决策位 */
  fitLine?: string;
  /** 是否已下载 mirror/ 副本(决定能否提供 zip 下载;否则回上游) */
  hasMirror?: boolean;
  /** 采集去重:非 null 表示本条是另一条(canonical)的副本/搬运;默认列表隐藏 */
  duplicateOf?: string | null;
  /** 退市墓碑(ADR 0020):上游连续缺席后停止收录;货架隐藏,详情页留事实行 */
  delistedAt?: string | null;
  /** SKILL.md frontmatter 是否合规;false(不合规)默认列表隐藏 */
  frontmatterValid?: boolean;
  /** 内容哈希(verdict 锚点;build-index 查账本用,不进瘦卡) */
  contentHash?: string;
  contextSize?: ContextSize | null;
  /** 首次进货架时间(ISO;signals.first_seen_at 物化缓存,ADR 0016)——「新上架」榜事实源 */
  firstSeenAt?: string | null;
  /** 上游仓库最近一次提交时间(ISO;signals.upstream_commit_at)——详情页「上游提交 X 前」维护活性;仓库级、采集起攒 */
  upstreamCommitAt?: string | null;
  stars?: number | null;
  installs?: number | null;
  /** 上游仓库 SKILL.md 总数(巨仓降权信号) */
  repoSkillCount?: number;
  /** 来自批量源仓库的折叠采样条目 */
  bulkSource?: boolean;
  curatedBy?: { list: string; category: string }[];
  eval?: EvalData | null;
}

/** 清单记录(catalog/lists,ADR 0019;原 catalog/collections 合集条目)。blocked = 拦截仓(零内容上架);description = 上游仓自述(采集事实) */
export interface Collection {
  id: string; url: string; skillCount: number; sampledCount: number; stars?: number | null; blocked?: boolean; description?: string;
}
