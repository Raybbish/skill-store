# STATUS — 我们在哪

> 手写现状。可派生的数字(catalog / 审计 / 提交)见 [`STATUS.generated.md`](./STATUS.generated.md),由 `npm run status` 自动生成——别在这里手抄数字。
>
> _上次人工更新:2026-07-06(上下文体积口径替换 token / 次,ADR 0015)_

## 里程碑:M0 · 可信目录(进行中)
目标:500+ 已收录 skill、可浏览 / 可搜 / 可一键装、catalog 公开可验证。

> ⛔ **安全扫描已整套下架**(2026-07-04,[ADR 0011](decisions/0011-unlist-security-scan.md)):前端认证徽章/权限披露/审计文案全部摘除,`audit`/`review`/`audit:l3` scripts 移除(源码留仓参考),CLI 只保留 content_hash 校验。待详细研究与设计后再上架。下面「已完成」里的审计条目为历史记录。

### 已完成
- **上下文体积口径替换 token / 次**(2026-07-06,[ADR 0015](decisions/0015-context-size-metric.md)):旧链路 `chars/4 → token_cost.body_tokens → token / 次` 直接下线,不做 legacy fallback;新字段 `context_size` 只表达静态、可复现的装载边界:最小装载(`SKILL.md`)、含声明引用、文本包总量。M0 先用显式标注的 `static-mixed-estimate-v1` 启发式计数器,前端缺回填显示「待重算」,不再把估算伪装成真实每次消耗。同日修订(ADR 0015 补充):补 DB 迁移 `infra/migrations/2026-07-06-context-size.sql`(**存量 Supabase 必须执行**,否则 sync 报列不存在);ingest 幂等闸对缺 `context_size` 的存量条目做**外科式回填**(只补该字段,LLM 分类与微文案不动;顺带修了更新路径无条件丢 copy、冲 LLM 分类的旧账);声明引用改 availability 驱动字面匹配(裸文件名/非 ASCII 可命中);symlink 逃逸包外不读;scope 去掉 `label`(UI 文案归前端)。
- **微文案全量数据已入库 + 词表归一**(2026-07-05,[ADR 0013](decisions/0013-microcopy-sources.md),`a5926c192`):全量 copy 块(约 5,816 条 `skill-report.json` 的 tagline / 场景词 / fit_line)+ `scene:renorm --apply`(8 别名 + 空格归一,约 +90 覆盖)一并提交——「微文案 P0 全链路」的 catalog 数据变更收口,仅剩用户端浏览器回归一步。
- **mirror 单文件大小闸**(2026-07-05,`6c740cea5`):`--mirror` 托管环节加默认 2MB 单文件闸,挡编译产物 / 大 blob 进 git,并清掉一个已混入的 71MB pomodoro 二进制。仓库卫生。
- **微文案 P0 · 全链路落地 + 全量已跑**(2026-07-05,[ADR 0013](decisions/0013-microcopy-sources.md),分支 `feat/microcopy-p0`):机器副标题(tagline)+ 场景词 + fit_line,埋点先行。① `schemas`:`SkillReport.copy` 顶层块(锚 content_hash)+ `sceneTags.ts`(别名归一/查重/`SCENE_VISIBLE_MIN=15`/去「拉丁↔中日韩」边界空格)+ `copyLint.ts`(`BANNED_WORDS` + L1-L6,判据单一来源);② `categorize-llm`:prompt 追加三字段单次产出 + 代码层 lint + 写 copy 块,`--canary` 加 25 条微文案金标(lint≥95%);③ `web`:卡片副标题=tagline(回退 description 截断)+ 场景 chip(点击=搜索,**不进 facet**)+ 详情页 fit_line/全量场景词 + build-index 按词频裁可见 chip(`scene`)/召回串(`skw`)+ `meta.sceneVocab`;④ 埋点三事件 schema 冻结(`docs/design/analytics-events.md`)+ beacon(未配置即 no-op)。**真机金标已过**(tag mcp 90.5% / 微文案 24/25=96%;修了一处 prompt 把 tag 具名(mcp)当场景反例、连带压掉 mcp 标签的 bug)。**全量 5,816 条已判**——`build-index` 实测 **5,529 张卡片有 tagline(≈95%)+ 可见场景 chip 70**,`skw` 召回生效(例:understand→tagline+chip「代码评审」+skw「项目交接 架构理解」)。**词表复核**:新增 `scene:renorm`(纯本地复核工具:全量词频 + 同义簇 / `--apply` 重归一,季度复核复用)+ 8 条同义别名 + 空格归一(dry:重归一 644、约 +90 条 fail→pass、0 回退)。**顺清两个既有阻塞**:`build-index` 顶层 await 改名 `.mts` 修 cjs 报错;idx 取数缓存击穿(`meta` no-store + `docs`/分片按 `generatedAt` 版本键),修「重建后计数是新的、筛选却吃旧 docs 返回 0」的假象。三侧 `tsc` 全绿;lint/场景归一/scene-split 离线单测过。不新建 job、不动 facet schema(ADR 0010)、不动 verdicts。
- **verdict 服务 S0 ④**(2026-07-05,ADR 0012):商店三插拔点接线完成,全部默认 off——ingest `TRUST_SUBMIT=1` 才提交判定;build-index `TRUST_DISPLAY=1` **且 policy 定稿**才 join verdict 到瘦卡(hash 不符不展示);`TrustBadge` 开关组件(verdict 缺省恒 null);CLI `TRUST_DISPLAY=1` 且 verdict 命中 hash 才披露。已验证:flag 开但 policy=draft 时 displayReady 仍 false。**S0 工程面收官,重新上架 = policy v1 定稿 + 开 flag。**(⚠ 本机需 `npm install` 链接新 workspace 包)
- **verdict 服务 S0 ②③**(2026-07-05,ADR 0012):`packages/verdicts` 落地——scan-verdict@v1 契约 + 五接口 + 编排器 + 插件(scanners 三件套 git mv 入 engines/,旧 audit/review jobs 删除);**skill-report schema v2**:security_audit 拆出,55 条真实判定迁入 `catalog/verdicts/` 账本(engine=legacy),6,122 条 pending 占位丢弃;ingest/sync/eval/status.mjs 配套改造(Supabase 需执行 `infra/migrations/2026-07-05-verdict-service.sql`)。TRUST_DISPLAY / TRUST_GATE 均 off,货架外观不变。
- **安全扫描下架**(2026-07-04,ADR 0011):CertBadge 删除、`SkillCard`/`Skill` 剥离 status/risk/l3/review、「仅无网络请求」筛选移除、CLI 装前披露移除(哈希校验保留);判定数据现已迁入 verdict 账本(见上)。
- **供给**:两段式采集(`index-only` 默认 / `--mirror` 托管双轨)、GitHub 全域 topic 采集、每仓折叠采样(`MAX_PER_REPO`)、内容哈希幂等去重、skills.sh 榜单 + awesome-list 精选/分类信号(`curated_by`)。
- **审计**:L1 静态签名 + L2 脚本数据流已跑;风险五因子 + 三段式 ID(`owner/repo/name`)入 schema。
- **前端(`packages/web`)**:v4「认证图标 + 去盒子编辑向」已落地——`CertBadge` 弹窗、`SkillRow`、home / browse / charts / detail(精简)/ community / publisher;`tsc --noEmit` 通过。
- **货架指标口径**(ADR 0005):stars 与 installs 实测零重叠(98.8% / 0.8%),故头条统一 stars、缺失回落 installs→「新」;排序 `byPopularity` = 归一 stars(`stars/√repo_skill_count` 抑制巨仓)+ installs 次键;去 browse 双轴、首页「大家都在装」改「热门」。`tsc` 通过。
- **新 IA + 场景包**(2026-07-04,用户导向裁决):nav 五收四(首页/榜单/社区/收录);「浏览」并入首页(搜索 + 场景包跑马灯 + 完整货架),`/browse/` 留薄壳跳转保深链;榜单改双 tab——🆕 新上架(按收录日分组,数据 = catalog git 首次提交时间,build-index 一次遍历)+ 🔥 热门(+评测榜占位);场景包 8 套(`catalog/packs/*.json`,成员全 pass 才出包)→ `idx/packs.json` → 首页跑马灯 + `/pack/[id]` 页;CLI `add` 支持多目标(包页「装整套」命令);文案红线:货架/包页零内部词汇。待本机浏览器回归。
- **P0 规模化止血 + 取数缝**(ADR 0007,2026-07-04):`lib/store.ts` 定 `SkillStore` 接口(search/getSkill,签名冻结)+ `SkillCard` 瘦卡;`build-index.ts` 构建期产 `public/idx/`(30 条/片 ×194 + docs.json + meta.json,热门序含 per-repo cap=3,收掉同仓聚顶);browse 改服务端首屏 30 条 + 分片翻页 + 懒加载本地搜索(深链 `?cat=&tag=&q=`);`data.ts` 单扫缓存 + `getSkill` O(1);全站客户端组件只喂瘦卡。**基线:browse 首屏 6.0MB→25KB;build-index 3.4s@5,816 条;docs.json 4.9MB(P1 门控:>1.5万条 或 >8MB 或搜索 p95>200ms → Typesense)**。两侧 `tsc` 全绿;待本机 `npm run web` 浏览器回归。

