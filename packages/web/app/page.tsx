import Link from "next/link";
import { allSkills, fmtInstalls, type Skill } from "@/lib/data";

function Row({ s }: { s: Skill }) {
  const netWarn = s.risk.network?.present === true;
  return (
    <Link href={`/skill/${s.owner}/${s.repo}/${s.name}/`} className="srow">
      <div className="s-icon">{s.name[0].toUpperCase()}</div>
      <div className="info">
        <div className="n">{s.id}</div>
        <div className="tg">{s.description ?? "(无描述)"}</div>
        <div className="badges">
          {s.eval && <span className="mini acc">评测 {s.eval.score}/10</span>}
          <span className={`mini ${s.status === "pass" ? "ok" : "warn"}`}>
            {s.status === "pass" ? "✓ 已审计" : s.status === "needs_review" ? "⚠ 待复核" : s.status}
          </span>
          {s.installs != null && <span className="mini acc">⬇ {fmtInstalls(s.installs)} 安装</span>}
          {netWarn && <span className="mini warn">🌐 含网络请求</span>}
          {s.risk.scripts?.present === true && <span className="mini">📜 含脚本</span>}
          {s.bulkSource && <span className="mini">📦 批量仓采样</span>}
          <span className="mini">{s.hosting === "mirrored" ? "镜像托管" : "索引"}</span>
          <span className="mini">~{Math.round(s.tokens / 100) / 10}K tok</span>
          {s.review && <span className="mini acc">已人工复核</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const skills = allSkills();
  const byPublisher = new Map<string, Skill[]>();
  for (const s of skills) (byPublisher.get(s.publisher) ?? byPublisher.set(s.publisher, []).get(s.publisher)!).push(s);

  return (
    <>
      <div className="h2">可信目录</div>
      <div className="h2-sub">
        {skills.length} 个 skill · 全部经过 L1 签名 / L2 五因子 / L3 意图三层审计,人工复核签名留痕
      </div>
      {[...byPublisher].map(([pub, list]) => (
        <div className="card" key={pub}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {pub} <small style={{ color: "var(--faint)", fontWeight: 400 }}>{list.length} 个</small>
          </div>
          {list.map((s) => <Row s={s} key={s.id} />)}
        </div>
      ))}
    </>
  );
}
