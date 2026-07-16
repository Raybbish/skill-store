/**
 * 双语词典(ADR 0022):「商店的话跟语言走,商品保持原文」。
 * - 商店自有页(首页/榜单/动态/收录/包页)双路由:/ = zh,/en/ = en,服务端以 locale 参数渲染;
 * - 共享页(详情/分类/发布者)单路由:chrome 用客户端组件按偏好切换(见 client.tsx 的 L/useLocale);
 * - 商品字段(skill 名/描述/README/用户内容)不翻译——原语言是商品属性。
 * 加一种语言 = 在 dicts 加一份词表(键集用 zh 锚定,tsc 保证不漏)。
 * 文案红线照旧:只写事实,不写 slogan。
 */
export type Locale = "zh" | "en";
export const DEFAULT_LOCALE: Locale = "zh";

/** 双路由页 hreflang 互指(SEO 收尾):path 传 zh 变体路径(如 "/charts/"),
 *  产出 Metadata.alternates —— canonical 指本 locale 变体,languages 互指,x-default 归 zh。 */
export function langAlternates(path: string, locale: Locale) {
  const zh = path;
  const en = `/en${path}`;
  return {
    canonical: locale === "en" ? en : zh,
    languages: { "zh-CN": zh, en, "x-default": zh },
  };
}

