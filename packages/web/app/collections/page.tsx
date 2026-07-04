import Link from "next/link";
import { allCollections } from "@/lib/data";
import { fmtInstalls } from "@/lib/skill-utils";

export const metadata = {
  title: "批量源合集 · oh-my-skill",
  description: "折叠采样收录的批量源仓库——我们对巨型合集仓的收录口径:每仓采样审计,全量见上游。",
};

/**
 * 收录方法论页(从 /browse 底部挪出,ADR 0007 讨论后定):
 * 合集卡指向未经审计的上游全集,不属于货架主流程 —— 货架上每个可点元素都指向已审计条目,
 * 这条信任边界在 browse 守死;透明化放这里集中讲清楚。
 */
export default function Collections() {
  const collections = allCollections();
  const upstreamTotal = collections.reduce((a, c) => a + c.skillCount, 0);
  const sampledTotal = collections.reduce((a, c) => a + c.sampledCount, 0);

  return (
    <>
      <Link href="/browse/" className="back">‹ 浏览</Link>

      <section className="hero">
        <div className="eyebrow">收录方法论</div>
        <h1 className="small">批量源合集 <span style={{ color: "var(--faint)", fontWeight: 600, fontSize: 20, marginLeft: 10 }}>{collections.length}</span></h1>
        <p className="lede">
          有些仓库一个 repo 塞成百上千个 skill(聚合仓、awesome 合集、批量生成)。全量收录会灌水货架,
          还会共享仓库级 stars 集体霸榜 —— 所以我们<b>每仓折叠采样</b>(上限 50 条)进入审计流程,其余记录在这里。
          上游共 {upstreamTotal.toLocaleString()} 条,已采样审计 {sampledTotal.toLocaleString()} 条。
        </p>
      </section>

      <div style={{ background: "#fdf3e4", borderRadius: 12, padding: "11px 15px", fontSize: 13, color: "var(--sub)", margin: "6px 0 14px" }}>
        ⚠ 「上游 ↗」链接指向源仓库<b>未经审计的全集</b>——没有权限营养标签,也没有三层扫描。货架上的每一条都过了审计;出了这个页面口径不同,请自行判断。
      </div>

      <div className="list">
        {collections.map((c) => (
          <a href={c.url} key={c.id} className="row" target="_blank" rel="noopener noreferrer">
            <div className="main">
              <div className="nm">{c.id}</div>
              <div className="ds">共 {c.skillCount.toLocaleString()} 个 skill · 已采样收录 {c.sampledCount} 条</div>
            </div>
            <div className="rt">
              {c.stars != null && <div className="score"><span className="gold">★</span> {fmtInstalls(c.stars)}</div>}
              <span className="go">上游 ↗</span>
            </div>
          </a>
        ))}
        {!collections.length && <div className="empty">暂无合集条目</div>}
      </div>
    </>
  );
}
