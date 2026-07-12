/**
 * 微文案 lint —— 代码层强制,不指望模型自觉(同 categorize-llm「mcp 双命中 meta 优先」哲学)。
 * 判据只维护一处:BANNED_WORDS 由 lint 与 prompt 共用一份,避免漂移(同 fmtTag 原则)。
 *
 * 字段级判罚(2026-07-11 放宽,原为一票否决):tagline 不过 → lint_pass=false 整份不可用;
 * 附属字段(fit_line/场景词)不过只丢该字段。内容照存(便于排查),前端对不可用整份回退 description 截断。
 * 规则表(原表见 skill-store-微文案-P0执行方案.html §04):
 *   L1 tagline 长度   8 ≤ 字数 ≤ 40                 —— 主字段,不过即整份失败
 *   L2 禁用开头       不以 skill 名 / 一个 / 这是 / 该 / 本 开头 —— 主字段,同上
 *   L3 禁用词         tagline 命中 = 整份失败;fit_line/场景词命中 = 丢该字段/该词
 *   L4 场景词数量/长度 剔除后 2~4 个,每个 ≤8 字;超上限裁齐,不足下限清空该轴
 *   L5 场景词查重     归一后不命中 labels.ts(命中静默剔除)
 *   L6 fit_line 句式  须以「适合你,如果」开头且 ≤50 字,不合规丢字段
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
/**
 * 2026-07-11 放宽(裁决:多语言覆盖优先于连坐式严检,与英文侧 lintEn 同范式):
 * 一票否决 → 字段级判罚。tagline 是主字段,L1/L2/L3 任一不过 = 整份不可用(pass=false,等重写);
 * fit_line / 场景词是附属字段,不合格只丢该字段,failures 照记但不拉低 pass。
 * 展示口径不变:凡是最终展示的字,仍然全部过检——宁可平淡,不可吹。
 */
export function lintCopy(raw: RawCopy, skillName: string): CopyLintResult {
  const failures: string[] = [];
  const tagline = typeof raw.tagline === "string" ? raw.tagline.trim() : "";
  const fitRaw = typeof raw.fit_line === "string" ? raw.fit_line.trim() : "";

  // ---- 主字段 tagline:不合格 = 整份不可用 ----
  // L1 长度
  const tl = charLen(tagline);
  if (tl < 8 || tl > 40) failures.push("L1");
  // L2 禁用开头(skill 名 + 冠词式起手,大小写不敏感)
  const low = tagline.toLowerCase();
  const nameLow = skillName.trim().toLowerCase();
  const badOpener =
    (nameLow.length > 0 && low.startsWith(nameLow)) ||
    BANNED_OPENERS.some((o) => low.startsWith(o));
  if (badOpener) failures.push("L2");
  // L3 禁用词(仅 tagline 命中才整份失败)
  const tagHit = containsBanned(tagline);
  if (tagHit) failures.push(`L3:${tagHit}`);
  const pass = failures.length === 0;

  // ---- 附属字段:不合格只丢字段 ----
  // 场景词:归一查重(L5,cleanSceneTags)→ 剔含禁词(L3)/超长(L4)的单词 → 超出上限裁齐;不足下限清空该轴
  let sceneTags = cleanSceneTags(raw.scene_tags).filter((s) => {
    const hit = containsBanned(s);
    if (hit) { failures.push(`L3:${hit}`); return false; }
    if (charLen(s) > SCENE_TAG_MAX_LEN) { failures.push("L4"); return false; }
    return true;
  });
  if (sceneTags.length > SCENE_TAG_MAX_COUNT) sceneTags = sceneTags.slice(0, SCENE_TAG_MAX_COUNT);
  if (sceneTags.length < SCENE_TAG_MIN_COUNT) {
    if (sceneTags.length > 0) failures.push("L4");
    sceneTags = [];
  }

  // fit_line:句式(L6)与禁词(L3)不合规即丢字段
  let fitOut: string | undefined;
  if (fitRaw) {
    const okPrefix = fitRaw.startsWith(FIT_PREFIX) || fitRaw.startsWith(FIT_PREFIX_ALT);
    const fitHit = containsBanned(fitRaw);
    if (!okPrefix || charLen(fitRaw) > 50) failures.push("L6");
    else if (fitHit) failures.push(`L3:${fitHit}`);
    else fitOut = fitRaw;
  }

  return {
    pass,
    failures,
    cleaned: { tagline, scene_tags: sceneTags, ...(fitOut ? { fit_line: fitOut } : {}) },
  };
}
