/**
 * S0 存量手术(ADR 0019,一次性):collections → lists 升级 + 拷贝回收 + 巨仓下架。
 *
 * 1. catalog/collections/<owner>/<repo>.json(CollectionReport)→ catalog/lists/(ListReport);
 *    file_count ≥ 阈值(默认 1000)的仓标 blocked——1000+ 文件不可能单作者手写,
 *    生成或搬运两种在模型下都是零内容上架(用户裁决 2026-07-09)。
 * 2. 回收可证拷贝:meta.duplicate_of 条目删除,引用记入来源仓清单 items(appearance 账本)。
 * 3. 巨仓下架:blocked 仓在货架的全部采样条目删除。
 * 4. 重算作品派生信号(appear_count/list_count),删除旧 collections/ 目录。
 *
 * 默认 dry-run 只打印账;--apply 落盘。--threshold N 覆盖拦截阈值。
 * 幂等:重跑无 dup 无 blocked 残留时是空操作。删除的条目可从 git 历史重放(审计账本不丢)。
 */
import { readdir, readFile, rm, rmdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionReport, ListReport } from "@skill-store/schemas";
import { CATALOG, loadCatalogEntries, entryDir } from "../catalog.ts";
import { loadLists, writeList, addItem, recomputeWorkSignals } from "../lists.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const COLLECTIONS = join(ROOT, "catalog", "collections");

const APPLY = process.argv.includes("--apply");
const argOf = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const THRESHOLD = Number(argOf("threshold")) || 1000;

async function loadCollections(): Promise<CollectionReport[]> {
  const out: CollectionReport[] = [];
  let owners: string[] = [];
  try { owners = await readdir(COLLECTIONS); } catch { return out; }
  for (const owner of owners) {
    let files: string[] = [];
    try { files = await readdir(join(COLLECTIONS, owner)); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try { out.push(JSON.parse(await readFile(join(COLLECTIONS, owner, f), "utf8")) as CollectionReport); } catch { /* skip */ }
    }
  }
  return out;
}

/** 删空的父目录(repo/owner 两级),保持 catalog/skills 干净 */
async function pruneEmptyParents(id: string): Promise<void> {
  const [owner, repo] = id.split("/");
  for (const d of [join(CATALOG, owner, repo), join(CATALOG, owner)]) {
    try { if ((await readdir(d)).length === 0) await rmdir(d); } catch { /* 非空或不存在 */ }
  }
}

