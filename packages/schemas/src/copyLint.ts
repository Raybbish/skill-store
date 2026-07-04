/**
 * 微文案 lint —— 代码层强制,不指望模型自觉(同 categorize-llm「mcp 双命中 meta 优先」哲学)。
 * 判据只维护一处:BANNED_WORDS 由 lint 与 prompt 共用一份,避免漂移(同 fmtTag 原则)。
 *
 * 任一条不过 → lint_pass=false,内容照存(便于排查),前端回退 description 截断。
 * 规则表(与 skill-store-微文案-P0执行方案.html §04 对齐):
 *   L1 tagline 长度   8 ≤ 字数 ≤ 40
 *   L2 禁用开头       不以 skill 名 / 一个 / 这是 / 该 / 本 开头
 *   L3 禁用词         三件微文案均不含 BANNED_WORDS(大小写不敏感)
 *   L4 场景词数量/长度 2~4 个,每个 ≤8 字
 *   L5 场景词查重     归一后不命中 labels.ts(命中静默剔除,剔完 <2 则 L4 失败)
 *   L6 fit_line 句式  若给出,须以「适合你,如果」开头且 ≤50 字
 */
import {
  cleanSceneTags,
  SCENE_TAG_MAX_LEN,
  SCENE_TAG_MIN_COUNT,
  SCENE_TAG_MAX_COUNT,
} from "./sceneTags";

/**
 * 禁用词(营销水词 + 空洞形容词)。lint 与 prompt 共用这一份。
 * 命中即 lint 不过——宁可平淡,不可吹。
 */
export const BANNED_WORDS = [
  "强大", "无缝", "一站式", "全面", "轻松", "极致", "革命性", "最佳", "完美", "海量",
  "powerful", "seamless", "all-in-one", "comprehensive", "effortless", "revolutionary", "best-in-class",
];

/** 禁用开头(空洞冠词式起手);skill 名单独按传入名比对 */
export const BANNED_OPENERS = ["一个", "这是", "该", "本", "this is", "a ", "an ", "the "];

/** 字数 = Unicode 码点数(CJK 一字算一,英文一字母算一) */
export const charLen = (s: string): number => [...s.trim()].length;

const FIT_PREFIX = "适合你,如果";
const FIT_PREFIX_ALT = "适合你，如果"; // 全角逗号容错

export interface RawCopy {
  tagline?: unknown;
  scene_tags?: unknown;
  fit_line?: unknown;
}

export interface CopyLintResult {
  pass: boolean;
  /** 失败规则码(如 ["L1","L3:powerful"]);便于排查 */
  failures: string[];
  /** 归一/剔除后的干净文案——无论过不过都返回,过则用它落盘 */
  cleaned: { tagline: string; scene_tags: string[]; fit_line?: string };
}

const containsBanned = (text: string): string | null => {
  const low = text.toLowerCase();
  for (const w of BANNED_WORDS) if (low.includes(w.toLowerCase())) return w;
  return null;
};

/**
 * 跑 L1-L6。raw = 模型原始三字段;skillName 用于 L2 禁用开头比对。
 * 场景词的归一/查重(L5)由 cleanSceneTags 完成,lint 只判剔除后的数量/长度。
 */
export function lintCopy(raw: RawCopy, skillName: string): CopyLintResult {
  const failures: string[] = [];
  const tagline = typeof raw.tagline === "string" ? raw.tagline.trim() : "";
  const sceneTags = cleanSceneTags(raw.scene_tags); // L5:归一 + 查重剔除已在此发生
  const fitRaw = typeof raw.fit_line === "string" ? raw.fit_line.trim() : "";

  // L1 tagline 长度
  const tl = charLen(tagline);
  if (tl < 8 || tl > 40) failures.push("L1");

  // L2 禁用开头(skill 名 + 冠词式起手,大小写不敏感)
  const low = tagline.toLowerCase();
  const nameLow = skillName.trim().toLowerCase();
  const badOpener =
    (nameLow.length > 0 && low.startsWith(nameLow)) ||
    BANNED_OPENERS.some((o) => low.startsWith(o));
  if (badOpener) failures.push("L2");

  // L3 禁用词(三件微文案任一命中即失败)
  for (const [field, text] of [["tagline", tagline], ["fit_line", fitRaw], ...sceneTags.map((s) => ["scene", s] as const)] as const) {
    const hit = containsBanned(text);
    if (hit) { failures.push(`L3:${hit}`); break; }
  }

  // L4 场景词数量/长度(剔除后)
  if (sceneTags.length < SCENE_TAG_MIN_COUNT || sceneTags.length > SCENE_TAG_MAX_COUNT) failures.push("L4");
  else if (sceneTags.some((s) => charLen(s) > SCENE_TAG_MAX_LEN)) failures.push("L4");

  // L6 fit_line 句式(可选;给出即须合规)
  let fitOut: string | undefined;
  if (fitRaw) {
    const okPrefix = fitRaw.startsWith(FIT_PREFIX) || fitRaw.startsWith(FIT_PREFIX_ALT);
    if (!okPrefix || charLen(fitRaw) > 50) failures.push("L6");
    else fitOut = fitRaw;
  }

  return {
    pass: failures.length === 0,
    failures,
    cleaned: { tagline, scene_tags: sceneTags, ...(fitOut ? { fit_line: fitOut } : {}) },
  };
}
