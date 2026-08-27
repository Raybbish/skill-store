# oh-my-skill

> 以可复现评测和可核验来源为核心的 Agent Skills 目录。

[中文站点](https://oh-my-skill.com) · [English](https://oh-my-skill.com/en/) · [提交 Issue](https://github.com/Raybbish/skill-store/issues)

oh-my-skill 帮助开发者发现、比较和安装 Agent Skills。我们不把“收录”包装成安全背书，而是尽可能公开来源、许可证、内容哈希、社区信号和评测条件，让使用者能够自行判断。

> [!IMPORTANT]
> 安全扫描与审计展示已于 2026-07-04 下架。L1/L2/L3 与人工复核链路均已暂停，详见 [ADR 0011](docs/decisions/0011-unlist-security-scan.md)。项目不会宣称任何 Skill “保证安全”。

## 项目能力

- **可追溯目录**：记录 Skill 的上游来源、许可证与采集状态。
- **托管 / 索引双轨**：许可证允许时保留镜像，否则仅保存元数据并链接到上游。
- **内容完整性**：通过 `content_hash` 固定目录内容，CLI 安装时逐文件复算校验。
- **中英双语商店**：界面文案随语言切换，Skill 名称、描述和 README 保持原文。
- **可复现评测**：任务、输入、runner、模型和校验器共同定义评测结果；无法执行的任务记为 N/A，而不是 0 分。
- **社区策展信号**：awesome-list 等社区清单只作为收录信号，Skill 内容仍从原始仓库采集。

## 快速开始

### 环境要求

- Node.js 20+
- npm 10+
- Git

### 本地运行

```bash
git clone https://github.com/Raybbish/skill-store.git
cd skill-store
npm install

# 启动商店，默认访问 http://localhost:3001
npm run web
```

构建静态站点：

```bash
npm run web:build
# 输出目录：packages/web/out
```

### 运行采集管线

```bash
npm run ingest                                  # 采集全部配置源
npm run ingest -- --source anthropics/skills  # 仅采集一个源
npm run ingest -- --limit 10                  # 限量试跑
```

采集结果写入：

```text
catalog/skills/<owner>/<repo>/<name>/skill-report.json
```

状态为 `mirrored` 的条目还会包含完整的 `mirror/` 副本。采集默认使用 Git shallow clone；GitHub API 仅用于补充 stars 等 signals。

### 运行其他任务

```bash
npm run typecheck
npm run status
npm run sync
npm run eval -- --category doc-generation --runner openai
npm run categorize:llm -- --scope missing-copy
```

部分任务需要外部服务或密钥。请按实际环境配置 `.env`，不要提交密钥。

## CLI

在仓库中直接运行 CLI：

```bash
node packages/cli/bin/oh-my-skill.mjs add <owner/repo/name>
```

安装时 CLI 会逐文件复算 Git blob SHA，并核对目录级 `content_hash`；内容不一致时拒绝安装。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| `packages/schemas` | `skill-report` JSON Schema、TypeScript 类型、词表和微文案 lint |
| `packages/pipeline` | 数据源适配、采集、校验、去重、同步和评测管线 |
| `packages/web` | Next.js 静态商店，构建时读取 `catalog/` |
| `packages/cli` | Skill 安装与内容哈希校验 CLI |
| `packages/verdicts` | 可插拔信任判定服务的实验方向 |
| `catalog/skills` | 每个 Skill 的事实记录及可选镜像 |
| `catalog/lists` | 聚合仓和 awesome-list 的出现记录 |
| `catalog/packs` | 官方策展的场景包 |
| `docs/decisions` | 架构决策记录（ADR） |
| `.github/workflows` | 自动采集、同步和构建工作流 |

## 核心原则

### 托管与索引分离

许可证允许再镜像。MIT、Apache 等宽松许可证可进入 `mirrored`；其他条目进入 `indexed`，只保存元数据和上游链接。

### 内容哈希

`content_hash` 基于目录中排序后的 `(path, git blob sha)` 集合计算 SHA-256。它用于发现内容漂移，并为 CLI 安装提供完整性校验。

### 事实、信号与判定分层

- **事实**：来源、版本、许可证、文件内容和哈希。
- **信号**：stars、社区清单收录、安装量等可观察数据。
- **判定**：平台或外部服务基于事实与信号给出的结论。

三者不会混为一谈；被收录不代表安全，也不代表官方推荐。

## 当前状态

项目处于 M1：可复现评测协议持续建设中。

- [x] 可信目录、采集管线与许可证分流
- [x] 中英双语静态商店
- [x] CLI 内容哈希校验
- [x] 社区清单信号与场景包
- [x] 确定性评测框架及真实 runner
- [ ] 在商店中展示带 runner / 模型元数据的评测结果
- [ ] 扩展任务集、覆盖更多类别并开展跨模型验证

具体设计和历史裁决以 [`docs/decisions/`](docs/decisions/) 中的 ADR 为准。

## 参与贡献

欢迎通过 [Issues](https://github.com/Raybbish/skill-store/issues) 报告问题、讨论数据口径或提出功能建议，也欢迎提交 Pull Request。

提交前请注意：

1. 不要把“收录”“社区信号”或“静态检查”描述为安全保证。
2. 涉及数据模型、语言口径或信任规则的改动，请同步补充或更新 ADR。
3. 不要提交 API Key、访问令牌、用户数据或其他敏感信息。
4. 对新增命令或行为提供可复现的验证步骤。

## 许可证状态

本仓库代码已公开，但目前尚未添加 `LICENSE` 文件。在许可证明确前，代码默认保留所有权利；查看源码不等于获得复制、修改或再分发授权。

如果你计划采用或再分发本项目代码，请先通过 Issue 与维护者确认。
