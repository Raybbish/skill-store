/**
 * categorize-preview.ts —— 开发用:把分类引擎跑一遍 catalog,打印每条的 category + tags 与分布。
 * 不写盘、不改数据。用于人工校准词表(labels.ts)。
 *
 * 运行:tsx packages/pipeline/src/jobs/categorize-preview.ts
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LABELS, labelZh, featuredLabels, tagLabels } from '@skill-store/schemas';
import { categorize } from '../categorize';

const CATALOG = resolve(process.cwd(), 'catalog/skills');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name === 'skill-report.json') out.push(p);
  }
  return out;
}

const files = walk(CATALOG);
const catCount: Record<string, number> = {};
const tagCount: Record<string, number> = {};
const rows: { cat: string; tags: string[]; id: string }[] = [];

for (const f of files) {
  const meta = JSON.parse(readFileSync(f, 'utf8')).meta ?? {};
  const { category, tags } = categorize(meta);
  catCount[category] = (catCount[category] ?? 0) + 1;
  for (const t of tags) tagCount[t] = (tagCount[t] ?? 0) + 1;
  rows.push({ cat: category, tags, id: meta.id });
}

console.log(`\n主分类分布(共 ${files.length} 条):`);
for (const l of [...featuredLabels(), { slug: 'uncategorized', label_zh: '未分类' } as any]) {
  const n = catCount[l.slug] ?? 0;
  console.log(`  ${labelZh(l.slug).padEnd(12)} ${String(n).padStart(3)}  ${'█'.repeat(n)}`);
}
console.log(`\n标签覆盖(featured:false,可跨分类):`);
for (const l of tagLabels()) console.log(`  #${l.slug.padEnd(14)} ${String(tagCount[l.slug] ?? 0).padStart(3)} 条`);

console.log(`\n逐条(cat · #tags):`);
for (const row of rows.sort((a, b) => a.cat.localeCompare(b.cat))) {
  console.log(`  ${row.cat.padEnd(13)} ${row.tags.map((t) => '#' + t).join(' ').padEnd(28)} ${row.id}`);
}
