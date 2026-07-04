import Link from "next/link";
import { allCollections } from "@/lib/data";
import { readIdxMeta, readIdxPage } from "@/lib/store-server";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import BrowseClient from "./BrowseClient";

/**
 * P0(ADR 0007):不再把全量 skills 塞给客户端 —— 只带首屏分片(30 条)+ 计数元数据,
 * 翻页/筛选/搜索由 BrowseClient 按需 fetch /idx/ 下的静态产物。
 * 首屏数据与客户端分片同源(都出自 build-index),口径天然一致。
 * 批量源合集已挪 /collections/(货架主流程只指向已审计条目),这里只留一行入口。
 */
export default function Browse() {
  const meta = readIdxMeta();
  const first = readIdxPage(1);
  const collections = allCollections();
  const upstreamTotal = collections.reduce((a, c) => a + c.skillCount, 0);
  const cats = featuredLabels().map((l) => ({ slug: l.slug, label: l.label_zh, n: meta.cats[l.slug] ?? 0 }));
  const tags = tagLabels().map((l) => ({ slug: l.slug, label: l.label_zh, n: meta.tags[l.slug] ?? 0 })).filter((t) => t.n > 0);

  return (
    <>
      <BrowseClient
        first={first}
        meta={{ total: meta.total, pages: meta.pages, size: meta.size }}
        cats={cats}
        tags={tags}
        catTag={meta.catTag}
      />
      {collections.length > 0 && (
        <div className="sec">
          <div className="sec-h">
            <h2>收录口径</h2>
            <span className="k">上游很大,审过才上架</span>
            <Link href="/collections/">收录方法论 ›</Link>
          </div>
          <Link href="/collections/" className="row" style={{ textDecoration: "none" }}>
            <div className="main">
              <div className="nm">上游 {upstreamTotal.toLocaleString()} 条 · 货架 {meta.total.toLocaleString()} 条,每条都过了三层审计</div>
              <div className="ds">{collections.length} 个批量源仓按「每仓采样 50 条」折叠收录 —— 为什么折叠、采了哪些、其余在哪,一页讲清楚</div>
            </div>
            <div className="rt"><span className="go">看合集 ›</span></div>
          </Link>
        </div>
      )}
    </>
  );
}
