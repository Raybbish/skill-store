# 埋点事件 schema(冻结)

> P0「只攒不花」:字段今天冻结,前端 beacon 打点,消费留到 P1(行为回填 scene_tags,见 [ADR 0013](../decisions/0013-microcopy-sources.md))。
> 实现:`packages/web/lib/analytics.ts`。收集端 = Supabase `analytics_events` 表(2026-07-16 落地,见下「收集端」节)——未配置 `NEXT_PUBLIC_ANALYTICS_URL` 时全部 no-op,货架行为不变。

## 为什么现在只定 schema 不接消费

场景词的「可见性」P0 靠词频阈值(≥ `SCENE_VISIBLE_MIN`)兜底,但真正的准确性担保来自**行为**:用户搜了某个场景词、点进某个 skill、装了它——这条 `search→click→install` 链一旦攒够,就能把「词 → skill」的配对从"机器猜的"升级成"用户用脚投的"。这个回填 P1 才做,但**数据不能等 P1 才开始攒**,否则上线即冷启动。所以 P0 就打点,schema 冻结以免 P1 消费时对不上。

## 三事件

一条日志管道(P0 static 站可 `sendBeacon` 到最简 collector,甚至先落 nginx 日志)。字段名**不可改**(P1 消费按此对齐):

```jsonc
{ "t": "search",  "q": "week report",                          "sid": "…", "ts": 1751700000000 }
{ "t": "click",   "q": "week report", "id": "owner/repo/name", "pos": 3, "sid": "…", "ts": … }
{ "t": "install", "id": "owner/repo/name", "ref_q": "week report",        "sid": "…", "ts": … }
```

| 字段 | 事件 | 含义 |
|---|---|---|
| `t` | 全部 | 事件类型:`search` / `click` / `install` |
| `q` | search / click | 查询词(click 时为来源查询,前端从 URL `?q=` 读) |
| `id` | click / install | 三段式 skill id `owner/repo/name` |
| `pos` | click | 结果中的位次(榜单/搜索结果的 rank;缺省表示非排序位) |
| `ref_q` | install | 促成安装的来源查询(把「词 → skill」配对) |
| `sid` | 全部 | 匿名会话 id(仅串联一次会话内的 search→click→install,**不做用户画像**;sessionStorage 持久,隐私模式下退化为空串) |
| `ts` | 全部 | 客户端毫秒时间戳 |

- **install** = 复制 npx / bash 安装命令,或下载 zip——P0 能拿到的最强意图信号。
- **click** = 打开详情页(卡片名 / 「获取 ›」)。

## 回填规则(P1 生效;数字为初值,跑三个月后校准)

见 [ADR 0013](../decisions/0013-microcopy-sources.md)。要点:

- 词 → skill 的 `install` 配对 ≥ **40** 次:该词进 `tags_search`(只做召回,UI 不可见);
- ≥ **80** 次:进「升可见候选」名单,人工过目后并入 `scene_tags`——**行为担保准确性,人只把关品味**;
- 防污染:同一 `sid` 对同一配对每天只计 1 次;单一 `sid` 贡献占比 > 30% 的词冻结。

## 收集端(2026-07-16 落地)

「最简 collector」选型 = **Supabase 一张表,零新基建**(与 install_receipts 同款手法):`infra/migrations/2026-07-16-analytics-events.sql` 建 `analytics_events`——payload 键 = 列名,前端 `sendBeacon` 直达 PostgREST,不经任何中间层。

- **端点**:`NEXT_PUBLIC_ANALYTICS_URL = https://<project>.supabase.co/rest/v1/analytics_events?apikey=<anon_key>`。sendBeacon 不能带 header,anon key 走 query 参数(key 本就烘在前端产物里,无新增暴露面)。
- **发送形态**:JSON 裹 `application/json` Blob(裸字符串会以 text/plain 发出被 PostgREST 拒收);代价是一次 CORS 预检,fire-and-forget 场景无所谓,**不影响搜索线的免预检优化(#51)**。
- **RLS**:匿名可插、不可读(埋点是店家账本);长度/取值约束挡垃圾,事件形状(search 必有 q,click/install 必有 id)表级 check 兜底。
- **反刷边界(诚实记录)**:匿名插入防不了刷,同回执口径——P1 消费时按 sid 去重 + 单 sid 占比 >30% 冻结(见上「回填规则」);分析以服务端 `created_at` 为锚,客户端 `ts` 仅排序参考。
- **不建二级索引**:纯追加账本,read 路径出现时(P1 聚合)再按查询形状建索引/物化视图。
- **上线三步**:Supabase 执行迁移 → `gh secret set NEXT_PUBLIC_ANALYTICS_URL`(管道写法**不带 --body**,见 deploy.yml 头注教训)→ 下次合 main 自动烘进产物。

## 隐私边界

`sid` 只为在**一次会话内**把三个事件串成一条链,不落任何可反查个人的字段(无 IP、无 UA 指纹、无跨会话 id)。这与全站「信任原生社区、不做行为画像」的取向一致。