### 进行中
- **分类 / 标签体系**:`packages/schemas` 词表(`featuredLabels` / `tagLabels`)+ `skill.category/tags` + browse/home 分类导航 + `/category/[slug]` 分类页——开发中,未提交。
- 可复现评测:OpenAI runner + `score`/`types` 迭代中(未提交)。
- **微文案分支 `feat/microcopy-p0`**:代码 + ADR 0013 + 文档 + 全量 catalog 数据变更(`a5926c192`,约 5,816 条 skill-report.json)均已提交本地,待 push 开 PR。
- 前端 v4 重设计 + 早期 docs 整理若仍有未提交项,一并留痕。

### 下一步
- **微文案收尾(仅剩本机回归一步)**:`npm run web:index && npm run web` + 硬刷新浏览器,回归卡片副标题 / 场景 chip / 详情 fit_line / 回退链。`scene:renorm --apply` 归一 + 全量 copy 数据已随 `a5926c192` 提交(见「已完成」),故原「本机 3 步」只余此一步。
- **verdict 服务步骤⑤⑥**([ADR 0012](decisions/0012-verdict-service.md)):研究议题(裁决口径/误报率基线/复核吞吐/徽章语义)在 `packages/verdicts/policies/` 草稿里迭代;policy v1 定稿 + 全量重扫 + 开 TRUST_DISPLAY = 重新上架(验收:diff 只有 flag)。
- Supabase:下次 sync 前执行 `infra/migrations/2026-07-05-verdict-service.sql`(放开 audit_status 非空)。
- 扩 catalog 到 500+(接更多源)。
- **M1**:可复现评测协议上线 + 信任原生社区最小切片 + 账号层 + 原作者一键认领入口(见 [ADR 0001](decisions/0001-trust-native-community.md) · [ADR 0006](decisions/0006-one-click-claim.md))。
- **规模化架构**(ADR 0004 → 0007):P0「埋缝」已完成;P1 触发条件命中(目录 >1.5万 / docs.json >8MB / 搜索 p95 >200ms)再上自托管 Typesense —— 实现新 adapter 即可,接口不动。详见[架构与迁移计划](architecture/走向百万级-架构与迁移计划.html)。
- 本机回归 P0:`npm run web` 手测 browse 搜索/分类/细分/翻页 + 分类页「看全部」深链 + 详情页;`npm run web:build` 记录构建耗时。

