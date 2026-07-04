# skill-store — Agent 契约 & 项目须知

> 每个 agent(Cowork / Claude Code / 子 agent / 队友)进入本仓的**第一读物**。
> 目标:让文档永远跟得上代码,让任何人一眼看清项目和各 agent 在做什么。

## 开工前(必读)
1. 读 **`docs/STATUS.md`** —— 项目当前在哪、进行中什么、下一步。
2. 跑 **`npm run status`**(= `node scripts/status.mjs`)看最新自动快照(catalog / 审计 / 提交数字)——**别信手写的数字**。
3. 相关决策看 **`docs/decisions/`**(ADR),别重议已定的事。

## 收工前(必做 —— 这就是"完成"的定义)
- 有可见进展 → 更新 `docs/STATUS.md` 的「已完成 / 进行中 / 下一步」。
- 做了架构或产品决策 → 在 `docs/decisions/` 加一条 ADR(编号递增,格式见该目录 README)。
- 改了数据 / 管线 → 跑 `npm run status` 刷新 `docs/STATUS.generated.md` 一起提交。
- **一次改动 = 一个分支 + 一个 PR**;PR 描述写清"这个 agent 在做什么"。PR 列表就是全体 agent 的看板。

## 目录
- `packages/` 代码:`pipeline`(采集+评测;审计已下架)· `web`(Next 前端)· `cli` · `schemas`
- `catalog/` **事实源**(公开;改动走 PR、带 commit 溯源)
- `docs/` 文档,**Markdown 为准**:`STATUS.md` 手写现状 · `STATUS.generated.md` 脚本自动生成 · `decisions/` ADR
- `scripts/status.mjs` 从 catalog + git 派生状态快照

## 硬约束(沿用 PRD)
- ⛔ **安全扫描整套已下架**(2026-07-04,[ADR 0011](docs/decisions/0011-unlist-security-scan.md)):不得在产品面展示任何审计/认证/权限披露内容,不得重新接线 `audit`/`review`/`audit:l3`——重新上架需先完成 ADR 0011 列的研究与设计。content_hash 完整性校验、发布者认证、评测(eval)不在下架范围。
- **措辞:全站禁「保证安全」**;涉及评测只说「已评测」。
- 品牌名:**oh-my-skill**。
