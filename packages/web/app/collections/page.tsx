import Link from "next/link";
import { allCollections } from "@/lib/data";
import { fmtInstalls } from "@/lib/skill-utils";
import { readIdxMeta } from "@/lib/store-server";

export const metadata = {
  title: "批量源合集 · 收录方法论 · oh-my-skill",
  description: "上游有 6 万+ 条 skill,我们审过才上架。批量源仓库按「每仓折叠采样」收录——为什么、怎么采、其余在哪,这页讲清楚。",
};

/** 收录比例条:采样占全量的比例(通常 <2%,视觉直接传达「折叠」力度) */
function Ratio({ sampled, total }: { sampled: number; total: number }) {
  const pct = (sampled / Math.max(1, total)) * 100;
  const label = pct >= 10 ? `${Math.round(pct)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
      <div style={{ flex: "0 0 120px", height: 3, borderRadius: 2, background: "var(--hair)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(1.5, pct)}%`, height: "100%", background: "var(--blue)" }} />
      </div>
      <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "var(--mono)" }}>已审计收录 {label}</span>
    </div>
  );
}

/**
 * 收录方法论页(v4 去盒子):把「折叠采样」讲成正面资产 ——
 * 上游宇宙很大,货架只放审过的;每行都能「回到货架」看这个仓已收录的条目(信任边界向内拉)。
 */
export default function Collections() {
  const collections = allCollections();
  const meta = readIdxMeta();
  const upstreamTotal = collections.reduce((a, c) => a + c.skillCount, 0);
  const sampledTotal = collections.reduce((a, c) => a + c.sampledCount, 0);

  return (
    <>
      <Link href="/browse/" className="back">‹ 浏览</Link>

      <section className="hero">
        <div className="eyebrow">收录方法论</div>
        <h1 className="small">上游很大,<span className="hl">审过才上架</span></h1>
        <p className="lede">
          有 {collections.length} 个仓库把成百上千个 skill 塞在一个 repo 里(聚合仓、awesome 合集、批量生成)。
          我们不照单全收:<b>每仓折叠采样、逐条过三层审计</b>,其余记录在这里,全量永远可以去上游看。
        </p>
        <div className="d-stats">
          <div><b>{upstreamTotal.toLocaleString()}</b><span>上游 skill 总量</span></div>
          <div><b>{sampledTotal.toLocaleString()}</b><span>采样进审计流程</span></div>
          <div><b>{meta.total.toLocaleString()}</b><span>全站已审计上架</span></div>
          <div><b>50 / 仓</b><span>采样上限</span></div>
        </div>
      </section>

      <div className="sec">
        <div className="sec-h"><h2>为什么折叠</h2><span className="k">三个理由,一条边界</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 28px" }}>
          {[
            ["防灌水", "一个 2.6 万条的仓能淹没整个货架;折叠后货架每条都值得被看到。"],
            ["防霸榜", "同仓 skill 共享仓库级 stars,不折叠会集体聚顶,热门榜失真。"],
            ["审计是承诺", "每条上架都要过 L1/L2/L3 扫描;采样让审计深度不被供给量稀释。"],
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
          <h2>全部合集</h2>
          <span className="k">「已收录 ›」= 过了审计的货架条目 · 「上游 ↗」= 未经审计的全集</span>
        </div>
        <div className="list">
          {collections.map((c) => {
            const owner = c.id.split("/")[0];
            return (
              <div className="row" key={c.id}>
                <div className="main">
                  <div className="nm">{c.id}</div>
                  <div className="ds">全量 {c.skillCount.toLocaleString()} 条 · 采样 {c.sampledCount} 条进三层审计 · @{owner}</div>
                  <Ratio sampled={c.sampledCount} total={c.skillCount} />
                </div>
                <div className="rt">
                  {c.stars != null && <div className="score"><span className="gold">★</span> {fmtInstalls(c.stars)}</div>}
                  <Link href={`/browse/?repo=${encodeURIComponent(c.id)}`} className="go">已收录 ›</Link>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>上游 ↗</a>
                </div>
              </div>
            );
          })}
          {!collections.length && <div className="empty">暂无合集条目</div>}
        </div>
      </div>
    </>
  );
}
