/**
 * categorize.ts —— 分类 / 标签引擎(通用,规则来自 @skill-store/schemas 的词表)
 *
 * 引擎本身不含任何 taxonomy 知识:它只是对 labels.ts 里每个标签的规则打分,然后:
 *   - category = 得分 ≥ CATEGORY_THRESHOLD 的 **featured** 标签里最高分者(平票 → uncategorized,交人工)
 *   - tags     = 得分 ≥ TAG_THRESHOLD 的 **featured:false** 标签(桶内二级筛选)
 *
 * 因此「升/降一个分类」只需在 labels.ts 翻 `featured` flag(见 jobs/promote.ts),引擎零改动。
 */

import {
  LABELS,
  CATEGORY_THRESHOLD,
  TAG_THRESHOLD,
  type LabelDef,
} from '@skill-store/schemas';

export interface CategorizeInput {
  id: string;
  name?: string;
  description?: string;
}

export interface CategorizeResult {
  /** featured 主分类 slug;无达标者为 'uncategorized' */
  category: string;
  /** 命中的标签 slug(featured:false),按得分降序 */
  tags: string[];
  /** 主分类得分 */
  score: number;
  /** featured 平票 → 交人工(区别于「分数太低」的 uncategorized) */
  ambiguous: boolean;
  /** 调试 / 审计:各标签非零得分 */
  scores: { slug: string; score: number }[];
}

interface Compiled {
  def: LabelDef;
  rules: { re: RegExp; weight: number }[];
}

/** 启动时预编译一次(规则是数据,引擎只跑正则) */
const COMPILED: Compiled[] = LABELS.map((l) => ({
  def: l,
  rules: l.rules.map((rule) => ({ re: new RegExp(rule.pattern, 'i'), weight: rule.weight })),
}));

const byScoreDesc = (a: { score: number }, b: { score: number }): number => b.score - a.score;

/**
 * 给单个 skill 归类 + 打标签。
 * @param input     name + description + id
 * @param override  sources.yaml 的 per-source 强制分类(featured slug;优先于启发式)
 */
export function categorize(input: CategorizeInput, override?: string): CategorizeResult {
  const text = `${input.name ?? ''} ${input.description ?? ''} ${input.id}`.toLowerCase();

  const scored = COMPILED.map(({ def, rules }) => {
    let score = 0;
    for (const { re, weight } of rules) if (re.test(text)) score += weight;
    return { def, score };
  });

  const debug = scored.filter((s) => s.score > 0).sort(byScoreDesc).map((s) => ({ slug: s.def.slug, score: s.score }));

  // 标签:featured:false 且达标
  const tags = scored
    .filter((s) => !s.def.featured && s.score >= TAG_THRESHOLD)
    .sort(byScoreDesc)
    .map((s) => s.def.slug);

  // per-source 覆盖
  if (override) {
    return { category: override, tags, score: Infinity, ambiguous: false, scores: debug };
  }

  // 主分类:featured 且达阈值,取最高;平票不臆断
  const cands = scored.filter((s) => s.def.featured && s.score >= CATEGORY_THRESHOLD).sort(byScoreDesc);
  if (cands.length === 0) {
    return { category: 'uncategorized', tags, score: 0, ambiguous: false, scores: debug };
  }
  const [top, second] = cands;
  if (second && second.score === top.score) {
    // 平票裁决:通用基座类(dev/utility)让位给更具体的垂直类。
    // 若并列最高分里恰好只剩一个非基座类 → 判它(如 dev=finance → finance);
    // 否则(垂直 vs 垂直,真歧义,如 marketing=science)仍交人工。
    const GENERIC = new Set(['dev', 'utility']);
    const topTied = cands.filter((s) => s.score === top.score);
    const specifics = topTied.filter((s) => !GENERIC.has(s.def.slug));
    if (specifics.length === 1) {
      return { category: specifics[0].def.slug, tags, score: top.score, ambiguous: false, scores: debug };
    }
    return { category: 'uncategorized', tags, score: top.score, ambiguous: true, scores: debug };
  }
  return { category: top.def.slug, tags, score: top.score, ambiguous: false, scores: debug };
}
