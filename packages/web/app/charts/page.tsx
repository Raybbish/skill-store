import { readIdxNew, readIdxPage } from "@/lib/store-server";
import ChartsClient, { type DayGroup } from "./ChartsClient";

const fmtDay = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric" });
const keyDay = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * 榜单:新上架(按收录日分组,数据=catalog git 首次提交时间)+ 热门(货架热门序前 20)。
 * 「今天/昨天」以构建时刻为准 —— 站点随每日 ingest 重建,足够准。
 */
export default function Charts() {
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
    const label = k === todayKey ? `今天 · ${fmtDay.format(d)}` : k === yesterdayKey ? `昨天 · ${fmtDay.format(d)}` : fmtDay.format(d);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(c);
    else groups.push({ label, isToday: k === todayKey, items: [c] });
  }

  return (
    <>
      <section className="hero">
        <div className="eyebrow">榜单</div>
        <h1 className="small">今天有什么新的</h1>
      </section>
      <ChartsClient groups={groups} hot={hot} />
    </>
  );
}
