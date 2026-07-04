# ADR 0009 — SEO 双轨:筛选词表 ≠ SEO tag 页
- 日期:2026-07-04
- 状态:已采纳(实现待 P1)

## 背景
标签分面方案把长尾技术词(react 78、postgres 24、vue 7…)挡在筛选词表外(1% 供给门槛)——作为站内 UI 决策是对的,但 skills.sh 的 Topics 证明这类词的另一半价值是 SEO 落地页:搜「claude skill react」的站外用户落在 78 条真货的页面上,一点不薄。

## 决策
两套机制、两个用户、互不污染:
1. **筛选词表**:服务站内用户。策展、1% 准入门槛、进 `labels.ts`、渲染为分面筛选。
2. **SEO tag 页**(`/t/<keyword>`):服务站外搜索用户。从原始 keyword 自动生成,**条目 ≥ 20 才 index,thin 页 noindex**,不进词表、不出现在筛选面板。

## 后果 / 约束
- 实现推迟到 P1(Typesense 落地时顺带,keyword 命中即查询);现在只立此存照,防止将来把长尾词塞回筛选词表来「补 SEO」。
- tag 页排序沿用数据侧统一口径(归一 stars + per-repo cap),前端不排。
