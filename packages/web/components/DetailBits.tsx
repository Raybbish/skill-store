"use client";
/** 详情页 chrome 小件(ADR 0022 共享页):相对时间按 locale 渲染,SSR 首帧 zh、水合后随偏好。 */
import { relTime, type MsgKey } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

/** 「收录于 X / 上游提交 X」chip:iso 缺失不渲染 */
export function WhenChip({ k, iso }: { k: MsgKey; iso?: string | null }) {
  const locale = useLocale();
  const tt = useT();
  const r = relTime(locale, iso);
  if (!r) return null;
  return <span title={r.abs}> · {tt(k, { t: r.rel })}</span>;
}
