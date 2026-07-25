# 0035. 多 agent 目录副本折叠(同一 skill 铺在 .claude/.cursor/… 只留一份)

- 状态:已采纳(2026-07-25)
- 关联:ADR 0027(长尾发现 P2 同仓消歧)、ADR 0020(退市)、ADR 0029(跨 agent 可复现安装)

## 背景
作者常把同一个 skill 复制进多个 agent 约定目录(`.claude/skills/`、`.cursor/skills/`、`.gemini/skills/`、`.github/skills/`、`.kiro/`、`.opencode/`、`.pi/`、`.qoder/`、`.rovodev/`、`.trae(-cn)/`、`.agents/`,以及仓根 `skills/`、`plugins/<x>/skills/`,含 monorepo 子目录内),让技能在各家 agent 都能装。采集按 SKILL.md 扫仓,把每份当独立 skill:同仓同名、仅所在目录不同。原消歧(ADR 0027 P2)只折叠「描述完全相同」的镜像,而各家副本 SKILL.md 略有出入(content_hash 不同)→ 逃过折叠、各补 `__<路径>` 后缀留下。

后果:热门榜/浏览里同名同星卡片扎堆(pbakaus/impeccable ×12、othmanadi/planning-with-files ×11、tencentcloudbase +10 等)。全库统计(07-25):95 条冗余、63 个技能、27 个仓(占 0.7%)——量不大,但全挤在高星仓、顶在榜首。

## 决策
在 `disambiguateIds` 的描述折叠之前加一步「跨 agent 目录折叠」:
- `foldKey(relDir)`:剥掉 agent 约定 dot-dir(`.claude`/`.cursor`/…)与 `plugins/<x>` 包装、再小写,得到「去 agent 归一化身份」;路径须含 `skills` 段,否则返回 null(非标准放置不折)。monorepo 子目录内的容器(`miniprogram/x/.claude/skills/foo`)一并覆盖。
- 同名组里,foldKey 相同的副本判为同一 skill(铺在不同 agent 家),只留优先级最高的一份、其余不 emit。
- `homePriority`(小=优先):中立源(无 agent/无 plugins)0 > `.claude` 1 > `plugins` 2 > 其它 agent dot-dir 3;同级按目录字典序。canonical 保留裸 name id。
- foldKey 不同或为 null(跨项目同名 `web/.../foo` vs `miniprogram/.../foo`、变体名 `agent-browser` vs `agent-browser-2`)维持原 `__后缀` 逻辑——那是真不同的技能。

## 后果
- 榜/浏览/搜索/总数不再有多 agent 重复。实测:跨-agent 折叠丢 41 条(impeccable 12→1、caveman/-compress、tencentcloudbase 各多 agent 簇等);其余同名簇为跨项目/变体,保守保留。
- canonical 现按优先级(而非纯字典序最小)选,个别 skill 裸 name id 背后的 upstream 会从 `.agents/` 改到 `.claude/`(id 不变、内容源变,往往顺带修好 stars 为 null 的问题)。被丢弃的 `__` 副本 id 走退市(ADR 0020)自动清。
- 权衡:极小概率误折——同仓两个「真不同但同名」的 skill 恰好 foldKey 相同会被合成一条。实测数据无此情形;宁可少一条也不要榜上一串重复。
- 跨仓同名(不同作者各有一个 "caveman")不受影响——本就是不同技能;榜上若仍显同名,属展示层(可加发布者区分),与本 ADR 无关。

## 落地
- 采集:`packages/pipeline/src/sources/official.ts`(`foldKey`/`homePriority` + `disambiguateIds` 折叠步)。
- 清存量:重跑受影响仓(或全量 ingest),丢弃 id 缺席 → 退市 3 天清 catalog/Supabase/Typesense。
- (后续可选)把 canonical 支持的 agent 列表记进 meta,详情页做「支持 N 家 agent」卖点。
