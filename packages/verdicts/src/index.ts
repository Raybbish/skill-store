/**
 * @skill-store/verdicts —— verdict 判定服务(ADR 0012)。
 *
 * 消费方(商店/CLI)只 import 本入口:契约类型 + 五接口 + 事件 + 门禁谓词。
 * 编排器与插件也从这里导出,但仅供服务侧 job 使用,商店不得直接调 runScan。
 */
export * from "./types.ts";
export {
  submit,
  getVerdict,
  batchGetVerdicts,
  listQueue,
  decide,
  onVerdictUpdated,
  displayReady,
  canPromote,
  riskScore,
  ENGINE_VERSION,
} from "./service.ts";
export { loadPolicy, type VerdictPolicy } from "./policy.ts";
export { readLedger, currentVerdict, loadAllLedgers, VERDICTS_DIR } from "./ledger.ts";
export { runScan, synthesize, DEFAULT_PIPELINE } from "./orchestrator.ts";
