import Link from "next/link";
import { notFound } from "next/navigation";
import { allSkills, getSkill, peersByEval, FACTOR_LABELS } from "@/lib/data";

export function generateStaticParams() {
  return allSkills().map((s) => ({ owner: s.owner, name: s.name }));
}

export default async function SkillPage({ params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const s = getSkill(owner, name);
  if (!s) notFound();

  const reviewReasons = s.evidence.filter((e) => e.factor === "review_reason");
  const fileEvidence = s.evidence.filter((e) => e.factor !== "review_reason");

  return (
    <>
      <Link href="/" className="back">‹ 可信目录</Link>
      <div className="card">
        <div className="hero">
          <div className="icon">{s.name[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{s.id}</h1>
            <div className="tagline">{s.description ?? "(无描述)"}</div>
            <div className="dev">{s.publisher} · <a href={s.upstream} style={{ color: "var(--accent)" }}>上游仓库 ↗</a></div>
            <div className="cli">npx oh-my-skill add {s.id}</div>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <b style={{ color: "var(--accent)" }}>{s.eval ? `${s.eval.score}` : "–"}<span style={{ fontSize: 12, color: "var(--faint)" }}>/10</span></b>
            <span>评测分</span>
          </div>
          <div className="stat">
            <b className={s.status === "pass" ? "ok" : "warn"}>{s.status === "pass" ? "已通过" : s.status === "needs_review" ? "待复核" : s.status}</b>
            <span>三层审计</span>
          </div>
          <div className="stat"><b>{s.hosting === "mirrored" ? "镜像" : "索引"}</b><span>托管方式</span></div>
          <div className="stat"><b>~{Math.round(s.tokens / 100) / 10}K</b><span>token / 次加载</span></div>
          <div className="stat"><b>{s.stars ?? "–"}</b><span>GitHub stars</span></div>
        </div>
      </div>

      {s.eval && (() => {
        const peers = peersByEval(s.eval.category).slice(0, 6);
        const CAT_LABEL: Record<string, string> = { "doc-generation": "文档生成" };
        return (
          <>
            <div className="sec-title">同类横评<small>{CAT_LABEL[s.eval.category] ?? s.eval.category} · {s.eval.tasks.length} 个标准任务 · {s.eval.runner}</small></div>
            <div className="card">
              <div className="review-box" style={{ marginTop: 0, marginBottom: 14 }}>
                🤖 在标准任务集上得分 <b>{s.eval.score}/10</b>,相对未安装净增益 <b>+{s.eval.lift_pp}pp</b>。评分由确定性校验器产出,可复现。
              </div>
              {peers.map((p) => (
                <div className="bench" key={p.id}>
                  <Link href={`/skill/${p.owner}/${p.name}/`} className={`bench-name ${p.id === s.id ? "self" : ""}`}>{p.id}</Link>
                  <div className="track"><div className="fill" style={{ width: `${p.eval!.score * 10}%`, background: p.id === s.id ? "var(--accent)" : "#b9b9c2" }} /></div>
                  <span className="bench-score" style={p.id === s.id ? { color: "var(--accent)", fontWeight: 700 } : {}}>{p.eval!.score}</span>
                </div>
              ))}
            </div>
            <div className="sec-title" style={{ fontSize: 14 }}>逐任务明细</div>
            <div className="card">
              {s.eval.tasks.map((t) => (
                <div className="ev" key={t.task}>
                  <code>{t.task}</code> · 装 {Math.round(t.with_skill.score * 100)}% vs 不装 {Math.round(t.without_skill.score * 100)}% · 增益 +{Math.round(t.delta * 100)}pp
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <div className="sec-title">权限与安全<small>结构化披露 · 不是安全背书</small></div>
      <div className="perm">
        {Object.entries(FACTOR_LABELS).map(([k, [em, label]]) => {
          const f = s.risk[k];
          const state = f?.present === true ? "warn" : f?.present === false ? "ok" : "";
          const text = f?.present === true ? `含${label}` : f?.present === false ? `无${label}` : "未判定";
          return (
            <div key={k}>
              <div className="em">{em}</div>
              <div className={`t ${state}`}>{text}</div>
              <div className="d">{f?.detail ?? ""}</div>
            </div>
          );
        })}
      </div>

      {s.l3?.verdict && (
        <>
          <div className="sec-title">LLM 意图审查<small>{s.l3.model}</small></div>
          <div className="card" style={{ fontSize: 13.5 }}>🤖 {s.l3.verdict.intent_summary}</div>
        </>
      )}

      {(s.review || reviewReasons.length > 0) && (
        <>
          <div className="sec-title">人工复核</div>
          <div className="card">
            {reviewReasons.map((e, i) => (
              <div className="ev" key={i}>⚠ 升级原因:{e.note}</div>
            ))}
            {s.review && (
              <div className="review-box">
                <b>{s.review.verdict === "pass" ? "✓ 复核放行" : "✗ 复核拒绝"}</b> · {s.review.by} ·{" "}
                {s.review.at.slice(0, 10)}<br />{s.review.note}
              </div>
            )}
          </div>
        </>
      )}

      {fileEvidence.length > 0 && (
        <>
          <div className="sec-title">审计证据<small>文件级,来自 L1/L2 静态扫描</small></div>
          <div className="card">
            {fileEvidence.slice(0, 20).map((e, i) => (
              <div className="ev" key={i}>
                [{e.factor}] <code>{e.file}{e.line ? `:${e.line}` : ""}</code> {e.note}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
