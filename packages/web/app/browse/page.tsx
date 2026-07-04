import { allCollections } from "@/lib/data";
import { readIdxMeta, readIdxPage } from "@/lib/store-server";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import BrowseClient from "./BrowseClient";

/**
 * P0(ADR 0007):不再把全量 skills 塞给客户端 —— 只带首屏分片(30 条)+ 计数元数据,
 * 翻页/筛选/搜索由 BrowseClient 按需 fetch /idx/ 下的静态产物。
 * 首屏数据与客户端分片同源(都出自 build-index),口径天然一致。
 * 收录标准入口 = 严选比例条(hero 下,零文字负担)+ nav「收录」tab + CertBadge 弹窗 + 页脚。
 */
export default function Browse() {
  const meta = readIdxMeta();
  const first = readIdxPage(1);
  const upstreamTotal = allCollections().reduce((a, c) => a + c.skillCount, 0);
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
        upstream={upstreamTotal}
      />
    </>
  );
}
