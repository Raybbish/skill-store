# oh-my-skill

以**标准化评测、安全透明、效果可见**为核心的 Agent Skills 商店。发现是红海,我们卖信任。

当前阶段:**M0 可信目录**(详见 `M0 详细设计`)。

## 结构

```
packages/schemas    skill-report JSON Schema v1 + TS 类型(四端单一来源)
packages/pipeline   采集管线:sources.yaml → adapter → 校验/licence 分流/哈希去重 → catalog/
catalog/skills/     事实源:每 skill 一个目录(skill-report.json + mirror/)
.github/workflows   ingest.yml:每日采集,变更走 PR
```

## 快速开始

```bash
npm install
npm run ingest                         # 跑全部源
npm run ingest -- --source anthropics/skills   # 只跑一个源
npm run ingest -- --limit 10           # 限量试跑
```

产出在 `catalog/skills/<owner>/<repo>/<name>/skill-report.json`;`mirrored` 条目附完整 `mirror/` 副本。

> 采集走 **git shallow clone**(无 API 限流、可完整镜像);GitHub API 仅用于 signals
> 补充(stars 等,见 `github.ts`),在 API 可达环境(如 GitHub Actions)运行。

## 设计要点(M0)

- **托管/索引双轨**:宽松 licence(MIT/Apache 等)→ `mirrored` 镜像;其余 → `indexed` 只存元数据 + 跳转上游
- **content_hash**:对目录内 (path, git blob sha) 排序集合取 sha256,CLI 安装时校验,防上游篡改
- **security_audit.status = pending**:采集只做静态清点(脚本盘点),L1-L3 审计由独立 audit job 填充(W2-W3)
- 措辞红线:全站只说「已扫描/已评测」,不说「保证安全」

## 路线

- [x] W1 骨架 + official adapter(clone 模式,首批 27 条:12 mirrored / 15 indexed)
- [x] W2 审计 L1(critical 签名)+ L2(五因子静态分析)— 首轮 27 条:19 pass / 8 needs_review;`npm run audit`
- [x] W3a 审计 L3(LLM 意图审查):`npm run audit:l3`,OpenAI 兼容任意供应商
      (`LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL`;`LLM_MOCK=1` 测管路;fail-closed,只升不降,不覆盖人工签名)
- [x] W3b Supabase 同步:`npm run sync`(增量,游标存 sync_state;infra/schema.sql 建表;sync.yml 自动触发)
- [x] W3c 供给扩量:GitHub 全域采集器 `npm run ingest -- --github-search 100`(按 skill topic 搜头部仓,注入 stars);skills.sh 私有 registry 备选(endpoint 待确认)
- [x] W4 商店前端:Next.js 纯静态导出,构建时直读 catalog;`npm run web` 本地预览,`npm run web:build` 出静态站
- [x] W5 CLI:`node packages/cli/bin/oh-my-skill.mjs add <owner/repo/name>` — 安装前营养标签确认,逐文件复算 blob sha 校验 content_hash,篡改即拒装

## M1 评测(进行中)

- [x] 评测框架:任务集(`task.yaml`+`prompt.md`+`inputs/`+`verify.ts`)、确定性校验器、装/不装双跑打分、`skill-report.eval` 回写
- [x] 文档生成品类:md→带TOC的docx、csv→带SUM公式的xlsx(零依赖 OOXML 解析校验)
- [x] `npm run eval -- --category doc-generation`(mock runner 跑通,横评有梯度 6.8–10)
- [ ] 真实 agent runner(接 agent runtime 执行任务,替换 `eval/runner/mock.ts`)
- [ ] 扩展到 20 个标准任务 / 覆盖更多品类

## Hub 精选信号线(架构图落地)

- [x] `npm run ingest -- --hub-signals 300` — 解析社区 awesome-list(VoltAgent/awesome-agent-skills 等,`HUB_LISTS` 可配)
- 情报不当货:只读「哪些 skill 被收录 + 归为什么类」,内容一律回上游 GitHub 采集
- 注入 `signals.curated_by`(收录来源+分类)并补 `meta.category`;详情页显示「★ 社区精选收录」
- 需本机/CI 跑(拉 raw.githubusercontent + clone 上游);解析逻辑已沙箱验证
