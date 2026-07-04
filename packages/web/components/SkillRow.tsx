"use client";
import Link from "next/link";
import type { Skill } from "@/lib/skill-types";
import CertBadge from "./CertBadge";

const fmt = (n: number) => (n >= 1e6 ? `${Math.round(n / 1e5) / 10}M` : n >= 1e3 ? `${Math.round(n / 100) / 10}K` : String(n));

export default function SkillRow({ skill, rank }: { skill: Skill; rank?: number }) {
  const s = skill;
  const href = `/skill/${s.owner}/${s.repo}/${s.name}/`;
  return (
    <div className="row">
      {rank != null && <div className={`idx ${rank <= 3 ? "top" : ""}`}>{String(rank).padStart(2, "0")}</div>}
      <div className="main">
        <div className="nm"><Link href={href}>{s.name}</Link> <CertBadge skill={s} /></div>
        {s.description && <div className="ds">{s.description}</div>}
        <div className="au">@{s.publisher}</div>
      </div>
      <div className="rt">
        {s.stars != null
          ? <div className="score"><span className="gold">★</span> {fmt(s.stars)}</div>
          : s.installs != null
            ? <div className="score">⬇ {fmt(s.installs)}</div>
            : <div className="dl">新</div>}
        <Link href={href} className="go">获取 ›</Link>
      </div>
    </div>
  );
}