## 决策记录(ADR)
- [0001 · 信任原生社区](decisions/0001-trust-native-community.md)
- [0002 · 图标/logo IP 策略(推迟)](decisions/0002-icon-logo-ip-deferred.md)
- [0003 · v4 认证图标设计系统](decisions/0003-v4-design-system.md)
- [0004 · 走向百万级:源/服务解耦 + 分页 + 托管搜索](decisions/0004-scale-to-millions.md)
- [0005 · 货架指标口径:stars 统一头条 + 归一排序](decisions/0005-shelf-metric-stars.md)
- [0006 · 原作者一键认领(发布者认领入口)](decisions/0006-one-click-claim.md)
- [0007 · SkillStore 取数缝 + 构建期静态索引(P0 止血)](decisions/0007-skillstore-seam-static-index.md)
- [0008 · M1×P2 合并判据:Postgres 触发器是用户数据](decisions/0008-m1-p2-merge-criterion.md)
- [0009 · SEO 双轨:筛选词表 ≠ SEO tag 页](decisions/0009-seo-dual-track.md)
- [0010 · facet 字段名冻结](decisions/0010-facet-schema-freeze.md)
- [0011 · 安全扫描整套下架(待重新设计)](decisions/0011-unlist-security-scan.md)
- [0012 · 扫描重生为可插拔 verdict 判定服务](decisions/0012-verdict-service.md)
- [0013 · 微文案三来源与「场景词不进 facet」红线](decisions/0013-microcopy-sources.md)
- [0014 · 场景包:定义、收录标准与生命周期](decisions/0014-pack-curation.md)
- [0015 · 上下文体积取代 token / 次](decisions/0015-context-size-metric.md)

## 文档地图(唯一入口)
所有规划 / 架构 / 设计文档已收进 `docs/`,点开即看。

**策略**
- [PRD](planning/PRD.html)
- [竞品调研报告](planning/竞品调研报告.html)
- [ModelScope 功能对标](planning/ModelScope-功能对标.html)
- [社区层设计与需求收敛](planning/社区层设计与需求收敛.html)
- [文档总览与进度对齐](planning/文档总览与进度对齐.html)

**架构与实现**(架构图直接画在 HTML 里)
- [⭐ 走向百万级 · 架构与迁移计划](architecture/走向百万级-架构与迁移计划.html) — 源/服务解耦 + 分页 + 托管搜索(ADR 0004)
- [原作者一键认领 · 发布者认领设计](architecture/一键认领-发布者认领设计.html) — GitHub 控制权自证 + 验证阶梯(ADR 0006)
- [供给聚合架构图](architecture/供给聚合架构图.html)
- [供给采集设计](architecture/供给采集设计.html)
- [审计流程](architecture/审计流程.html) — ⛔ 历史(ADR 0011 下架;重生方向见下)
- [⭐ 安全扫描服务 · 可插拔架构与迁移](architecture/安全扫描服务-可插拔架构与迁移.html) — verdict 契约 + 三插拔点 + S0-S3(ADR 0012)
- [⚠ 架构事实核对与勘误](architecture/架构事实核对.html) — 文档 vs 代码差异,建议按此更新
- [分类与安装入口 · 实施拆解](planning/分类与安装入口-实施拆解.html)
- [M0 详细设计](planning/M0-详细设计.html)

**设计**
- [重设计定稿 v4](design/redesign-preview-v4.html)

> 已被取代的过程稿(重设计 v1–v3、可交互原型、作废 md)在 `docs/_archive/`。
