<!-- 自动生成,勿手改。运行: npm run status -->
# 项目状态(自动快照)

_生成于 2026-07-15 05:33 UTC · 分支 `feat/howto-star1k` · 未提交改动 4 处_

## Catalog
- **skill 总数:10521**
- verdict 账本(catalog/verdicts,ADR 0012;扫描停摆中,现存均为 legacy 历史判定):有判定 **55** —— pass 52 · flagged 3
- 托管(磁盘事实):indexed 5953 · mirrored 4568 · ⚠ 字段漂移 1 条(`npm run reconcile:hosting` 对账)
- 已评测:**0** · 发布者:**837**

## 最近提交
```
b8c21c93d6 fix(ingest): clone 加 120s 超时 + 半成品清理,单个巨仓不再挂死整趟 (ADR 0027)
c638be59c0 fix(ingest): 同仓同名 skill 按路径消歧,不再静默漏收 (ADR 0027 P2)
fb02a2ec7c fix(ingest): 共享 search 客户端,二级限流退避重试 + 跨源节流 (ADR 0027 P1)
5d33b45c37 chore(howto): star≥1000 批「怎么用」+ --min-stars 选择器 (ADR 0025)
5f055745eb fix(ingest): Code Search 停摆可见 + 游标直推 main + ls-tree -z + 同名告警 (ADR 0027) (#53)
8c437dc7de perf(search): Typesense 请求免 CORS 预检 + use_cache + 防抖 280→350ms (#51)
9aeee9ec88 Feat/reviews to comments (#50)
02f5867859 ci(ingest): 采集后自动补中英文微文案 + 怎么用
```
