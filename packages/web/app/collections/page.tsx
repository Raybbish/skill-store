import Link from "next/link";
import { allCollections } from "@/lib/data";
import { fmtInstalls } from "@/lib/skill-utils";
import { readIdxMeta } from "@/lib/store-server";

export const metadata = {
  title: "收录标准 · oh-my-skill",
  description: "全网几万个 skill,这里只上架审核过的。为什么不照单全收、每个源收了多少、其余在哪,这页讲清楚。",
};

/** 收录比例条:上架数占源内总量的比例(视觉直接传达「只挑一部分」) */
function Ratio({ sampled, total }: { sampled: number; total: number }) {
  const pct = (sampled / Math.max(1, total)) * 100;
  const label = pct >= 10 ? `${Math.round(pct)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
      <div style={{ flex: "0 0 120px", height: 3, borderRadius: 2, background: "var(--hair)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(1.5, pct)}%`, height: "100%", background: "var(--blue)" }} />
      </div>
      <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "var(--mono)" }}>已上架 {label}</span>
    </div>
  );
}

/**
 * 收录标准页(用户语言版):不出现「审计/折叠/采样/上游/批量源」等内部词。
 * 与 browse 的严选比例条共用同一视觉母题;每行「已收录 ›」深链回货架(拉回信任边界内)。
 */
export default function Collections() {
  const collections = allCollections();
  const meta = readIdxMeta();
  const upstreamTotal = collections.reduce((a, c) => a + c.skillCount, 0);

  return (
    <>
      <Link href="/browse/" className="back">‹ 浏览</Link>

      <section className="hero">
        <div className="eyebrow">收录标准</div>
        <h1 className="small">全网很大,<span className="hl">审过才上架</span></h1>
        <p className="lede">
          有些源把成百上千个 skill 打包在一起。我们不照单全收:<b>每个源只挑一部分,逐个审核后上架</b>;
          其余列在这里,你随时可以去源头看全部。
        </p>
        <div className="d-stats">
          <div><b>{(meta.total + upstreamTotal).toLocaleString()}</b><span>全网 skill</span></div>
          <div><b>{meta.total.toLocaleString()}</b><span>已审核上架</span></div>
          <div><b>{collections.length}</b><span>打包大源</span></div>
        </div>
      </section>

      <div className="sec">
        <div className="sec-h"><h2>为什么只挑一部分</h2></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 28px" }}>
          {[
            ["不灌水", "货架上的每个位置,都留给值得看的。"],
            ["不刷榜", "大源不能靠数量霸占热门榜。"],
            ["审核是承诺", "上架多少,就审多少——宁可少,不掺假。"],
          ].map(([t, d]) => (
            <div key={t} style={{ borderTop: "1px solid var(--hair)", padding: "14px 2px 6px" }}>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--sub)", marginTop: 5, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <h2>这些大源</h2>
          <span className="k">「已收录 ›」看它家审核过的 · 「源头 ↗」看它全部(未审核)</span>
        </div>
        <div className="list">
          {collections.map((c) => (
            <div className="row" key={c.id}>
              <div className="main">
                <div className="nm">{c.id}</div>
                <div className="ds">共 {c.skillCount.toLocaleString()} 个 · 已审核上架 {c.sampledCount} 个</div>
                <Ratio sampled={c.sampledCount} total={c.skillCount} />
              </div>
              <div className="rt">
                {c.stars != null && <div className="score"><span className="gold">★</span> {fmtInstalls(c.stars)}</div>}
                <Link href={`/browse/?repo=${encodeURIComponent(c.id)}`} className="go">已收录 ›</Link>
                <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>源头 ↗</a>
              </div>
            </div>
          ))}
          {!collections.length && <div className="empty">暂无条目</div>}
        </div>
      </div>
    </>
  );
}
