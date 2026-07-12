/**
 * 退市判定共享逻辑(ADR 0020)。
 *
 * 两个观测源共用同一计数:ingest(源成功枚举而条目不在候选集 / 官方仓 clone not-found)
 * 与 enrich-stars(仓级 API 404)。缺席按「观测日」计——同日多趟只计一次(missing_at 闸),
 * 连续 ≥ DELIST_STREAK 个观测日 → 盖墓碑 delisted_at。已退市条目不再累计(零 diff 噪音)。
 * 复活(重新观测到 → 清计数撤墓碑)发生在 ingest 幂等闸与完整更新路径,不在本模块。
 */
import type { SkillReport } from "@skill-store/schemas";

/** 连续缺席观测日阈值;env DELIST_STREAK 覆盖 */
export const DELIST_STREAK = Number(process.env.DELIST_STREAK) || 3;

export type MissingResult = "counted" | "delisted" | "noop";

/** 缺席一次(按观测日幂等)。"delisted" = 本次刚过线盖章;"noop" = 已退市或今日已计,无需写盘 */
export function markMissing(r: SkillReport): MissingResult {
  if (r.meta.delisted_at) return "noop";
  const today = new Date().toISOString().slice(0, 10);
  if (r.signals.missing_at?.slice(0, 10) === today) return "noop";
  r.signals.missing_at = new Date().toISOString();
  r.signals.missing_streak = (r.signals.missing_streak ?? 0) + 1;
  if (r.signals.missing_streak >= DELIST_STREAK) {
    r.meta.delisted_at = new Date().toISOString();
    return "delisted";
  }
  return "counted";
}