const zh = {
  // 导航 / 页脚
  "nav.home": "首页", "nav.charts": "榜单", "nav.changelog": "动态", "nav.methodology": "收录",
  "nav.back": "‹ 首页", "nav.signIn": "登录",
  "footer.privacy": "隐私", "footer.tail": "Agent Skills 商店",
  // 首页
  "home.searchPlaceholder": "搜索 {n} 个 skill…",
  "home.packsTitle": "一套装齐", "home.packsK": "按场景配好,一条命令",
  "home.allSkills": "全部 skill", "home.relevance": "相关度排序",
  "home.scene": "场景", "home.exitScene": "退出场景",
  "home.filterRepo": "只看仓库", "home.filterPub": "只看发布者",
  "home.all": "全部", "home.any": "不限",
  "home.noMatch": "无匹配结果", "home.loadFail": "索引加载失败,刷新重试", "home.loading": "加载中…",
  "home.prev": "‹ 上一页", "home.next": "下一页 ›", "home.pageOf": "第 {p} / {n} 页",
  "home.pagerLabel": "分页", "home.jumpTo": "跳至", "home.pageUnit": "页", "home.jumpGo": "跳转", "home.jumpAria": "跳至第几页,共 {n} 页",
  "home.sortLabel": "排序", "home.sortHot": "热门", "home.sortStars": "Star 数", "home.sortNew": "最新收录",
  "home.searchLabel": "搜索 skill",
  // 分面名(labels.ts FACETS 只有中文名,英文在这里补)
  "facet.activity": "做什么", "facet.surface": "用在哪", "facet.language": "语言", "facet.tech": "技术", "facet.meta": "其他",
  // 榜单
  "charts.eyebrow": "榜单", "charts.title": "今天有什么新的",
  "charts.tabNew": "🆕 新上架", "charts.tabHot": "🔥 热门", "charts.tabEval": "🧪 评测榜 · 开发中",
  "charts.dayCount": "{label} · 新上架 {n} 个", "charts.empty": "暂无新上架记录",
  "charts.today": "今天", "charts.yesterday": "昨天",
  // 动态
  "cl.title": "动态 · oh-my-skill", "cl.desc": "商店周报:本周新增、上线与下线,一页看全。",
  "cl.eyebrow": "动态", "cl.week": "本周", "cl.weekTail": "条上架",
  "cl.release": "上线", "cl.change": "变更", "cl.notice": "公告", "cl.empty": "暂无动态",
  // 收录
  "cov.title": "收录 · oh-my-skill", "cov.desc": "每个源收了多少、其余在哪,一页看全。",
  "cov.eyebrow": "收录", "cov.observed": "全网", "cov.listed": "已上架", "cov.sources": "大源",
  "cov.notItemized": "未逐条收录", "cov.listedN": "上架 {n}", "cov.listedLink": "已收录 ›", "cov.source": "源头 ↗",
  "cov.empty": "暂无",
  "cov.footnote": "单仓 ≥ 1,000 个 skill 的批量源:记录来源与规模,不逐条收录",
  // 邮箱 OTP 登录文案(键名沿革自 /talk;论坛已随 ADR 0024 下线,reviews / me / studio 登录流共用)
  "talk.signedAs": "以 {email} 登录", "talk.signOut": "退出",
  "talk.emailPh": "邮箱(仅用于验证码登录)", "talk.sendCode": "发验证码", "talk.cancel": "取消",
  "talk.codeTip": "邮件已发到 {email}(注意垃圾箱)——收到链接直接点,会自动回到本页登录;收到 6 位码就在下面输:",
  "talk.codePh": "6 位验证码(如果邮件里有)", "talk.signIn": "登录", "talk.changeEmail": "换邮箱",
  "talk.user": "用户",
  "talk.errEmail": "邮箱格式不对", "talk.errCode": "验证码不对或已过期",
  // 评论区(ADR 0026;键名沿用 rev.* 前缀)
  "rev.title": "评论", "rev.write": "写评论", "rev.edit": "改我的短评",
  "rev.gateOn": "发布需要「已验证安装」:装过(或验证过本机副本)的人才可评。",
  "rev.gateOff": "登录即可评论;带「已验证安装」的,是发布者名下有本店的安装或持有记录。",
  "rev.send": "发布", "rev.reply": "回复", "rev.replyPh": "回复…",
  "rev.delete": "删除", "rev.confirmDel": "删除这条评论?它的回复会一起删除。",
  "rev.upTip": "顶", "rev.downTip": "踩",
  "rev.verdictOpt": "评价可选", "rev.textReq": "写点什么再发", "rev.emptyTop": "选个评价,或写一句",
  "rev.rate": "太快了,喘口气再发", "rev.replyErr": "只能回复主楼评论", "rev.loginHint": "先登录再发言",
  "rev.good": "✓ 好用", "rev.ok": "− 一般", "rev.bad": "✗ 不好用",
  "rev.textPh": "一句话(可选):它帮你做成了什么?哪里要注意?",
  "rev.nickPh": "署名(可选,默认「用户」)", "rev.publish": "发布", "rev.update": "更新",
  "rev.pickOne": "先选一档:好用 / 一般 / 不好用",
  "rev.verified": "已验证安装", "rev.verifiedTip": "发布者名下有该 skill 的安装/持有记录",
  "rev.oldVer": "评于旧版本", "rev.oldVerTip": "发布后内容已更新",
  "rev.empty": "还没有评论——登录就能发第一条。",
  "rev.ineligible": "你的账号名下还没有这个 skill 的记录。装过?把装好的文件夹、或 .skill / .zip 安装包拖进下面——校验在你电脑本地完成,文件不会上传,只核对内容指纹:",
  "rev.dropHere": "把装好的文件夹,或 .skill / .zip 安装包,拖到这里", "rev.checking": "校验中…",
  "rev.pickDir": "选文件夹", "rev.pickFile": "选 .skill / .zip 文件",
  "rev.cliAlt": "习惯终端?一条命令也行", "rev.recheck": "验证完了,重新检查", "rev.later": "先不评",
  "rev.rejected": "校验未通过", "rev.rlsHint": "还差一步:短评需要「已验证安装」——先装过或跑一次 verify", "rev.failed": "提交失败({s})",
  // 详情页 chrome
  "d.addedAt": "收录于 {t}", "d.upstreamAt": "上游提交 {t}", "d.pick": "★ 社区精选", "d.noDesc": "(无描述)",
  "d.scene": "场景", "d.installs": "安装量", "d.stars": "GitHub stars",
  "d.pending": "待重算", "d.ctxSingle": "上下文体积 · 单文件", "d.ctxMin": "最小装载", "d.ctxRefs": "含声明引用", "d.ctxTotal": "文本包总量",
  "d.hosting": "托管", "d.mirrored": "镜像", "d.indexed": "索引",
  "d.tomb": "上游已移除或改名,本条目于 {d} 停止收录;历史数据与镜像保留。",
  // 相对时间
  "t.today": "今天", "t.yesterday": "昨天", "t.days": "{n} 天前", "t.weeks": "{n} 周前", "t.months": "{n} 个月前", "t.years": "{n} 年前",
  // 安装区
  "inst.download": "下载安装", "inst.dragNote": "双击,或拖进 Claude 桌面版 / Cowork,即完成安装",
  "inst.otherAgent": "用别的 agent?下载 .zip 解压,把文件夹放进它的技能目录",
  "inst.otherTools": "其他工具", "inst.otherToolsNote": "见其文档的「skills」目录;两个下载是同一份文件,只是名字不同",
  "inst.cursorNote": "自动读取上面两处目录", "inst.projLevel": "项目级",
  "inst.npx": "通过 npx 安装", "inst.hashTag": "校验哈希", "inst.bash": "通过 bash 安装",
  "inst.verify": "已经装过?验证本机副本,不用重装",
  "inst.copy": "复制", "inst.copied": "已复制 ✓",
  "inst.foot": "安装器自动探测 agent 目录(.claude / .codex / .cursor …);落盘前逐文件复算 blob sha 校验 content_hash,与货架不一致即拒装 —— 别家 npx 是盲装,这里不是。",
  // 认领
  "claim.q": "是你的作品?", "claim.btn": "用 GitHub 认领", "claim.busy": "认领中…", "claim.done": "✓ 作者已认领",
  "claim.doneTip": "@{login} 于 {d} 认领;身份说明,非平台背书",
  "claim.noGithub": "当前登录方式不含 GitHub——认领需要用 GitHub 登录(证明你控制这个仓)",
  "claim.aggregator": "这条来自多作者合集仓,自动认领不适用;其他验证方式在路上",
  "claim.claimed": "这条已被认领;如有争议请联系我们仲裁",
  "claim.notFound": "没找到这条 skill(可能刚下架)", "claim.signInFirst": "请先登录",
  "claim.mismatch": "你的 GitHub(@{got})与 @{want} 不一致——换对应账号登录后再试", "claim.fail": "没成功({s})",
  "claim.all": "认领你的全部作品 ›",
  // GitHub 登录(全站选项,2026-07-12)/ 作者工作台(/studio)
  "gh.signIn": "用 GitHub 登录",
  "st.title": "作者工作台", "st.eyebrow": "作者",
  "st.intro": "用 GitHub 登录后:认领店内已收录的你的作品,或把还没收录的仓库提交进店。",
  "st.needGh": "当前登录不含 GitHub 身份——作者功能需要用 GitHub 登录",
  "st.listed": "已收录 · @{login}", "st.listedNone": "店内没有 @{login} 名下的作品",
  "st.claim": "认领", "st.claimAll": "一键全认领", "st.claimedTag": "✓ 已认领",
  "st.bulkNo": "合集仓成员,自动认领不适用",
  "st.scanH": "尚未收录的仓库",
  "st.scan": "扫描我的 GitHub 公开仓库", "st.scanning": "扫描中…",
  "st.scanNone": "没扫到含 SKILL.md 的未收录公开仓库",
  "st.scanAuth": "扫描要用登录时带的 GitHub 授权,当前没有——重新用 GitHub 登录一次即可",
  "st.scanFail": "扫描没成功({s});可用下面的手填框提交",
  "st.submit": "提交收录", "st.submitAll": "全部提交", "st.pending": "已提交,待收录",
  "st.manualPh": "{login}/仓库名",
  "st.off": "作者功能尚未开放",
  "st.loading": "加载中…",
  "sub.badRepo": "仓库名格式不对(应为 owner/name)",
  "sub.listed": "这个仓库已在店内",
  "sub.dup": "已提交过,无需重复",
  "sub.rate": "提交太频繁,明天再试",
  "sub.notYours": "只能提交 @{login} 名下的仓库",
  // 我的(/me,一页两态)
  "me.title": "我的", "me.eyebrow": "账号",
  "me.uses": "登录用于:写短评、认领作品、提交收录。浏览和下载不需要账号。",
  "me.ghNote": "作者功能(认领 / 提交收录)需要 GitHub 身份",
  "me.or": "或",
  "me.twoAccounts": "邮箱与 GitHub 各是一个账号,暂不互通",
  "me.studio": "作者工作台 ›", "me.studioNote": "认领已收录的作品,提交未收录的仓库",
  "me.notConfigured": "账号功能未启用(后端未配置)。",
  // 登录页(/login,ADR 0023 追记三)
  "login.eyebrow": "登录 / 注册",
  "login.title": "登录",
  "login.sub": "GitHub 或邮箱验证码,任选其一。首次登录即注册。",
  "login.desc": "Claude 技能与插件商店。按需挑选,一键装进 Claude Code。",
  "login.stats": "{n} 技能 · {c} 分类 · 每日更新",
  "login.codeSent": "验证码已发到 {email}(留意垃圾箱)。收到链接可直接点开登录,收到 6 位码就在下面输。",
  "login.codeDigit": "验证码第 {i} 位",
  "login.resend": "重新发送验证码",
  "login.resendIn": "{s} 秒后可重新发送",
  // 卡片 / 包页 / 其他
  "row.scene": "场景", "row.new": "新", "row.get": "获取 ›",
  "pack.suffix": "{n} 件套,装一次就够。", "pack.hashNote": "安装时逐个校验内容哈希;每个成员也可以单独安装。",
  "pack.noTerminal": "不用终端?", "pack.fullZip": "↓ 整包 .zip",
  "pack.dlNote": ".skill 双击或拖进 Claude 即装;整包 zip 解压后把文件夹放进你工具的技能目录",
  "pack.editorNote": "编辑手记",
  "browse.redirect": "正在跳转…",
  "pub.listed": "已上架", "pub.installs": "累计安装", "pub.works": "作品集",
} as const;

