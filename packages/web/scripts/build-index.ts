/**
 * 构建期索引生成(ADR 0007 · P0):catalog → public/idx/ 静态派生索引。
 *
 *   idx/meta.json     total/pages + 分类·标签·桶内细分计数(货架口径:主分类或标签命中)
 *   idx/pages/pN.json 默认「热门」视图分片,每片 PAGE_SIZE(30)张瘦卡,已套 per-repo cap
 *   idx/docs.json     全量瘦卡(纯热门序、未 cap),客户端筛选/搜索懒加载用
 *
 * 跑法:npm run web:index(根目录)或 npm run index -w @skill-store/web;
 * dev/build 经 predev/prebuild 自动执行。**必须以 packages/web 为 cwd**(data.ts 按 cwd 找 catalog)。
 * 产物是派生物,不进 git(见 .gitignore);搜索/浏览查它,catalog 仍是唯一事实源。
 */
import { mkdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { allSkills } from "../lib/data";
import { PAGE_SIZE, toCard, type IdxMeta } from "../lib/store";
import { applyRepoCap, byPopularity } from "../lib/skill-utils";
import { featuredLabels, tagLabels } from "@skill-store/schemas";

const t0 = Date.now();
const OUT = join(process.cwd(), "public/idx");

const skills = allSkills();
if (!skills.length) {
  console.error("[build-index] catalog 读到 0 条 —— cwd 必须是 packages/web(经 npm run index -w 执行)。");
  process.exit(1);
}

// 纯热门序全量瘦卡(docs.json);分片视图在此之上套 per-repo cap
const docs = [...skills].sort(byPopularity).map(toCard);
const shelf = applyRepoCap(docs);

// 计数(与 matchFilters/货架口径一致:分类=主分类命中;标签=tags 命中)
const cats: Record<string, number> = {};
const tags: Record<string, number> = {};
const catTag: Record<string, Record<string, number>> = {};
const tagSlugs = tagLabels().map((l) => l.slug);
for (const l of featuredLabels()) {
  const members = docs.filter((c) => c.category === l.slug || (c.tags ?? []).includes(l.slug));
  cats[l.slug] = members.length;
  const inner: Record<string, number> = {};
  for (const t of tagSlugs) {
    const n = members.filter((c) => (c.tags ?? []).includes(t)).length;
    if (n > 0) inner[t] = n;
  }
  if (Object.keys(inner).length) catTag[l.slug] = inner;
}
for (const t of tagSlugs) {
  const n = docs.filter((c) => c.category === t || (c.tags ?? []).includes(t)).length;
  if (n > 0) tags[t] = n;
}

// 落盘(rm 失败不致命:沙箱挂载盘禁 unlink 时直接覆盖写)
try { rmSync(OUT, { recursive: true, force: true }); } catch { /* 覆盖写兜底 */ }
mkdirSync(join(OUT, "pages"), { recursive: true });

const pages = Math.max(1, Math.ceil(shelf.length / PAGE_SIZE));
for (let p = 1; p <= pages; p++) {
  writeFileSync(join(OUT, "pages", `p${p}.json`), JSON.stringify(shelf.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)));
}
const meta: IdxMeta = {
  generatedAt: new Date().toISOString(),
  total: docs.length, pages, size: PAGE_SIZE,
  cats, tags, catTag,
};
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta));
writeFileSync(join(OUT, "docs.json"), JSON.stringify(docs));

const kb = (f: string) => `${Math.round(statSync(join(OUT, f)).size / 1024)}KB`;
console.log(
  `[build-index] ${docs.length} 条 → ${pages} 片 × ${PAGE_SIZE} · meta ${kb("meta.json")} · docs ${kb("docs.json")} · p1 ${kb("pages/p1.json")} · ${Date.now() - t0}ms`,
);
