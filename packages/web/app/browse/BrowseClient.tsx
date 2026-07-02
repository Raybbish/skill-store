"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { Skill } from "@/lib/data";

export default function BrowseClient({ skills }: { skills: Skill[] }) {
  const [q, setQ] = useState("");
  const [pub, setPub] = useState<string | null>(null);
  const [safeOnly, setSafeOnly] = useState(false);
  const [evalOnly, setEvalOnly] = useState(false);
  const [sort, setSort] = useState<"eval" | "stars" | "tokens">("eval");

  const publishers = useMemo(() => [...new Set(skills.map((s) => s.publisher))], [skills]);

  const list = useMemo(() => {
    let l = skills.slice();
    if (pub) l = l.filter((s) => s.publisher === pub);
    if (safeOnly) l = l.filter((s) => s.risk.network?.present !== true);
    if (evalOnly) l = l.filter((s) => s.eval);
    if (q) {
      const t = q.toLowerCase();
      l = l.filter((s) => (s.id + (s.description ?? "")).toLowerCase().includes(t));
    }
    l.sort((a, b) => {
      if (sort === "eval") return (b.eval?.score ?? -1) - (a.eval?.score ?? -1);
      if (sort === "stars") return (b.stars ?? 0) - (a.stars ?? 0);
      return a.tokens - b.tokens;
    });
    return l;
  }, [skills, q, pub, safeOnly, evalOnly, sort]);

  return (
    <>
      <div className="h2">浏览</div>
      <div className="h2-sub">{list.length} / {skills.length} 个 skill</div>

      <input className="search-input" placeholder="搜索 skill…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="filters">
        <button className={`chip ${!pub ? "on" : ""}`} onClick={() => setPub(null)}>全部发布者</button>
        {publishers.map((p) => (
          <button key={p} className={`chip ${pub === p ? "on" : ""}`} onClick={() => setPub(p)}>{p}</button>
        ))}
      </div>
      <div className="filters">
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="eval">按评测分</option>
          <option value="stars">按 stars</option>
          <option value="tokens">按 token 成本(低→高)</option>
        </select>
        <button className={`chip ${evalOnly ? "on" : ""}`} onClick={() => setEvalOnly(!evalOnly)}>仅已评测</button>
        <button className={`chip ${safeOnly ? "on" : ""}`} onClick={() => setSafeOnly(!safeOnly)}>🛡️ 仅无网络请求</button>
      </div>

      <div className="card" style={{ padding: "8px 14px" }}>
        {list.map((s) => (
          <Link href={`/skill/${s.owner}/${s.name}/`} className="srow" key={s.id}>
            <div className="s-icon">{s.name[0].toUpperCase()}</div>
            <div className="info">
              <div className="n">{s.id}</div>
              <div className="tg">{s.description ?? "(无描述)"}</div>
              <div className="badges">
                {s.eval && <span className="mini acc">评测 {s.eval.score}/10</span>}
                <span className={`mini ${s.status === "pass" ? "ok" : "warn"}`}>{s.status === "pass" ? "✓ 已审计" : "⚠ " + s.status}</span>
                {s.risk.network?.present === true && <span className="mini warn">🌐 网络</span>}
                <span className="mini">{s.hosting === "mirrored" ? "镜像" : "索引"}</span>
                <span className="mini">~{Math.round(s.tokens / 100) / 10}K tok</span>
              </div>
            </div>
          </Link>
        ))}
        {!list.length && <div style={{ padding: "30px 0", textAlign: "center", color: "var(--faint)" }}>无匹配结果</div>}
      </div>
    </>
  );
}
