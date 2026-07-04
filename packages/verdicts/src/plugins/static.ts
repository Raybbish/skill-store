/**
 * 静态扫描插件:一次目录遍历同时产出 L1 critical 签名命中与 L2 风险五因子。
 * 引擎为原 pipeline scanners(ADR 0012 步骤② 搬入),规则集见 engines/rules.ts。
 */
import { analyzeSkillDir } from "../engines/analyze.ts";
import type { ScannerPlugin } from "../types.ts";

export const staticScan: ScannerPlugin = {
  layer: "L2",
  async scan({ skillDir }) {
    const r = await analyzeSkillDir(skillDir);
    return {
      layer: "L2",
      verdict: r.criticalHits.length ? "critical" : "scanned",
      factors: r.factors,
      evidence: r.evidence,
      critical: r.criticalHits,
      note: `${r.scannedFiles} 个文件`,
    };
  },
};
