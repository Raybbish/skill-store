/**
 * review:人工复核 needs_review 条目。复核是唯一能把条目改成 pass/rejected 的通道,
 * 且必须留签名(who/when/note),写进 security_audit.review 永久留痕。
 *
 * 用法:
 *   npm run review                                        # 列出待复核队列 + 证据摘要
 *   npm run review -- --approve <id> --by <name> --note "…"
 *   npm run review -- --reject  <id> --by <name> --note "…"
 *   npm run review -- --approve-all --by <name> --note "…" # 批量放行(慎用)
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillReport } from "@skill-store/schemas";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CATALOG = join(ROOT, "catalog", "skills");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

interface Entry { path: string; report: SkillReport; }

async function loadQueue(): Promise<Entry[]> {
  const out: Entry[] = [];
  for (const owner of await readdir(CATALOG)) {
    for (const name of await readdir(join(CATALOG, owner))) {
      const p = join(CATALOG, owner, name, "skill-report.json");
      try {
        const report = JSON.parse(await readFile(p, "utf8")) as SkillReport;
        if (report.security_audit.status === "needs_review") out.push({ path: p, report });
      } catch { /* skip */ }
    }
  }
  return out;
}

async function decide(e: Entry, verdict: "pass" | "rejected", by: string, note: string) {
  const sa = e.report.security_audit as SkillReport["security_audit"] & {
    review?: { verdict: string; by: string; at: string; note: string };
  };
  sa.status = verdict;
  sa.review = { verdict, by, at: new Date().toISOString(), note };
  await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
  console.log(`  ${verdict === "pass" ? "✓ 放行" : "✗ 拒绝"} ${e.report.meta.id} — ${note}`);
}

async function main() {
  const queue = await loadQueue();
  const by = arg("by");
  const note = arg("note") ?? "";
  const target = arg("approve") ?? arg("reject");

  if (has("approve-all")) {
    if (!by || !note) throw new Error("批量放行必须带 --by 和 --note");
    for (const e of queue) await decide(e, "pass", by, note);
    console.log(`\n批量放行 ${queue.length} 条,复核人:${by}`);
    return;
  }
  if (target) {
    if (!by || !note) throw new Error("复核必须带 --by 和 --note(留痕)");
    const e = queue.find((x) => x.report.meta.id === target);
    if (!e) throw new Error(`队列中没有 ${target}`);
    await decide(e, has("reject") || arg("reject") ? "rejected" : "pass", by, note);
    return;
  }

  // 默认:打印队列
  console.log(`待复核: ${queue.length} 条\n`);
  for (const e of queue) {
    const sa = e.report.security_audit;
    const reasons = sa.evidence.filter((v) => v.factor === "review_reason").map((v) => v.note);
    console.log(`■ ${e.report.meta.id}  (${e.report.meta.license} / ${e.report.meta.hosting})`);
    for (const r of reasons) console.log(`    原因: ${r}`);
    for (const ev of sa.evidence.filter((v) => v.factor !== "review_reason").slice(0, 5)) {
      console.log(`    证据: [${ev.factor}] ${ev.file}:${ev.line ?? "-"} ${ev.note}`);
    }
    console.log();
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
