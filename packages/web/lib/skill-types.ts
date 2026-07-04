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
  /** 内容哈希(verdict 锚点;build-index 查账本用,不进瘦卡) */
  contentHash?: string;
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
