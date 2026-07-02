# Skill Store

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

产出在 `catalog/skills/<owner>/<name>/skill-report.json`;`mirrored` 条目附完整 `mirror/` 副本。

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
- [ ] W3 审计 L3(LLM 意图审查)+ Supabase 同步 + skills.sh adapter
- [ ] W4 商店前端(Next.js SSG)
- [ ] W5 npx CLI(哈希校验 + 安装前权限确认)
