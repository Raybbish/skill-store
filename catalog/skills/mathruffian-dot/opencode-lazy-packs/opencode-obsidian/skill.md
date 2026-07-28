---
name: opencode-obsidian
description: 連接 Obsidian，讓 OpenCode 讀寫第二大腦筆記。說「連接 Obsidian」「設定 Obsidian vault」時載入。
---

# OpenCode 懶人包 #04：建立第二大腦 Obsidian


---

## 這個懶人包會幫你做什麼？

讓 OpenCode 可以讀寫你的 Obsidian 筆記本：
- 找到 Obsidian vault 位置
- 安裝 MCPVault（@bitbonsai/mcpvault）
- 寫入 opencode.json MCP 設定
- 驗證讀寫

---

## 先備條件

- [ ] Node.js 已安裝（版本不拘，由 00-env-setup 負責）
- [ ] 已有 Obsidian vault

---

## 請 OpenCode 幫我執行以下步驟

### 步驟一：找到使用者的 Obsidian vault

先問使用者筆記本位置。常見位置：

| 同步方式 | 常見路徑 |
|----------|----------|
| OneDrive | `C:\Users\<你>\OneDrive\文件\<vault名稱>` |
| Google Drive | 你的雲端硬碟同步資料夾底下的 `<vault名稱>`（磁碟機代號與資料夾名稱依你的設定而定） |
| Documents | `C:\Users\<你>\Documents\<vault名稱>` |

如果不知道，可搜尋：
```bash
# Windows（PowerShell）
Get-ChildItem -Path "$env:USERPROFILE\OneDrive" -Recurse -Directory -Force |
  Where-Object { Test-Path (Join-Path $_.FullName ".obsidian") }
```

確認條件：
- 資料夾存在
- 裡面有 `.obsidian` 子資料夾
- 使用者確認這是主要筆記本

---

### 步驟二：安裝 mcpvault

```bash
npm install -g @bitbonsai/mcpvault
```

確認安裝位置：
```bash
# Windows
where.exe mcpvault

# macOS / Linux
which mcpvault
```

---

### 步驟三：寫入 OpenCode MCP 設定

編輯 `~/.config/opencode/opencode.json`，加入：

```json
{
  "mcp": {
    "obsidian": {
      "type": "local",
      "command": ["npx", "@bitbonsai/mcpvault", "<VAULT_PATH>"],
      "enabled": true
    }
  }
}
```

Windows 範例：
```json
{
  "mcp": {
    "obsidian": {
      "type": "local",
      "command": ["npx", "@bitbonsai/mcpvault", "C:\\Users\\<你的使用者名稱>\\Documents\\<你的vault資料夾>"],
      "enabled": true
    }
  }
}
```

---

### 步驟四：驗證連線

重新開啟 OpenCode，然後問它：

```
請列出我的 Obsidian vault 根目錄的資料夾。
```

再測試寫入：

```
請在我的 Obsidian 建立一則測試筆記，內容寫「OpenCode 已成功連接 Obsidian」。
```

---

## 完成回報格式

```md
## Obsidian 連接完成

- Vault 路徑：<VAULT_PATH>
- mcpvault：已安裝 / 未安裝
- MCP 設定：已寫入 opencode.json
- 讀取測試：成功 / 失敗
- 寫入測試：成功 / 失敗
```

---

## 進階：CLI-Anything Obsidian CLI

若需要全文檢索、metadata 操作、tag 管理、筆記分析等進階功能，可安裝 CLI-Anything 的 Obsidian CLI：

### 前置需求
1. 在 Obsidian 內安裝 [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) 社群插件
2. 插件設定中啟用 HTTPS（非必要）並記下 API key

### 安裝
```bash
pip install cli-anything-hub
cli-hub install obsidian
```

### 使用範例
```bash
cli-anything-obsidian search "SKILL.md"
cli-anything-obsidian tag list
cli-anything-obsidian note get "專案工作流程.md"
```

> 💡 mcpvault（本懶人包預設方案）適合基本讀寫；Obsidian CLI 適合需要查詢、分析、批量操作的情境。兩者可並存。

---

## 常見問題

| 問題 | 解法 |
|------|------|
| `npm install -g` 出現 EPERM | Windows 以系統管理員身分執行 |
| 找不到 vault | 搜尋 `.obsidian` 資料夾位置 |
| opencode.json 格式錯誤 | JSON 最後一項不能有逗號，路徑雙引號 |


## 附：第二大腦資料夾結構設定

> 這一節原本是 v1 的獨立懶人包 #04，v2 併進本包——因為它的先備條件就是上半部，兩者拆開反而讓人不知道該先做哪一個。
> **先完成上半部（MCP 連線可讀寫）再做這一節。**

建立 Obsidian 第二大腦的三層結構、AGENTS.md 分工、模板與每週知識重整流程。

---

## 整體架構

```
Obsidian vault/
├── 每日筆記/           # 第一層：原始輸入
│   ├── 2026-05-19.md
│   └── ...
├── 創作庫/             # 第二層：加工輸出
│   ├── Claude基本功EP10 - 老師建專案指南.md
│   └── ...
└── 知識庫/             # 第三層：知識沉澱
    ├── 專案模板/
    └── ...
```

### 三層分工

| 層級 | 資料夾 | 內容 | 更新頻率 |
|------|--------|------|---------|
| 第一層 | `每日筆記/` | 原始想法、會議紀錄、臨時筆記 | 每天 |
| 第二層 | `創作庫/` | 整理後的產出（影片筆記、懶人包） | 每週 |
| 第三層 | `知識庫/` | 可重複使用的知識（模板、SOP） | 每月 |

---

## 請 OpenCode 幫我執行以下步驟

### 步驟一：檢查 vault 是否有三層結構

```
請檢查我的 Obsidian vault 是否有以下資料夾：
- 每日筆記/
- 創作庫/
- 知識庫/

列出每個資料夾中的檔案數量。
```

### 步驟二：若缺少，幫我建立

如果缺少任一個資料夾，OpenCode 幫我建立並建立一個說明筆記。

### 步驟三：在 AGENTS.md 記錄 Obsidian 路徑

確認專案 AGENTS.md 中有記錄：
```
## Obsidian 關聯資料
- Obsidian vault：<VAULT_PATH>
- 每日筆記：`每日筆記/<日期>.md`
- 創作庫：`創作庫/`
- 知識庫：`知識庫/`
```

---

## 完成回報格式

```md
## 第二大腦設定完成

- 每日筆記/：✅ 已存在 / 🆕 已建立（N 筆）
- 創作庫/：✅ 已存在 / 🆕 已建立（N 筆）
- 知識庫/：✅ 已存在 / 🆕 已建立（N 筆）
- AGENTS.md 已記錄 Obsidian 路徑：✅ / ⚠️
```

---

## 每週知識重整流程

每週做一次，保持第二大腦乾淨：

1. 整理每日筆記：把有用的資訊搬到創作庫或知識庫
2. 更新專案進度：檢查各專案的 Obsidian 駕駛艙
3. 清理無用筆記：刪除或封存過期內容

---

## 相關懶人包

- `08-workflow-skills` — 開工／收工／專案初始化三技能（會用到本包建立的第二大腦）
- `03-notebooklm` — NotebookLM，另一條把素材變成教材的路線

