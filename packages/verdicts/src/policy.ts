/**
 * 裁决口径 = 版本化 policy 文件(ADR 0012 §5)。
 * 「什么算重大风险、L3 有没有最终裁决权、复核容量」都是配置不是代码;
 * ADR 0011 的研究议题在 policy 版本迭代里做,不牵动消费方。
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface VerdictPolicy {
  version: string;
  /** draft 口径不得用于打开 TRUST_DISPLAY */
  status: "draft" | "final";
  note?: string;
  /** 命中即转人工(flagged);l1_critical 恒真——机器不得放行恶意签名 */
  major_risk: {
    exfiltration_path: boolean;
    injection_suspected: boolean;
    l3_severity_major: boolean;
    l1_critical: boolean;
  };
  /** true:非重大风险由 L3 自动放行(可下调 L2 因 hold_factors 挂起的条目) */
  l3_final_arbiter: boolean;
  /** true:任一层失败 → flagged,绝不默认放行 */
  fail_closed: boolean;
  /** L2 阶段先挂起、交 L3 定夺的因子(旧口径:network 非硬红线,但先 hold) */
  hold_factors: string[];
  queue: { daily_capacity: number; order: "risk_desc" };
}

const POLICY_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "policies");

let cached: VerdictPolicy | null = null;

/** 加载当前 policy(默认 v0 草稿;定稿 v1 后改这里的默认值) */
export function loadPolicy(version = "v0"): VerdictPolicy {
  if (cached && cached.version.startsWith(version)) return cached;
  cached = JSON.parse(readFileSync(join(POLICY_DIR, `${version}.json`), "utf8")) as VerdictPolicy;
  return cached;
}
