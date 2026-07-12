# ADR 0024 — 论坛 /talk 整体下线:没有用户先不做
- 日期:2026-07-12
- 状态:已采纳(将 0021 标为「废弃(被 0024 取代)」)

## 背景
ADR 0021 落码了公海讨论区 /talk(posts 表 + lib/talk.ts + TalkBoard + nav「讨论」),但一直停在「待用户端执行迁移」状态,从未在生产开通。上线冲刺(2026-07-12)前用户裁决:**现在没有用户,论坛整个下线,先不做**——空论坛比没有论坛更伤「活人感」(ADR 0017 的定位),且它把自定义 SMTP 拖成了上线前置。

## 决策
论坛功能整体摘除,代码走 git 历史留档,不留 flag、不留隐藏路由:

- **删**:`app/talk/` + `app/en/talk/` 两路由、`components/TalkBoard.tsx`、`lib/talk.ts`、globals.css 的 tk-* 族。
- **摘**:nav「讨论」tab(Chrome.tsx)、sitemap 两条、LocaleSwitch 的 STORE_RE 中 `talk`、i18n 词典中论坛专属键。
- **留**:`talk.*` 的邮箱 OTP 登录文案(signedAs/signOut/emailPh/sendCode/cancel/codeTip/codePh/signIn/changeEmail/errEmail/errCode/user)——reviews / me / studio 登录流共用,键名沿革不改,词典处已注释。
- **数据侧零动作**:`2026-07-09-talk.sql` 从未执行,文件加 ⛔ 头留档;Supabase 无 posts 表可清,Auth 回跳白名单无需含 /talk/。

## 后果 / 约束
- 连带松绑:**自定义 SMTP 不再是上线前置**(它当初升级为前置是因为公海放大登录量;现登录量只剩短评/认领/studio,内置邮件档先够用)。
- 重新上架的门槛不是技术是人气:等有真实用户/真实提问需求再议,届时从本 ADR + 0021 + git 历史恢复(设计方案 C「信笺流」三版对比稿仍在 Desktop)。
- 讨论/反馈的临时出路:页脚 contact 邮箱 + GitHub issues;对象锚定的短评(ADR 0017)不受影响,照常。
