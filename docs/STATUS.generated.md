<!-- 自动生成,勿手改。运行: npm run status -->
# 项目状态(自动快照)

_生成于 2026-07-09 10:33 UTC · 分支 `feat/s0-work-list-model` · 工作区干净_

## Catalog
- **skill 总数:10494**
- verdict 账本(catalog/verdicts,ADR 0012;扫描停摆中,现存均为 legacy 历史判定):有判定 **55** —— pass 52 · flagged 3
- 托管(磁盘事实):indexed 5926 · mirrored 4568 · ⚠ 字段漂移 1 条(`npm run reconcile:hosting` 对账)
- 已评测:**0** · 发布者:**836**

## 最近提交
```
0c9bc0d47 ingest.yml:cron 加 --code-search 30;PR 抽查清单同步 ADR 0019 口径
97e825130 ingest:code-search 单源故障降级为跳过,不拖死整趟采集
f0258d0b4 S1 Code Search 采集器(ADR 0019):filename:SKILL.md 全网扫描,好货不打标的仓从这条线进
56e9bfd94 S0 收敛迁移:清 Supabase 中 catalog 已删的 692 条 skills 行
3524faab2 收录页去执法语言:「已拦截」退场,只留事实陈述
88226d70d 收录页补拦截规则注脚:已拦截=单仓≥1000 批量源,不逐条收录
815688670 收录页大源补自述与拦截态(ADR 0019 随笔补丁)
3c3fc5fc9 S0 作品与清单对象模型(ADR 0019):lists 账本落地 + 拷贝回收 + 巨仓拦截
```
