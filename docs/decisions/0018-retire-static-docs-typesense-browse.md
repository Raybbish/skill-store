# ADR 0018 — 退静态 docs.json,browse/筛选/搜索三态全走 Typesense
- 日期:2026-07-08
- 状态:已采纳

## 背景
P1(ADR 0004/0007)让**带词搜索**走 Typesense,但默认浏览与纯筛选仍走静态 `public/idx/docs.json`——客户端首次筛选懒加载全量瘦卡(gzip ~1MB @1万条),本地 `matchFilters` + `applyRepoCap` 分页。docs.json 随目录线性增长(P0.5 WireCard 已从 7.5MB 砍到 4MB,但仍随规模涨),是 browse 路径的载荷天花板;而目录即将全量扩充。既然 Typesense 已在线服务搜索,把浏览/筛选也交给它,docs.json 就不必再进浏览器。

## 决策
**三态(默认视图 / 纯筛选 / 带词搜索)全走 Typesense;配了 Typesense 时浏览器永不 fetch docs.json。**

1. `TypesenseStore.search` 接管三态:带词维持 relevance(`_text_match:desc,pop:desc`)、不套 cap;无词用 `q=*` 全量 + `sort_by=cap_overflow:asc,pop:desc`。
2. **per-repo cap 平价**:`applyRepoCap`(cap=3)是**重排非过滤**(同仓前 3 席留头、溢出沉底、零丢弃)。push 时按 pop 序算每仓 rank,落 `cap_overflow`(`rank>3?1:0`)为 int32 排序键;无词 `sort cap_overflow:asc,pop:desc` 复刻其「头+尾」重排,保扁平分页与计数。
   **注(口径差异)**:平价仅在**无筛选态**精确成立——`cap_overflow` 按全局 pop 序预计算;旧 `StaticStore` 在纯筛选态是对**筛选后子集**重算 rank(某仓筛后仅剩全局 rank 4/5/6 的 3 条,旧口径留头、新口径沉底)。取全局口径:cap 本意是防单仓刷屏,同仓全局溢出条目在筛选态沉底不违本意,且免去按每种筛选组合动态算 rank;计数与零丢弃两个不变量不受影响。接受此差异。
3. `getSkill` 走 search + `filter_by: sid:=…`(不用文档直取端点:search-only scoped key 只授 `documents:search`,直取需要 `documents:get`,生产 key 打不通)。
4. `docs.json` **保留为构建产物**:仍是 `typesense-push` 的唯一输入,也是未配 Typesense 时 `StaticStore` 的本地实现;仅不再随响应发给浏览器。
5. SSR 首屏仍读静态分片 `p1`(`readIdxPage(1)`),快且不依赖 Typesense;客户端交互(翻页/筛选/搜索)后接手 Typesense——首屏与后续同口径(`cap_overflow+pop` == `applyRepoCap+byPopularity`)。

## 放弃项(取舍,选项 B)
**fail-open 下线。** ADR 0004/0007 的「永不因搜索服务缺席而哑」在配了 Typesense 时不再成立:Typesense 不可达 → `search` 抛错 → 前端进「索引加载失败,刷新重试」态(非白屏,SSR 首屏分片仍在)。取舍理由:运维上 Typesense 已是核心依赖,再维护「本地全量兜底」这条双实现的成本 > 收益;可用性改由 Typesense 侧高可用保证。

## 后果 / 约束
- docs.json 不再随规模拖累 browse(客户端零下载);目录可放开扩,静态载荷不再是门槛(下个天花板留给 P3)。
- **`typesense:push` 必须在每次 `web:index` 后跑**,否则浏览/搜索滞后于 catalog。
- 生产 Typesense 成为 browse 单点:单实例挂 = 全站列表不可用(接受;上生产前配副本 / 别名原子切换,见 typesense-push 头注)。
- 无 schema 破坏;collection 新增 `cap_overflow` 字段,下次 push 生效。
