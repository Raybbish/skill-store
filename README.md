# oh-my-skill

以**可复现评测、效果可见**为核心的 Agent Skills 商店。发现是红海,我们卖信任。

站点:[oh-my-skill.com](https://oh-my-skill.com)(中文)/ [oh-my-skill.com/en](https://oh-my-skill.com/en/)(English)。双语口径见 ADR 0022:商店的话跟语言走,商品(skill 名/描述/README)保持原文。

> ⛔ **安全扫描整套已下架**(2026-07-04,[ADR 0011](docs/decisions/0011-unlist-security-scan.md)):审计链路(L1/L2/L3 + 人工复核)与全部产品面展示暂停,待详细研究与设计后再上架。下文带 ~~删除线~~ 或标注「已下架」的条目为历史记录。

当前阶段:**上线冲刺**(M0 可信目录已收口,见下方里程碑;M1 可复现评测进行中)。

## 结构

```
packages/schemas    skill-report JSON Schema v1 + TS 类型 + 词表/微文案 lint(四端单一来源)
packages/pipeline   采集管线:sources.yaml → adapter → 校验/licence 分流/哈希去重 → catalog/
packages/web        商店前端:Next.js 纯静态导出,构建时直读 catalog(zh / en 双路由)
packages/cli        oh-my-skill CLI:安装时逐文件复算 blob sha 校验 content_hash
packages/verdicts   信任判定(可插拔判定服务方向,ADR 0012;S0 阶段)
catalog/skills/     事实源:每 skill 一个目录(skill-report.json + mirror/)
catalog/lists/      清单账本(ADR 0019:聚合仓/awesome-list 的出现记录)
catalog/packs/      场景包(官方策展,一套一起装)
docs/decisions/     ADR:所有裁决入档,现行架构以此为准
.github/workflows   ingest.yml:每日采集(含 --code-search 探索),变更走 PR
```

## 快速开始

```bash
npm install
npm run ingest                         # 跑全部源
npm run ingest -- --source anthropics/skills   # 只跑一个源
npm run ingest -- --limit 10           # 限量试跑
npm run web                            # 本地预览商店(:3001)
npm run web:build                      # 出静态站(packages/web/out)
npm run categorize:llm -- --scope missing-copy  # 补微文案(需 LLM key;missing-en 补英文)
npm run status                         # 仓况快照(docs/STATUS)
```

产出在 `catalog/skills/<owner>/<repo>/<name>/skill-report.json`;`mirrored` 条目附完整 `mirror/` 副本。

> 采集走 **git shallow clone**(无 API 限流、可完整镜像);GitHub API 仅用于 signals
> 补充(stars 等,见 `github.ts`),在 API 可达环境(如 GitHub Actions)运行。

## 设计要点(M0)

- **托管/索引双轨**:宽松 licence(MIT/Apache 等)→ `mirrored` 镜像;其余 → `indexed` 只存元数据 + 跳转上游
- **content_hash**:对目录内 (path, git blob sha) 排序集合取 sha256,CLI 安装时校验,防上游篡改
- **security_audit 字段**:catalog 中保留历史数据,但审计管线已下架(ADR 0011),前端与 CLI 不再读取
- 措辞红线:全站不说「保证安全」

## 路线

- [x] W1 骨架 + official adapter(clone 模式,首批 27 条:12 mirrored / 15 indexed)
- [x] ~~W2 审计 L1(critical 签名)+ L2(五因子静态分析)~~ **已下架**(ADR 0011;源码留仓,scripts 已移除)
- [x] ~~W3a 审计 L3(LLM 意图审查)~~ **已下架**(ADR 0011;源码留仓,scripts 已移除)
- [x] W3b Supabase 同步:`npm run sync`(增量,游标存 sync_state;infra/schema.sql 建表;sync.yml 自动触发)
- [x] W3c 供给扩量:GitHub 全域采集器 `npm run ingest -- --github-search 100`(topic 搜头部仓,注入 stars);skills.sh 榜单 `--skills-sh 200`(解析 SSR 榜单注入安装量);三段式 ID owner/repo/name。~~每仓折叠采样 MAX_PER_REPO + collections 合集~~ 已被 ADR 0019 取代(见下)
- [x] W4 商店前端:Next.js 纯静态导出,构建时直读 catalog;`npm run web` 本地预览,`npm run web:build` 出静态站
- [x] W5 CLI:`node packages/cli/bin/oh-my-skill.mjs add <owner/repo/name>` — 逐文件复算 blob sha 校验 content_hash,篡改即拒装

## M0 之后已落地(以 docs/decisions/ 为准)

- [x] **作品/清单/出现对象模型**(ADR 0019):仓型判定由 content_hash 对撞客观给出,取代启发式采样;聚合仓成排序养料;S1 Code Search 探索采集进 cron(`--code-search`)
- [x] **退市机制**(ADR 0020):上游消失 → 缺席观测计数 → 3 日墓碑页(深链不 404,事实陈述);重现自动复活
- [x] **微文案层**(ADR 0013):机器生成 tagline/场景词/fit_line,lint 字段级判罚(主字段 tagline 不过才整份作废),禁用词表 prompt 与 lint 共用;场景词点击 = 搜索聚合,词频阈值裁可见 chip
- [x] **双语**(ADR 0022):商店页 zh/en 瘦身双路由 + 共享页客户端切换;中英微文案同一次 LLM 调用产出;hreflang 互指
- [x] **搜索 P1/P2**(ADR 0018):Typesense 接管三态检索(env 未配时自动回落纯静态);首页排序:热门(归一 star + per-repo cap)/ Star 数 / 最新收录(纯排序)
- [x] **社区层**(ADR 0017 / 0021):skill 短评(下载回执 + 邮箱 OTP 隐形验证)、公海讨论区(信笺流);场景包 11 包(人写编辑手记)

## M1 评测(进行中 · 可复现协议,平台做赛道不做裁判)

- [x] 评测框架:任务集(`task.yaml`+`prompt.md`+`inputs/`+`verify.ts`)、确定性校验器、装/不装双跑;产物缺失/环境不匹配记 **N/A(不计 0 分)**并排除出统计(非"评到 0 分")
- [x] 写入闸:只有带 runner+模型元数据、且无 N/A 任务的真实结果才回写 `skill-report.eval`;mock、全/部分 N/A 一律拒绝(防假分污染货架)
- [x] 文档生成品类:md→带TOC的docx、csv→带SUM公式的xlsx(零依赖 OOXML 解析校验)
- [x] 真实 runner:`npm run eval -- --category doc-generation --runner openai`(OpenAI 兼容端点;`mock` 仅跑通管线、不落库)
- [ ] 货架分数展示:分数带元数据(runner/模型)、可复现可挑战;协议成熟前前端为「可复现评测·开发中」路线图态
- [ ] 扩展任务集 / 覆盖更多品类;跨模型交叉验证防过拟合

## Hub 精选信号线(架构图落地)

- [x] `npm run ingest -- --hub-signals 300` — 解析社区 awesome-list(VoltAgent/awesome-agent-skills 等,`HUB_LISTS` 可配)
- 情报不当货:只读「哪些 skill 被收录 + 归为什么类」,内容一律回上游 GitHub 采集
- 注入 `signals.curated_by`(收录来源+分类)并补 `meta.category`;详情页显示「★ 社区精选收录」
- 需本机/CI 跑(拉 raw.githubusercontent + clone 上游);解析逻辑已沙箱验证
