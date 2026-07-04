/**
 * recategorize:用当前 labels.ts 词表对全 catalog 重跑分类,写回 meta.category + meta.tags。
 * 为什么需要:ingest 只对「新增 / 上游内容变更」的条目分类,存量条目不会因词表更新而重分类。
 * 改了 labels.ts(加分类 / 调规则)后,跑这个把新 taxonomy 落地到已有 catalog。
 *
 * 规则(与 ingest 的分类段一致):
 *   - category_locked(人工锁定)的条目不动;
 *   - 其余按 categorize() 重算,sources.yaml 的 per-source category 覆盖仍优先;
 *   - 默认只写回「有变化」的条目(幂等,不产生噪音 diff)。
 *
 * 用法:npm run recategorize [-- --dry](--dry 只统计不写盘)
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { loadCatalogEntries } from "../catalog.ts";
import { categorize } from "../categorize.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

async function main() {
  const dry = process.argv.includes("--dry");

  // per-source 分类覆盖(与 ingest 同源):sources.yaml 的 category 字段优先于启发式
  const sourcesFile = parse(await readFile(join(ROOT, "sources.yaml"), "utf8")) as {
    sources: { type: string; repo: string; category?: string }[];
  };
  const catOverride = new Map<string, string>();
  for (const s of sourcesFile.sources) if (s.category) catOverride.set(s.repo.toLowerCase(), s.category);
  const overrideFor = (id: string): string | undefined => {
    const [owner, repo] = id.split("/");
    return catOverride.get(`${owner}/${repo}`.toLowerCase());
  };

  const entries = await loadCatalogEntries();
  let changed = 0;
  let locked = 0;
  const dist: Record<string, number> = {};
  const inc = (k: string) => (dist[k] = (dist[k] ?? 0) + 1);

  for (const { path, report } of entries) {
    if (report.meta.category_locked) {
      locked++;
      inc(report.meta.category ?? "uncategorized");
      continue;
    }
    const { category, tags } = categorize(report.meta, overrideFor(report.meta.id));
    inc(category);

    const oldCat = report.meta.category ?? null;
    const oldTags = JSON.stringify(report.meta.tags ?? []);
    if (oldCat !== category || oldTags !== JSON.stringify(tags)) {
      changed++;
      report.meta.category = category;
      report.meta.tags = tags;
      if (!dry) await writeFile(path, JSON.stringify(report, null, 2) + "\n");
    }
  }

  console.log(`\n=== recategorize ${dry ? "(dry-run,未写盘)" : "完成"} ===`);
  console.log(`条目: ${entries.length} · 变更: ${changed} · 人工锁定跳过: ${locked}`);
  console.log(`新主分类分布:`);
  for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
