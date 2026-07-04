# ADR 0012 — 安全扫描重生为可插拔 verdict 判定服务
- 日期:2026-07-04
- 状态:已定稿(S0 待执行)
- 前置:[ADR 0011](0011-unlist-security-scan.md)(扫描已整套下架)
- 全文:[安全扫描服务 · 可插拔架构与迁移](../architecture/安全扫描服务-可插拔架构与迁移.html)
- 手法对齐:[ADR 0007](0007-skillstore-seam-static-index.md)(埋缝不搬家)

## 背景
下架扫描动了 29 个文件——扫描逻辑弥散在前端组件、类型三层、筛选器、CLI、文案、构建门禁里,从来不是模块。重新上架前必须先解决结构问题:信任层需要一条和 `search()/getSkill()` 同等级的缝。

## 决策
扫描重生为独立的 **verdict 判定服务**,商店是它的第一个消费方,不是宿主。

1. **数据面一刀**:判定从 skill-report.json 拆出为独立 verdict 文档,锚定 `content_hash`,幂等键 = `content_hash + policy_version`,append-only 账本(S0 存 `catalog/verdicts/` git 目录)。skill-report 只留 content_hash 锚点。
2. **契约冻结**:`scan-verdict@v1` schema(subject / scanner 版本 / status 状态机 / factors / evidence / decisions 决策链)+ 五接口(`submit` / `getVerdict` / `batchGet` / `listQueue` / `decide`)+ 事件 `verdict.updated`。transport 无关:S0 = `packages/verdicts` 导出函数,S1 起原样上 HTTP。
3. **商店三插拔点**:ingest 完异步 submit;build-index optional join + TrustBadge 开关组件;CLI optional 披露(content_hash 校验独立,永远在)。两个 flag:`TRUST_DISPLAY`(展示,fail-open)、`TRUST_GATE`(门禁,fail-closed,谓词在服务侧——商店不自己解释 verdict)。
4. **层即插件,口径即配置**:L1/L2/L3/human 实现同一 scanner 插件接口;裁决口径(什么算重大风险、L3 裁决权、复核容量)是版本化 policy 文件,ADR 0011 的研究在 policy 迭代里做,不牵动商店代码。
5. **四阶段**:S0 同仓 package 零运维 → S1 队列+worker+HTTP(gate:目录 >1.5万 或全量扫 >1h)→ S2 多租户「信任即服务」(gate:第二个真实消费方)→ S3 插件生态 + merkle 透明度日志。

## 验收标准
**重新上架 = 打开 TRUST_DISPLAY,diff 只有 flag。** 这就是「可插拔」的定义。

## 迁移(S0 六步,详见全文 §8)
① 本 ADR 定契约 → ② 建 `packages/verdicts`(schema + 五接口 + 编排器,scanners 三件套 + review 搬入为插件)→ ③ 历史 5,800+ security_audit 迁移标 legacy,skill-report schema v2 删 security_audit 字段 → ④ 商店三处 optional 接线,flag 默认 off(货架外观不变)→ ⑤ ADR 0011 研究议题在 policy 草稿里迭代 → ⑥ policy v1 定稿 + 全量重扫 + 开 flag。

## 红线(继承)
全站不说「保证安全」;徽章语义 =「已扫描@版本」的结构化披露非背书;人工裁决签名留痕;LLM 判定 fail-closed。
