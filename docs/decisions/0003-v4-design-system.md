# ADR 0003 — v4「认证图标 + 去盒子编辑向」设计系统
- 日期:2026-07-03
- 状态:已采纳并落地 `packages/web`

## 背景
旧前端偏极简 Apple 风,被评「太多方块 / 偏土」。经 v1 证书 → v2 App Store×TapTap 卡片 → v3 去盒子 → v4 定稿四轮预览。

## 决策
- **字体**:Space Grotesk(display)+ Manrope(UI)+ IBM Plex Mono(数据 / CLI / 哈希),经 `next/font` 接入,`globals.css` 用 CSS 变量。
- **版式**:去盒子——发丝线行列表、**无 skill 图标(纯文字)**、大号灰序号榜、tinted 合集带;保留 `#3b6cf0` 为 signal。
- **信任只保留一个认证图标**:`status==="pass"` → 蓝盾 ✓;否则 → 琥珀盾。点击弹 `CertBadge` 弹窗(该 skill 实测权限五因子 + L3 / 人工复核 + 通用认证流程 + 「已扫描≠保证安全」免责)。**页面上的信任说教文案全部撤除,收进弹窗。**
- **组件**:`CertBadge` / `SkillRow` / `ThreadRow`。

## 约束
- 措辞禁「保证安全」。
- 完整 `next build` 需在开发者 Mac 上跑(sandbox 的 `node_modules` 是 macOS 原生二进制,esbuild/SWC 无法在 Linux 沙箱执行);类型用 `tsc --noEmit` 兜底。
- 设计定稿预览:桌面 `redesign-preview-v4.html`。
