# ADR 0016 — 新上架时间 first_seen_at 与「新上架」榜口径
- 日期:2026-07-06
- 状态:已采纳

## 背景
「新上架」榜需要一个稳定的「这条 skill 何时进我们货架」的时间戳。现有字段都不合用:

- `signals.fetched_at` 每次采到/内容变更即刷新(未变的条目又被跳过不更新),表达的是「最近一次采到」,不是首次上架;拿它排序会让老 skill 上游改一次就冒到榜首。
- `meta.upstream_commit` 是 commit 哈希,不是日期。
- Supabase `skills.updated_at` 每次同步都刷新;且该表「可随时全量重建」,任何只活在 DB 的时间(含默认 `now()`)都会在重建时丢失。

唯一权威的「首次进 catalog」事实是 **catalog 的 git 历史**——`skill-report.json` 首个 `--diff-filter=A` commit 的时间。但逐条跑 git 是 O(n)、不适合喂榜单。

另一个约束:批量采集(尤其含 GitHub 全域 / 聚合仓折叠采样)一次会带进几千条,若「新上架」= 纯 `ORDER BY 时间 DESC`,一次批量就把新榜灌爆、还把批内几千条平铺成同一时刻,失去意义。

## 决策

### 1. 轴 = 首次进货架(first-seen),不是上游发布
「新上架」指「新到**我们**架子上」,而非上游作者何时发布。上游发布时间是另一套更重的信号(需对上游仓单独跑 git log),如需另立字段,不与 first_seen 混用。

### 2. first_seen_at 字段:git 为事实源,物化为缓存,盖一次永不覆盖
- 位置:`signals.first_seen_at`(ISO 字符串),schema 可选。
- **事实源是 catalog git**;字段是其物化缓存,读/排便宜(百万级不能每次 O(n) 跑 git),且能从 git 确定性重推、扛全量重建。
- **不变式**:首次写入时盖章,之后永不覆盖——与 `eval` / `copy` 同属「采集不冲下游」。
  - `official.ts`:新候选默认盖 `first_seen_at = 发现时刻`。
  - `ingest.ts`:更新既有条目时用旧值顶掉(`prev.first_seen_at ?? now`),不因重跑漂移。
  - 存量(字段引入前)条目由 `jobs/backfill-first-seen.ts` 从 git 一次性回填,不在采集热路径推导 git。
- 传导:`sync.ts` 幂等 upsert 带入 Supabase `first_seen_at` 列(`infra/migrations/2026-07-06-first-seen.sql`),前端按它排「新上架」。

### 3.「新上架」榜口径:防批量灌爆
榜单不是裸的 `ORDER BY first_seen_at DESC`,而是三重收敛:

1. **窗口化**:只取「近 N 天」或「自上次批量以来」的新条目,而非无限回溯。
2. **质量兜底二排**:窗口内按已有质量信号(`stars_github` / `installs_skills_sh`)二次排序,让批内同日的几千条不平铺、有序。
3. **隐藏过滤**:套用货架既有的隐藏规则——`duplicate_of` 非空、`!frontmatter_valid`,并对 `bulk_source`(折叠采样批量源)降权或折叠,避免一次批量采集把新榜冲垮。

## 后果 / 约束
- **存量回填是一次性**:先 `npm run backfill:first-seen`(git 单次 pass 建表、幂等只填缺失、`--dry` 可预览按天分布),再 `npm run sync -- --full` 把值推上 Supabase。
- **改名迁移的口径 caveat**:git 按**当前路径**取首个 add commit,经历过 id-v2 三段式改名迁移的条目取到的是**迁移日期**而非更早的原始日期(跨改名精确溯源需 `--follow`,仅单路径可用,批量 pass 不做)。catalog 尚年轻(始于 2026-07 初),影响小。
- **new ≠ updated**:first_seen_at 只驱动「新上架」;「最近更新」是另一根轴(content_hash 变化 / updated_at),不要用 first_seen 表达内容更新。
- **批量同日聚集是预期**:一次批量的几千条会共享同一 first_seen 日期,批内先后本无意义——由口径②的质量二排消化,不追求批内细粒度顺序。
- **schema 不设 required**:存量缺失属合法状态,消费方写守卫;前端缺值时可回退按 updated_at 或不进新榜。
- **明天的批量不会丢顺序**:catalog git 已记账,批量无论在字段落地前后跑,事后都能从 git 回填出正确先后;唯一禁忌是引入字段时给全部条目盖统一的 `now`(会把历史压平成一天)。
