/**
 * 编排器:插件顺序执行 → 按 policy 合成 verdict(状态机见 types.ts)。
 *
 * 合成口径(全部来自 policy,改口径改配置不改这里的结构):
 *   - 任一层 error 且 fail_closed → flagged(绝不默认放行)
 *   - L1 critical 命中 → flagged(机器不得放行恶意签名)
 *   - L3 命中 major_risk(外传/注入/自评 major)→ flagged
 *   - L3 正常且 l3_final_arbiter → pass(可下调 hold_factors 挂起的条目)
 *   - 无 L3 时:hold_factors 命中 → flagged,否则 pass
 *
 * ⚠ S0 阶段本编排器只作为库存在,不接任何 cron/job:
 *   policy v0 是 draft,ADR 0012 步骤⑥(policy v1 定稿 + 全量重扫)之前不得批量执行。
 */
import type { LayerFinding, ScannerPlugin, ScanVerdict, VerdictSubject, Decision } from "./types.ts";
import type { VerdictPolicy } from "./policy.ts";
import { loadPolicy } from "./policy.ts";
import { appendVerdict } from "./ledger.ts";
import { emitVerdictUpdated } from "./events.ts";
import { ENGINE_VERSION } from "./service.ts";
import { staticScan } from "./plugins/static.ts";
import { l3Intent } from "./plugins/l3-intent.ts";

export const DEFAULT_PIPELINE: ScannerPlugin[] = [staticScan, l3Intent];

export async function runScan(
  subject: VerdictSubject,
  skillDir: string,
  plugins: ScannerPlugin[] = DEFAULT_PIPELINE,
): Promise<ScanVerdict> {
  const policy = loadPolicy();
  const findings: LayerFinding[] = [];
  for (const p of plugins) {
    try {
      findings.push(await p.scan({ subject, skillDir, prior: findings }));
    } catch (e) {
      findings.push({ layer: p.layer, verdict: "failed", error: (e as Error).message });
    }
  }
  const v = synthesize(subject, findings, policy);
  await appendVerdict(v);
  emitVerdictUpdated(v);
  return v;
}

/** 纯函数:findings + policy → verdict(可单测;不碰盘) */
export function synthesize(
  subject: VerdictSubject,
  findings: LayerFinding[],
  policy: VerdictPolicy,
): ScanVerdict {
  const at = new Date().toISOString();
  const factors = findings.find((f) => f.factors)?.factors ?? {};
  const evidence = findings.flatMap((f) => [...(f.critical ?? []), ...(f.evidence ?? [])]);
  const models = findings.filter((f) => f.layer === "L3" && f.by).map((f) => f.by!);

  const decisions: Decision[] = findings.map((f) => ({
    layer: f.layer,
    verdict: f.verdict,
    at,
    ...(f.by ? { by: f.by } : {}),
    ...(f.note ? { note: f.note } : {}),
    ...(f.error ? { note: `失败: ${f.error}` } : {}),
  }));

  const l1Critical = findings.some((f) => (f.critical?.length ?? 0) > 0);
  const failed = findings.some((f) => f.error);
  const l3 = findings.find((f) => f.layer === "L3" && f.l3)?.l3;
  const holdHit = policy.hold_factors.some(
    (k) => (factors as Record<string, { present?: boolean | null } | undefined>)[k]?.present === true,
  );

  let status: ScanVerdict["status"];
  let final: string;
  if (failed && policy.fail_closed) {
    status = "flagged"; final = "fail_closed";
  } else if (l1Critical && policy.major_risk.l1_critical) {
    status = "flagged"; final = "escalated_l1_critical";
  } else if (l3) {
    const major =
      (policy.major_risk.exfiltration_path && l3.exfiltration_path) ||
      (policy.major_risk.injection_suspected && l3.injection_suspected) ||
      (policy.major_risk.l3_severity_major && l3.severity === "major");
    if (major) { status = "flagged"; final = "escalated_major_risk"; }
    else if (policy.l3_final_arbiter) { status = "pass"; final = "auto_pass"; }
    else { status = holdHit ? "flagged" : "pass"; final = holdHit ? "hold" : "pass"; }
  } else {
    status = holdHit ? "flagged" : "pass";
    final = holdHit ? "hold_no_l3" : "pass_no_l3";
  }
  decisions.push({ layer: "system", verdict: final, at, note: `policy ${policy.version}` });

  return {
    schema: "scan-verdict@v1",
    subject,
    scanner: { engine: ENGINE_VERSION, policy: policy.version, ...(models.length ? { models } : {}) },
    status,
    factors,
    evidence,
    decisions,
    issued_at: at,
  };
}
