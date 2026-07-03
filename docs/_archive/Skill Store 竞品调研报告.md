# Skill Store 竞品与市场调研

*2026-07-02(2026-07-03 修订:评测重定位为可复现协议——平台做赛道不做裁判)· 面向「skill 届的 App Store」立项判断*

## 一句话结论

发现(discovery)已是红海,信任(trust)与质量(quality)是空白。市场上没有一家同时做到「可复现评测 + 安全透明 + 效果展示」——这正是你 mockup 的定位,方向成立。

## 市场规模与背景

Anthropic 于 2025 年 10 月发布 Agent Skills,2026 年初开放为独立标准(agentskills.io),Microsoft、OpenAI Codex、Cursor、Gemini CLI 等约 40 个产品已兼容。生态爆发极快:2026 年 1 月 16 日公开 skill 约 2,179 个,20 天后超过 40,000 个(18.5 倍);到 6 月,skills.sh 一家就索引约 67 万个。注册市场从 2025 年 12 月的 1 家增长到 2026 Q2 的 8+ 家。

## 竞品矩阵

| 玩家 | 定位 | 规模 | 策展/安全 | 变现 | 弱点 |
|---|---|---|---|---|---|
| **Anthropic 官方** | 标准制定者 + 少量精选 | 官方目录 + 合作伙伴(Stripe、Notion、Figma 等) | 人工精选 | 无 | 不做开放市场,量小 |
| **skills.sh**(Vercel) | 「skill 界的 npm」,CLI 分发 + 榜单 | ~67 万,头部 skill 200 万安装 | 无提交审核,靠安装遥测上榜;Snyk 实时扫描(曾被绕过) | 无 | 纯目录,零质量信号,靠安装量马太效应 |
| **SkillsMP / ClaudeSkills.info** | GitHub 爬虫式大目录 | 80 万+ / 658+ | 基本无 | 无 | 噪音极大,需自行审查代码 |
| **ClawHub**(OpenClaw) | Agent 自带市场 | 数千 | VirusTotal + ClawScan + NVIDIA 分析——事后补的 | 无 | 多次恶意 skill 事件,信任受损 |
| **Agensi** | 付费精选市场 | 1,600+ | 8 项自动安全检查,一键安装 | 一次性买断,创作者 70% 分成 | 量小、评测缺失、自我宣传成分高 |
| **Smithery / mcp.so 等** | MCP 服务器目录(邻近品类) | 7,000+ / 20,000+ | Smithery 编辑审核+托管;mcp.so 开放 | 托管服务 | 解决「连接工具」不解决「教会工作流」 |
| **ModelScope 魔搭**(阿里) | Skills 中心:开源模型 × skill 一站式组合,「汇聚社区能力组件」 | 未公开;镜像 @anthropics、@vercel-labs 等命名空间 + 社区上传 | 分类/标签/技能卡片,未见评测分或安全标签 | 无(免费 API-Inference 引流) | 无质量与安全信号;绑定自家 MS-Agent 生态 |
| **腾讯 SkillHub** | OpenClaw 生态本土化分发:中文搜索 + 国内节点 | 13,000+(2026-03 上线) | 50+ 精选榜单,安全扫描 + 质量筛选;EdgeOne ClawScan 自检 skill | 无(为腾讯云引流) | 精选层薄(50/13,000);绑定 OpenClaw 单一 agent |

## 中国大厂入场(2026-07 更新)

**ModelScope Skills 中心**是与你正面重叠度最高的新玩家:阿里魔搭(中国最大模型社区)上线的 skill 聚合专区,定位「开源模型与 Skills 自由组合」。打法是全栈生态:网页目录(关键词搜索 + 开发工具/数据处理/内容创作/行业应用/通用工具五大分类)+ 命令行安装(`npx skills add` / curl / ZIP)+ 开源运行时 MS-Agent(Agent Skills 协议实现,ms-enclave Docker 沙箱执行)+ 免费 Qwen API 推理。它镜像了 @anthropics、@vercel-labs 等国际命名空间,同时接受社区上传。

**对你的含义:**它复制的是 skills.sh 的「大目录 + CLI 分发」模式,而非你的「信任 + 质量」定位——技能卡片只有名称/描述/作者/标签/基础数据,没有评测分、权限披露或效果对比。你的五个差异化点在 ModelScope 上依然是零覆盖。真正的威胁不在功能,在渠道:它自带千万级社区流量和阿里云入口,一旦补上评测/安全层,第三方店在中文市场的空间会被快速压缩。腾讯 SkillHub 的「50+ 精选 + 安全扫描」说明大厂已经意识到信任问题,只是目前做得薄(精选占比 0.4%,扫描无透明披露)。

**时间窗口判断:**大厂当前都在抢供给规模和自家生态绑定(ModelScope 绑 Qwen/MS-Agent,腾讯绑 OpenClaw/腾讯云),中立评测层仍无人做。这反而强化了「多 agent 中立聚合 + 评测数据资产」的对策——但窗口期估计不超过 2-3 个季度。

