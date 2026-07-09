# ADR 0019 — 作品与清单对象模型:聚合仓从内容源降级为信号源
- 日期:2026-07-09
- 状态:已采纳
- 设计稿:`Desktop/skill store/skill-store-作品与清单-对象模型设计稿.html`(mockup 与判定矩阵详版)

## 背景
三个叠着的问题同根:①聚合仓刷屏——Klotzkette 单仓 26,179 个生成 SKILL.md、awesome-skills-cn 搬运 5,772 份拷贝,现行 per-repo 采样(MAX_PER_REPO=50)+ 合集条目折叠是配额止血,三种性质不同的仓拿同一处置;②署名错位——采进来的拷贝 ID 挂搬运者名下,与将来认领(ADR 0006)冲突;③收录页口径虚——「已上架/全网」读作覆盖进度,分母大半是拷贝与生成物。病根是管道思维:对每个仓决定一个处置动作,而仓不是用户关心的实体——用户关心的实体只有 skill 和清单。

## 决策
目录收敛为两个原语 + 一种事实记录:

- **作品 Work**:一个 skill,锚 `content_hash`(与 verdict 同根,ADR 0012),唯一 canonical 出处。评价、微文案、认领、verdict、场景包成员资格全挂作品。ID 维持三段式。
- **清单 List**:对作品的引用集合。聚合仓、awesome-list、官方场景包(ADR 0014)、编辑精选、将来用户清单 = 同一对象,区别仅 kind(`imported | editorial | pack | user`)与策展人。
- **出现 Appearance**:「作品 W 在仓 R 路径 P 被观测到」的事实记录,kind `original | copy | derivative`。

**仓型由 hash 对撞客观判定,取代 isMarketplace 启发式与固定采样**:文件 hash 命中已有作品 = 引用;新 hash = 候选作品。由此:

1. **策展清单仓**(awesome-skills-cn 等):0 条内容上架;入库为一份清单 + 全量 appearance,引用解析回 canonical 并计策展分。署名回正,认领冲突消除。
2. **生成仓**(Klotzkette 等):质量地板全拦,合集卡也不给;收录页留灰条 + 源头外链。预留「语料库整仓 = 单条目」破例通道(kind=corpus),**现阶段不启用**——启用前提是编辑签名,无编辑精力即关门;不做 star 阈值自动上架(教刷星 + 机器挑=机器装人)。启用时机看被动需求信号(站内搜索无结果日志、灰条点击埋点)。
3. **混合仓**:逐文件拆,新 hash 走作品线、命中走引用线。
4. **收录页换口径**:作品 / 清单 / 来源仓分开数,观测总量与拦截量为灰色注脚。

**裁决三项(2026-07-09)**:存量 bulk 采样条目**一次性手术**回收为 appearance(量 ≤5k);imported 清单**只进数据不上架**(货架上暂只有官方场景包,外来清单待编辑手挑);derivative **只记账不展示**(挂 lineage,P2 后再议透出)。

**验收判据**:任何用户可见状态必须能从 works / appearances / lists 三张表推导,不得引用仓级策略参数(MAX_PER_REPO 类数字应不复存在)。豁免两处:新 hash 原创判定(进表前判断,见已知局限)、收录页以仓为行(主题即供给来源,不决定货架状态)。

## 已知局限(不装作被 hash 解决)
新 hash 的**原创判定仍是仓级启发式**:单个 SKILL.md 内部无字段可区分手写与生成,原创性是上下文属性(兄弟文件规模、提交模式、作者一致性)。错误代价不对称——错收可见可修,错拦不可见不可修。**偏置规则:灰区一律偏向收**(如真人高产写 40 个结构雷同 skill);极端生成特征(Klotzkette 级)不属灰区,照拦。

## 落地与约束
- **S0(静态期,现在)**:schema 定稿;ingest 停止对清单仓采样拷贝;存量回收手术。catalog 现有 `collections/` 升级为 `lists/`。
- **S1**:Code Search 采集器(`filename:SKILL.md`,第三层采集待办)按新主循环实现——按仓分组、bulk 命中整仓跳过省配额、size 切片绕 1,000 条上限;`list_count` 进排序(Typesense collection 加字段,下次 push 生效,ADR 0018)。
- **S2**:前端三件——详情页「被 N 份清单收录」行、清单卡(与场景包同卡)、收录页换口径。
- **S3**:appearance 全量流水进 Postgres,与 P2 同批。不违 ADR 0008 判据:appearance 可从 Git 账本重放,非「不可重建用户数据」,不触发提前建库。
- **P0 最小落法**:appearance 不建全表,先聚合为条目信号字段 `appear_count` / `list_count`,后者进 byPopularity。
- 红线不破:货架零内部词汇(用户只见「skill / 清单 / 被 N 份清单收录」);imported 清单 source_repo 对用户隐身,呈现走策展人署名(认领前 monogram/头像,ADR 0002);焊缝不破(清单页 P0 走静态路由,不新开接口);hash 脆弱兜底(同名+同作者+高相似 → derivative,宁可漏判成新作品不可错判抢 canonical);不新增内容爬取,换记账方式不换抓取面。
- 界面文案约束:只写事实(数字/动作/状态),不写 slogan;真人策展位留空待本人填,机器不代写。

## 修订(2026-07-09,S0 落地实测)
存量手术前的全量 hash 对撞推翻了「bulk 采样条目≈拷贝」的预设:4,956 条 bulk 条目中可证拷贝(duplicate_of)仅 144,额外 hash 命中 **0**——聚合仓拷贝几乎全被改动过(hash 脆弱性条款实测坐实),且 bulk 条目大量来自原创大仓采样(单作者 50~100 skill)。据此修正:

- **一刀切回收改为三档**(用户裁决):①回收 144 条可证拷贝(其中 20 条的 canonical 本身在被拦仓内、无幸存者,放弃记账,git 历史可溯);②`file_count ≥ 1000` 的 12 仓判非单作者原创(生成或搬运),548 条采样条目全部下架——阈值是 §08 已知局限那次仓级判断的结构化形态,1000+ 不属灰区;③其余 bulk 条目(原创大仓采样,含 500-999 灰区 4 仓)按偏置规则留架。手术删除 692 条,货架 11,071 → 10,379。
- **appearance 的 S0 形态 = 清单 items**:拷贝引用记入 `catalog/lists/<owner>/<repo>.json` 的 items(按 work+name 去重,天然幂等闸);作品条目的 `appear_count`/`list_count` 是 items 的派生缓存,一律由 `pipeline/lists.ts#recomputeWorkSignals` 重算,任何 job 不得手写。
- **ingest 三档处置已接线**:已拦截仓跳克隆只刷新记录;新仓 ≥ `BULK_SIGNAL_ONLY`(默认 1000)零候选 + 拦截记录;跨仓 hash 命中不再落 `duplicate_of` 条目,改记 appearance。`MAX_PER_REPO` 采样仅存于 50~1000 灰区,其退役待 S1 原创判定引擎。
- 迁移完成:`catalog/collections/` 已移除,`CollectionReport` 类型标记 deprecated;web 收录页取数改读 `catalog/lists`。