async function main() {
  console.log(`S0 存量手术(${APPLY ? "APPLY" : "dry-run"}),拦截阈值 ${THRESHOLD}\n`);
  const cols = await loadCollections();
  const entries = await loadCatalogEntries();
  const lists = await loadLists();
  console.log(`存量:collections ${cols.length} · 条目 ${entries.length} · 既有 lists ${lists.size}`);

  // —— 计划:谁被删、谁进账本 ——
  const blockedRepos = new Set(cols.filter((c) => c.skill_count >= THRESHOLD).map((c) => c.id.toLowerCase()));
  const repoOf = (id: string) => id.split("/").slice(0, 2).join("/");
  const dups = entries.filter((e) => e.report.meta.duplicate_of);
  const blockedEntries = entries.filter((e) => !e.report.meta.duplicate_of && blockedRepos.has(repoOf(e.report.meta.id)));
  const deleteIds = new Set([...dups, ...blockedEntries].map((e) => e.report.meta.id));

  // 幸存者 hash 索引(canonical 再解析用:目标若也被删,按内容找幸存的同 hash 条目)
  const survivorByHash = new Map<string, string>();
  for (const e of entries) {
    if (deleteIds.has(e.report.meta.id)) continue;
    if (!survivorByHash.has(e.report.meta.content_hash)) survivorByHash.set(e.report.meta.content_hash, e.report.meta.id);
  }

  // —— 拷贝回收:appearance 进来源仓清单 items ——
  let recycled = 0, dropped = 0;
  const touched = new Set<string>();
  const now = new Date().toISOString();
  for (const d of dups) {
    const id = d.report.meta.id;
    let target = d.report.meta.duplicate_of!;
    if (deleteIds.has(target) || !entries.some((e) => e.report.meta.id === target)) {
      const re = survivorByHash.get(d.report.meta.content_hash);
      if (!re) { dropped++; console.warn(`  ⚠ ${id} 的 canonical ${target} 无幸存者,出现记录放弃(git 历史可溯)`); continue; }
      target = re;
    }
    const srcRepo = repoOf(id);
    if (srcRepo === repoOf(target)) { recycled++; continue; } // 同仓改名:删条目即可,不算外部出现
    const l = lists.get(srcRepo) ?? {
      schema_version: "1" as const, id: srcRepo, kind: "imported" as const,
      url: `https://github.com/${srcRepo}`, sampled_count: 0, fetched_at: now,
    };
    lists.set(srcRepo, l);
    if (addItem(l, target, d.report.meta.name)) touched.add(srcRepo);
    recycled++;
  }

  // —— collections → lists(保留原 fetched_at 观测时点;blocked 仓标记拦截) ——
  for (const c of cols) {
    const prev = lists.get(c.id);
    const l: ListReport = prev ?? {
      schema_version: "1", id: c.id, kind: "imported", url: c.url, sampled_count: 0, fetched_at: c.fetched_at,
    };
    l.file_count = c.skill_count;
    if (c.stars_github != null) l.stars_github = c.stars_github;
    if (blockedRepos.has(c.id.toLowerCase())) { l.blocked = true; l.block_reason ??= `bulk>=${THRESHOLD}`; }
    lists.set(c.id, l);
    touched.add(c.id);
  }

  // sampled_count = 手术后货架事实
  const liveByRepo = new Map<string, number>();
  for (const e of entries) {
    if (deleteIds.has(e.report.meta.id)) continue;
    const r = repoOf(e.report.meta.id);
    liveByRepo.set(r, (liveByRepo.get(r) ?? 0) + 1);
  }
  for (const id of touched) {
    const l = lists.get(id)!;
    if (!l.blocked) l.sampled_count = liveByRepo.get(id) ?? 0;
  }

  // —— 账单 ——
  console.log(`\n计划:`);
  console.log(`  拦截仓(file_count ≥ ${THRESHOLD}): ${blockedRepos.size} 个,下架条目 ${blockedEntries.length}`);
  console.log(`  可证拷贝(duplicate_of)回收: ${dups.length}(记账 ${recycled},canonical 无幸存者放弃 ${dropped})`);
  console.log(`  删除条目合计: ${deleteIds.size}`);
  console.log(`  清单写入/更新: ${touched.size}(其中带 items 账本 ${[...touched].filter((t) => (lists.get(t)!.items?.length ?? 0) > 0).length})`);
  console.log(`  手术后货架条目: ${entries.length - deleteIds.size}`);

  if (!APPLY) { console.log(`\ndry-run 结束,未写盘。加 --apply 执行。`); return; }

  // —— 落盘 ——
  for (const id of touched) await writeList(lists.get(id)!);
  let deleted = 0;
  for (const id of deleteIds) {
    await rm(entryDir(id), { recursive: true, force: true });
    await pruneEmptyParents(id);
    deleted++;
  }
  if (existsSync(COLLECTIONS)) await rm(COLLECTIONS, { recursive: true, force: true });
  const survivors = entries.filter((e) => !deleteIds.has(e.report.meta.id));
  const rc = await recomputeWorkSignals(lists, survivors);
  for (const d of rc.dangling) console.warn(`  ⚠ 清单 ${d.list} 引用了不存在的作品 ${d.work}`);
  console.log(`\n=== 手术完成 ===`);
  console.log(`  删除条目: ${deleted} · 清单落盘: ${touched.size} · 派生信号写回: ${rc.updated}`);
  console.log(`  旧 catalog/collections/ 已移除;后续:npm run web:index && npm run typesense:push,Supabase 由 sync 收敛`);
}

main().catch((e) => { console.error(e); process.exit(1); });
