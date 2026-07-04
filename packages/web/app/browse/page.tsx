import { readIdxMeta, readIdxPage } from "@/lib/store-server";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import BrowseClient from "./BrowseClient";

/**
 * P0(ADR 0007):不再把全量 skills 塞给客户端 —— 只带首屏分片(30 条)+ 计数元数据,
 * 翻页/筛选/搜索由 BrowseClient 按需 fetch /idx/ 下的静态产物。
 * 首屏数据与客户端分片同源(都出自 build-index),口径天然一致。
 * 收录口径完全不在货架出现(用户导向零认知负担)——入口在 CertBadge 弹窗与页脚。
 */
export default function Browse() {
  const meta = readIdxMeta();
  const first = readIdxPage(1);
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
    </>
  );
}
