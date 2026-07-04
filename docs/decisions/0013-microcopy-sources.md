# ADR 0013 — 微文案三来源与「场景词不进 facet」红线
- 日期:2026-07-05
- 状态:已采纳(P0 代码已落,全量重打待真实 LLM 环境)
- 前置:[ADR 0010](0010-facet-schema-freeze.md)(五分面 schema 冻结)· 标签设计=[skill-store-标签-平台模式头脑风暴.html]
- 手法对齐:[ADR 0012](0012-verdict-service.md)(锚 `content_hash`)· categorize:llm「判据只维护一处」
- 全文:[微文案 · P0 执行方案](../../../skill-store-微文案-P0执行方案.html)(Desktop)

## 背景
货架卡片的副标题一直是 `description` 直出——上游作者写给同行的技术说明,不是写给"想干成某件事"的用户。要让人一眼看懂"装了它能干嘛",需要一层**派生微文案**(tagline / 场景词 / fit_line)。但派生文案有三个绕不开的边界问题,先立此 ADR,免得 M1/M2 反复重议:

1. 文案从哪来?机器生成会平庸,作者自述会自吹,社区提炼要等规模。
2. 场景词(「周报」「合同审阅」)算不算一种筛选维度?若算,就和冻结的五分面冲突。
3. 谁担保准确?

## 决策

**1. 三来源,分阶段,永不并存冲突。** 同一 skill 的微文案按可信度分层,后来者覆盖前者:
- **P0 机器兜底**:`categorize:llm` 单次调用顺带产出,过代码层 lint(L1-L6),锚 `content_hash`;`source="llm"`。
- **M1 作者认领**:原作者一键认领后可改写,`source="author"`,**同样过 lint**(自吹词照样打回)。
- **M2 行为回填**:`search→click→install` 攒够的「词 → skill」配对,把场景词从"机器猜"升级成"用户用脚投"(见下)。

派生文案挂 `SkillReport.copy` 顶层,**不进 `meta`**:meta 是采集事实,copy 是我们的转述,生命周期不同——分开后"重算文案"永不污染采集事实的 diff。

**2. 场景词是搜索词,不是 facet —— 红线。** 场景词回答「什么时候用」,与五分面(技术形态)正交。它**只有两种归宿:搜索召回、点击=发起搜索**。绝不进 `matchFilters`、绝不 facetable、绝不碰 ADR 0010 冻结的五分面 schema。治理靠归一(`SCENE_ALIASES`)+ 可见性阈值(`SCENE_VISIBLE_MIN=15`)+ 与 `labels.ts` 查重丢弃,不靠预定义枚举(半开放词表)。可见性阈值天然保证「点 chip 出去 ≥ 阈值 条结果」,无需额外红线逻辑。

**3. 行为担保准确,人只把关品味。** 埋点 schema P0 即冻结(`docs/design/analytics-events.md`),P1 消费:词↔skill 的 install 配对 ≥40 进召回(UI 不可见),≥80 进「升可见候选」由人过目并入 `scene_tags`。防污染:同一 `sid` 对同一配对每天计 1 次;单一 sid 占比 >30% 的词冻结。

## 后果 / 约束
- **回退优先于好看**:`copy` 缺失 / `lint_pass=false` / `content_hash` 过期 → 卡片回退 `description` 截断,不显 chips。宁可平淡,不可说谎。
- **判据单一来源**:`BANNED_WORDS`、场景词长度/数量常量由 `packages/schemas` 导出,lint 与 prompt 共用一份,避免漂移。
- **金标门**:全量重打前必过 `--canary`(分类/标签易混对 + 25 条微文案 lint 通过率 ≥95%);人工另抽读满意 ≥22/25。
- **不新建 job、不动 facet schema、不动 verdicts**:P0 只在 schemas / categorize-llm / web / 埋点四处落子。
- 词表季度复核沿用标签准入/退出节奏:场景词频 top 200 人工过一遍,补别名、清垃圾词,只重跑归一(纯本地,不调 LLM)。
- **已知边界**:场景词与 `labels.ts` 查重只覆盖"已在五分面里的技术形态词";未进词表的形态词(如 pdf/csv)可能漏进场景词——靠 prompt 约束 + 季度复核兜底,冒头即考虑纳入 labels 或别名。
