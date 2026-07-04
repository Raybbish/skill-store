/**
 * 五接口 —— 契约面(ADR 0012 §3.3)。S0 = 同仓函数调用;S1 起原样映射 HTTP,签名不变。
 *
 *   submit          幂等入队(同 hash + 同 policy 直接返回既有判定)
 *   getVerdict      商店唯一读入口(单条)
 *   batchGetVerdicts 构建期批量 join
 *   listQueue       人工复核队列(风险分排序,容量来自 policy)
 *   decide          人工裁决(必须签名留痕)
 *
 * 门禁谓词也在本文件(canPromote):商店只问「能不能上」,不自己解释 verdict。
 */
import type { RiskFactors } from "@skill-store/schemas";
import type { ScanVerdict, VerdictSubject } from "./types.ts";
import { readLedger, appendVerdict, currentVerdict, loadAllLedgers } from "./ledger.ts";
import { loadPolicy } from "./policy.ts";
import { emitVerdictUpdated } from "./events.ts";

export const ENGINE_VERSION = "0.1.0-s0";

export async function getVerdict(subject: VerdictSubject): Promise<ScanVerdict | null> {
  return currentVerdict(await readLedger(subject.skill_id), subject.content_hash);
}

/** key = skill_id */
export async function batchGetVerdicts(subjects: VerdictSubject[]): Promise<Map<string, ScanVerdict | null>> {
  const out = new Map<string, ScanVerdict | null>();
  for (const s of subjects) out.set(s.skill_id, await getVerdict(s));
  return out;
}

/** 幂等提交:内容或口径变了才产生新 pending 条目(旧判定通过 supersedes 链接) */
export async function submit(subject: VerdictSubject): Promise<ScanVerdict> {
  const policy = loadPolicy();
  const ledger = await readLedger(subject.skill_id);
  const existing = currentVerdict(ledger, subject.content_hash);
  if (existing && existing.scanner.policy === policy.version && existing.status !== "error") {
    return existing;
  }
  const prev = currentVerdict(ledger);
  const v: ScanVerdict = {
    schema: "scan-verdict@v1",
    subject,
    scanner: { engine: ENGINE_VERSION, policy: policy.version },
    status: "pending",
    factors: {},
    evidence: [],
    decisions: [{ layer: "system", verdict: "submitted", at: new Date().toISOString() }],
    issued_at: new Date().toISOString(),
    ...(prev ? { supersedes: `${prev.subject.content_hash}@${prev.scanner.policy}` } : {}),
  };
  await appendVerdict(v);
  emitVerdictUpdated(v);
  return v;
}

/** 风险分:critical 命中权重最高,其次因子数(队列排序口径,内部启发式可调) */
export function riskScore(v: ScanVerdict): number {
  const critical = v.evidence.filter((e) => e.factor === "critical" || e.factor === "review_reason").length;
  const factors = (Object.keys(v.factors) as (keyof RiskFactors)[]).filter((k) => v.factors[k]?.present === true).length;
  return critical * 10 + factors;
}

/** 人工复核队列:flagged 按风险分降序;默认容量 = policy.queue.daily_capacity */
export async function listQueue(opts: { top?: number } = {}): Promise<ScanVerdict[]> {
  const policy = loadPolicy();
  const top = opts.top ?? policy.queue.daily_capacity;
  const flagged: ScanVerdict[] = [];
  for (const ledger of await loadAllLedgers()) {
    const cur = currentVerdict(ledger);
    if (cur?.status === "flagged") flagged.push(cur);
  }
  return flagged.sort((a, b) => riskScore(b) - riskScore(a)).slice(0, top);
}

/** 人工裁决:唯一能产生 rejected 的通道;append 新条目(不覆写),签名留痕 */
export async function decide(
  subject: VerdictSubject,
  verdict: "pass" | "rejected",
  by: string,
  note: string,
): Promise<ScanVerdict> {
  if (!by || !note) throw new Error("人工裁决必须带签名(by)与理由(note)");
  const existing = await getVerdict(subject);
  if (!existing) throw new Error(`无待裁决判定: ${subject.skill_id}@${subject.content_hash.slice(0, 16)}…`);
  const at = new Date().toISOString();
  const v: ScanVerdict = {
    ...existing,
    status: verdict,
    decisions: [...existing.decisions, { layer: "human", verdict, by, at, note, signature: `${by}@${at}` }],
    issued_at: at,
    supersedes: `${existing.subject.content_hash}@${existing.scanner.policy}`,
  };
  await appendVerdict(v);
  emitVerdictUpdated(v);
  return v;
}

/* ============ 门禁谓词(TRUST_GATE 用;商店不得自行解释 verdict) ============ */

/** 展示口径:verdict 是否可对用户展示(TRUST_DISPLAY 且 policy 已定稿) */
export function displayReady(): boolean {
  return process.env.TRUST_DISPLAY === "1" && loadPolicy().status === "final";
}

/** 门禁口径:该条目能否 promotion(TRUST_GATE 关闭时恒真 = 商店行为与今天一致) */
export function canPromote(v: ScanVerdict | null): boolean {
  if (process.env.TRUST_GATE !== "1") return true;
  // fail-closed:门禁开启时,无判定或非 pass 一律不放行
  return v?.status === "pass";
}

export { onVerdictUpdated } from "./events.ts";
