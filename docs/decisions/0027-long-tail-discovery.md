# ADR 0027 — 长尾发现:停摆观测、游标持久化与分档隔离

- 日期:2026-07-14
- 状态:P0 已采纳并随本 ADR 落地;P1–P3 方向已定,细则各自实施时定稿
- 关联:ADR 0019(作品+清单对象模型、三档处置)、ADR 0020(退市)、2026-07-14 外部只读审计

## 背景

2026-07-14 审计确认:货架增长进入平台期是结构性的——当前逻辑实为「固定头部回访器 + 强采样货架」,唯一负责长尾的 Code Search 停摆。

1. **常规四源都是无游标的固定头部**:sources.yaml 7 个直连仓(~211 条)、`topic:claude-skills` 按 stars 前 100、VoltAgent awesome 单清单、skills.sh 首页 ~200 条。07-14 一轮 ~2,180 候选只新增 27 条,算力花在重 clone 已知仓。
2. **Code Search 实际停摆**:最近三次生产运行首个请求即 403/429,代码 `break` 后 Actions 仍全绿;游标自 07-09 停在 `slice=0/page=2`,`sweeps_completed=0`——所谓全网扫描一轮完整 sweep 都没跑完。旧代码把 403 与 429 混在同一分支,无法区分「配额耗尽 / 二级限流 / 权限不足」。
3. **游标寄生在审核 PR 里**:ingest/daily 每轮从 main 重算 + force update 同一 PR,PR 不合并游标与候选就回滚(07-14 两轮 28→27 互相覆盖)。「每天 Actions 成功」≠「新增已入库」。
4. **主动裁量**:12 个 blocked 仓观测 60,841 条入库 0(≥1000 拦截,合理);91 个 50–999 灰区仓 15,462 → ~4,514,**永久**只看前 50,会漏真人高产仓。
5. **静默漏抓**:code search 已知仓永久跳过,首次发现后该仓新增 skill 不再抓;`ls-tree` 未用 `-z`,非 ASCII 路径被 `core.quotePath` 转义后正则漏配——正打在中文创作者源(本店差异化)上;ID 用归一化 frontmatter name 不含路径,同仓同名 skill 静默丢弃且无告警。

数字存疑,记录待实测:`size:0..300` 片的 total_count,REST 口径 07-09 观测 5,152,GitHub web UI 新索引 07-14 查询 ~54,848,口径差 10 倍。唯一确定的是单片 >1000 超出翻页硬上限(10 页 × 100),切片表需重切,但**必须以 pipeline 实际走的 REST API 实测为准,不采信 web UI 数字**。

## 决策

分四段推进,P0 随本 ADR 落地,P1–P3 依序实施。

**P0 停摆可见 + 进度不回滚(本次)**

1. code-search 对 403/429 记全 `retry-after` / `x-ratelimit-remaining` / `x-ratelimit-reset` / `x-ratelimit-resource` 与响应体;`retry-after ≤ 180s` 时按官方指示退避重试一次,再挂才收工。
2. 发过请求却零成功响应 → `degraded` → ingest 以非零码退出;workflow 对 Run ingest 步 `continue-on-error`,catalog PR 与游标照常产出,末端 gate 把整个 job 置红。
3. 游标退出审核 PR:workflow 末尾用临时 worktree 只带 `code-search-state.json` 直推 main(游标是运行状态,不是待审数据)。
4. ingest/daily 接续:运行开始先 merge 上一轮未合并的 ingest/daily,候选跨运行累积;失败(冲突/浅克隆无 merge base)退回从 main 重算,有告警。手动单源任务走独立分支 `ingest/manual`。
5. `ls-tree -r -z` + NUL 切分,修非 ASCII 路径漏抓;同 id 不同内容打告警留痕(ID 改路径锚归 P2 一并议)。

**P1 发现源扩容(修通 429 之后)**

- 多 query:`topic:claude-skills`、`topic:agent-skills`、`topic:codex-skills`、无 topic 的 filename 搜索;星数/时间分片突破单查询 1000 条上限。
- 已知仓低频 revisit 队列:预算内轮询已收录仓,解决「首次发现后永不回访、后续新增漏抓」。
- 切片表按实测 total_count 重切;表变更后清游标重扫(现有约定)。

**P2 候选隔离区**

「已观测 → 候选隔离区 → 正式货架」三层:50–999 灰区仓**全量记录**候选到隔离区(不发布),质量筛选后放行进货架;≥1000 拦截维持零候选。把「永久丢弃」改成「记录但不发布」,货架口径不变。

**P3 漏斗持久化**

`discovered_via / run_id / drop_reason / clone_error / candidate_count` 入账本(lists/_meta),覆盖率判断从「靠感觉」变成可查询。

## 后果 / 约束

- 游标直推 main 依赖 workflow 的 `contents: write` 且 main 未设强制 PR 的分支保护;commit 带 `[skip ci]`。货架部署是本机 CLI 手动,不受此推动影响。
- 质量闸不取消:P2 只改变丢弃语义,发布判据另行筛选;拦截阈值(SIGNAL_ONLY=1000)与折叠采样(MAX_PER_REPO=50)数值本 ADR 不动。
- ingest 非零退出会让每日 workflow 显示失败——这是特性不是回归:停摆必须可见。降噪手段是修根因,不是调回全绿。
- 待验证:下一轮生产 ingest 观察 degraded 路径日志(区分三种病因)、游标是否推进、接续合并是否生效。
