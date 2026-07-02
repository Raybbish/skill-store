import Link from "next/link";
import { allSkills } from "@/lib/data";

function List({ skills, metric }: { skills: ReturnType<typeof allSkills>; metric: "eval" | "stars" }) {
  return (
    <>
      {skills.map((s, i) => (
        <Link href={`/skill/${s.owner}/${s.name}/`} className="srow" key={s.id}>
          <div style={{ width: 22, textAlign: "center", fontWeight: 700, color: "var(--faint)", flexShrink: 0 }}>{i + 1}</div>
          <div className="s-icon" style={{ width: 40, height: 40, fontSize: 17 }}>{s.name[0].toUpperCase()}</div>
          <div className="info"><div className="n" style={{ fontSize: 13.5 }}>{s.id}</div></div>
          <div style={{ fontWeight: 800, color: metric === "eval" ? "var(--accent)" : "var(--ink)", fontSize: 15 }}>
            {metric === "eval" ? `${s.eval!.score}` : (s.stars ?? "–")}
          </div>
        </Link>
      ))}
    </>
  );
}

export default function Charts() {
  const evalRanked = allSkills().filter((s) => s.eval).sort((a, b) => b.eval!.score - a.eval!.score).slice(0, 10);
  const starRanked = allSkills().filter((s) => s.stars).sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0)).slice(0, 10);
  return (
    <>
      <div className="h2">榜单</div>
      <div className="h2-sub">左:平台自动评测分(确定性校验器) · 右:GitHub stars(流行度代理)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="duo">
        <div className="card"><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>🏅 评测分榜</div><List skills={evalRanked} metric="eval" /></div>
        <div className="card"><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>🔥 流行度榜</div><List skills={starRanked} metric="stars" /></div>
      </div>
      <div className="card" style={{ fontSize: 13, color: "var(--sub)" }}>
        💡 <b style={{ color: "var(--ink)" }}>为什么两个榜?</b> 流行度反映热度,但有马太效应;评测分来自标准任务集上的确定性测试,新 skill 也能靠质量上榜。两榜并列是本店与纯目录市场的核心差异。
      </div>
    </>
  );
}
