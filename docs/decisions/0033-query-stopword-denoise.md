# ADR 0033 — 查询降噪:剔除功能词与店内全量词

- 日期:2026-07-17
- 状态:已采纳并落地(纯前端查询预处理,合 main 随 Vercel 部署即生效;零 schema/索引变更)
- 关联:ADR 0028(查询预分词 segmentCJK——本条是其后续管道级)、ADR 0032(拼写容错解锁,同日)

## 背景

用户截图报障(2026-07-17):搜「读论文的skill」,头部是 skill-status(跟踪学习进度)、vibe-coding-harness(产出物治理)等无关条目,真目标 ai-paper-reading 被压到其后。

根因:`tokens_matched` 是 Typesense `_text_match` 的**最高优先级分量**,而查询里有两类 token 是零信息量的白送分:

1. **店内全量词**:「skill」——万条商品条条是 skill,该词不筛选任何东西,却能以 name 权重 10 精确命中 skill-* 命名的条目(skill-status 因此登顶);
2. **中文功能词**:「的/帮我/推荐/怎么」——locale:zh 索引里 tagline/description 普遍含「的」,谁含谁 +1 tokens_matched,纯噪声。

线上直测(query_by 子集):「读 论文 的 skill」头部 = bluesky-reader / reality-check-mode / docx,全靠凑 2 个噪声 token 的命中数登顶;剔掉「的 skill」后噪声条目整体退场。

## 决策

`store-typesense.ts` 查询管道升级:`segmentCJK` 后加 `normalizeQuery` 剔停用词再发 Typesense。

- **词表三段**:中文功能词(的/了/帮我/推荐/怎么/这个…)+ 店内全量词(skill/skills/技能/插件/工具)+ 英文功能词(a/the/for/how/find…)。只剔精确 token,实义动名词(读/写/做/翻译/爬虫…)一律保留。
- **碎片兜底**:分词器词典缺词时会把停用词切碎(实测「插件」→「插 件」)——相邻两 token 拼回仍是停用词则一并剔。
- **剔空回退**:全部 token 都是停用词时(用户真搜「skill」「工具」),回退为不剔,行为与旧版一致。
- 服务端 Typesense 原生 stopwords 集**不用**:需 admin key 推送、与代码版本脱钩;客户端剔词零基建、随部署走、可 tsc/单测覆盖。

## 验证

烟测(Node Intl.Segmenter,与线上同 API):

| 输入 | 降噪后 |
|---|---|
| 读论文的skill | 读 论文 |
| 帮我找个做PPT的工具 | 做 PPT |
| 翻译插件 | 翻译(碎片兜底生效) |
| 有没有推荐的爬虫 | 爬虫 |
| 怎么写简历 | 写 简历 |
| how to merge pdf | merge pdf |
| skill / 工具(全停用词) | 原样(回退) |
| excel 转 json | 原样(实义词零误伤) |

线上索引直测:「读 论文 的 skill」→ 噪声条目 tokens_matched=2 登顶;「读 论文」→ 论文类条目回归头部(ADR 0028 验证过 found=203、头部 ai-paper-reading)。web `tsc` 绿。

## 后果 / 约束

- 词表是**产品判断**,不是语言学全集:宁缺勿滥,只收高置信噪声词;搜索埋点(ADR 0013 补充)攒出真实 query 分布后再迭代。
- 「插件/工具」剔除意味着搜「翻译插件」按「翻译」召回——按店内语义这是正确行为(货架上没有「插件」这个品类之分)。
- StaticStore 降级档不走此管道(子串匹配对全量词不敏感),两档差异沿 ADR 0028 口径。
- 沙箱/老 Node 的 ICU 词典小于浏览器(实测「文档」被切碎)——涉及分词的验证以浏览器实测为准(ADR 0028 教训的分词版)。
