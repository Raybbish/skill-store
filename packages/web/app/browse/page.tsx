import { allCollections } from "@/lib/data";
import { readIdxMeta, readIdxPage } from "@/lib/store-server";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import BrowseClient from "./BrowseClient";

/**
 * P0(ADR 0007):不再把全量 skills 塞给客户端 —— 只带首屏分片(30 条)+ 计数元数据,
 * 翻页/筛选/搜索由 BrowseClient 按需 fetch /idx/ 下的静态产物。
 * 首屏数据与客户端分片同源(都出自 build-index),口径天然一致。
 */
export default function Browse() {
  const meta = readIdxMeta();
  const first = readIdxPage(1);
  const collections = allCollections();
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
          <div className="sec-h"><h2>批量源合集</h2><span className="k">折叠采样 · 全量见上游</span></div>
          <div className="list">
            {collections.map((c) => (
              <a href={c.url} key={c.id} className="row" target="_blank" rel="noopener noreferrer">
                <div className="main">
                  <div className="nm">{c.id}</div>
                  <div className="ds">共 {c.skillCount.toLocaleString()} 个 skill · 已采样收录 {c.sampledCount} 条</div>
                </div>
                <div className="rt">
                  {c.stars != null && <div className="score"><span className="gold">★</span> {c.stars.toLocaleString()}</div>}
                  <span className="go">上游 ↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
