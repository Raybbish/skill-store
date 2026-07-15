# ADR 0029 — 跨 Agent 可复现安装与 Adapter 边界

- 日期:2026-07-15
- 状态:已采纳(P0 待实施)
- 关联:ADR 0017(安装回执语义)、[`跨Agent可复现安装-落地方案.html`](../planning/跨Agent可复现安装-落地方案.html)、2026-07-15 外部只读审查

## 背景

官网中英文文案承诺安装器会自动探测 Claude、Codex、Cursor,但当前 CLI 的探测循环为空,最终固定写入 `~/.claude/skills`。在线安装还存在四个不可复现或不安全边界:

1. API 查询归一化时丢弃已有的 `upstream_commit`;
2. 安装时 `git clone --depth 1` 获取上游 HEAD,不是货架收录版本;
3. `content_hash` 缺失时被条件判断静默放行;
4. 以 Skill 名作为落盘目录并递归复制,没有 Agent、scope、来源身份和冲突事务语义。

Skill 已成为 Claude、Codex、Cursor、Qwen Code、Kimi Code、Comate、CodeBuddy、iFlow 等模型宿主共同使用的轻量工作流载体。本项目不与模型厂商竞争 Agent runtime,而应提供中立的发现、兼容性判断、可复现制品和跨宿主安装层。

## 决策

### 1. 安装目标必须显式或可解释

- CLI 正式支持 `--agent <id>` 与 `--scope user|project`;
- 默认 scope 冻结为“存在当前 Agent 的项目级目录时选 project,否则选 user”,不得仅因处于 Git 仓库就隐式修改项目;
- `--agent auto` 单命中可自动选择;TTY 多命中要求用户选择,非 TTY 多命中直接报错;`--yes` 不消除歧义;
- `--agent all` 仅安装到已探测目标,每个目标是独立事务;
- 删除固定 Claude fallback。网页支持表、命令生成器与 CLI 共用同一份 Adapter registry。

### 2. Adapter 是平台差异的唯一入口

P0 首批支持 Claude、Codex、Cursor、Qwen Code、Kimi Code、Comate;紧随批支持 CodeBuddy、iFlow。每个 Adapter 必须声明官方文档、最后核验时间、路径 resolver、平台 marker、格式约束与成熟度。

路径 resolver 至少支持 literal、环境变量 home、配置数组与最近 Git 根。Kimi 必须解析 `$KIMI_CODE_HOME`、回退目录和 `config.toml.extra_skill_dirs`;Comate 已能读取 `.claude/skills` 等兼容目录时不得重复复制。没有正式稳定契约的平台进入研究队列,不得猜路径。

P0 仅加载仓内 Adapter。安装、覆盖、回滚和账本写入属于共享事务层,不得在各 Adapter 中复制实现。

### 3. 安装必须由不可变内容锚定

- catalog 的 `content_hash` 在新代码中称为 `source_content_hash`;
- `content_hash` 缺失、为空或格式非法时,在下载与写盘前以退出码 4 拒绝安装;不提供 `--force` 降级;
- 采集端、CLI、制品构建和投影共用同一哈希规则或同一组 fixture;
- source/projection hash 忽略 `.git/`,并排除本店注入的保留文件 `LICENSE.upstream`;
- `artifact_sha256` 覆盖最终 `.skill` 的全部字节,包括包内 `LICENSE.upstream` 与 ZIP 元数据。

`hosting=mirrored && mirror_complete=true` 时,构建确定性 `.skill`,按 `artifact_sha256` 发布到 `/artifacts/sha256/<hex>.skill`,并用 artifact index 建立 `skill_id + source_content_hash → artifact_sha256 + URL + size` 映射。CLI 先校验 artifact hash,解包后再校验 source hash;不得用 source hash 猜制品 URL。

`hosting=indexed` 或镜像不完整时,CLI 只获取 catalog 指定的 `upstream_commit` 与 subpath。commit 不存在即失败,不得回退上游 HEAD,也不得由本店 CDN 二次分发无托管许可的内容。

当前 catalog 或支持中的发布版本引用的制品长期保留;无引用制品保留 180 天后由对象存储生命周期任务清理。法律下架、许可证撤回或恶意内容处置允许立即 tombstone 并删除。

### 4. 安装是有身份、有账本的文件事务

本机 `~/.oh-my-skill/state.json` 至少记录 `skill_id / agent_id / scope / project_root / destination / source_content_hash / projection_hash / adapter_version / installed_at`。账本用临时文件加 rename 原子更新,并加短时文件锁。

目标目录不存在才直接安装;已受管的同一 Skill 按 hash 判断幂等或更新;不同来源同名、不同 Skill 同目录、未经管理的既有目录均默认失败。P0 不自动重命名同名 Skill。替换使用 staging、backup、rename 和失败回滚,不得静默覆盖未知目录。

### 5. 多目标部分成功必须对调用方可见

`--agent all` 某些目标成功、某些失败时,保留已成功目标,继续其余目标,最终返回退出码 8。JSON 返回 `status: "partial"`、`succeeded[]`、`failed[]`,逐项包含 Agent、scope、目标、退出码与原因。全部成功返回 0;全部失败且错误码一致时返回该码,错误码不同返回 1。P0 不提供跨 Agent 全局原子事务。

### 6. P0 不做内容投影

P0 Adapter 只选择路径并做兼容性校验,不修改 Skill 内容。无法确认的能力返回 warning/unknown,明确不兼容则阻断。双哈希字段先进入契约与账本;真正需要改 frontmatter、wrapper 或目录结构的平台投影后置,另行验证其确定性与 UI 诚实口径。

### 7. 安装回执不升级为安全或使用证明

延续 ADR 0017:回执只证明通过某渠道获取或本机持有,不证明使用深度、兼容性或安全。`install_receipts` 可增加 `agent_id / scope / adapter_version / projection_hash`,旧 `content_hash` 字段继续承载 source hash,保持历史兼容。

## 后果 / 约束

- CLI 将发布包含纠错型 breaking change 的 `0.2.0`:无歧义目标才能安装,不再默认 Claude;
- mirrored 构建从“可选 zip”升级为发布闸:制品缺失、哈希策略不一致或非确定性构建必须使 CI 失败;
- 平台支持数量不再是首要指标;正式文档、fixture、路径/scope E2E 和可解释兼容性优先;
- CodeBuddy 使用正式生产文档域名;无法核实稳定契约的国内外 Agent 统一进入研究队列;
- 外部动态 Adapter、P0 内容投影、跨 Agent 全局事务、未有稳定契约的平台接入均不在本 ADR 的 P0 范围;
- 详细任务拆分、测试矩阵、灰度与验收清单以关联 HTML 方案为准,但不得违反本 ADR 不变量。
