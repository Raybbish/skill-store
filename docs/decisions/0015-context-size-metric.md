# ADR 0015 — 上下文体积取代 token / 次
- 日期:2026-07-06
- 状态:已采纳

## 背景
旧详情页展示「~X token / 次」,链路为采集时 `Math.round(md.length / 4)` → `token_cost.body_tokens` → 前端换算 K。这个口径有三处问题:英文 chars/4 经验值会系统性低估中文与混合代码;字段名 `body_tokens` 与实际含 frontmatter 的整篇 `SKILL.md` 不符;只统计 `SKILL.md`,没有表达 references/scripts/chapters 等按需资源带来的装载边界。

同时 skill-store 是货架/catalog,不控制宿主 agent、模型、对话历史、tool schema、附件与按需读取行为,因此不能承诺「真实每次调用消耗」。

## 决策
删除旧 `token_cost.body_tokens` 产品链路,不做 legacy fallback。新字段为 `context_size`,只表示静态、可复现的上下文体积。

固定三类 scope:

1. `activation_core`:最小装载,即 `SKILL.md` 全文。
2. `activation_with_declared_refs`:含声明引用,即 `SKILL.md` 加上其中明确提到的相对路径文本资源。
3. `package_total_text`:文本包总量,即 skill 目录内所有可读文本文件总量。

M0 先使用 `static-mixed-estimate-v1` 启发式计数器,字段里显式标 `method: heuristic`;引入官方 tokenizer 依赖后可新增/替换计数器,但不改变 scope 语义。前端只说「上下文体积 / 装载体积」,不得再说「token / 次」。

## 后果 / 约束
- 旧 catalog 未回填 `context_size` 时,前端显示「待重算」,不得回退到 `token_cost`。
- 不设计 runtime actual usage / observed usage / provider usage upload;这些不属于货架职责。
- provider/model 真实 token 差异只作为说明:实际消耗取决于宿主 agent、模型、对话历史和按需读取行为。

### 补充(2026-07-06 同日修订)
- **存量回填走外科式路径**:ingest 幂等闸对「内容与 commit 均未变、仅缺 `context_size`」的条目只补该字段后原样写回,category/tags/copy/eval 一律不动——避免启发式归类冲掉 categorize:llm 权威判定、或丢掉微文案 copy 块。首次全量回填需重克隆全部源仓,成本一次性。
- **存量库迁移**:`infra/migrations/2026-07-06-context-size.sql`(`token_cost int` → `context_size jsonb`);`schema.sql` 的 `create table if not exists` 不会改已有表,不执行迁移则 sync 报列不存在。
- **声明引用 = availability 驱动的字面匹配**:以包内实际存在的文本文件为候选集,在 `SKILL.md` 里做边界感知匹配(支持裸同级文件名、`./` 前缀、非 ASCII 路径;不会命中 URL/包外路径)。只认字面提及,不做语义解析。
- **计数排除规则**:单文本文件 >256KB 不计入任何 scope(连 `files` 清单也不进);symlink 解析到 clone 外的不读(git tree 把 symlink 当 blob,恶意仓库可借此让采集机读任意文件;仓内软链照常跟随)。
- **scope 不带 `label`**:UI 文案(「最小装载」等)由前端按 scope id 渲染,不固化进 catalog 数据。
- **schema 不把 `context_size` 设为 required**(TS 类型同为可选):存量条目缺失属合法状态,消费方必须写守卫。
