import { readIdxMeta, readIdxPage } from "@/lib/store-server";
import { featuredLabels, tagLabels, FACETS } from "@skill-store/schemas";
import { type Locale } from "@/lib/i18n";
import BrowseClient from "./BrowseClient";

/**
 * 浏览页共享服务端体(ADR 0022 双路由 / ADR 0034 迁入):/browse/ = zh,/en/browse/ = en,同一数据、词随 locale。
 * 分类/标签名用词表自带的 label_zh / label_en(labels.ts 天生双语);分面名走词典。
 */
export default function BrowseServer({ locale }: { locale: Locale }) {
  const meta = readIdxMeta();
  const first = readIdxPage(1);
  const name = (l: { label_zh: string; label_en: string }) => (locale === "en" ? l.label_en : l.label_zh);
  const cats = featuredLabels().map((l) => ({ slug: l.slug, label: name(l), n: meta.cats[l.slug] ?? 0 }));
  const tags = tagLabels()
    .map((l) => ({ slug: l.slug, label: name(l), facet: (l.facet ?? "activity") as string, n: meta.tags[l.slug] ?? 0 }))
    .filter((x) => x.n > 0);
  const facets = FACETS.map((f) => ({ id: f.id as string, label: locale === "en" ? f.en : f.zh })); // 词表自带双语,单一来源

  return (
    <BrowseClient
      locale={locale}
      first={first}
      meta={{ total: meta.total, pages: meta.pages, size: meta.size, sceneVocab: meta.sceneVocab }}
      cats={cats}
      tags={tags}
      facets={facets}
      catTag={meta.catTag}
    />
  );
}
