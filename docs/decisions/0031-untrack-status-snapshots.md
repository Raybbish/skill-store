# ADR 0031 — STATUS 生成物退出 git 跟踪
- 日期:2026-07-17
- 状态:已采纳

## 背景
`docs/STATUS.generated.md` / `docs/STATUS.html` 是 `npm run status` 的机器产物,却被两头写:
status.yml 定时(01:20 UTC)直推 main 刷新;各特性分支改动 docs 时也重新生成随 PR 提交。
两头写同一文件 = 天然冲突源——07-16~17 两天内三条 PR 的冲突全部落在这三件套上,
每次都要 `--ours` 手解。`.gitignore` 里的忽略条目其实早已存在(注释就写着「避免每次 merge 冲突」),
但从未执行 `git rm --cached`,忽略从未生效,`chore/untrack-status` 分支立而未做。

## 决策
1. **生成物退出跟踪**:`git rm --cached docs/STATUS.generated.md docs/STATUS.html`(既有 gitignore 条目就此生效)。
2. **status.yml 撤定时提交**与 `contents: write` 权限,只保留 push 时校验 `status.mjs` 可运行(守门脚本别被改坏)。
3. **契约改口(CLAUDE.md)**:可派生数字 = 本地跑 `npm run status` 看;唯一进 git 的状态文件是手写 `docs/STATUS.md`。

## 后果 / 约束
- GitHub 网页上不再能直接看快照;换来 docs 冲突面缩到一个手写文件。
- 各 agent 收工时不再提交生成物;`npm run status` 照常本地生成(产物被 gitignore)。
- `chore/untrack-status` 旧分支使命完成,可删。
