# ADR 0032 — 搜索拼写容错解锁:typo_tokens_threshold 1→10

- 日期:2026-07-17
- 状态:已采纳并落地(纯查询期参数,合 main 随 Vercel 部署即生效;零 schema 变更,无需重推索引)
- 关联:ADR 0028(模糊回退 drop_tokens——本条是同一哲学在 typo 维度的补全)、ADR 0018(三态全走 Typesense)

## 背景

用户报障(2026-07-17):首页搜索精度差,基本找不到需要的 skill。

线上生产索引直测(search-only key,10,674 条)定位到单一根因:**Typesense `typo_tokens_threshold` 默认 1**——只要 0-typo(含末位前缀)已有 ≥1 条命中,就永不尝试拼写容错。表现为「一条无关结果垫场,正确结果全体隐身」:

| 查询 | 现状 found | 命中 | 病理 |
|---|---|---|---|
| excell | 1 | google-cloud-waf-operational-**excell**ence | 无关前缀命中卡死容错,excel-* 全体隐身 |
| powerpont | 1 | ppt-translator | found=0 时默认容错才触发,恰好还有救 |

ADR 0028 只解了「多词丢词」维度(drop_tokens 0→10),同款参数哲学在「单词拼错」维度(typo_tokens)漏配。

## 决策

`store-typesense.ts` 带词分支加一行:`typo_tokens_threshold=10`。与 `drop_tokens_threshold=10` 对齐同一哲学:头部不足 10 条才扩容错(1–2 typo,`num_typos` 用默认值);`_text_match` 仍主序,精确命中恒压容错命中,头部精度不塌。

评估过、明确不做的:

- **同义词表**:中文转述层(微文案)已兜住词汇差——「幻灯片」found=55(头部 deck/ppt 类)、「抠图」命中 background-removal。缩写 ppt→pptx / xls→xlsx / doc→docx 均为 1 typo,容错解锁后天然覆盖。词表是持续维护负担,推迟到搜索埋点(ADR 0013 补充)攒出真实缺口再议。
- **num_typos / max_candidates / split_join_tokens**:默认值已够(split_join 默认 fallback 实测已在起作用,见响应 request_params.first_q 的连写尝试);少一个参数少一个维护面。
- **schema / push 脚本**:零改动。

## 验证(线上生产索引直测,2026-07-17)

| 查询 | 修前 found | 修后 found | 修后头部 |
|---|---|---|---|
| excell | 1(错) | 17 | 精确命中 excellence 仍居首,dgn-to-excel 等 excel 类紧随(typo_prefix_score 排序生效) |
| ppt 模板(双阈值齐开) | 未单测 | 10 | guizang-ppt-skill、smart-illustrator(0-typo 全词命中居首) |
| 幻灯片(控制组) | 55 | 55 | deck-simple、wowerpoint(转述层兜同义词,无需词表) |

注:验证用 query_by 子集(web_fetch URL 长度所限),found 绝对值略低于生产全字段,机制结论不受影响。

CJK 安全性:中文分词后词长普遍 <4,低于 `min_len_1typo=4`,typo 扩召回不触及中文——ADR 0028 行为零扰动。英文精确热词(pdf 等)头部 ≥10 条时容错不启动,零开销。

## 后果 / 约束

- 纯查询期参数:与索引重推解耦,回滚 = 删一行。
- 精确命中 1–9 条的查询会追加容错命中(排序恒在其后)——召回变宽,头部不塌(与 ADR 0028 同一保证)。
- StaticStore 降级档(子串匹配)不受影响,两档语义差异沿 ADR 0028 口径可接受。
- 本地目检发现不了此类问题(降级档不走 Typesense)——排障必须打真实 Typesense(ADR 0028 教训再次成立)。
