# ADR 0022 — 双语架构:商店的话跟语言走,商品保持原文
- 日期:2026-07-09
- 状态:已采纳(用户裁决:「面向全球是宗旨」,多语言升一等需求)

## 背景
用户裁决面向全球为产品宗旨,拒绝「中文首发、英文后补」。约束:站点纯静态导出(`output:"export"`),Next 内置 i18n 路由不可用;全量双路由会把 1.07 万条路由翻倍。关键洞察(用户):**值得翻译的只有商店自己的话**——skill 名/描述/README/用户内容是商品,原语言是商品属性(App Store/Steam 同款模型);微文案(tagline/场景词)按 ADR 0013 定义是「我们的转述」,归商店侧,应随语言(英文批跑后补)。

## 决策
**瘦身双路由 + 客户端偏好切换**,首发 zh + en,词典架构支持后续加语言(加一份词表):

1. **商店页双路由**(~20 张 ×2):首页/榜单/动态/收录/talk/包页——`/` = zh,`/en/` = en。每页正文抽成带 `locale` 参数的共享组件,两个薄路由;SSR 即正确语言,无闪切。路由 1.07 万 + 20,文件数与构建时间基本不变。
2. **共享页单路由**(详情 9,880/分类/发布者/browse 壳):页面主体是商品原文,chrome(十几个标签)用客户端切换——`useLocale()` 取 localStorage 偏好(`oms_locale`,事件广播即时生效),`<L zh en/>` 内联双语件,SSR 首帧 zh 与静态输出一致、en 偏好水合后订正。已知取舍:共享页英文 SEO 弱(静态 HTML 标签为 zh),冷启动可接受;英文流量起来后可渐进升级成真双路由,URL 不变。
3. **词典**:`lib/i18n`(zh 锚定键集,en 缺键活不过 tsc;`t()` 支持 {var} 插值);分类/标签/分面名用词表自带的 `label_zh/label_en`(labels.ts 天生双语,单一来源);lib 层(talk/reviews)错误抛 `E:词典键`,组件层按 locale 翻译——lib 保持语言无关。
4. **切换器**:nav「中 / EN」;商店页跳对应变体并记偏好,共享页原地切;`<html lang>` 客户端订正。
5. **邮件**:Magic Link 模板双语(中前英后,`{{ .ConfirmationURL }}` + `{{ .Token }}`)。
6. **连带定案**:文件数今天已 ~2.6 万(路由×2 文件 + dl 产物),CF Pages 2 万上限出局——**部署平台 = Vercel**。InstallBox 的 HOST 顺手落定 `https://oh-my-skill.com`。

## 后果 / 约束
- **修订(同日,用户裁决「AI 描述和标签也要同步英文」)**:转述层双语进上线范围——`SkillCopy` 加 `tagline_en/scene_tags_en/fit_line_en`(同锚同批,**同一次 LLM 调用产出中英两份**,比分两批省一半);categorize-llm 新 scope `missing-en`(只补 zh 新鲜但缺英文的存量 ~9.4k);英文侧轻量 lint(长度帽/禁名/禁冠词开头),不合格丢字段回退 description、不拉低 zh lint_pass;en 场景词 launch 期不做词表治理(后补,同 zh renorm 路径)。批跑命令:`npm run categorize:llm -- --scope missing-en`。显示层已接线(同日):瘦卡 taglineEn/sceneEn 透传 wire、SkillRow 按 locale 取英文副标题与场景词(回退 description 原文)、详情页 fit_line/场景词双语、本地打分器与 Typesense query_by 英文召回(taglineEn,sceneEn 权重 3,5);待 web:index + typesense:push 生效。
- 已知残留(backlog):详情页 `contextMethodTip` 悬停提示(「静态估算」)zh-only;分类页 metadata zh-only(单路由 SEO 主中文);hreflang alternates 未做(上线后补)。
- 用户内容(短评/公海帖)与包 title/tagline/编辑手记(人写署名的策展内容)不翻译,混排是全球社区常态。
- 新增语言流程:dicts 加词表 + `/{lang}/` 薄路由一组;共享页自动获得该语言 chrome。
