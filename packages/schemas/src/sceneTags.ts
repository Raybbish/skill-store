/**
 * 场景词治理 —— 与 labels.ts 平行的第二张词表,但**半开放**:
 * LLM 可自造词,治理靠归一(SCENE_ALIASES)与可见性阈值(SCENE_VISIBLE_MIN),不靠预定义枚举。
 *
 * 场景词回答「用户在什么时候用它」(周报、合同审阅、上线前检查),
 * 不回答「它是什么技术形态」(react、pdf、mcp——那是 labels.ts 五分面管的)。
 *
 * 生成侧(categorize:llm)与搜索侧共用 normScene 这一个归一函数,避免两侧漂移。
 * 与五分面查重:归一后命中 labels.ts 任何 slug / label_zh → 直接丢弃(isLabelWord)。
 *
 * 季度复核:全量跑完统计词频,top 200 人工过一遍 → 合并新别名、清垃圾词,
 *          只重跑归一(纯本地,不再调 LLM)。
 */
import { LABELS } from "./labels";

/**
 * 归一别名表:把同义/异形/中英表述合并到一个规范词。
 * key 为**已小写去空格**的原始词,value 为规范词。
 * 首次全量跑完后,对词频 top 200 人工过一遍补齐(见 categorize:llm 词表回补步骤)。
 */
export const SCENE_ALIASES: Record<string, string> = {
  // 中英归一
  "周报生成": "周报", "写周报": "周报", "weekly report": "周报", "weekly-report": "周报",
  "竞品分析": "竞品调研", "竞品研究": "竞品调研", "competitor research": "竞品调研", "competitive analysis": "竞品调研",
  "合同审查": "合同审阅", "合同审核": "合同审阅", "contract review": "合同审阅",
  "上线检查": "上线前检查", "发布前检查": "上线前检查", "pre-release check": "上线前检查",
  "会议纪要": "会议记录", "meeting notes": "会议记录", "会议总结": "会议记录",
  "代码审查": "代码评审", "code review": "代码评审",
  "简历筛选": "简历初筛", "resume screening": "简历初筛",
  "数据清洗": "数据整理", "data cleaning": "数据整理",
  // ⬆ 首次全量跑完后,对词频 top 200 人工过一遍补齐别名
};

/**
 * 卡片上可点(= 发起搜索)的最低覆盖数:某场景词覆盖 skill 数 ≥ 此值才在卡片渲染为 chip。
 * 不达标的词只进搜索索引做召回,UI 不显示(build-index 统计词频后据此裁 chip)。
 */
export const SCENE_VISIBLE_MIN = 15;

/** 场景词长度上限(字符);L4 lint 与 prompt 共用此常量 */
export const SCENE_TAG_MAX_LEN = 8;
/** 场景词数量区间;L4 lint 与 prompt 共用 */
export const SCENE_TAG_MIN_COUNT = 2;
export const SCENE_TAG_MAX_COUNT = 4;

/** 归一:小写 + trim + 折叠空白 + 别名合并。生成侧与搜索侧共用这一个函数。 */
export function normScene(raw: string): string {
  const base = raw.trim().toLowerCase().replace(/\s+/g, " ").replace(/[，。、·]+$/u, "");
  return SCENE_ALIASES[base] ?? base;
}

/** 五分面查重:归一后的场景词是否命中 labels.ts 的 slug 或 label_zh(命中即技术形态词,应丢弃)。 */
const LABEL_WORDS: Set<string> = new Set(
  LABELS.flatMap((l) => [l.slug, l.label_zh]).map((w) => w.trim().toLowerCase()),
);
export function isLabelWord(normalized: string): boolean {
  return LABEL_WORDS.has(normalized);
}

/**
 * 归一 + 去重 + 查重丢弃,得到落盘的场景词。
 * 顺序保留(模型先给的视为更主要);命中五分面词表的静默剔除。
 */
export function cleanSceneTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item !== "string") continue;
    const w = normScene(item);
    if (!w || seen.has(w) || isLabelWord(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}
