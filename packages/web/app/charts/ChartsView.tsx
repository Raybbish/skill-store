import { readIdxNew, readIdxPage } from "@/lib/store-server";
import { t, type Locale } from "@/lib/i18n";
import ChartsClient, { type DayGroup } from "./ChartsClient";

/**
 * 榜单共享服务端体(ADR 0022 双路由):新上架(按收录日分组)+ 热门(货架热门序前 20)。
 * 「今天/昨天」以构建时刻为准 —— 站点随每日 ingest 重建,足够准。日期格式随 locale。
 */
export default function ChartsView({ locale }: { locale: Locale }) {
  const fmtDay = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", { timeZone: "Asia/Shanghai", month: locale === "en" ? "short" : "long", day: "numeric" });
  const keyDay = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
  const fresh = readIdxNew();
  const hot = readIdxPage(1).slice(0, 20);

  const now = Date.now();
  const todayKey = keyDay.format(new Date(now));
  const yesterdayKey = keyDay.format(new Date(now - 86400000));
  const groups: DayGroup[] = [];
  for (const c of fresh) {
    if (!c.addedAt) continue;
    const d = new Date(c.addedAt * 1000);
    const k = keyDay.format(d);
    const label = k === todayKey ? `${t(locale, "charts.today")} · ${fmtDay.format(d)}` : k === yesterdayKey ? `${t(locale, "charts.yesterday")} · ${fmtDay.format(d)}` : fmtDay.format(d);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(c);
    else groups.push({ label, isToday: k === todayKey, items: [c] });
  }

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{t(locale, "charts.eyebrow")}</div>
        <h1 className="small">{t(locale, "charts.title")}</h1>
      </section>
      <ChartsClient groups={groups} hot={hot} locale={locale} />
    </>
  );
}
