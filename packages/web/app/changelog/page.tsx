import Link from "next/link";
import { readIdxChangelog } from "@/lib/store-server";

export const metadata = {
  title: "动态 · oh-my-skill",
  description: "商店周报:本周新增、上线与下线,一页看全。",
};

const KIND: Record<string, string> = { release: "上线", change: "变更", notice: "公告" };

/** 商店周报(/changelog):自动「本周 +N 条」统计行 + 手写条目(catalog/changelog.json 事实源)。
 *  「公告&复盘」从社区拆出后的落点(ADR 0017)。 */
export default function Changelog() {
  const cl = readIdxChangelog();

  return (
    <>
      <Link href="/" className="back">‹ 首页</Link>

      <section className="hero">
        <div className="eyebrow">动态</div>
        <h1 className="small">本周 <span style={{ color: "var(--blue)" }}>+{cl.weekAdded.toLocaleString()}</span> 条上架</h1>
      </section>

      <div className="list" style={{ marginTop: 18 }}>
        {cl.entries.map((e, i) => (
          <div className="row" key={i}>
            <div className="main">
              <div className="nm">{e.text}</div>
              <div className="ds">{e.date}{e.kind ? ` · ${KIND[e.kind] ?? e.kind}` : ""}</div>
            </div>
          </div>
        ))}
        {!cl.entries.length && <div className="empty">暂无动态</div>}
      </div>
    </>
  );
}
