# @skill-store/verdicts

verdict 判定服务([ADR 0012](../../docs/decisions/0012-verdict-service.md)· [架构全文](../../docs/architecture/安全扫描服务-可插拔架构与迁移.html))。

**契约(冻结)**:`scan-verdict@v1`(types.ts)+ 五接口(service.ts:`submit` / `getVerdict` / `batchGetVerdicts` / `listQueue` / `decide`)+ 事件 `verdict.updated`。S0 = 同仓函数调用;S1 起原样上 HTTP,签名不变。

**账本**:`catalog/verdicts/<owner>/<repo>/<name>.json`,append-only,git 即公开可验证账本。判定锚定 `content_hash`,幂等键 = hash + policy 版本。

**口径**:`policies/v0.json`(draft,旧口径存档)。ADR 0011 前置研究完成、定稿 v1 前:不得打开 `TRUST_DISPLAY`,编排器不得接 cron 批量执行。

**引擎**:`src/engines/` 为原 pipeline scanners 三件套原样搬入(git mv,历史可溯);`src/plugins/` 是其插件包装,层即插件,第三方引擎实现 `ScannerPlugin` 即可接入(S3)。

**两个 flag**:`TRUST_DISPLAY`(展示,fail-open)· `TRUST_GATE`(门禁,fail-closed,谓词 `canPromote` 在本包)。商店不得自行解释 verdict。
