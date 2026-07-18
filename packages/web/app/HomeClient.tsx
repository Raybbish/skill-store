"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Pack, SkillCard } from "@/lib/store";
import SkillRow from "@/components/SkillRow";
import PackShelf from "@/components/PackShelf";
import { trackClick } from "@/lib/analytics";
import { localePath, t, type Locale, type MsgKey } from "@/lib/i18n";
import type { DayGroup } from "./HomeServer";

const fmt = (n: number) => (n >= 1e6 ? `${Math.round(n / 1e5) / 10}M` : n >= 1e3 ? `${Math.round(n / 100) / 10}K` : String(n));
const nf = (x: number) => x.toLocaleString();

/** 热门单行(店况右栏)。与浏览页默认态同数据同序 —— 有意重复(门面摆畅销切片,设计稿 06-d 拍板),不是待修问题。 */
function RankLine({ s, rank }: { s: SkillCard; rank: number }) {
  const href = `/skill/${s.owner}/${s.repo}/${s.name}/`;
  return (
    <Link href={href} className="rk" prefetch={false} onClick={() => trackClick(s.id, rank)}>
      <span className={`i ${rank <= 3 ? "top" : ""}`}>{rank}</span>
      <span className="n">{s.name}</span>
      {s.stars != null && <span className="s">★ {fmt(s.stars)}</span>}
    </Link>
  );
}

/**
 * 店况首页客户端体(ADR 0034):
 * - 检索深链转发:旧 / 承接的 ?q=&cat=&tag=&repo=&pub= 客户端 replace 到 /browse/ 同参(静态导出,与旧 /browse 壳同模式);
 * - 搜索框只是入口:提交即跳 /browse/?q=,检索本体只有浏览页一个;
 * - 移动端(<960px)单栏,新上架/热门收进双 tab(文字无 emoji);桌面双栏恒展开。
 */
export default function HomeClient({ locale, groups, hot, packs, stats }: {
  locale: Locale;
  groups: DayGroup[];
  hot: SkillCard[];
  packs: Pack[];
  stats: { total: number; today: number; week: number };
}) {
  const tt = (k: MsgKey, vars?: Record<string, string | number>) => t(locale, k, vars);
  const [tab, setTab] = useState<"new" | "hot">("new");
  const [q, setQ] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (["q", "cat", "tag", "repo", "pub"].some((k) => sp.has(k))) {
      window.location.replace(`${localePath(locale, "/browse/")}?${sp.toString()}`);
    }
  }, [locale]);

  const goSearch = () => {
    const w = q.trim();
    window.location.assign(localePath(locale, "/browse/") + (w ? `?q=${encodeURIComponent(w)}` : ""));
  };

  return (
    <>
      {/* 事实条:只写事实数字,不写口号(文案克制);今日 +0 时整项不显示(设计稿 06-c) */}
      <section className="facts">
        <span className="stat">{tt("home.statTotal", { n: nf(stats.total) })}</span>
        {stats.today > 0 && <span className="stat up">{tt("home.statToday", { n: nf(stats.today) })}</span>}
        {stats.week > 0 && <span className="stat up">{tt("home.statWeek", { n: nf(stats.week) })}</span>}
        <div className="searchbar sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
          <input
            type="search" aria-label={tt("home.searchLabel")} value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") goSearch(); }}
            placeholder={tt("home.searchPlaceholder", { n: nf(stats.total) })}
          />
        </div>
      </section>

      <PackShelf packs={packs} locale={locale} />

      <div className="cols2-tabs filters">
        <button className={`chip ${tab === "new" ? "on" : ""}`} onClick={() => setTab("new")}>{tt("home.tabNew")}</button>
        <button className={`chip ${tab === "hot" ? "on" : ""}`} onClick={() => setTab("hot")}>{tt("home.tabHot")}</button>
      </div>

      <div className="cols2" data-tab={tab}>
        <div className="col-new">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="day">{tt("home.dayCount", { label: g.label, n: g.items.length })}</div>
              <div className="list">
                {g.items.map((s) => <SkillRow key={s.id} skill={s} isNew={g.isToday} variant="compact" />)}
              </div>
            </div>
          ))}
          {!groups.length && <div className="empty">{tt("home.newEmpty")}</div>}
          <div className="col-foot"><Link href={`${localePath(locale, "/browse/")}?sort=new`} prefetch={false}>{tt("home.allNew")} ›</Link></div>
        </div>
        <div className="col-hot">
          <div className="day">{tt("home.hotTitle")}</div>
          {hot.map((s, i) => <RankLine key={s.id} s={s} rank={i + 1} />)}
          <div className="col-foot"><Link href={localePath(locale, "/browse/")} prefetch={false}>{tt("home.fullCatalog")} ›</Link></div>
        </div>
      </div>
    </>
  );
}
