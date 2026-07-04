# ADR 0005 — 货架指标口径:stars 统一头条 + 归一排序
- 日期:2026-07-04
- 状态:已采纳并落地 `packages/web`

## 背景
货架上有的 skill 显示下载量(installs)、有的显示 GitHub stars,视觉与语义都乱。实测可见 5,811 条:**stars 覆盖 98.8% · installs(skills.sh)仅 0.8% · 两者零重叠**——因为管线现在"按来源单填"(GitHub 源填 stars、skills.sh 源填 installs)。所以不是一半一半,而是一条 99% 是星数的列里冒出 45 条孤立下载量,格外扎眼;且 stars 与 installs 不可比,旧双轴排序里"按 installs"会把 5,766 条 null 全压底(基本是坏的)。

## 决策
- **头条统一一个槽位**:有 stars 显 `★`,缺失回落 `⬇ installs`,再无则标「新」。
- **排序 `byPopularity`**:归一 stars 主键 = `stars / √repo_skill_count`(抑制巨仓——20-skill 大仓不再靠 skill 多霸榜),`installs` 作次键给少数仅 skills.sh 有数的条目兜底。
- 去掉 browse「按 installs / 按 stars」双轴;首页「大家都在装 · 安装量」→「热门 · GitHub 人气 · 按仓库归一」。
- `installs` 原始值留详情页作"外部采用"参考。暂不引自家遥测(冷启动为空)。

## 后果 / 约束
- stars 是仓库级 → 同仓 skill 同分并列,顶部可能一个仓聚顶;**待办:货架加 per-repo cap**(同屏同仓限 1–2 条)。
- 属**过渡口径**:自家安装遥测 / 综合 `quality_score` 就位后并入(见 [ADR 0004](0004-scale-to-millions.md) 的发现/排序)。
- 改动:`packages/web` 的 `lib/data.ts`(`normStars`/`byPopularity`)· `SkillRow` · `BrowseClient` · `page.tsx`;`tsc --noEmit` 通过。