export type MsgKey = keyof typeof zh;

const en: Record<MsgKey, string> = {
  "nav.home": "Home", "nav.charts": "Charts", "nav.changelog": "Updates", "nav.methodology": "Coverage",
  "nav.back": "‹ Home", "nav.signIn": "Sign in",
  "footer.privacy": "Privacy", "footer.tail": "The Agent Skills store",
  "home.searchPlaceholder": "Search {n} skills…",
  "home.packsTitle": "Starter packs", "home.packsK": "Curated by scenario, one command",
  "home.allSkills": "All skills", "home.relevance": "by relevance",
  "home.scene": "Scene", "home.exitScene": "Exit scene",
  "home.filterRepo": "From repo", "home.filterPub": "From publisher",
  "home.all": "All", "home.any": "Any",
  "home.noMatch": "No results", "home.loadFail": "Index failed to load — refresh to retry", "home.loading": "Loading…",
  "home.prev": "‹ Prev", "home.next": "Next ›", "home.pageOf": "Page {p} of {n}",
  "home.pagerLabel": "Pagination", "home.jumpTo": "Go to page", "home.pageUnit": "", "home.jumpGo": "Go", "home.jumpAria": "Jump to page (1–{n})",
  "home.sortLabel": "Sort", "home.sortHot": "Popular", "home.sortStars": "Stars", "home.sortNew": "Newest",
  "home.searchLabel": "Search skills",
  "facet.activity": "Activity", "facet.surface": "Surface", "facet.language": "Language", "facet.tech": "Tech", "facet.meta": "Other",
  "charts.eyebrow": "Charts", "charts.title": "What's new today",
  "charts.tabNew": "🆕 New", "charts.tabHot": "🔥 Trending", "charts.tabEval": "🧪 Evals · in progress",
  "charts.dayCount": "{label} · {n} new", "charts.empty": "No arrivals on record yet",
  "charts.today": "Today", "charts.yesterday": "Yesterday",
  "cl.title": "Updates · oh-my-skill", "cl.desc": "Weekly store updates: new arrivals, releases and removals.",
  "cl.eyebrow": "Updates", "cl.week": "This week", "cl.weekTail": "listed",
  "cl.release": "Shipped", "cl.change": "Changed", "cl.notice": "Notice", "cl.empty": "Nothing yet",
  "cov.title": "Coverage · oh-my-skill", "cov.desc": "What each source contributed and where the rest lives — one page.",
  "cov.eyebrow": "Coverage", "cov.observed": "observed", "cov.listed": "listed", "cov.sources": "major sources",
  "cov.notItemized": "not itemized", "cov.listedN": "{n} listed", "cov.listedLink": "Listed ›", "cov.source": "Source ↗",
  "cov.empty": "None yet",
  "cov.footnote": "Bulk sources with ≥ 1,000 skills in one repo: recorded (source and scale), not itemized",
  "talk.signedAs": "Signed in as {email}", "talk.signOut": "sign out",
  "talk.emailPh": "Email (used only for the sign-in code)", "talk.sendCode": "Send code", "talk.cancel": "Cancel",
  "talk.codeTip": "Email sent to {email} (check spam) — click the link to sign in and return here; if the email shows a 6-digit code, enter it below:",
  "talk.codePh": "6-digit code (if the email includes one)", "talk.signIn": "Sign in", "talk.changeEmail": "Change email",
  "talk.user": "user",
  "talk.errEmail": "That email doesn't look right", "talk.errCode": "Wrong or expired code",
  "rev.title": "Comments", "rev.write": "Write a comment", "rev.edit": "Edit my review",
  "rev.gateOn": "Posting requires a verified install: only people who installed (or verified a local copy) can review.",
  "rev.gateOff": "Sign in to comment; the “verified install” tag means the store has an install or ownership record for the author.",
  "rev.send": "Post", "rev.reply": "Reply", "rev.replyPh": "Reply…",
  "rev.delete": "Delete", "rev.confirmDel": "Delete this comment? Its replies go too.",
  "rev.upTip": "Upvote", "rev.downTip": "Downvote",
  "rev.verdictOpt": "rating optional", "rev.textReq": "Write something first", "rev.emptyTop": "Pick a rating, or write a line",
  "rev.rate": "Too fast — give it a few seconds", "rev.replyErr": "You can only reply to top-level comments", "rev.loginHint": "Sign in to post",
  "rev.good": "✓ Works", "rev.ok": "− Okay", "rev.bad": "✗ Poor",
  "rev.textPh": "One line (optional): what did it get done? Anything to watch out for?",
  "rev.nickPh": "Name (optional, defaults to “user”)", "rev.publish": "Publish", "rev.update": "Update",
  "rev.pickOne": "Pick one first: works / okay / poor",
  "rev.verified": "verified install", "rev.verifiedTip": "The reviewer has an install or ownership record for this skill",
  "rev.oldVer": "older version", "rev.oldVerTip": "The skill has been updated since this review",
  "rev.empty": "No comments yet — sign in to post the first.",
  "rev.ineligible": "No record of this skill under your account yet. Installed it? Drop the installed folder, or the .skill / .zip package, below — verification runs locally in your browser; files are not uploaded, only the content fingerprint is checked:",
  "rev.dropHere": "Drop the installed folder, or a .skill / .zip package, here", "rev.checking": "Checking…",
  "rev.pickDir": "Pick folder", "rev.pickFile": "Pick .skill / .zip",
  "rev.cliAlt": "Prefer the terminal? One command works too", "rev.recheck": "Verified — check again", "rev.later": "Not now",
  "rev.rejected": "Verification failed", "rev.rlsHint": "One step left: reviews require a verified install — install it or run verify once", "rev.failed": "Submit failed ({s})",
  "d.addedAt": "Added {t}", "d.upstreamAt": "Upstream commit {t}", "d.pick": "★ Community pick", "d.noDesc": "(no description)",
  "d.scene": "Scene", "d.installs": "installs", "d.stars": "GitHub stars",
  "d.pending": "pending", "d.ctxSingle": "Context size · single file", "d.ctxMin": "Min load", "d.ctxRefs": "With declared refs", "d.ctxTotal": "Total text",
  "d.hosting": "hosting", "d.mirrored": "Mirrored", "d.indexed": "Indexed",
  "d.tomb": "The upstream was removed or renamed; this entry stopped being listed on {d}. History and mirror are preserved.",
  "t.today": "today", "t.yesterday": "yesterday", "t.days": "{n}d ago", "t.weeks": "{n}w ago", "t.months": "{n}mo ago", "t.years": "{n}y ago",
  "inst.download": "Download & install", "inst.dragNote": "Double-click, or drag into Claude desktop / Cowork, to install",
  "inst.otherAgent": "Using another agent? Download the .zip, unzip, and put the folder in its skills directory",
  "inst.otherTools": "Other tools", "inst.otherToolsNote": "see their docs for the “skills” directory; both downloads are the same file under different names",
  "inst.cursorNote": "reads both directories above", "inst.projLevel": "project-level",
  "inst.npx": "Install via npx", "inst.hashTag": "hash-verified", "inst.bash": "Install via bash",
  "inst.verify": "Already installed? Verify your local copy — no reinstall",
  "inst.copy": "Copy", "inst.copied": "Copied ✓",
  "inst.foot": "The installer auto-detects agent directories (.claude / .codex / .cursor …); before writing, it recomputes blob shas per file against content_hash and refuses on mismatch — unlike blind npx installs elsewhere.",
  "claim.q": "Your work?", "claim.btn": "Claim with GitHub", "claim.busy": "Claiming…", "claim.done": "✓ Claimed by author",
  "claim.doneTip": "Claimed by @{login} on {d}; identity statement, not an endorsement",
  "claim.noGithub": "Your current sign-in has no GitHub identity — claiming requires GitHub sign-in (to prove you control the repo)",
  "claim.aggregator": "This entry comes from a multi-author aggregate repo; automatic claiming doesn't apply — other verification paths are coming",
  "claim.claimed": "Already claimed; contact us if you dispute it",
  "claim.notFound": "Skill not found (it may have just been delisted)", "claim.signInFirst": "Sign in first",
  "claim.mismatch": "Your GitHub (@{got}) doesn't match @{want} — sign in with the matching account", "claim.fail": "Didn't work ({s})",
  "claim.all": "Claim all your works ›",
  "gh.signIn": "Sign in with GitHub",
  "st.title": "Author studio", "st.eyebrow": "Author",
  "st.intro": "Sign in with GitHub to claim your listed works, or submit repos that aren't listed yet.",
  "st.needGh": "Your current sign-in has no GitHub identity — author features require GitHub sign-in",
  "st.listed": "Listed · @{login}", "st.listedNone": "No listed works under @{login}",
  "st.claim": "Claim", "st.claimAll": "Claim all", "st.claimedTag": "✓ Claimed",
  "st.bulkNo": "From an aggregate repo; automatic claiming doesn't apply",
  "st.scanH": "Repos not listed yet",
  "st.scan": "Scan my public GitHub repos", "st.scanning": "Scanning…",
  "st.scanNone": "No unlisted public repos with a SKILL.md found",
  "st.scanAuth": "Scanning uses the GitHub authorization from sign-in, which is missing — sign in with GitHub once more",
  "st.scanFail": "Scan didn't work ({s}); you can submit via the input below",
  "st.submit": "Submit", "st.submitAll": "Submit all", "st.pending": "Submitted — pending",
  "st.manualPh": "{login}/repo-name",
  "st.off": "Author features aren't open yet",
  "st.loading": "Loading…",
  "sub.badRepo": "Repo name should look like owner/name",
  "sub.listed": "This repo is already in the store",
  "sub.dup": "Already submitted",
  "sub.rate": "Too many submissions — try again tomorrow",
  "sub.notYours": "You can only submit repos under @{login}",
  "me.title": "Me", "me.eyebrow": "Account",
  "me.uses": "Sign in to review, claim your works, or submit repos. Browsing and downloads need no account.",
  "me.ghNote": "Author features (claiming / submitting) require a GitHub identity",
  "me.or": "or",
  "me.twoAccounts": "Email and GitHub sign-ins are separate accounts for now",
  "me.studio": "Author studio ›", "me.studioNote": "Claim your listed works, submit unlisted repos",
  "me.notConfigured": "Accounts aren't enabled (backend not configured).",
  "login.eyebrow": "Sign in / up",
  "login.title": "Sign in",
  "login.sub": "GitHub or an email code — either works. First sign-in creates your account.",
  "login.desc": "The store for Claude skills & plugins. Pick what you need, install to Claude Code in one step.",
  "login.stats": "{n} skills · {c} categories · updated daily",
  "login.codeSent": "Code sent to {email} (check spam). Click the link if the email has one, or enter the 6-digit code below.",
  "login.codeDigit": "Code digit {i}",
  "login.resend": "Resend code",
  "login.resendIn": "Resend in {s}s",
  "row.scene": "Scene", "row.new": "New", "row.get": "Get ›",
  "pack.suffix": "{n} skills, one install.", "pack.hashNote": "Each member is hash-verified on install; members can also be installed individually.",
  "pack.noTerminal": "No terminal?", "pack.fullZip": "↓ Full pack .zip",
  "pack.dlNote": ".skill installs by double-click or drag into Claude; unzip the pack and place folders into your tool's skills directory",
  "pack.editorNote": "Editor's note",
  "browse.redirect": "Redirecting…",
  "pub.listed": "listed", "pub.installs": "total installs", "pub.works": "Works",
};

export const dicts: Record<Locale, Record<MsgKey, string>> = { zh, en };

/** 取词 + {var} 插值。键以 zh 词表为锚,en 缺键活不过 tsc。 */
export function t(locale: Locale, key: MsgKey, vars?: Record<string, string | number>): string {
  let s: string = dicts[locale][key] ?? zh[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** 商店页链接按 locale 加前缀(共享页——详情/分类/发布者——不加,单路由) */
export function localePath(locale: Locale, path: string): string {
  return locale === "en" ? (path === "/" ? "/en/" : `/en${path}`) : path;
}

/** 相对时间(与详情页/短评同口径,双语) */
export function relTime(locale: Locale, iso?: string | null): { rel: string; abs: string } | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  const rel =
    days <= 0 ? t(locale, "t.today") : days === 1 ? t(locale, "t.yesterday")
    : days < 7 ? t(locale, "t.days", { n: days }) : days < 30 ? t(locale, "t.weeks", { n: Math.floor(days / 7) })
    : days < 365 ? t(locale, "t.months", { n: Math.floor(days / 30) }) : t(locale, "t.years", { n: Math.floor(days / 365) });
  return { rel, abs: iso.slice(0, 10) };
}
