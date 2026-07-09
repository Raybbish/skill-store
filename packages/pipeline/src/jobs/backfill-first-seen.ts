/**
 * backfill-first-seen:给存量 catalog 条目回填 `signals.first_seen_at`(见 ADR 0016)。
 *
 * 事实源是 catalog 的 git 历史:一条 skill-report.json 首次被 `--diff-filter=A` 加入的
 * commit 时间,就是它「首次进货架」的时间。采集期只对**新条目**盖 first_seen_at(official.ts),
 * 更新时沿用旧值(ingest.ts);字段引入前的存量条目没有该值,由本脚本一次性从 git 回填。
 *
 * 要点:
 *   - **单次 git pass**:一条 `git log --reverse --diff-filter=A` 建「路径 → 首个 add 日期」表,
 *     不对 5,816 条各跑一次 git(O(1) 子进程,不是 O(n))。
 *   - **幂等**:默认只填缺失的(已有 first_seen_at 的跳过);`--force` 才覆盖重算。
 *   - **只读预览**:`--dry` 不写盘,打印按天分布,便于批量采集前核对。
 *
 * 口径注意(catalog 尚年轻,影响小,但要知道):git 按**当前路径**取首个 add commit。
 * 经历过 id-v2 改名迁移(catalog/skills 三段式重构)的条目,取到的是**迁移那次**的日期,
 * 而非更早的原始日期;跨改名的精确溯源需 `--follow`(仅单路径可用),批量 pass 不做。
 *
 * 用法:
 *   npm run backfill:first-seen -- --dry     # 预览:多少条待填 + 按天分布,不写盘
 *   npm run backfill:first-seen              # 回填缺失项(幂等)
 *   npm run backfill:first-seen -- --force   # 强制按 git 重算全部(覆盖已有)
 */
import { writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { relative, sep } from "node:path";
import { loadCatalogEntries, ROOT } from "../catalog.ts";

const exec = promisify(execFile);
// catalog 规模下 git 输出会超过 execFile 默认 1MB stdout 上限,放大 maxBuffer(仅上限,不预分配)。
const GIT_OPTS = { maxBuffer: 1024 * 1024 * 512 };

/** 单次 git pass:catalog/skills/…/skill-report.json → 首个 add commit 的 ISO 日期 */
async function firstAddDates(): Promise<Map<string, string>> {
  // --reverse 让 commit 由旧到新;每个 commit 先输出一行 ISO 日期(--format=%aI),
  // 再输出该 commit 新增(A)的文件路径(--name-only)。首次见到某路径 = 其 add 日期。
  // --no-renames:关掉改名检测。否则 id-v2 三段式迁移(如 anthropics/pptx → anthropics/skills/pptx)
  //   被记为 R 而非 A,--diff-filter=A 直接漏掉,这类条目永远填不上——与上方 docstring「取迁移那次日期」
  //   的意图相悖。关掉后改名会拆成 D(旧路径)+ A(新路径),新路径这条 A 正是我们要的迁移日期。
  const out = (await exec(
    "git",
    ["-C", ROOT, "log", "--reverse", "--diff-filter=A", "--no-renames", "--name-only", "--format=%aI", "--", "catalog/skills"],
    GIT_OPTS,
  )).stdout;

  const firstAdd = new Map<string, string>();
  let curDate = "";
  for (const line of out.split("\n")) {
    if (!line) continue;
    if (/^\d{4}-\d{2}-\d{2}T/.test(line)) { curDate = line.trim(); continue; } // commit 头(日期)
    if (line.startsWith("catalog/skills/") && line.endsWith("/skill-report.json") && !firstAdd.has(line)) {
      firstAdd.set(line, curDate);
    }
  }
  return firstAdd;
}

async function main() {
  const force = process.argv.includes("--force");
  const dry = process.argv.includes("--dry");

  const firstAdd = await firstAddDates();
  const entries = await loadCatalogEntries();

  let written = 0, already = 0, noGit = 0, wouldWrite = 0;
  const dist = new Map<string, number>(); // 首见日(YYYY-MM-DD)→ 条数
  for (const e of entries) {
    if (e.report.signals.first_seen_at && !force) { already++; continue; }
    const relPath = relative(ROOT, e.path).split(sep).join("/"); // 归一为 posix,对齐 git 输出
    const date = firstAdd.get(relPath);
    if (!date) { noGit++; continue; } // 尚未提交(未跟踪)/ 路径不匹配 → 留给下次(提交后再跑)

    dist.set(date.slice(0, 10), (dist.get(date.slice(0, 10)) ?? 0) + 1);
    if (dry) { wouldWrite++; continue; }
    e.report.signals.first_seen_at = date;
    await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    written++;
  }

  console.log(`\n=== backfill-first-seen${dry ? "(--dry 预览)" : ""}${force ? "(--force 覆盖)" : ""} ===`);
  console.log(`catalog 条目: ${entries.length} · git 已追踪的 add 路径: ${firstAdd.size}`);
  console.log(dry ? `  将回填: ${wouldWrite}` : `  已回填: ${written}`);
  console.log(`  已有值跳过: ${already}${force ? "(--force 下为 0)" : ""}`);
  if (noGit) console.log(`  git 无记录(未提交/路径不匹配,提交后重跑即可): ${noGit}`);
  const days = [...dist.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (days.length) {
    console.log(`  首见日分布:`);
    for (const [day, n] of days) console.log(`    ${day}  ${"█".repeat(Math.min(40, n)).padEnd(40)} ${n}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