## 关键事实(决定产品设计)

**质量危机是真实的。** SkillsBench(87 任务、7,308 条轨迹)显示:精选 skill 平均把任务通过率从 33.9% 提到 50.5%(+16.6pp),但 47,150 个公开 skill 平均质量分只有 6.2/12,且部分 skill 反而拖低表现。→ 质量差异真实,评测是刚需筛子——但要做成可复现协议(带元数据、可被复跑挑战),而非平台单方跑分。

**安全危机更真实。** Snyk ToxicSkills 审计:36.8% 的 skill 至少有一个安全缺陷,13.4% 含严重问题,确认 76 个恶意 skill(SSH 密钥外传只需 SKILL.md 里三行 markdown);91% 的恶意 skill 同时用传统恶意代码 + 提示注入,能骗过现有扫描器;后续研究证明多模态隐藏指令可绕过扫描。ClawHub 接入 VirusTotal 后仍被 Unit 42 抓到 5 个漏网恶意 skill。→ 纯自动扫描不可信,「扫描通过」标签必须配人工复核层级 + 权限透明标签,这是差异化护城河。

**GPT Store 的前车之鉴。** 300 万 GPT 上线首日即噪音化,无变现框架导致创作者流失;后期按「粘性」付费也没救活。教训:先解决信任与质量,变现跟着高质量供给走,而不是反过来。

## 差异化机会(按优先级)

1. **可复现评测协议(赛道非裁判)**:SkillsBench 证明质量差异真实但只是学术 benchmark;没有一家店把「任务集 + 确定性校验器 + runner」开放成可复现协议、让货架分数带元数据可复现可挑战。平台不做单方裁判,公信力锚在可复现性——与安全审计「已扫描≠保证安全」措辞同构,全市场独一份。
2. **权限营养标签**:App Store 隐私标签的移植。现有市场只有「通过/不通过」二值,没人展示「含 2 个 Python 脚本、仅工作目录读写、不联网」这种结构化披露。
3. **效果对比替代截图**:同一 prompt 装/不装的输出对比,直击「skill 到底有什么用」的认知成本。没有竞品这么做。
4. **Token 成本标注**:GPT Store 教训里 token 成本吃掉收益是头号坑,mockup 里「~3K token/次」是被验证的痛点,零竞品覆盖。
5. **冷启动用审计摘要占位评论**:解决新市场无评价的鸡生蛋问题(评测成熟后并入可复现跑分摘要)。

## 风险

发行入口被平台截流:Anthropic/Vercel/阿里/腾讯任何一家把评测+安全做进官方渠道,第三方店空间被压缩(参考 App Store 从未让位给第三方);中文市场尤甚——ModelScope 和腾讯 SkillHub 都自带流量与云入口。对策:先做多 agent 中立聚合(官方各自只管自家),评测数据本身沉淀为资产。恶意 skill 漏网一次即重创信任(ClawHub 已示范),安全承诺措辞要留余地(「已扫描」而非「保证安全」)。

## 来源

- [Anthropic: Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [The New Stack: Agent Skills — Anthropic's Next Bid to Define AI Standards](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/)
- [Vercel: Introducing skills, the open agent skills ecosystem](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem)
- [skills.sh: npm for Agent Skills (DEV Community)](https://dev.to/stevengonsalvez/skillssh-npm-for-agent-skills-35jc)
- [SkillsBench: Benchmarking How Well Agent Skills Work (arXiv 2602.12670)](https://arxiv.org/abs/2602.12670)
- [Snyk: ToxicSkills — Malicious AI Agent Skills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [Snyk: Why Your "Skill Scanner" Is Just False Security](https://snyk.io/blog/skill-scanner-false-security/)
- [Unit 42: OpenClaw's Skill Marketplace and the Emerging AI Supply Chain Threat](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/)
- [Agensi: Every AI Agent Skill Directory in 2026(注意:自我宣传立场)](https://www.agensi.io/learn/complete-list-ai-agent-skill-directories-2026)
- [TrueFoundry: Best MCP Registries in 2026](https://www.truefoundry.com/blog/best-mcp-registries)
- [Agentman: The Agent Skills Ecosystem in 2026](https://agentman.ai/blog/agent-skills-ecosystem-report-2026)
- [ModelScope Skills 技能中心](https://modelscope.cn/skills)
- [ModelScope: Agent Skills 技术协议与开源实现(MS-Agent)](https://modelscope.csdn.net/69156ec982fbe0098cab2b8f.html)
- [Skill 使用指南:ModelScope Skills 中心搜索/安装流程(第三方)](https://zhanghuiwan.com/2026/03/11/skill%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97%E4%BB%8E%E5%85%A5%E9%97%A8%E5%88%B0%E8%87%AA%E5%B7%B1%E7%BC%96%E5%86%99/)
- [腾讯云:龙虾技能社区 SkillHub 上线](https://news.qq.com/rain/a/20260311A07U3A00)
