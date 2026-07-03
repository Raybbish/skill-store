<!-- 自动生成,勿手改。运行: npm run status -->
# 项目状态(自动快照)

_生成于 2026-07-03 11:13 UTC · 分支 `main` · 未提交改动 225 处_

## Catalog
- **skill 总数:73**
- 审计状态:pass 52 · needs_review 3 · pending 18  →  通过 **52 / 71%**
- 托管:mirrored 55 · indexed 18
- 已评测:**0** · 发布者:**13**

## 最近提交
```
a6b358e feat: L1/L2 审计 28 条 + openai 真实 runner + 前端新信号展示 + audit --repo
4bb9dd1 chore: 同步 package-lock.json(补 cli workspace)
6945f0c feat: 三段式 ID(owner/repo/name)+ 每仓折叠采样 + skills.sh 榜单采集
8886c29 feat(ingest): two-stage acquisition — default index-only(metadata, no mirror, scales to 万级); --mirror opts into hosting layer for select skills. Roots out the collection-repo blowup.
f94c70d fix(ingest): robust mirror cp (force+dereference for symlinked collection repos, degrade-not-crash) + hub-signals caps by skill count (MAX_PER_REPO)
425ea74 fix(ingest): idempotent re-runs — load existing catalog, cross-run hash dedup, preserve audit/eval/review on same-id updates, skip unchanged (verified)
4cbb9cb feat: Hub curated-signal line — parse community awesome-lists for curation+category signal, content still from upstream (schema curated_by, ingest --hub-signals, frontend badge, arch diagram updated)
e2282a2 feat(w3c): GitHub-wide source adapter (search API by skill topic) — reliable alternative to skills.sh private registry
```
