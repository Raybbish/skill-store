<!-- 自动生成,勿手改。运行: npm run status -->
# 项目状态(自动快照)

_生成于 2026-07-07 02:10 UTC · 分支 `fix/sync-maxbuffer` · 未提交改动 1 处_

## Catalog
- **skill 总数:10744**
- verdict 账本(catalog/verdicts,ADR 0012;扫描停摆中,现存均为 legacy 历史判定):有判定 **55** —— pass 52 · flagged 3
- 托管:mirrored 8499 · indexed 2245
- 已评测:**0** · 发布者:**821**

## 最近提交
```
2cbe7b521 docs(status): 补录 sync/mirror 修复批与仓库卫生;场景包「新上架」口径改引 ADR 0016;ADR 0015 修订
c5386eda1 chore(scripts): 各 pipeline job 自动加载 .env
eaa241062 data(first-seen): 全量回填 first_seen_at(git 派生 10,716 条;ADR 0016)
b82b64bbd feat(first-seen): first_seen_at 采集盖章 + git 回填 job + sync/schema + ADR 0016
8aab2e830 chore: 去跟踪 tsbuildinfo(生成物,已入 gitignore)
3651fb870 chore: 统一包管理器为 npm;清理生成物跟踪
0d2a1ee3c fix(ingest): normalizeName 保证非空,清理一条空 name 坏条目
21027d47f data(catalog): 64 个 gitlink mirror 降级为 index-only(修复损坏镜像)
```
