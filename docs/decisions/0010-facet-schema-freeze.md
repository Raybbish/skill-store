# ADR 0010 — facet 字段名冻结:按 Typesense faceted schema 定形
- 日期:2026-07-04
- 状态:已采纳
- 承接:[0007 SkillStore 缝](0007-skillstore-seam-static-index.md)的接口冻结原则,延伸到数据字段

## 背景
标签分面方案(五分面 + 分类分域)落 `labels.ts` 前,先把 skill 文档上的字段名定成 P1 Typesense 直接可用的形状——P0 静态 JSON 与 P1 搜索索引同构,迁移只是换索引后端,前端零改动。

## 决策
skill 文档(瘦卡/索引层)新增字段,即日冻结:
- `facet_activity` / `facet_surface` / `facet_meta` — string(单值),facetable;值来自 `labels.ts` 词表。
- `facet_language` / `facet_tech` — **string[](≤2)**,facetable;双主力(fullstack、docker+k8s)是真实供给,单选会造成随机仲裁与召回损失,Typesense 数组 facet 原生支持。
- `cert_status` — enum,facetable;**来源是审核库而非词表**(信任轴与用途轴分离,见标签设计文档的边界声明;对应 UI 上唯一的「已认证」开关)。
- `appliesTo` / `definition` / 正反例等**留在词表层**(`labels.ts` 的 `LabelDef`),不进每条 skill 文档。

## 后果 / 约束
- P1 建 Typesense collection 时 schema 照抄,不再讨论字段名;
- 任何新筛选维度必须先回答「属于哪个轴」(用途→词表新面;信任→审核库字段;兼容→metadata),不许直接加顶层字段;
- `categorize:llm` 输出按此字段落盘;Language/Tech ≤2 已拍板(2026-07-04),prompt 须注明「只有真双主力才给第二个」防凑满。
