/**
 * review:人工复核 needs_review 条目。复核是唯一能把条目改成 pass/rejected 的通道,
 * 且必须留签名(who/when/note),写进 security_audit.review 永久留痕。
 *
 * 用法:
 *   npm run review                                        # 按风险排序,列出今日处理力(默认前 5)条
 *   npm run review -- --top 10                            # 调整今日列出条数
 *   npm run review -- --approve <id> --by <name> --note "…"
 *   npm run review -- --reject  <id> --by <name> --note "…"
 *   npm run review -- --approve-all --by <name> --note "…" # 批量放行(慎用)
 *
 * 队列已被 L3(DeepSeek)收窄到「重大风险 + fail-closed」;这里再按风险从高到低排序,
 * 每天只需处理前 N 条,其余留待后续——匹配人工每日约 5 条的处理力。
 */
import { writeFile } from "node:fs/promises";
import type { SkillReport } from "@skill-store/schemas";
import { loadCatalogEntries } from "../catalog.ts";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

interface Entry { path: string; report: SkillReport; }

type ReviewAudit = SkillReport["security_audit"] & {
  l3?: {
    decision?: string;
    verdict?: {
      severity?: string;
      exfiltration_path?: boolean;
      injection_suspected?: boolean;
      hidden_instructions?: boolean;
      doc_code_consistent?: boolean;
    };
  };
};

/** 风险打分:队列内排序用,分越高越该先看。L3 未跑 / 失败的排前面(信息缺口 = 优先人看)。 */
function riskScore(saRaw: SkillReport["security_audit"]): number {
  const sa = saRaw as ReviewAudit;
  const v = sa.l3?.verdict;
  let s = 0;
  if (!sa.l3) s += 40;                        // 没跑过 L3(如 L1 恶意签名直接 hold)
  if (sa.l3?.decision === "failed") s += 45;  // L3 失败 fail-closed
  if (v?.severity === "major") s += 60;
  if (v?.exfiltration_path) s += 50;
  if (v?.injection_suspected) s += 40;
  if (v?.hidden_instructions) s += 10;
  if (v && v.doc_code_consistent === false) s += 5;
  return s;
}

async function loadQueue(): Promise<Entry[]> {
  return (await loadCatalogEntries()).filter((e) => e.report.security_audit.status === "needs_review");
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

  // 默认:按风险排序,只列今日处理力(默认 5)内的前 N 条
  const top = arg("top") ? Math.max(1, Number(arg("top"))) : 5;
  const ranked = queue
    .map((e) => ({ e, score: riskScore(e.report.security_audit) }))
    .sort((a, b) => b.score - a.score);
  console.log(`待复核: ${queue.length} 条 · 处理力 ${top}/日 · 下面按风险从高到低列出前 ${Math.min(top, queue.length)} 条\n`);
  for (const { e, score } of ranked.slice(0, top)) {
    const sa = e.report.security_audit as ReviewAudit;
    const sev = sa.l3?.verdict?.severity ?? (sa.l3?.decision === "failed" ? "未知(L3失败)" : "—");
    const reasons = sa.evidence.filter((v) => v.factor === "review_reason").map((v) => v.note);
    console.log(`■ [risk ${score}] ${e.report.meta.id}  (${e.report.meta.license} / ${e.report.meta.hosting})  严重度: ${sev}`);
    for (const r of reasons) console.log(`    原因: ${r}`);
    for (const ev of sa.evidence.filter((v) => v.factor !== "review_reason").slice(0, 5)) {
      console.log(`    证据: [${ev.factor}] ${ev.file}:${ev.line ?? "-"} ${ev.note}`);
    }
    console.log();
  }
  if (queue.length > top) {
    console.log(`… 其余 ${queue.length - top} 条风险更低,留待后续(队列按 ${top}/日 自然消化)。`);
    console.log(`   放行/拒绝:npm run review -- --approve|--reject <id> --by <你> --note "…"`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
