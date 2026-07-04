# STATUS — 我们在哪

> 手写现状。可派生的数字(catalog / 审计 / 提交)见 [`STATUS.generated.md`](./STATUS.generated.md),由 `npm run status` 自动生成——别在这里手抄数字。
>
> _上次人工更新:2026-07-04(安全扫描整套下架,ADR 0011)_

## 里程碑:M0 · 可信目录(进行中)
目标:500+ 已收录 skill、可浏览 / 可搜 / 可一键装、catalog 公开可验证。

> ⛔ **安全扫描已整套下架**(2026-07-04,[ADR 0011](decisions/0011-unlist-security-scan.md)):前端认证徽章/权限披露/审计文案全部摘除,`audit`/`review`/`audit:l3` scripts 移除(源码留仓参考),CLI 只保留 content_hash 校验。待详细研究与设计后再上架。下面「已完成」里的审计条目为历史记录。

### 已完成
- **安全扫描下架**(2026-07-04,ADR 0011):CertBadge 删除、`SkillCard`/`Skill` 剥离 status/risk/l3/review、「仅无网络请求」筛选移除、CLI 装前披露移除(哈希校验保留)、扫描 jobs 停用加 ⛔ 头注;catalog 的 skill-report.json 数据原样保留。
- **供给**:两段式采集(`index-only` 默认 / `--mirror` 托管双轨)、GitHub 全域 topic 采集、每仓折叠采样(`MAX_PER_REPO`)、内容哈希幂等去重、skills.sh 榜单 + awesome-list 精选/分类信号(`curated_by`)。
- **审计**:L1 静态签名 + L2 脚本数据流已跑;风险五因子 + 三段式 ID(`owner/repo/name`)入 schema。
- **前端(`packages/web`)**:v4「认证图标 + 去盒子编辑向」已落地——`CertBadge` 弹窗、`SkillRow`、home / browse / charts / detail(精简)/ community / publisher;`tsc --noEmit` 通过。
- **货架指标口径**(ADR 0005):stars 与 installs 实测零重叠(98.8% / 0.8%),故头条统一 stars、缺失回落 installs→「新」;排序 `byPopularity` = 归一 stars(`stars/√repo_skill_count` 抑制巨仓)+ installs 次键;去 browse 双轴、首页「大家都在装」改「热门」。`tsc` 通过。
- **新 IA + 场景包**(2026-07-04,用户导向裁决):nav 五收四(首页/榜单/社区/收录);「浏览」并入首页(搜索 + 场景包跑马灯 + 完整货架),`/browse/` 留薄壳跳转保深链;榜单改双 tab——🆕 新上架(按收录日分组,数据 = catalog git 首次提交时间,build-index 一次遍历)+ 🔥 热门(+评测榜占位);场景包 8 套(`catalog/packs/*.json`,成员全 pass 才出包)→ `idx/packs.json` → 首页跑马灯 + `/pack/[id]` 页;CLI `add` 支持多目标(包页「装整套」命令);文案红线:货架/包页零内部词汇。待本机浏览器回归。
- **P0 规模化止血 + 取数缝**(ADR 0007,2026-07-04):`lib/store.ts` 定 `SkillStore` 接口(search/getSkill,签名冻结)+ `SkillCard` 瘦卡;`build-index.ts` 构建期产 `public/idx/`(30 条/片 ×194 + docs.json + meta.json,热门序含 per-repo cap=3,收掉同仓聚顶);browse 改服务端首屏 30 条 + 分片翻页 + 懒加载本地搜索(深链 `?cat=&tag=&q=`);`data.ts` 单扫缓存 + `getSkill` O(1);全站客户端组件只喂瘦卡。**基线:browse 首屏 6.0MB→25KB;build-index 3.4s@5,816 条;docs.json 4.9MB(P1 门控:>1.5万条 或 >8MB 或搜索 p95>200ms → Typesense)**。两侧 `tsc` 全绿;待本机 `npm run web` 浏览器回归。

### 进行中
- **分类 / 标签体系**:`packages/schemas` 词表(`featuredLabels` / `tagLabels`)+ `skill.category/tags` + browse/home 分类导航 + `/category/[slug]` 分类页——开发中,未提交。
- 可复现评测:OpenAI runner + `score`/`types` 迭代中(未提交)。
- 前端 v4 重设计 + 审计结果 + 本 docs 整理**待 git 提交留痕**(当前工作区未提交约 200 处)。

### 下一步
- **安全扫描重新研究与设计**(重新上架前置清单见 [ADR 0011](decisions/0011-unlist-security-scan.md))。
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
- [审计流程](architecture/审计流程.html)
- [⚠ 架构事实核对与勘误](architecture/架构事实核对.html) — 文档 vs 代码差异,建议按此更新
- [分类与安装入口 · 实施拆解](planning/分类与安装入口-实施拆解.html)
- [M0 详细设计](planning/M0-详细设计.html)

**设计**
- [重设计定稿 v4](design/redesign-preview-v4.html)

> 已被取代的过程稿(重设计 v1–v3、可交互原型、作废 md)在 `docs/_archive/`。
