/**
 * migrate-id-v2:一次性迁移,catalog/skills 从二段式(owner/name)迁到三段式(owner/repo/name)。
 * repo 段从 meta.upstream 解析(github.com/<owner>/<repo>/tree/...),小写。
 * 幂等:已在三层深度的条目(目录下无 skill-report.json 而下一层有)自动跳过。
 * 同时重写 meta.id 与全量 duplicate_of 引用。迁移后可删除本文件。
 *
 * 用法:npx tsx packages/pipeline/src/jobs/migrate-id-v2.ts
 *      (或 node --experimental-strip-types 同路径)
 */
import { readdir, readFile, writeFile, rename, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillReport } from "@skill-store/schemas";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CATALOG = join(ROOT, "catalog", "skills");

async function exists(p: string): Promise<boolean> {
  try { await readFile(p, "utf8"); return true; } catch { return false; }
}

async function main() {
  // 1. 收集旧式条目(owner/<name>/skill-report.json,深度 2)
  const old: { owner: string; name: string; dir: string; report: SkillReport }[] = [];
  for (const owner of await readdir(CATALOG)) {
    let seconds: string[] = [];
    try { seconds = await readdir(join(CATALOG, owner)); } catch { continue; }
    for (const second of seconds) {
      const dir = join(CATALOG, owner, second);
      const p = join(dir, "skill-report.json");
      if (!(await exists(p))) continue; // 深度 2 无报告 → 已是新式中间层或杂项
      old.push({ owner, name: second, dir, report: JSON.parse(await readFile(p, "utf8")) as SkillReport });
    }
  }
  if (!old.length) { console.log("没有旧式条目,无需迁移"); return; }
  console.log(`发现 ${old.length} 条旧式(owner/name)条目`);

  // 2. 两阶段搬移(先全部挪进暂存区再落位):避免「skill 名 == repo 名」时目标路径
  //    落在源目录内部导致 rename 自嵌套(EINVAL),以及旧条目目录被新中间层复用的交叉冲突。
  const idMap = new Map<string, string>();
  const staged: { tmp: string; target: string; oldId: string; newId: string }[] = [];
  const STAGING = join(CATALOG, ".migrating");
  await mkdir(STAGING, { recursive: true });
  let moved = 0, skipped = 0;

  // 阶段 A:重写 id → 挪进暂存区
  for (let i = 0; i < old.length; i++) {
    const e = old[i];
    const m = e.report.meta.upstream.match(/github\.com\/[^/]+\/([^/]+)\/tree\//);
    if (!m) { console.warn(`  ✗ 无法从 upstream 解析 repo,跳过: ${e.report.meta.id}`); skipped++; continue; }
    const repo = m[1].toLowerCase();
    const oldId = e.report.meta.id;
    const newId = `${e.owner}/${repo}/${e.name}`;
    idMap.set(oldId, newId);

    e.report.meta.id = newId;
    await writeFile(join(e.dir, "skill-report.json"), JSON.stringify(e.report, null, 2) + "\n");
    const tmp = join(STAGING, String(i));
    await rename(e.dir, tmp); // 整目录搬移,mirror/ 一并带走
    staged.push({ tmp, target: join(CATALOG, e.owner, repo, e.name), oldId, newId });
  }

  // 阶段 B:从暂存区落位
  for (const s of staged) {
    if (await exists(join(s.target, "skill-report.json"))) {
      console.warn(`  ⚠ 目标已存在,丢弃旧条目: ${s.oldId} → ${s.newId}`);
      await rm(s.tmp, { recursive: true, force: true });
      skipped++;
      continue;
    }
    await mkdir(dirname(s.target), { recursive: true });
    await rename(s.tmp, s.target);
    moved++;
    console.log(`  ✓ ${s.oldId} → ${s.newId}`);
  }
  await rm(STAGING, { recursive: true, force: true });

  // 3. 全量重写 duplicate_of 引用(此时全部条目已在三层)
  let refFixed = 0;
  for (const owner of await readdir(CATALOG)) {
    for (const repo of await readdir(join(CATALOG, owner)).catch(() => [] as string[])) {
      for (const name of await readdir(join(CATALOG, owner, repo)).catch(() => [] as string[])) {
        const p = join(CATALOG, owner, repo, name, "skill-report.json");
        try {
          const r = JSON.parse(await readFile(p, "utf8")) as SkillReport;
          const dup = r.meta.duplicate_of;
          if (dup && idMap.has(dup)) {
            r.meta.duplicate_of = idMap.get(dup)!;
            await writeFile(p, JSON.stringify(r, null, 2) + "\n");
            refFixed++;
          }
        } catch { /* skip */ }
      }
    }
  }

  console.log(`\n=== 迁移完成 ===`);
  console.log(`搬移: ${moved} · 跳过: ${skipped} · duplicate_of 修正: ${refFixed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
