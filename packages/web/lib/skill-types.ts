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
  /** 当前 catalog hash 是否已有通过双哈希闸的不可变制品。 */
  hasMirror?: boolean;
  /** artifact index 给出的内容寻址 URL;不得从 source hash 自行拼接。 */
  artifactUrl?: string;
  artifactSha256?: string;
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
  /** 英文转述(ADR 0022):同锚同批;缺失时前端回退 description 原文 */
  taglineEn?: string;
  sceneTagsEn?: string[];
  fitLineEn?: string;
  bulkSource?: boolean;
  curatedBy?: { list: string; category: string }[];
  eval?: EvalData | null;
  /** 「怎么用」转述段(ADR 0025;仅 lint_pass 且锚新鲜时填充,否则 null → 板块只出原文) */
  howto?: SkillHowtoView | null;
  /** 采集时的上游 commit(原文折叠的「版本」标注;与 content_hash 同代) */
  upstreamCommit?: string | null;
}

/** 「怎么用」板块的展示形态(catalog howto 块过回退闸后的映射,ADR 0025) */
export interface SkillHowtoView {
  what: string;
  when: string;
  say: { text: string; note?: string }[];
  whatEn?: string;
  whenEn?: string;
  sayEn?: { text: string; note?: string }[];
  /** llm = 商店整理;author = 认领作者改写(界面署名随之切换) */
  source: "llm" | "author";
}

/** 清单记录(catalog/lists,ADR 0019;原 catalog/collections 合集条目)。blocked = 拦截仓(零内容上架);description = 上游仓自述(采集事实) */
export interface Collection {
  id: string; url: string; skillCount: number; sampledCount: number; stars?: number | null; blocked?: boolean; description?: string;
}
