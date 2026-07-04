# ADR 0006 — 原作者一键认领(发布者认领入口)
- 日期:2026-07-04
- 状态:建议(落在 M1 账号层)

## 背景
skill 全部从 GitHub 采集,冷启动时 listing 归属为空(聚合态)。要让原作者把自己那条 listing 收归己有——改图标(ADR 0002 第 3 档所指的「M1 发布者认领入口」)、答复社区(ADR 0001 的 M1 社区切片)、后续拿采用数据。难点是 authorship 无法凭空自证;但既然内容源都在 GitHub,**「对源仓库的控制权」可自证**,这就是认领的支点。

## 决策
**核心口径:身份证明 = 对 skill 源 GitHub 仓库 / 账号的控制权。** 认领 = 用 M1 已定的 **Supabase Auth(GitHub OAuth,ADR 0001)** 登录,拿 `login / orgs / repo 权限` 自动比对源归属,命中即当场绑定——这才是真正的「一键」。

**验证阶梯(命中即停;前 3 档零人工 = 一键):**
1. 源仓 `admin/push` 权限匹配 → 自动放行(覆盖第一方仓,绝大多数场景)
2. 源仓所属 org 的 owner / 成员 → 自动放行
3. `SKILL.md` frontmatter `author` / 声明的源链接 == 登录身份 → 自动放行(**聚合源专用**,见下)
4. 挑战验证:往源仓 / Gist 塞一次性 token,轮询 GitHub API 确认 → 半自动
5. 冲突 / 存疑 → 人工审核(永久兜底)

**第一方 vs 聚合源(关键分叉):**
三段式 ID `owner/repo/name` 里的 `owner`,在第一方仓 = 作者;在聚合 / 精选仓(`curated_by` 标记、`MAX_PER_REPO` 折叠来的)= 搬运工。故比对逻辑按来源分流:
- `source_type = first_party` → 走第 1–2 档(repo 权限即可判定)。
- `source_type = aggregator` → **跳过 repo 权限档**(会误绑到搬运工),只认第 3 档(frontmatter / 声明源);否则落第 4–5 档。

复用现有聚合标记(`curated_by` / 折叠信号)派生 `source_type`。

**数据模型(Supabase Postgres,与账号层同库):**
```
accounts(id, github_user_id, github_login, avatar, email, created_at)
skills.owner_account_id   -- null = 未认领(聚合态)
skills.claim_state        -- unclaimed | pending | claimed | verified
skills.source_type        -- first_party | aggregator(派生自 curated_by / 折叠)
claims(id, skill_id, account_id, method, evidence, status, ts)  -- 审计流,争议/撤销的唯一依据
```
`claims` 表必留:它是撤销与仲裁的证据链。

**认领后授予(渐进,守红线):**
- 编辑 listing:图标(落地 ADR 0002 第 3 档)、描述覆盖、链接、标签建议。
- **「作者已验证」身份徽章**——与平台「已扫描 / 已评测」认证**视觉与文案分离**(ADR 0002 红线:身份 ≠ 背书,禁虚假背书)。
- 答复社区(ADR 0001 的求助 / 评价)。
- 发布者页归属(`packages/web` 已有 publisher 页)。
- 后续:该 skill 的采用 / 流量数据。

**增长:静默预填。** 首次 OAuth 后扫登录者 `repos + orgs`,把 catalog 中 `owner ∈ {login, orgs}` 的 skill 一次性列出「发现 N 条疑似你的,一键全认领」(仿 npm / PyPI 登录即见己包),把认领率从「主动找」变「顺手确认」。

## 后果 / 约束
- **身份 ≠ 背书**:徽章只表「作者已认领并验证」,不隐含平台对其安全性的担保(PRD 红线「全站只说已扫描 / 已评测」)。视觉、文案与认证徽章分离。
- **Apache-2.0 §6**:认领授予的是 listing 控制权,非商标授权;沿用 ADR 0002 的商标 / logo 移除流程。
- **防滥用**:排除 `fork:true` 仓(防拿 fork 冒领)、GitHub 侧权限变更触发重验、`claims` 全程留痕、admin 可撤销 / 仲裁、认领限流。
- **MVP 边界**:M1 只做第 1–2 档(第一方仓,直接坐在 Supabase GitHub OAuth 上,零新基建);第 3 档(聚合源 frontmatter)与第 4 档(挑战)待聚合认领有真实需求再补;第 5 档人工永久保留。
- **依赖**:`source_type` 分类质量决定第 3 档能否自动;frontmatter `author` 非强制字段,缺失即落挑战 / 人工。
- 关联:[ADR 0001](0001-trust-native-community.md)(M1 账号层 = 本入口的家)、[ADR 0002](0002-icon-logo-ip-deferred.md)(图标认领即本入口第一个消费场景)。
