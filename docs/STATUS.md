# STATUS — 我们在哪

> 手写现状。可派生的数字(catalog / 审计 / 提交)见 [`STATUS.generated.md`](./STATUS.generated.md),由 `npm run status` 自动生成——别在这里手抄数字。
>
> _上次人工更新:2026-07-04(货架指标口径统一 + 百万级架构方向)_

## 里程碑:M0 · 可信目录(进行中)
目标:500+ 已审计 skill、权限标签全覆盖、可浏览 / 可搜 / 可一键装、审计报告公开可验证。

### 已完成
- **供给**:两段式采集(`index-only` 默认 / `--mirror` 托管双轨)、GitHub 全域 topic 采集、每仓折叠采样(`MAX_PER_REPO`)、内容哈希幂等去重、skills.sh 榜单 + awesome-list 精选/分类信号(`curated_by`)。
- **审计**:L1 静态签名 + L2 脚本数据流已跑;风险五因子 + 三段式 ID(`owner/repo/name`)入 schema。
- **前端(`packages/web`)**:v4「认证图标 + 去盒子编辑向」已落地——`CertBadge` 弹窗、`SkillRow`、home / browse / charts / detail(精简)/ community / publisher;`tsc --noEmit` 通过。
- **货架指标口径**(ADR 0005):stars 与 installs 实测零重叠(98.8% / 0.8%),故头条统一 stars、缺失回落 installs→「新」;排序 `byPopularity` = 归一 stars(`stars/√repo_skill_count` 抑制巨仓)+ installs 次键;去 browse 双轴、首页「大家都在装」改「热门」。`tsc` 通过。

### 进行中
- **分类 / 标签体系**:`packages/schemas` 词表(`featuredLabels` / `tagLabels`)+ `skill.category/tags` + browse/home 分类导航 + `/category/[slug]` 分类页——开发中,未提交。
- 可复现评测:OpenAI runner + `score`/`types` 迭代中(未提交)。
- 前端 v4 重设计 + 审计结果 + 本 docs 整理**待 git 提交留痕**(当前工作区未提交约 200 处)。

### 下一步
- 提交当前 web 重设计 + 审计结果(先把未提交的落地)。
- 扩 catalog 到 500+(接更多源)。
- **M1**:可复现评测协议上线 + 信任原生社区最小切片 + 账号层(见 [ADR 0001](decisions/0001-trust-native-community.md))。
- **规模化架构**(ADR 0004):目录奔百万的源/服务解耦方向已定——近期先做 P0「埋缝」(`search()/getSkill()` 接口 + 分页取代整表渲染 + 修 `data.ts` O(n²));详见[架构与迁移计划](architecture/走向百万级-架构与迁移计划.html)。

## 决策记录(ADR)
- [0001 · 信任原生社区](decisions/0001-trust-native-community.md)
- [0002 · 图标/logo IP 策略(推迟)](decisions/0002-icon-logo-ip-deferred.md)
- [0003 · v4 认证图标设计系统](decisions/0003-v4-design-system.md)
- [0004 · 走向百万级:源/服务解耦 + 分页 + 托管搜索](decisions/0004-scale-to-millions.md)
- [0005 · 货架指标口径:stars 统一头条 + 归一排序](decisions/0005-shelf-metric-stars.md)

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
- [供给聚合架构图](architecture/供给聚合架构图.html)
- [供给采集设计](architecture/供给采集设计.html)
- [审计流程](architecture/审计流程.html)
- [⚠ 架构事实核对与勘误](architecture/架构事实核对.html) — 文档 vs 代码差异,建议按此更新
- [分类与安装入口 · 实施拆解](planning/分类与安装入口-实施拆解.html)
- [M0 详细设计](planning/M0-详细设计.html)

**设计**
- [重设计定稿 v4](design/redesign-preview-v4.html)

> 已被取代的过程稿(重设计 v1–v3、可交互原型、作废 md)在 `docs/_archive/`。
