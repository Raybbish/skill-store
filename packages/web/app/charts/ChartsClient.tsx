"use client";
import { useState } from "react";
import type { SkillCard } from "@/lib/store";
import SkillRow from "@/components/SkillRow";
import { t, type Locale } from "@/lib/i18n";

export interface DayGroup { label: string; isToday: boolean; items: SkillCard[] }

/** 榜单:新上架(「今日」住这里)/ 热门 双 tab;评测榜占位 */
export default function ChartsClient({ groups, hot, locale }: { groups: DayGroup[]; hot: SkillCard[]; locale: Locale }) {
  const [tab, setTab] = useState<"new" | "hot">("new");

  return (
    <>
      <div className="filters" style={{ marginTop: 14 }}>
        <button className={`chip ${tab === "new" ? "on" : ""}`} onClick={() => setTab("new")}>{t(locale, "charts.tabNew")}</button>
        <button className={`chip ${tab === "hot" ? "on" : ""}`} onClick={() => setTab("hot")}>{t(locale, "charts.tabHot")}</button>
        <span className="chip" style={{ opacity: 0.45, cursor: "default" }}>{t(locale, "charts.tabEval")}</span>
      </div>

      {tab === "new" && (
        <>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="day">{t(locale, "charts.dayCount", { label: g.label, n: g.items.length })}</div>
              <div className="list">
                {g.items.map((s) => <SkillRow key={s.id} skill={s} isNew={g.isToday} />)}
              </div>
            </div>
          ))}
          {!groups.length && <div className="empty">{t(locale, "charts.empty")}</div>}
        </>
      )}

      {tab === "hot" && (
        <div className="list" style={{ marginTop: 10 }}>
          {hot.map((s, i) => <SkillRow key={s.id} skill={s} rank={i + 1} />)}
        </div>
      )}
    </>
  );
}
