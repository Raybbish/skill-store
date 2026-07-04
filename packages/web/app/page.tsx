import { readIdxMeta, readIdxPacks, readIdxPage } from "@/lib/store-server";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import HomeClient from "./HomeClient";

/**
 * 首页 = 搜索 + 场景包跑马灯 + 完整货架(原 /browse 并入,「浏览」作为概念取消)。
 * 只带首屏分片(30 条)+ 计数元数据 + 包定义;其余交互由 HomeClient 按需 fetch /idx/。
 */
export default function Home() {
  const meta = readIdxMeta();
  const first = readIdxPage(1);
  const packs = readIdxPacks();
  const cats = featuredLabels().map((l) => ({ slug: l.slug, label: l.label_zh, n: meta.cats[l.slug] ?? 0 }));
  const tags = tagLabels().map((l) => ({ slug: l.slug, label: l.label_zh, n: meta.tags[l.slug] ?? 0 })).filter((t) => t.n > 0);

  return (
    <HomeClient
      first={first}
      meta={{ total: meta.total, pages: meta.pages, size: meta.size }}
      cats={cats}
      tags={tags}
      catTag={meta.catTag}
      packs={packs}
    />
  );
}
