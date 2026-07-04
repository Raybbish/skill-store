/**
 * scan-verdict@v1 —— verdict 判定服务的冻结契约(ADR 0012)。
 *
 * verdict 是内容的纯函数:幂等键 = subject.content_hash + scanner.policy。
 * 本文件与五接口(service.ts)一起构成「缝」:实现(编排器/插件/存储)随 S0→S3 演进,契约不动。
 * 消费方(商店)只依赖本文件的类型与 service.ts 的签名,不得解释 verdict 内部细节(门禁谓词在服务侧)。
 */
import type { RiskFactors, Evidence } from "@skill-store/schemas";

export type VerdictStatus = "pending" | "pass" | "flagged" | "rejected" | "error";

export interface VerdictSubject {
  /** owner/repo/name */
  skill_id: string;
  /** sha256 over sorted (path, blob sha) —— 判定锚定内容,不是名字 */
  content_hash: string;
}

export interface ScannerInfo {
  /** 判定引擎版本;历史迁移数据为 "legacy" */
  engine: string;
  /** 裁决口径(policy)版本;draft 口径不得用于开 TRUST_DISPLAY(ADR 0012 步骤⑥) */
  policy: string;
  models?: string[];
}

export type DecisionLayer = "L1" | "L2" | "L3" | "human" | "system";

/** 决策链条目:谁(规则/模型/人)在何时判了什么 */
export interface Decision {
  layer: DecisionLayer;
  /** clean / critical / escalated / auto_pass / failed / pass / rejected … */
  verdict: string;
  at: string;
  /** 模型名或人工签名者 */
  by?: string;
  note?: string;
  /** 人工裁决必须留痕 */
  signature?: string;
}

export interface ScanVerdict {
  schema: "scan-verdict@v1";
  subject: VerdictSubject;
  scanner: ScannerInfo;
  status: VerdictStatus;
  factors: RiskFactors;
  evidence: Evidence[];
  /** append-only 决策链 */
  decisions: Decision[];
  issued_at: string;
  /** 被本条取代的旧判定指针:`${content_hash}@${policy}` */
  supersedes?: string;
}

/** 账本文件(catalog/verdicts/<owner>/<repo>/<name>.json):新在前,append-only —— 改判 = 新条目,不覆写 */
export interface VerdictLedger {
  schema: "scan-verdict-ledger@v1";
  skill_id: string;
  verdicts: ScanVerdict[];
}

/* ============ scanner 插件接口(层即插件;S3 生态的接入面) ============ */

export interface ScanContext {
  subject: VerdictSubject;
  /** 内容目录(mirror/ 或临时 clone) */
  skillDir: string;
  /** 前序层的产出(如 L3 需要 L1/L2 摘要) */
  prior: LayerFinding[];
}

export interface LayerFinding {
  layer: DecisionLayer;
  verdict: string;
  factors?: RiskFactors;
  evidence?: Evidence[];
  /** L1 critical 命中(机器不得放行,policy.major_risk.l1_critical) */
  critical?: Evidence[];
  /** L3 意图审查明细(synthesize 依 policy 读取) */
  l3?: L3Finding;
  by?: string;
  note?: string;
  /** 非空 = 本层失败;policy.fail_closed 决定后果 */
  error?: string;
}

export interface L3Finding {
  intent_summary: string;
  doc_code_consistent: boolean;
  hidden_instructions: boolean;
  injection_suspected: boolean;
  exfiltration_path: boolean;
  severity: "none" | "minor" | "major";
  notes: string[];
}

export interface ScannerPlugin {
  layer: DecisionLayer;
  scan(ctx: ScanContext): Promise<LayerFinding>;
}
