# ADR 0030 — Code Search 小时级二级封禁:读 reset 一发即收工 + 拆 workflow 错峰

- 日期:2026-07-16
- 状态:已采纳,随本 ADR 落地
- 关联:ADR 0027(长尾发现:P1 二级限流退避)、ADR 0019 S1(Code Search 采集线)

## 背景

ADR 0027 P1(共享 search 客户端 + 二级限流退避)07-15 生产验收转绿,07-16 cron 即复发:

- code search **第一发**即 429:`x-ratelimit-remaining=10`(主配额未动)、无 `retry-after`、响应体为 HTML 错误页——纯二级(abuse)限流;
- `x-ratelimit-reset` 恒 ≈ **now + 63 分钟**(04:35 UTC 请求 → reset 05:38),不是 60s 主窗口;
- 退避 60s/120s 后重试,reset 从 05:38 → 05:41——**重试本身在给封禁续期**;
- 三发耗尽收工,本轮 0 次成功响应,游标冻结在 切片3 页2。

结论:这类封禁是**小时级滑动窗口**,P1 的指数退避(60s 起、3 发、单次等待封顶 180s)在设计上就赢不了,多打的每一发还把窗口往后推。07-15 验收转绿属于错开了触发阈值,不是修好。触发面:主 ingest 在同一 GITHUB_TOKEN 下先跑 topic 搜索 + 几十仓 shallow clone,几分钟内紧接全网 `filename:SKILL.md`(GitHub 最贵查询之一)。

## 决策

1. **封禁识别,一发即收工**(`gh-search-client.ts`):判为二级限流、无 retry-after、且 `reset - now > SEARCH_RESET_GIVEUP_MS`(默认 10 分钟)→ 不再重试,立即把受限结果交回调用方。code-search 据此收工判 degraded、游标保留,语义与 ADR 0027 一致;省下白等的 3 分钟,更不再续期封禁。reset 近(正常 60s 窗口)时维持原退避。
2. **code-search 拆独立 workflow 错峰**(`.github/workflows/code-search.yml`):cron 07:00 UTC(北京 15:00),与主 ingest(03:00 UTC)拉开 4 小时;与 ingest.yml **共用 `concurrency: group: ingest`** 互斥串行,cron 漂移也不同窗。产物落同一条 `ingest/daily` PR(接续机制同款,PR body 同文避免互相覆写);游标照旧直推 main;LLM 只跑便宜的 `categorize:llm --scope missing-copy`,howto 重活留主 ingest 热门批。
3. **主 ingest 移除 code-search**:`ingest.yml` 去掉 `--code-search 30` 与「Persist code-search cursor」步骤。主 run 不再因 code search 停摆置红,停摆可见性由 code-search.yml 自身 gate 承担。

## 后果与边界

- sources.yaml 官方仓在两条 workflow 里各枚举一次:幂等;退市缺席计数有同日闸(`delist.ts` 的 `markMissing`),不双计。
- 若 07:00 窗口仍撞封禁(说明触发因子不止「同窗突发」),下一步升级:code search 换独立 PAT(独立配额桶),或拉大 `SEARCH_MIN_GAP_MS` 降频。
- 验收判据:① 两 run 各自绿;② code-search run 搜索成功数 > 0、游标离开 切片3 页2;③ 若再 429,日志出现「判为小时级滑动封禁……立即收工」而非三连重试。
