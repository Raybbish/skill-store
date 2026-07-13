# ADR 0025 — 详情页「怎么用」板块:双语转述 + 原文折叠

- 日期:2026-07-13
- 状态:已采纳
- 关联:ADR 0022(双语口径)、ADR 0013(微文案三来源)、ADR 0012(content_hash 锚)、设计稿 `Desktop/skill-store-怎么用板块-设计稿.html`

## 背景

详情页信息止步于一句 description + fit line,用户装完不知道怎么开口;详细内容只有英文原文,还藏在 GitHub 里——对中文用户不友好(用户 2026-07-13 提出)。

曾考虑「直接搬 repo README」,否决,三个理由:
1. **聚合仓错位**:大量条目来自多 skill 仓,repo README 讲整个合集,跟单个技能对不上。对口素材是技能目录里的 **SKILL.md 正文**(ingest 本就读它算 context_size/content_hash,只是没落盘);
2. **渲染残废**:README 的相对链接/图片/badge 脱离仓库上下文全部失效;
3. **license 红线**:全量约 21% 条目(无证 + 待复核)正文不可转载,搬运方案绕不开分流。

## 决策

按 ADR 0022 口径切两层:

**转述段 = 商店的话,跟语言走。** 新 job `howto:llm` 用 SKILL.md 正文生成三段事实性内容(中英同一次调用):`what` 它做什么 / `when` 什么时候触发 / `say` 装好后可以这样说(示例话术 2~3 条,点击复制)。存 `SkillReport.howto` 顶层块(与 copy 同级同哲学),锚 `meta.content_hash`,不新鲜/lint 未过前端不出转述段。来源三层复用 ADR 0013:机器兜底 → 认领作者改写(source=author,机器永不覆盖)→ 行为回填后置。署名口径:llm 标「商店整理 · 表述以原文为准」,author 标「作者撰写」。英文三件(what_en/when_en/say_en)不齐则整组丢弃——**半套英文比没有更糟**,英文态整段回退只出原文。

**原文 = 商品,原样呈现不翻译。** 详情页折叠展示 SKILL.md(去 frontmatter,最小安全渲染:先整体转义再注入受控标签,仅放行绝对 http(s) 链接;表格/图片/相对链接按纯文本诚实降级),标「作者撰写 · <license> · <commit7>」,尾注「按 <license> 许可原样转载,未经改动 + GitHub 出口」。

**转载资格 = 磁盘事实。** 正文按优先级取 `mirror/SKILL.md`(托管副本)→ `skill.md` 快照;快照**只为宽松证(PERMISSIVE_LICENSES)且未镜像**的条目落盘(条目根,与 skill-report.json 同级,**不入 mirror/**,不参与内容哈希与 .skill 打包)。证不宽松 → 磁盘无正文 → 板块只给「在 GitHub 查看」出口,零转载。与 hosting「字段=磁盘事实」同口径。

**正文供给三条线:**
- ingest 顺手落盘(`alignSkillMdSnapshot`:宽松证未镜像 → 写/刷新;镜像已落或证收紧 → 清残留快照;`SkillCandidate.skillMdSrcPath` 由 discoverFromRepo 统一带出,五条采集线全覆盖);
- 存量回填 `backfill:skillmd`(长尾条目不被例行重克隆,从上游 raw 拉;**只收 pinned**——ref=upstream_commit 与 content_hash 同代,commit 被剪不退分支兜底,快照绝不比货架数据新);
- `howto:llm` 生成时磁盘缺正文则临时拉取(同 pinned only),**用完即弃不落盘**(证不宽松的正文不进公开 catalog)。

**分层推进:** S0 原文直出(零 LLM,ingest+backfill 即生效)→ S1 热门双语(`--scope hot` = 场景包成员 ∪ 人气 top 1000,人气 = installs 主键 + stars/√repo_skill_count 次键)→ S2 全量 + 认领改写。

## 后果 / 约束

- **转载红线**:任何路径都不得把非宽松证的 SKILL.md 正文写进 catalog(公开仓 = 再分发)。快照资格判据只认 `PERMISSIVE_LICENSES`(schemas 单一来源,与镜像同一套)。
- 界面文案全事实性(文案克制):转述段不写形容词,整理注明示「表述以原文为准」;货架零内部词汇(不出现 howto/转述层/S0 等)。
- howto 与 verdict/copy 同锚 content_hash:内容变更 → 同一触发点重算;`materiallyEqual` 闸免时间戳 churn。
- 运行环境:`backfill:skillmd` / `howto:llm` 需在本机跑(沙箱 DNS 不放行 raw.githubusercontent.com;LLM key 同 categorize:llm 用户本机约定)。
- sync/Supabase 不动:详情页 SSG 直读 catalog,howto 不进瘦卡与 Typesense(搜索召回后续按需再议)。
- 待办:S1 首批 `backfill:skillmd --scope hot` + `howto:llm --scope hot`(本机);howto 金标(canary)在首批人工抽读后再立,不阻塞落地;/studio 认领改写 howto 的编辑面归 S2。
