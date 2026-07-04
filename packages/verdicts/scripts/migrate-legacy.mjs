#!/usr/bin/env node
/**
 * S0-③ 一次性迁移(ADR 0012 步骤③):skill-report.json 的 security_audit → catalog/verdicts 账本。
 *
 * 口径:
 *   - 有真实判定信号的条目(status != pending,或带 review / l3)→ 迁成 legacy verdict
 *     (scanner.engine = "legacy", policy = "pre-adr-0011";status 映射 pass→pass / needs_review→flagged / rejected→rejected)
 *   - 纯 pending 采集占位(audited_at=null、无 review/l3)不产生账本条目——「从未判定」不是判定,
 *     账本只记判决,不记空白
 *   - 所有 skill-report 删除 security_audit 字段,schema_version 置 "2"
 *
 * 幂等:重复运行只会重写相同内容;--dry-run 只统计不落盘。
 * 用法:npm run verdicts:migrate [-- --dry-run]
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const SKILLS = join(ROOT, "catalog", "skills");
const VERDICTS = join(ROOT, "catalog", "verdicts");
const DRY = process.argv.includes("--dry-run");

const stats = { total: 0, migrated: 0, stubDropped: 0, alreadyV2: 0, byStatus: {} };

const mapStatus = (s) => ({ pass: "pass", needs_review: "flagged", rejected: "rejected" }[s] ?? "pending");

function toLegacyVerdict(report, sa) {
  const at = sa.audited_at ?? new Date().toISOString();
  const decisions = [];
  if (sa.audited_at) {
    decisions.push({ layer: "L2", verdict: "scanned", at: sa.audited_at, note: "L1 签名 + L2 五因子(legacy audit)" });
  }
  if (sa.l3) {
    decisions.push({
      layer: "L3",
      verdict: sa.l3.decision ?? "unknown",
      at: sa.l3.at ?? at,
      ...(sa.l3.model ? { by: sa.l3.model } : {}),
      ...(sa.l3.verdict?.intent_summary ? { note: sa.l3.verdict.intent_summary } : sa.l3.error ? { note: `失败: ${sa.l3.error}` } : {}),
    });
  }
  if (sa.review) {
    decisions.push({
      layer: "human",
      verdict: sa.review.verdict ?? "pass",
      at: sa.review.at ?? at,
      by: sa.review.by ?? "unknown",
      ...(sa.review.note ? { note: sa.review.note } : {}),
      signature: `${sa.review.by ?? "unknown"}@${sa.review.at ?? at}`,
    });
  }
  decisions.push({ layer: "system", verdict: "migrated", at: new Date().toISOString(), note: "ADR 0012 步骤③:security_audit → legacy verdict" });

  return {
    schema: "scan-verdict@v1",
    subject: { skill_id: report.meta.id, content_hash: report.meta.content_hash },
    scanner: {
      engine: "legacy",
      policy: "pre-adr-0011",
      ...(sa.scanner_versions?.l3_model ? { models: [sa.scanner_versions.l3_model] } : {}),
    },
    status: mapStatus(sa.status),
    factors: sa.risk_factors ?? {},
    evidence: sa.evidence ?? [],
    decisions,
    issued_at: at,
  };
}

for (const owner of readdirSync(SKILLS)) {
  let repos = [];
  try { repos = readdirSync(join(SKILLS, owner)); } catch { continue; }
  for (const repo of repos) {
    let names = [];
    try { names = readdirSync(join(SKILLS, owner, repo)); } catch { continue; }
    for (const name of names) {
      const p = join(SKILLS, owner, repo, name, "skill-report.json");
      let report;
      try { report = JSON.parse(readFileSync(p, "utf8")); } catch { continue; }
      stats.total++;

      const sa = report.security_audit;
      if (!sa) { stats.alreadyV2++; continue; }
      stats.byStatus[sa.status] = (stats.byStatus[sa.status] ?? 0) + 1;

      const hasSignal = sa.status !== "pending" || sa.review || sa.l3;
      if (hasSignal) {
        const v = toLegacyVerdict(report, sa);
        const ledger = { schema: "scan-verdict-ledger@v1", skill_id: report.meta.id, verdicts: [v] };
        if (!DRY) {
          const lp = join(VERDICTS, owner, repo, `${name}.json`);
          mkdirSync(dirname(lp), { recursive: true });
          writeFileSync(lp, JSON.stringify(ledger, null, 2) + "\n");
        }
        stats.migrated++;
      } else {
        stats.stubDropped++;
      }

      delete report.security_audit;
      report.schema_version = "2";
      if (!DRY) writeFileSync(p, JSON.stringify(report, null, 2) + "\n");
    }
  }
}

console.log(`${DRY ? "[dry-run] " : ""}skill-report 共 ${stats.total} 份(已是 v2: ${stats.alreadyV2})`);
console.log(`  原 security_audit 状态分布: ${JSON.stringify(stats.byStatus)}`);
console.log(`  → 迁成 legacy verdict: ${stats.migrated} 条(catalog/verdicts/)`);
console.log(`  → 纯 pending 占位丢弃: ${stats.stubDropped} 条(无判定信号,不入账本)`);
console.log(`  → 全部 report 已${DRY ? "将" : ""}删 security_audit 并升 schema_version=2`);
