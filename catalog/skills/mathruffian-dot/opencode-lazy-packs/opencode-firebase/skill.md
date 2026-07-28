---
name: opencode-firebase
description: 連接 Firebase，讓 OpenCode 管理 Firestore / Hosting / Auth。說「連接 Firebase」「設定 Firebase」時載入。
---

# OpenCode 加碼包：連接 Firebase（extras，非研習主線）

> ## 📌 先讀這一段：主線已改走 Supabase
>
> **「即時資料庫」在研習主線上改用 Supabase，對應 `skills/06-supabase`。**
> 需要「多人同時寫入」的作品（文字雲、線上對戰、即時排行榜），**請走那一包**。
>
> 改用 Supabase 的四個理由：
>
> 1. **設定比較簡單** — 建專案、建表、開權限都在同一個網頁裡完成
> 2. **Dashboard 長得像 Excel** — 老師打開就看得懂，不用另外做管理後台
> 3. **官方托管的 MCP，用瀏覽器登入就好** — 走 OAuth，不用申請、保管、貼上 Personal Access Token
> 4. **官方文件直接列出支援 OpenCode** — 設定範例可以照抄，不用自己猜格式
>
> **Firebase 保留為替代方案**，沒有被淘汰：已經在用 Firebase 的老師不必搬家，
> 想比較兩者的人也可以照這一包做。只是它**不在研習流程裡**，內容仍是 v1 版、未經 v2 重新查證。
>
> 👉 研習主線請看：[`skills/06-supabase/SKILL.md`](../../skills/06-supabase/SKILL.md)

---

## 這個懶人包會幫你做什麼？

讓 OpenCode 可以管理 Firebase：
- 安裝 Firebase CLI
- 登入 Google 帳號
- 建立或選擇 Firebase 專案
- 寫入 opencode.json MCP 設定
- 驗證 CRUD

---

## 先備條件

- [ ] Node.js 18+ 已安裝
- [ ] 已有 Google 帳號

---

## 請 OpenCode 幫我執行以下步驟

### 步驟一：安裝 Firebase CLI

```bash
npm install -g firebase-tools
```

確認版本：
```bash
firebase --version
```

---

### 步驟二：登入 Firebase

```bash
firebase login
```

瀏覽器會開啟 Google 登入頁面。

登入後檢查可用專案：
```bash
firebase projects:list
```

---

### 步驟三：初始化 Firebase 專案

在專案目錄執行：
```bash
firebase init
```

選擇需要的服務（Firestore、Hosting 等）。

---

### 步驟四：寫入 OpenCode MCP 設定

編輯 `~/.config/opencode/opencode.json`，加入：

```json
{
  "mcp": {
    "firebase": {
      "type": "local",
      "command": ["npx", "-y", "firebase-tools@latest", "mcp"],
      "enabled": true
    }
  }
}
```

---

### 步驟五：驗證連線

重新開啟 OpenCode，然後問它：

```
請列出我的 Firebase 專案。
```

---

## 完成回報格式

```md
## Firebase 連接完成

- firebase-tools 版本：xxx
- 登入狀態：成功 / 失敗
- 可用專案：xxx 個
- MCP 設定：已寫入 opencode.json
- 工具測試：成功 / 失敗
```

---

## 常見問題

| 問題 | 解法 |
|------|------|
| `firebase login` 瀏覽器不開 | 手動執行，或檢查防火牆 |
| opencode.json 路徑錯誤 | 確認 `~/.config/opencode/opencode.json` 存在 |

