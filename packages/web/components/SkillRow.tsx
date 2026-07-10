"use client";
import Link from "next/link";
import type { SkillCard } from "@/lib/store";
import TrustBadge from "./TrustBadge";
import { trackClick } from "@/lib/analytics";
import { localePath } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

const fmt = (n: number) => (n >= 1e6 ? `${Math.round(n / 1e5) / 10}M` : n >= 1e3 ? `${Math.round(n / 100) / 10}K` : String(n));

/** 列表行只吃瘦卡(SkillCard);全量 Skill 结构上兼容,详情页直接传也行(ADR 0007)。
 *  chrome 双语(useT);skill 名/描述/场景词是商品与转述内容,保持原文(ADR 0022)。 */
export default function SkillRow({ skill, rank, isNew }: { skill: SkillCard; rank?: number; isNew?: boolean }) {
  const tt = useT();
  const locale = useLocale();
  const s = skill;
  const href = `/skill/${s.owner}/${s.repo}/${s.name}/`; // 详情页单路由(共享,chrome 客户端切换)
  const onOpen = () => trackClick(s.id, rank); // 埋点:click(rank 作 pos,q 由 analytics 从 URL 读)
  return (
    <div className="row">
      {rank != null && <div className={`idx ${rank <= 3 ? "top" : ""}`}>{String(rank).padStart(2, "0")}</div>}
      <div className="main">
        <div className="nm"><Link href={href} onClick={onOpen}>{s.name}</Link><TrustBadge skill={s} />{isNew && <span className="new-tag">NEW</span>}</div>
        {/* 副标题:优先机器微文案 tagline;缺失/未过 lint 时回退 description 截断(宁可平淡,不可说谎) */}
        {(s.tagline || s.description) && (
          <div className="ds">{s.tagline ?? (s.description!.length > 60 ? s.description!.slice(0, 60) + "…" : s.description)}</div>
        )}
        {/* 场景词 =「话题」层:行首微标签 + 话题样式与 facet #tag 分化;点击 = 搜索聚合,不进 facet(ADR 0013 补充) */}
        {s.scene && s.scene.length > 0 && (
          <div className="scene">
            <span className="sc-k">{tt("row.scene")}</span>
            {s.scene.slice(0, 3).map((w) => (
              <Link key={w} href={`${localePath(locale, "/")}?q=${encodeURIComponent(w)}`} className="sc" prefetch={false}>{w}</Link>
            ))}
          </div>
        )}
        <div className="au">@{s.publisher}</div>
      </div>
      <div className="rt">
        {s.stars != null
          ? <div className="score"><span className="gold">★</span> {fmt(s.stars)}</div>
          : s.installs != null
            ? <div className="score">⬇ {fmt(s.installs)}</div>
            : <div className="dl">{tt("row.new")}</div>}
        <Link href={href} className="go" onClick={onOpen}>{tt("row.get")}</Link>
      </div>
    </div>
  );
}
