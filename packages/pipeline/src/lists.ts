/**
 * 清单对象(catalog/lists)共享 IO 与派生信号重算(ADR 0019)。
 *
 * items 是 appearance 的 S0 静态账本:拷贝不落条目,记「作品被谁引用」。
 * 作品条目的 signals.appear_count / list_count 是 items 的派生缓存——
 * 一律经 recomputeWorkSignals 重算,幂等可重放,任何 job 不得手写这两个字段。
 */
import { mkdir, readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ListReport } from "@skill-store/schemas";
import { loadCatalogEntries, type CatalogEntry } from "./catalog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const LISTS = join(ROOT, "catalog", "lists");

/** id(owner/repo)→ 清单文件绝对路径 */
export function listPath(id: string): string {
  const [owner, repo] = id.split("/");
  return join(LISTS, owner, `${repo}.json`);
}

/** 加载全部清单;目录不存在返回空 Map(id → ListReport) */
export async function loadLists(): Promise<Map<string, ListReport>> {
  const out = new Map<string, ListReport>();
  let owners: string[] = [];
  try { owners = await readdir(LISTS); } catch { return out; }
  for (const owner of owners) {
    const dir = join(LISTS, owner);
    try { if (!(await stat(dir)).isDirectory()) continue; } catch { continue; }
    for (const f of await readdir(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const l = JSON.parse(await readFile(join(dir, f), "utf8")) as ListReport;
        out.set(l.id, l);
      } catch { /* 损坏跳过 */ }
    }
  }
  return out;
}

/** 写清单(resolved_count 随 items 收口,一处维护) */
export async function writeList(l: ListReport): Promise<void> {
  l.resolved_count = l.items?.length ?? 0;
  if (l.blocked) l.sampled_count = 0; // 拦截仓不变式:货架零条目
  const p = listPath(l.id);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(l, null, 2) + "\n");
}

/** 向清单追加引用(按 work+name 去重;返回是否新增)。items 即幂等闸:重复观测不重复记账 */
export function addItem(l: ListReport, work: string, name?: string): boolean {
  l.items ??= [];
  if (l.items.some((it) => it.work === work && (it.name ?? null) === (name ?? null))) return false;
  l.items.push(name ? { work, name } : { work });
  return true;
}

/**
 * 从全部清单 items 重算作品条目的 appear_count / list_count 派生缓存,外科式写回。
 * 幂等:以 items 为唯一事实源,重放结果一致;引用不存在的作品(悬空)返回报告不写入。
 * 传 entries 可复用调用方已加载的目录(省一次全量扫描)。
 */
export async function recomputeWorkSignals(
  lists: Map<string, ListReport>,
  entries?: CatalogEntry[],
): Promise<{ updated: number; dangling: { list: string; work: string }[] }> {
  const appear = new Map<string, number>();
  const inLists = new Map<string, Set<string>>();
  for (const l of lists.values()) {
    for (const it of l.items ?? []) {
      appear.set(it.work, (appear.get(it.work) ?? 0) + 1);
      (inLists.get(it.work) ?? inLists.set(it.work, new Set()).get(it.work)!).add(l.id);
    }
  }
  const all = entries ?? (await loadCatalogEntries());
  const byId = new Map(all.map((e) => [e.report.meta.id, e]));
  const dangling: { list: string; work: string }[] = [];
  for (const [work, sets] of inLists) if (!byId.has(work)) {
    for (const l of lists.values()) if ((l.items ?? []).some((it) => it.work === work)) dangling.push({ list: l.id, work });
    void sets;
  }
  let updated = 0;
  // 全量对齐:有引用的写新值,没引用但残留旧值的清零——保证「派生缓存 = items 的纯函数」
  for (const e of all) {
    const a = appear.get(e.report.meta.id);
    const lc = inLists.get(e.report.meta.id)?.size;
    const cur = e.report.signals;
    const next = { appear_count: a, list_count: lc };
    if ((cur.appear_count ?? undefined) === next.appear_count && (cur.list_count ?? undefined) === next.list_count) continue;
    if (next.appear_count == null) delete cur.appear_count; else cur.appear_count = next.appear_count;
    if (next.list_count == null) delete cur.list_count; else cur.list_count = next.list_count;
    await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    updated++;
  }
  return { updated, dangling };
}
