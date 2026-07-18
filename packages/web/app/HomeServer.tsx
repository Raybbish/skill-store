import { readIdxChangelog, readIdxMeta, readIdxNew, readIdxPacks, readIdxPage } from "@/lib/store-server";
import { t, type Locale } from "@/lib/i18n";
import type { SkillCard } from "@/lib/store";
import HomeClient from "./HomeClient";

export interface DayGroup { label: string; isToday: boolean; items: SkillCard[] }

/**
 * 店况首页(ADR 0034,原榜单进化):事实条 + 货架 + 左「新上架(按日)」/ 右「热门 TOP 20」两栏。
 * 目录检索迁 /browse/;旧 / 检索深链由 HomeClient 客户端转发保活。
 * 「今天/昨天」以构建时刻为准 —— 站点随每日 ingest 重建,足够准。日期格式随 locale。
 */
export default function HomeServer({ locale }: { locale: Locale }) {
  const meta = readIdxMeta();
  const packs = readIdxPacks();
  const hot = readIdxPage(1).slice(0, 20);
  const fresh = readIdxNew();
  const week = readIdxChangelog().weekAdded ?? 0;

  const fmtDay = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", { timeZone: "Asia/Shanghai", month: locale === "en" ? "short" : "long", day: "numeric" });
  const keyDay = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
  const now = Date.now();
  const todayKey = keyDay.format(new Date(now));
  const yesterdayKey = keyDay.format(new Date(now - 86400000));
  const groups: DayGroup[] = [];
  for (const c of fresh) {
    if (!c.addedAt) continue;
    const d = new Date(c.addedAt * 1000);
    const k = keyDay.format(d);
    // 组标题「今天 7月17日」以空格连接 —— 中点配额留给 dayCount 的「· 新上架 n 个」(设计稿 07 自审:每行至多一个 ·)
    const label = k === todayKey ? `${t(locale, "home.today")} ${fmtDay.format(d)}` : k === yesterdayKey ? `${t(locale, "home.yesterday")} ${fmtDay.format(d)}` : fmtDay.format(d);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(c);
    else groups.push({ label, isToday: k === todayKey, items: [c] });
  }
  const today = groups.find((g) => g.isToday)?.items.length ?? 0;
  // 只展示最新一日(2026-07-18 用户裁定:不要「昨天」流水)。今天有货=只显今天;
  // 今天空档=顺延显示最近一天(组标题自带日期,事实标注,无空窗)。今日计数仍按真实今天算(+0 时事实条整项不显示)。
  const shown = groups.slice(0, 1);

  return <HomeClient locale={locale} groups={shown} hot={hot} packs={packs} stats={{ total: meta.total, today, week }} />;
}
