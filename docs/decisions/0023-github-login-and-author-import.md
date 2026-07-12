# ADR 0023 — GitHub 全站登录 + 作者一键导入(工作台 /studio)
- 日期:2026-07-12
- 状态:已落地(代码);开关沿用 claims flag,默认 off

## 背景
ADR 0006 第①档(单条认领)已落地但「静默预填(一键全认领)」后置;ADR 0017 把 GitHub 降为
「只在认领时出场」。上线冲刺日用户裁决两件事:① GitHub 升级为**全站登录选项**(评论/发帖登录框
与邮箱 OTP 并列);② 做「一键导入自己的作品」,含**两半**:批量认领店内已收录的 + 提交店里还没有的。

## 决策
**① GitHub 全站登录(修订 ADR 0017 口径)。** 短评/公海登录框加「用 GitHub 登录」按钮,与
邮箱 OTP 并列;走既有 Supabase authorize 端点,回跳令牌在 hash,由 `sessionFromUrlHash`
统一接住(与魔法链接同管道,零新基建)。M1 仍不做身份链接:GitHub 账号与邮箱账号可能是两个,
可接受(ADR 0006 补充的既定边界)。`Session.user` 增 `github_login`(取自平台验证过的
identities,仅显示与预填用;服务端裁决仍只认 `auth.identities`)。

**② 作者工作台 `/studio`(单路由共享页)。**
- **批量认领** = ADR 0006「静默预填」落地:取数走 SkillStore 缝(`publisher==login` 再核
  `owner==login`),列出全部已收录作品与认领状态,「一键全认领」循环 `claim_skill` RPC——
  服务端逐条裁决(bulk_source 拒绝、owner 比对、幂等),前端无任何信任决定权。
- **提交未收录** = 新 `submissions` 表 + `submit_repo` RPC(`2026-07-12-submissions.sql`):
  - 边界与第①档一致:**只收「个人 owner == 已验证 GitHub login」的仓**(org 仓待②档);
  - 服务端校验:格式 / owner 比对 / 已在店内(skills.id 前两段)/ 一仓一条(含已拒,重提走人工)/
    24h 30 条限流;写入只经 RPC,RLS 只许读自己的提交;
  - 仓库发现:OAuth 回跳带的 `provider_token`(**只进 sessionStorage,关标签页即弃**)调
    GitHub code search `filename:SKILL.md user:{login}`,排除 fork 与已收录仓;token 缺失/
    扫描失败给「重新 GitHub 登录」与**手填框**两条出路。
- **消费**:近期人工(查 pending → 审核入册 sources.yaml → 标 accepted/rejected);后续
  pipeline job 直读本表自动入册(入册仍走既有 ingest 全链路,收录标准不因自助提交而降)。

**开关与入口**:与认领共用 `app_settings['claims']` 一套门(作者功能一体);off 时 /studio 只说
「尚未开放」、站内唯一入口(SkillClaim 认领面板的「认领你的全部作品 ›」)也随之隐藏。

## 后果 / 约束
- **身份 ≠ 背书**红线不变:认领只陈述归属;提交只进待收录队列,**收录与否以货架为准,不预告**
  (submissions 无公开读)。
- provider_token 仅用于公开数据检索(code search),服务端从不信任它;不落 localStorage。
- 双账号(邮箱/GitHub)并存的合并仍留 M2(manual linking)。
- 全站 GitHub 按钮增加了普通用户接触 GitHub 的面;接受——按钮并列不默认,邮箱 OTP 仍是主轨。
- 关联:[ADR 0006](0006-one-click-claim.md)(静默预填=本页第①区)、[ADR 0017](0017-object-anchored-community-and-invisible-verify.md)(登录口径被本 ADR 修订)。

## 落地件
`lib/auth.ts`(github_login/provider_token 捕获)· `lib/claims.ts#listClaimsByLogin` ·
`lib/submissions.ts` · `app/studio/`(page + StudioClient)· `SkillReviews`/`TalkBoard` 登录框
GitHub 按钮 · `SkillClaim` 面板入口 · `infra/migrations/2026-07-12-submissions.sql`。
上线序(在 2026-07-08-claims.sql 三步之上):执行 submissions 迁移 → 开 claims flag → 完。

## 追记(2026-07-12 同日):/me 一页两态
用户问「要不要正式登录页」。裁决:**不设独立登录页**(延迟注册是 ADR 0017 定案,登录是动作时刻
不是目的地;OAuth/魔法链接回跳当前页的模式保持),但补「账号在场」的落点——新增 `/me`:
未登录 = 登录页(邮箱 OTP + GitHub 双轨,注明两账号暂不互通);已登录 = 身份 + 退出 +
作者工作台入口(claims flag 开着才显示)。页脚加「我的」。名下内容(短评/回执/认领/提交)留 M2。
