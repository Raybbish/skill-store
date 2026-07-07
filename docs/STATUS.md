# STATUS — 我们在哪

> 手写现状。可派生的数字(catalog / 审计 / 提交)见 [`STATUS.generated.md`](./STATUS.generated.md),由 `npm run status` 自动生成——别在这里手抄数字。
>
> _上次人工更新:2026-07-07(「下一步」按仓库实况核对改写:catalog 500+ 目标已超额删除、Supabase 迁移补齐为三个、P1 触发提为「准备动手」、两条本机回归合并)_

## 里程碑:M0 · 可信目录(进行中)
目标:500+ 已收录 skill、可浏览 / 可搜 / 可一键装、catalog 公开可验证。

> ⛔ **安全扫描已整套下架**(2026-07-04,[ADR 0011](decisions/0011-unlist-security-scan.md)):前端认证徽章/权限披露/审计文案全部摘除,`audit`/`review`/`audit:l3` scripts 移除(源码留仓参考),CLI 只保留 content_hash 校验。待详细研究与设计后再上架。下面「已完成」里的审计条目为历史记录。

### 已完成
- **场景词「话题层」分离**(2026-07-07,ADR 0013 补充):目检发现卡片场景 chip「代码评审」与 facet「#代码审查」近义并存观感打架。参照小红书三层词体系(类目/话题/筛选器同义共存但从不混排)裁决:**不做跨层同义查重丢弃**,做层分离——场景 chip 改话题样式(软蓝底/无边框/hover 下划线,与 facet 白底描边胶囊分化)+ 卡片/详情行首「场景」微标签;搜索精确命中 `meta.sceneVocab` 时抬头换「〔场景〕词」聚合页壳 + ✕ 退出(清 q 与 URL,防刷新弹回;实现仍是搜索,零新路由);prompt「场景词必须是情境非动作名词」约束推迟到 1.5万 批跑。四文件改动(globals.css / SkillRow / 详情页 / HomeClient+page 传参),`tsc` 绿,**浏览器目检已过**(卡片场景行 / 详情页 / 场景抬头 + ✕ 退出)。
- **build-index「新上架」切换 first_seen_at 事实源**(2026-07-07,补切 ADR 0016 漏项):ADR 0016 只落了采集/回填侧,`web/scripts/build-index.mts` 仍在遍历 git log(本机有 .git 一直没暴露;无 git 环境「新上架」直接为空)。现改为 `signals.first_seen_at` 为主(10,010/10,036 命中)、git 遍历降级为缺失回退(27 条漏网待下次 ingest 盖章);`Skill` 类型与 `data.ts` 补 `firstSeenAt` 映射。无 git 沙箱实测:新上架 0 → 100;web 侧 `tsc` 零错误;仓内 `public/idx` 已用新逻辑重建(输出与旧逻辑逐字节同规格:10,036 条/335 片/docs 7402KB)。
- **回归(2026-07-07,全部收口)**:沙箱侧数据与源码级已过——idx 重建正常(包 8/可见场景词 62/新上架 100);渲染条件核对:卡片 `tagline ?? description` 60 字截断回退、场景 chip=`/?q=` 搜索链接(不进 facet)、详情 fit_line 在安装按钮上方决策位、ADR 0015 单文件折叠判据 `text_files===1`、`tokens==null` 才显「待重算」(0 合法)。catalog 实测:缺 context_size 166(与 STATUS 口径一致)、缺 first_seen_at 27。**本机浏览器目检已过**(用户执行,截图核对):首页卡片 tagline/场景行 + 计数 10,036;榜单新上架 tab(100 个、按收录日分组,first_seen_at 切换后首次目检)+ 热门 tab;详情页 fit_line + 多文件三格(~9.8K/~28.4K/~72.7K)+ 安装三通道;回退链(新采集条目 description 截断、无场景行);场景抬头 + ✕ 退出。单文件折叠/待重算两个微状态未逐页目检,以源码判据 + 全量构建通过背书。期间发现并顺手修掉:`.next` 生产/开发缓存混用致 /charts 500(清缓存即愈,属操作顺序问题非代码缺陷)。
- **sync/mirror 修复批 + 仓库卫生**(2026-07-06):sync 增量路径解析三处修复 + NUL 边界防御(`e4b685d16`)、mirror 目录 gitlink 路径反推(`8f062810d`)、镜像跳过 `.git/.svn/.hg` 不再拷成 gitlink(`4b6524f27`)、64 个损坏 gitlink mirror 降级 index-only(`21027d47f`)、`normalizeName` 保证非空并清一条空 name 坏条目(`0d2a1ee3c`);另统一包管理器为 npm、去跟踪 tsbuildinfo、各 pipeline job 自动加载 .env(`3651fb870` / `8aab2e830` / `c5386eda1`)。
- **新上架口径 first_seen_at**(2026-07-06,[ADR 0016](decisions/0016-new-arrivals-ranking.md),`b82b64bbd` + `eaa241062`):「新上架」轴 = 首次进**我们**货架,不是上游发布。`signals.first_seen_at` 以 catalog git 为事实源的物化缓存,首次盖章永不覆盖(official 新候选盖发现时刻;ingest 更新用旧值顶掉;`jobs/backfill-first-seen.ts` 从 git `--diff-filter=A` 一次性回填存量 10,716 条);sync 传导 Supabase(`infra/migrations/2026-07-06-first-seen.sql`,**存量库须执行**)。取代此前「build-index 一次遍历 git 首次提交时间」的临时做法。
- **上下文体积口径替换 token / 次**(2026-07-06,[ADR 0015](decisions/0015-context-size-metric.md)):旧链路 `chars/4 → token_cost.body_tokens → token / 次` 直接下线,不做 legacy fallback;新字段 `context_size` 只表达静态、可复现的装载边界:最小装载(`SKILL.md`)、含声明引用、文本包总量。M0 先用显式标注的 `static-mixed-estimate-v1` 启发式计数器,前端缺回填显示「待重算」,不再把估算伪装成真实每次消耗。同日修订(ADR 0015 补充):补 DB 迁移 `infra/migrations/2026-07-06-context-size.sql`(**存量 Supabase 必须执行**,否则 sync 报列不存在);ingest 幂等闸对缺 `context_size` 的存量条目做**外科式回填**(只补该字段,LLM 分类与微文案不动;顺带修了更新路径无条件丢 copy、冲 LLM 分类的旧账);声明引用改 availability 驱动字面匹配(裸文件名/非 ASCII 可命中);symlink 逃逸包外不读;scope 去掉 `label`(UI 文案归前端)。**回填已基本收敛**(2026-07-06 实测,商店三层口径):catalog 10,735 条中 10,569 条已有 `context_size`,缺 166 条正确显示「待重算」,随下次 ingest 幂等闸外科式补齐。**详情页展示二次修订**(同日,ADR 0015 补充):单文本文件包(全量 49%,三 scope 文本集合相同、三格数字必然一样)折叠为一格「上下文体积 · 单文件」(判据 `text_files === 1` 结构事实,非三值相等);「静态估算」不再占独立格,计数方式收进数值格悬停提示;缺失由三格「待重算」收成单格。`tsc` 通过;`web:build` 已回归(2026-07-07 本机):**10,886 页全量构建过**(compiled 38.4s,10,036 条 + 分类/包/发布者页),含单文件折叠/待重算态渲染,无报错。
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
- **新 IA + 场景包**(2026-07-04,用户导向裁决):nav 五收四(首页/榜单/社区/收录);「浏览」并入首页(搜索 + 场景包跑马灯 + 完整货架),`/browse/` 留薄壳跳转保深链;榜单改双 tab——🆕 新上架(按收录日分组;数据口径现为 `signals.first_seen_at`,ADR 0016 已取代当初「build-index 一次遍历 git 首次提交时间」的临时做法)+ 🔥 热门(+评测榜占位);场景包 8 套(`catalog/packs/*.json`,成员全 pass 才出包)→ `idx/packs.json` → 首页跑马灯 + `/pack/[id]` 页;CLI `add` 支持多目标(包页「装整套」命令);文案红线:货架/包页零内部词汇。待本机浏览器回归。
- **P0 规模化止血 + 取数缝**(ADR 0007,2026-07-04):`lib/store.ts` 定 `SkillStore` 接口(search/getSkill,签名冻结)+ `SkillCard` 瘦卡;`build-index.ts` 构建期产 `public/idx/`(30 条/片 ×194 + docs.json + meta.json,热门序含 per-repo cap=3,收掉同仓聚顶);browse 改服务端首屏 30 条 + 分片翻页 + 懒加载本地搜索(深链 `?cat=&tag=&q=`);`data.ts` 单扫缓存 + `getSkill` O(1);全站客户端组件只喂瘦卡。**基线:browse 首屏 6.0MB→25KB;build-index 3.4s@5,816 条;docs.json 4.9MB(P1 门控:>1.5万条 或 >8MB 或搜索 p95>200ms → Typesense)**。两侧 `tsc` 全绿;待本机 `npm run web` 浏览器回归。

