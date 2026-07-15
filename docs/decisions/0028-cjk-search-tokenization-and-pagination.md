# ADR 0028 — 中文搜索:分词(locale:zh)+ 查询预分词 + 模糊回退,及分页可用性

- 日期:2026-07-15
- 状态:已采纳并落地(前端 + push 脚本);本地真机验证通过,待生产重推 + 部署
- 关联:ADR 0004/0007(换 adapter 不动接口)、ADR 0018(三态全走 Typesense)、ADR 0022(中英召回)

## 背景

用户报障(2026-07-15):中文搜「读论文」召回极差(线上实测 found=1,且是错的 journalism-writing);分页 331 页只能上/下一页逐页点。

三个叠加根因,缺一不可:

1. **schema 没设 locale**:collection 用 `{ ".*": auto }` 兜底,中文检索字段无 `locale`,Typesense 按字切 CJK。「论文」还能靠单字命中(旧 found=82),但「读论文」要求「读」「论」「文」三字全中 → 只剩 1 条。
2. **drop_tokens 只作用于空格分隔的查询词**(关键发现):连写中文「读论文」对查询解析器是**一个词**,无从丢词——所以 `drop_tokens_threshold` 0/10/100、`drop_tokens_mode` 各档实测**全同 found=1**。content 分了词,query 没分。
3. 数据里是「论文阅读 / 复现论文」,并无字面「读论文」;即便分词,严格 AND[读 且 论文] 也几乎为 0,要靠丢词留住名词「论文」。

本地降级档 `StaticStore.matchScore` 用子串 `.includes()` 匹配,本地目检发现不了 #1/#2,只线上(Typesense)复现——排障必须打真实 Typesense。

## 决策

1. **schema 中文字段 locale:zh**(`typesense-push`):`tagline / description / scene / skw` 显式 `locale:"zh"`(ICU 词分词);`tags / name / sid / *En` 是英文 slug / 英文转述留默认。`.* auto` 兜底其余——**实测 locale 不被 `.*` 吞**(GET schema 确认四字段 = zh)。
2. **查询预分词 `segmentCJK`**(前端 `store-typesense`):发 Typesense 前用 `Intl.Segmenter("zh")` 把连写中文切成空格分隔(「读论文」→「读 论文」),`drop_tokens` 才有词可丢。纯英文 / 无中文原样;老环境无 `Intl.Segmenter` 回退原样(退回旧行为,不炸)。
3. **模糊回退**:`drop_tokens_threshold` 0→10 + `drop_tokens_mode: both_sides:3`(≤3 词从两端各丢一次取并集;默认右起丢会先丢掉名词)。`_text_match` 主序——全词命中(读+论文)恒排在丢词命中(仅论文)之上,召回变宽而头部精度不塌。
4. **分页**:`Pager` 组件——页码窗口(首尾 + 当前邻域 + 省略号)+「跳至 __ 页」输入;DOM 恒小红线不变(仍只渲染当前页,页码是纯导航)。

## 验证(本地真机 Typesense 27.1,10,415 条)

| 查询 | 预分词后 | found | 头部命中 |
|---|---|---|---|
| 论文 | 论文 | 158 | paper-* |
| 读论文 | 读 论文 | **203** | ai-paper-reading, paper-* |
| 写测试 | 写 测试 | 17 | test-driven-development |
| 做PPT | 做 PPT | 83 | ppt-report-generator, pptx |
| 读 arxiv 论文 | 读 arxiv 论文 | 203 | paper-analysis-assistant |
| testing | testing | 1017 | testing(英文不受影响) |

修前「读论文」= 1(错的 journalism-writing);修后 203、头部正是 ai-paper-reading。web `tsc` 绿。

## 后果 / 约束

- ⚠ **schema 变更必须重跑 `typesense:push`** 才生效(drop+create+import 全量重建,~几十秒)。前端(预分词 + drop + 分页)随 Vercel 部署即生效,但没 `locale:zh` 时中文召回仍差——**三者要一起上**。deploy.yml 已含 `web:index` + `typesense:push`,合 main 自动触发。
- StaticStore 降级档(未配 Typesense)仍走子串匹配,不受本改动影响;两档语义不完全一致,可接受。
- `Intl.Segmenter` 浏览器支持:现代浏览器全覆盖;老 Firefox(<125)回退原样(退回旧行为,非崩溃)。
- 沿用 ADR 0018:每次 `web:index` 后必跑 `typesense:push`。
