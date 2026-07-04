# ADR 0007 — SkillStore 取数缝 + 构建期静态索引(P0 止血)
- 日期:2026-07-04
- 状态:已采纳
- 承接:[0004 走向百万级](0004-scale-to-millions.md)的 P0 阶段落地

## 背景
实测三个病根(2026-07-04,catalog 6,177 条 / 可见 5,816):
1. `lib/data.ts` 无缓存,`getSkill` = 全表 find —— SSG ~5.8k 详情页 → 构建期 O(n²);
2. `/browse` 把全量 Skill(含 evidence)序列化进客户端 props:**6.0MB 原始 / 0.96MB gzip**,5.8k 行整表渲染,每击键全表重算;
3. 索引层不存在,各页面直连 `allSkills()` 再过滤,取数逻辑散落。

## 决策
1. **缝**:前端取数收拢到 `lib/store.ts` 的 `SkillStore` 接口 —— `search(query, filters, page)` 返回 `{items, total, page, pages}`、`getSkill(id)`。**接口签名冻结**;P1 Typesense、P2 Postgres 只换实现(新增 adapter,不删旧的,可随时回退)。
2. **瘦卡 `SkillCard`**:列表行 + 认证弹窗的最小字段面(含 risk 五因子/l3 摘要/review/upstream;**不含** evidence、eval.tasks)。字段与 `Skill` 同名同型 → 全量 Skill 结构上就是合法卡,组件两边通吃。客户端组件一律只喂卡。
3. **构建期索引** `scripts/build-index.ts` → `public/idx/`(派生物,不进 git;predev/prebuild 自动跑):
   - `pages/pN.json`:热门序分片,30 条/片(DOM 恒 ≤30 行,免虚拟化),**已套 per-repo cap=3**(收掉 ADR 0005 遗留的同仓聚顶);
   - `docs.json`:全量瘦卡、纯热门序(4.9MB/gzip ~0.9MB),仅筛选/搜索时懒加载一次,客户端过滤后按需再 cap;
   - `meta.json`:total/pages + 分类·标签·桶内细分计数(browse 不再全量扫描算计数)。
4. **browse**:服务端只带 p1(25KB)+ meta;翻页 fetch 分片,筛选/搜索走 `StaticStore.search()`;搜索为零依赖相关度打分(name 前缀 > name > id > 标签 > 描述),行为向后兼容旧子串搜索。支持深链 `/browse/?cat=&tag=&q=`。
5. **data.ts**:catalog 单次扫描模块级缓存,`getSkill` 走 Map O(1);分类页热门序 + cap + 截 150,溢出跳 browse 深链。

## 基线(P1 门控仪表盘,数字进 STATUS)
- 构建期 catalog 文件读:~6k 次(原 ~3,400 万次量级);build-index 3.4s@5,816;
- browse 首屏数据:25KB(原 6.0MB);docs.json 4.9MB —— **门控:目录 >1.5万 或 docs.json >8MB 或 搜索 p95 >200ms → 启动 P1 Typesense**。

## 后果 / 约束
- 排序逻辑(热门 + cap)在**数据侧**(构建期/索引期)算好,前端不再排序 —— P1 迁 Typesense rank 字段时口径不变;
- `output:"export"` 维持到 P2;本次改造未加深对它的依赖(所有交互数据走 fetch 静态产物);
- dev 模式 catalog 变更需重启(模块级缓存);
- docs.json 若先胀破:先裁 description 长度,再考虑分片,最后才提前 P1。