### 进行中
- **分类 / 标签体系**:`packages/schemas` 词表(`featuredLabels` / `tagLabels`)+ `skill.category/tags` + browse/home 分类导航 + `/category/[slug]` 分类页——开发中,未提交。
- 可复现评测:OpenAI runner + `score`/`types` 迭代中(未提交)。
- **微文案分支 `feat/microcopy-p0`**:代码 + ADR 0013 + 文档 + 全量 catalog 数据变更(`a5926c192`,约 5,816 条 skill-report.json)**已并入 main**(2026-07-07 核对),分支可清理;仅剩本机浏览器回归(见「下一步」)。
- 前端 v4 重设计 + 早期 docs 整理若仍有未提交项,一并留痕。

### 下一步
- **hosting 字段对账(2026-07-07 构建时发现)**:8,496 条标 `meta.hosting=mirrored`,其中 **3,664 条磁盘无 `mirror/` 目录**——字段与事实脱节(pack-zips 实打 4,832 个 zip;前端侥幸无恙:`hasMirror` 走 `existsSync` 磁盘事实,这批自动回退上游)。待做:① 对账 job——无 mirror/ 的回写 `indexed`(或补下载);② `status.mjs` 快照改按磁盘事实计数(现在「托管 8,499」是虚数);③ ingest 把 `hosting=mirrored` 的写入时机挪到 mirror 落盘成功之后,杜绝再产生。
- **微文案批量补跑(触发点=P1 门槛 1.5万条,2026-07-07 裁决)**:07-06 采集翻倍后覆盖率从 ~95% 掉到 **48%**(10,735 条中 copy 有效 5,218;~5.2k 新条目没进过 `categorize:llm`,另有 276 条 hash 过期)。**不即时增量补**——继续采集,目录到 1.5万 时与 Typesense 同批动手(一次 regime change),届时 `categorize:llm` 批量跑缺失+过期、再 `web:index`。理由:边采边补会被内容更新的 hash 过期反复浪费 LLM 跑量;缺文案条目按设计回退 description(宁可平淡,不可说谎),UX 可接受。
- **verdict 服务步骤⑤⑥**([ADR 0012](decisions/0012-verdict-service.md)):研究议题(裁决口径/误报率基线/复核吞吐/徽章语义)在 `packages/verdicts/policies/` 草稿里迭代(现状 `v0-draft`,账本仅 55 条 legacy);policy v1 定稿 + 全量重扫 + 开 TRUST_DISPLAY = 重新上架(验收:diff 只有 flag)。
- **Supabase:下次 sync 前执行三个迁移**(按日期顺序):`2026-07-05-verdict-service.sql`(放开 audit_status 非空)、`2026-07-06-context-size.sql`(**不执行 sync 直接报列不存在**)、`2026-07-06-first-seen.sql`。
- **M1**:社区最小切片改按 [ADR 0017](decisions/0017-object-anchored-community-and-invisible-verify.md) 执行——短评/求助 Q&A/开发者说挂对象页 + 账号层(邮箱 OTP 延迟注册)+ 隐形验证回执(.skill 下载为主路径)+ 原作者一键认领([ADR 0006](decisions/0006-one-click-claim.md);ADR 0001 实现层由 0017 修订)。`/community` demo 四板块不上线,聚合页密度门控(周新帖 >20)。可复现评测协议随评测线另行排期。
- **规模化架构 P1:从「等触发」提为「准备动手」**(ADR 0004 → 0007):2026-07-07 实测 docs.json **7.58MB**(阈值 8MB 的 95%)、目录 10,744 条(阈值 1.5万 的 72%)——下一波采集大概率越线。届时上自托管 Typesense:实现新 adapter 即可,接口不动;**微文案批量补跑与此同批触发**(见上条)。详见[架构与迁移计划](architecture/走向百万级-架构与迁移计划.html)。

> 已从本清单移除:「扩 catalog 到 500+」——catalog 已 10,744 条(2026-07-07 快照),M0 供给目标超额完成;后续供给扩展另立目标再入清单。

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
- [0016 · 新上架时间 first_seen_at 与「新上架」榜口径](decisions/0016-new-arrivals-ranking.md)
- [0017 · 社区对象锚定 + 隐形验证安装](decisions/0017-object-anchored-community-and-invisible-verify.md)

## 文档地图(唯一入口)
所有规划 / 架构 / 设计文档已收进 `docs/`,点开即看。

**策略**
- [PRD](planning/PRD.html)
- [竞品调研报告](planning/竞品调研报告.html)
- [ModelScope 功能对标](planning/ModelScope-功能对标.html)
- [社区层设计 v2 · 对象锚定与隐形验证](planning/社区层设计v2-对象锚定与隐形验证.html) — 四内容类型挂对象 + .skill 下载回执(ADR 0017;v1 已移 _archive)
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
