/**
 * verdict 账本(S0 形态):catalog/verdicts/<owner>/<repo>/<name>.json,git 即 append-only 账本,
 * 公开可验证、PR 溯源——与 catalog「事实源走 git」同一哲学(ADR 0012 §6)。
 * S1+ 换 Postgres 主存时本文件换实现,service.ts 接口不动。
 */
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ScanVerdict, VerdictLedger } from "./types.ts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const VERDICTS_DIR = join(ROOT, "catalog", "verdicts");

export function ledgerPath(skillId: string): string {
  const [owner, repo, name] = skillId.split("/");
  return join(VERDICTS_DIR, owner, repo, `${name}.json`);
}

export async function readLedger(skillId: string): Promise<VerdictLedger | null> {
  try {
    return JSON.parse(await readFile(ledgerPath(skillId), "utf8")) as VerdictLedger;
  } catch {
    return null;
  }
}

/** append-only:新条目插到最前;绝不修改既有条目 */
export async function appendVerdict(v: ScanVerdict): Promise<VerdictLedger> {
  const ledger: VerdictLedger = (await readLedger(v.subject.skill_id)) ?? {
    schema: "scan-verdict-ledger@v1",
    skill_id: v.subject.skill_id,
    verdicts: [],
  };
  ledger.verdicts.unshift(v);
  const p = ledgerPath(v.subject.skill_id);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(ledger, null, 2) + "\n");
  return ledger;
}

/** 当前有效判定:命中 content_hash 的最新条目(无 hash 约束时取最新) */
export function currentVerdict(ledger: VerdictLedger | null, contentHash?: string): ScanVerdict | null {
  if (!ledger) return null;
  if (!contentHash) return ledger.verdicts[0] ?? null;
  return ledger.verdicts.find((v) => v.subject.content_hash === contentHash) ?? null;
}

/** 遍历全部账本(队列/统计用);容忍空目录 */
export async function loadAllLedgers(): Promise<VerdictLedger[]> {
  const out: VerdictLedger[] = [];
  let owners: string[] = [];
  try { owners = await readdir(VERDICTS_DIR); } catch { return out; }
  for (const owner of owners) {
    let repos: string[] = [];
    try { repos = await readdir(join(VERDICTS_DIR, owner)); } catch { continue; }
    for (const repo of repos) {
      let files: string[] = [];
      try { files = await readdir(join(VERDICTS_DIR, owner, repo)); } catch { continue; }
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          out.push(JSON.parse(await readFile(join(VERDICTS_DIR, owner, repo, f), "utf8")) as VerdictLedger);
        } catch { /* 跳过坏文件 */ }
      }
    }
  }
  return out;
}
