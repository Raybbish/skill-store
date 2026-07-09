import Link from "next/link";
import { allCollections } from "@/lib/data";
import { fmtInstalls } from "@/lib/skill-utils";
import { readIdxMeta } from "@/lib/store-server";

export const metadata = {
  title: "收录 · oh-my-skill",
  description: "每个源收了多少、其余在哪,一页看全。",
};

/** 收录比例条:上架数占源内总量(纯视觉,无文字解释) */
function Ratio({ sampled, total }: { sampled: number; total: number }) {
  const pct = (sampled / Math.max(1, total)) * 100;
  const label = pct >= 10 ? `${Math.round(pct)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
      <div style={{ flex: "0 0 120px", height: 3, borderRadius: 2, background: "var(--hair)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(1.5, pct)}%`, height: "100%", background: "var(--blue)" }} />
      </div>
      <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "var(--mono)" }}>{label}</span>
    </div>
  );
}

/** 收录页(零文案版):数据自己说话——数字、比例条、来源列表,没有一句解释性文字。 */
export default function Methodology() {
  const collections = allCollections();
  const meta = readIdxMeta();
  const upstreamTotal = collections.reduce((a, c) => a + c.skillCount, 0);

  return (
    <>
      <Link href="/" className="back">‹ 首页</Link>

      <section className="hero">
        <div className="eyebrow">收录</div>
        <h1 className="small">{meta.total.toLocaleString()} <span style={{ color: "var(--faint)", fontWeight: 600 }}>/ {(meta.total + upstreamTotal).toLocaleString()}</span></h1>
        <div className="d-stats">
          <div><b>{(meta.total + upstreamTotal).toLocaleString()}</b><span>全网</span></div>
          <div><b>{meta.total.toLocaleString()}</b><span>已上架</span></div>
          <div><b>{collections.length}</b><span>大源</span></div>
        </div>
      </section>

      <div className="list" style={{ marginTop: 18 }}>
        {collections.map((c) => (
          <div className="row" key={c.id}>
            <div className="main">
              <div className="nm">{c.id}</div>
              {c.description && <div className="ds">{c.description}</div>}
              <div className="ds" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                {c.skillCount.toLocaleString()}{c.blocked ? " · 未逐条收录" : ` · 上架 ${c.sampledCount}`}
              </div>
              {!c.blocked && <Ratio sampled={c.sampledCount} total={c.skillCount} />}
            </div>
            <div className="rt">
              {c.stars != null && <div className="score"><span className="gold">★</span> {fmtInstalls(c.stars)}</div>}
              {!c.blocked && <Link href={`/?repo=${encodeURIComponent(c.id)}`} className="go">已收录 ›</Link>}
              <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>源头 ↗</a>
            </div>
          </div>
        ))}
        {!collections.length && <div className="empty">暂无</div>}
      </div>

      {collections.some((c) => c.blocked) && (
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--faint)", fontFamily: "var(--mono)" }}>
          单仓 ≥ 1,000 个 skill 的批量源:记录来源与规模,不逐条收录
        </p>
      )}
    </>
  );
}
