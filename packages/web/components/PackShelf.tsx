"use client";
/** 场景包货架(ADR 0034 抽离自旧首页):手动横滑(触控板/滚轮/箭头按钮),不自动播放(见 globals.css)。
 *  仅首页使用;浏览页(目录检索)不放货架。 */
import { useRef } from "react";
import Link from "next/link";
import { type Pack } from "@/lib/store";
import { localePath, t, type Locale } from "@/lib/i18n";

/** 场景包横滑:手动滚动(触控板/滚轮/箭头按钮),不自动播放(见 globals.css) */
export default function PackShelf({ packs, locale }: { packs: Pack[]; locale: Locale }) {
  const rail = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    el?.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: "smooth" });
  };
  if (!packs.length) return null;
  const Card = ({ p }: { p: Pack }) => (
    <Link href={localePath(locale, `/pack/${p.id}/`)} className="pk">
      <span className="tile" style={{ background: p.tile }}>{p.emoji}</span>
      <span>
        <span className="pt">{locale === "en" ? p.titleEn ?? p.title : p.title}</span>
        <span className="pd">{locale === "en" ? p.taglineEn ?? p.tagline : p.tagline}</span>
      </span>
      <span className="arr">›</span>
    </Link>
  );
  return (
    <div className="sec">
      <div className="sec-h">
        <h2>{t(locale, "home.packsTitle")}</h2><span className="k">{t(locale, "home.packsK")}</span>
        <span className="mq-nav">
          <button type="button" aria-label={t(locale, "home.packsPrev")} onClick={() => nudge(-1)}>‹</button>
          <button type="button" aria-label={t(locale, "home.packsNext")} onClick={() => nudge(1)}>›</button>
        </span>
      </div>
      <div className="mq" ref={rail}>
        <div className="mq-track">
          {packs.map((p) => <Card p={p} key={p.id} />)}
        </div>
      </div>
    </div>
  );
}
