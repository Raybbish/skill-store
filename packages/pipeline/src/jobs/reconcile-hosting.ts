/**
 * hosting 字段对账:字段 ↔ 磁盘事实 + source hash。
 *
 * 病根:hosting 曾按 licence 分类写入(宽松证即 "mirrored"),与是否真有 mirror/ 副本脱节——
 * 两段式采集默认不下载副本,于是大量条目「标 mirrored 无镜像」。裁决(STATUS 2026-07-07):
 * hosting 只表达「本店实际托管」;licence 权限不丢——meta.license 原样在,可随时重推。
 *
 * 规则(外科式,只动 meta.hosting / meta.mirror_complete,其余字段一律不碰):
 * - hosting=mirrored 且磁盘无 mirror/ → 回写 indexed,删 mirror_complete
 * - mirror_complete=true 但 mirror 复算值与 content_hash 不同 → 回写 indexed,删 mirror_complete
 * - hosting=indexed 且磁盘有 mirror/ → 异常态,只报告不写(licence 收紧遗留副本等,人工核)
 *
 * 用法:npm run reconcile:hosting             (dry,只报告)
 *      npm run reconcile:hosting -- --apply  (写回)
 */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { loadCatalogEntries } from "../catalog.ts";
import { sourceContentHashDirectory } from "../../../cli/lib/content-hash.mjs";

async function main() {
  const apply = process.argv.includes("--apply");
  const entries = await loadCatalogEntries();
  let fixed = 0;
  let okMirrored = 0;
  let okIndexed = 0;
  const anomalies: string[] = [];
  const drifted: string[] = [];

  for (const e of entries) {
    const hasMirror = existsSync(join(dirname(e.path), "mirror"));
    const h = e.report.meta.hosting;
    if (h === "mirrored" && !hasMirror) {
      fixed++;
      if (apply) {
        e.report.meta.hosting = "indexed";
        delete e.report.meta.mirror_complete;
        await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
      }
    } else if (h === "mirrored" && e.report.meta.mirror_complete === true) {
      const actual = await sourceContentHashDirectory(join(dirname(e.path), "mirror")).catch(() => null);
      if (actual !== e.report.meta.content_hash) {
        drifted.push(e.report.meta.id);
        if (apply) {
          e.report.meta.hosting = "indexed";
          delete e.report.meta.mirror_complete;
          await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
        }
      } else {
        okMirrored++;
      }
    } else if (h === "indexed" && hasMirror) {
      anomalies.push(e.report.meta.id);
    } else if (h === "mirrored") {
      okMirrored++;
    } else {
      okIndexed++;
    }
  }

  console.log(`=== hosting 对账 ${apply ? "(--apply,已写回)" : "(dry,加 --apply 写回)"} ===`);
  console.log(`总条目: ${entries.length}`);
  console.log(`字段=磁盘,一致: mirrored ${okMirrored} · indexed ${okIndexed}`);
  console.log(`标 mirrored 但磁盘无 mirror/: ${fixed}${apply ? " → 已回写 indexed(删 mirror_complete)" : ""}`);
  console.log(`标 complete 但 source hash 漂移: ${drifted.length}${apply ? " → 已隔离为 indexed(保留旧 mirror 待下次 --mirror 刷新)" : ""}`);
  for (const id of drifted.slice(0, 10)) console.log(`   - ${id}`);
  if (drifted.length > 10) console.log(`   …等 ${drifted.length} 条`);
  if (anomalies.length) {
    console.log(`⚠ 标 indexed 但磁盘有 mirror/(未写回,人工核): ${anomalies.length}`);
    for (const id of anomalies.slice(0, 10)) console.log(`   - ${id}`);
    if (anomalies.length > 10) console.log(`   …等 ${anomalies.length} 条`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
