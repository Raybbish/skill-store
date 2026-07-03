/**
 * catalog 遍历共享工具:catalog/skills/<owner>/<repo>/<name>/skill-report.json(三段式 ID v2)。
 * 所有 job(ingest/audit/audit-l3/review/eval)统一从这里读,避免各自维护目录深度。
 */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillReport } from "@skill-store/schemas";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const CATALOG = join(ROOT, "catalog", "skills");

export interface CatalogEntry {
  /** skill-report.json 的绝对路径(job 写回用) */
  path: string;
  report: SkillReport;
}

/** 加载全部条目;容忍非条目目录与解析失败(跳过) */
export async function loadCatalogEntries(): Promise<CatalogEntry[]> {
  const out: CatalogEntry[] = [];
  let owners: string[] = [];
  try { owners = await readdir(CATALOG); } catch { return out; }
  for (const owner of owners) {
    let repos: string[] = [];
    try { repos = await readdir(join(CATALOG, owner)); } catch { continue; }
    for (const repo of repos) {
      let names: string[] = [];
      try { names = await readdir(join(CATALOG, owner, repo)); } catch { continue; }
      for (const name of names) {
        const p = join(CATALOG, owner, repo, name, "skill-report.json");
        try {
          out.push({ path: p, report: JSON.parse(await readFile(p, "utf8")) as SkillReport });
        } catch { /* 非条目目录,跳过 */ }
      }
    }
  }
  return out;
}

/** id(owner/repo/name)→ 条目目录绝对路径 */
export function entryDir(id: string): string {
  const [owner, repo, name] = id.split("/");
  return join(CATALOG, owner, repo, name);
}
