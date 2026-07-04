"use client";
import { useState } from "react";
import type { SkillCard } from "@/lib/store";
import SkillRow from "@/components/SkillRow";

export interface DayGroup { label: string; isToday: boolean; items: SkillCard[] }

/** 榜单:新上架(「今日」住这里)/ 热门 双 tab;评测榜占位 */
export default function ChartsClient({ groups, hot }: { groups: DayGroup[]; hot: SkillCard[] }) {
  const [tab, setTab] = useState<"new" | "hot">("new");

  return (
    <>
      <div className="filters" style={{ marginTop: 14 }}>
        <button className={`chip ${tab === "new" ? "on" : ""}`} onClick={() => setTab("new")}>🆕 新上架</button>
        <button className={`chip ${tab === "hot" ? "on" : ""}`} onClick={() => setTab("hot")}>🔥 热门</button>
        <span className="chip" style={{ opacity: 0.45, cursor: "default" }}>🧪 评测榜 · 开发中</span>
      </div>

      {tab === "new" && (
        <>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="day">{g.label} · 新上架 {g.items.length} 个</div>
              <div className="list">
                {g.items.map((s) => <SkillRow key={s.id} skill={s} isNew={g.isToday} />)}
              </div>
            </div>
          ))}
          {!groups.length && <div className="empty">暂无新上架记录</div>}
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
