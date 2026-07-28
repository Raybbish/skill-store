---
name: opencode-workflow-skills
description: 安裝開工／收工／初始化三大工作流程技能（完整版）。當使用者說「裝工作流程技能」「安裝開工收工技能」「裝三大技能」「startup shutdown project-init」「讓 OpenCode 會開工收工」時載入。本技能會在 ~/.config/opencode/skills/ 建立 startup、shutdown、project-init 三個全域技能，並設定 opencode.json 權限。
---

# 開工／收工／初始化 三大技能（OpenCode 完整版）

> 更新日期：2026-07-27

裝完這一包，你只要對 OpenCode 說三句話，專案就能在**任何電腦、任何 AI Agent** 之間無縫接續：

| 口令 | 技能 | 它會做什麼 |
|------|------|-----------|
| 「**初始化專案**」 | `project-init` | 幫這個資料夾建立專案藍圖 `AGENTS.md` ＋ 交接檔 `handoff.md`；有 GitHub 就順便建私有 repo，有 Obsidian 就建詳細筆記 |
| 「**開工**」 | `startup` | 讀藍圖＋交接檔，回報「上次做到哪、上次在哪台電腦收工、git 狀態、建議下一步」 |
| 「**收工**」 | `shutdown` | 更新藍圖進度、改寫交接檔、git commit + push、詳細紀錄寫進 Obsidian |

**設計核心一句話：開工是「讀」，收工是「寫」。** 兩個流程永不重疊、不衝突。

---

## 三個層級：你裝到哪，技能就做到哪

這三個技能會**自動偵測**你的工具，不用選版本、不用改設定：

| 層級 | 需要先裝什麼 | 你會得到 |
|------|------------|---------|
| **L1 本地** | 什麼都不用（建議專案放在你的雲端硬碟資料夾） | `AGENTS.md`＋`handoff.md`，換電腦靠雲端硬碟自動同步 |
| **L2 ＋GitHub** | 懶人包 **07-github**（`gh auth login` 已登入） | 版本控制＋雲端備份 |
| **L3 ＋Obsidian** | 懶人包 **04-obsidian**（Obsidian MCP 可用） | 專案詳細筆記（第二大腦） |

三層資訊的**讀取頻率不同**，這是整套設計的靈魂：

- `AGENTS.md`＋`handoff.md`：**每個 session 都讀**（只放交接必需的精簡資訊）
- GitHub：**指定才讀**（備份與歷史）
- Obsidian：**有需要才讀**（完整脈絡與細節）

---

## 先備條件

- [ ] OpenCode 已安裝（懶人包 **00-env-setup**）
- [ ] （想要 L2 才需要）懶人包 **07-github** 已完成，`gh auth status` 通過
- [ ] （想要 L3 才需要）懶人包 **04-obsidian** 已完成
- [ ] 只做 L1 的話，以上兩項都可以先跳過，之後再補

---

## 請 OpenCode 幫我執行以下步驟

### 步驟一：建立三個技能資料夾

Windows（PowerShell）：

```powershell
New-Item -ItemType Directory -Force "$HOME\.config\opencode\skills\startup"
New-Item -ItemType Directory -Force "$HOME\.config\opencode\skills\shutdown"
New-Item -ItemType Directory -Force "$HOME\.config\opencode\skills\project-init"
```

Mac／Linux：

```bash
mkdir -p ~/.config/opencode/skills/startup
mkdir -p ~/.config/opencode/skills/shutdown
mkdir -p ~/.config/opencode/skills/project-init
```

> ⚠️ 檔名一定要是**全大寫的 `SKILL.md`**，資料夾名要跟技能的 `name` 一模一樣，OpenCode 才掃得到。

---

### 步驟二：建立 startup（開工）技能

把下面整段內容原封不動寫入 `~/.config/opencode/skills/startup/SKILL.md`
（**不要**把最外層的 ```` ```` ```` 圍籬符號寫進檔案，檔案第一行必須是 `---`）：

````md
---
name: startup
description: 開工接續助手（三層級自動偵測）。當使用者說「開工」、「開始工作」、「我來了」、「上次做到哪」、「我們繼續」、「接下來呢」、「接續工作」、「來吧」等任何要接續上次工作的請求時，請一定要使用此技能。本技能會讀取 AGENTS.md 專案藍圖與 handoff.md 交接檔、檢查 git 狀態（含遠端 fetch）、辨識上次是否在另一台電腦收工、建議下一步該做什麼。
---

# 開工接續助手（三層級）

新對話開始時，幫使用者快速進入「上次做到哪」的脈絡，避免從零開始解釋。

## 核心原則

1. **開工是「讀」、收工是「寫」**——本技能只讀、只報告，不改任何檔案
2. **不主動 `git pull`**（避免覆蓋本地未 commit 變動，只提醒「要不要 pull」）
3. **30 分鐘內 fetch 過就跳過**（避免單台多對話冗餘）
4. **Obsidian 有需要才讀**——L3 筆記是詳細背景資料，開工預設不讀、只列出路徑
5. 跟收工（shutdown）技能是**對偶關係**：收工存進去、開工讀出來

## 層級偵測（開工看「這個專案」建到哪層）

- **L1**：專案有 `AGENTS.md`／`handoff.md` → 讀
- **L2**：專案有 `.git` → 做 git 檢查
- **L3**：`AGENTS.md` 同步層級表登記了 Obsidian 路徑，且**目前有可用的 Obsidian MCP 工具**（例如能列出 vault 目錄、讀寫筆記的工具）→ 列出筆記路徑（不主動讀）

> 判斷 L3 時請看「你手上實際有哪些工具」，不要假設特定的工具名稱——不同的 Obsidian MCP 名稱不一樣。
> 注意：偵測依據是「專案有什麼」，不是「電腦有什麼」。低層級電腦打開高層級專案時做得到的照做、做不到的註明（優雅降級）。

## 開工 SOP（依序執行）

### L1：讀藍圖與交接檔（永遠執行）

1. **讀 `AGENTS.md`**：專案目標、路線圖進度、工作約定（摘要，不全文倒出）
2. **讀 `handoff.md`**：上次做到哪、目前狀態、下一步、注意事項
3. **檢查「最後更新」欄**：
   - 取得這台電腦的名稱——Windows（PowerShell）用 `$env:COMPUTERNAME`；Mac／Linux 用 `hostname`
   - 若**更新者的電腦名 ≠ 這台電腦** → 特別標示「⚠️ 上次在另一台電腦（名稱）收工」，並確認雲端硬碟同步已完成（看 `handoff.md` 的檔案時間戳是否與交接檔內寫的時間吻合；若本地檔案明顯過舊，提醒等雲端同步完再開工）
   - 若 `handoff.md` 的更新時間比 `AGENTS.md` 舊很多 → 提醒「上次可能沒有正式收工」

**Fallback（舊專案相容）**：若專案沒有 `AGENTS.md`／`handoff.md`：
- 有 Obsidian MCP → 改讀 `<你的 vault>/<專案資料夾名>/專案工作流程.md` 或 `工作筆記.md` 的「上次做到哪」段
- 讀完提議：「這個專案還沒有 AGENTS.md＋handoff.md，要不要用『初始化專案』補建？」（提議即可，不主動建）

### L2：git 檢查（專案有 `.git` 才做）

4. **本地狀態**：`git status --short`
   - clean → 「本地工作區乾淨」
   - 有未 commit 變動 → 列出，提醒「上次有未完成的修改，要繼續還是放棄？」
5. **遠端狀態（30 分鐘規則）**：
   1. 先看 `.git/FETCH_HEAD` 的最後修改時間（用你手上的檔案工具讀取時間戳即可，**不要用只有某個平台才有的 shell 語法**）
   2. 檔案不存在，或距離現在**超過 30 分鐘** → 執行：
      ```
      git fetch origin
      ```
   3. 再看落後幾個 commit：
      ```
      git rev-list --count "HEAD..@{u}"
      ```
      > 引號不能省：PowerShell 會把沒加引號的 `@{...}` 當成 hashtable 語法而報錯。
      > 若回報「沒有上游分支」之類的錯誤 → 視為 0，並在報告註明「尚未設定上游分支」。
   4. 落後 > 0 → 提醒「遠端有 N 個新 commit，要 `git pull` 嗎？」**不主動 pull**
6. **交叉比對防呆**：若 `handoff.md` 寫「Git push：✅」但遠端沒有對應的新 commit → 警告「上次收工可能沒推成功，建議先確認再動工」

### L3：Obsidian 筆記（有登記才列，不主動讀）

7. 在報告中列出筆記路徑（例：`<專案資料夾名>/專案工作流程.md`），註明「需要詳細背景時我再去讀」
8. 只有兩種情況才主動讀：`handoff.md` 的「下一步」明確指向筆記內容，或使用者要求

### 報告 + 建議下一步

給使用者**結構化摘要**（不要冗長）：

```
📂 專案：<資料夾名>（第 N 層級）
📘 上次做到哪：<handoff 摘要 1-2 句>（<時間>，<更新者> @ <電腦名>）
🔧 本地 git：<clean｜有 N 個未 commit 變動｜—（L1 專案）>
🌐 遠端：<最新｜落後 N commits，建議 git pull｜—>
🧠 Obsidian：<筆記路徑，需要時再讀｜—>
➡️ 建議下一步：
   1. <handoff「下一步」第 1 項>
   2. <可選：第 2 項>

要從哪個方向開始？
```

最後**等使用者選方向**，不要自己擅自繼續。

## 不該做的事

- ❌ 主動 `git pull`（會撞本地未 commit 變動）
- ❌ 修改 `AGENTS.md`／`handoff.md`／Obsidian 筆記（那是收工的事）
- ❌ 沒有交接檔時硬建一個（先問使用者）
- ❌ 開工就把 Obsidian 筆記全文讀進來（違反「有需要才讀」的分層設計）
- ❌ 把藍圖與交接檔內容**全文倒出來**（要摘要、保持精簡）

## 與收工（shutdown）的對偶關係

| 面向 | 收工 | 開工 |
|------|------|------|
| 主要動作 | 摘要今天做什麼 | 摘要上次做什麼 |
| AGENTS.md / handoff.md | **寫入** | **讀出** |
| Git 動作 | add + commit + push | status + fetch（不 pull） |
| Obsidian | 寫詳細紀錄 | 只列路徑、需要才讀 |
| 對外副作用 | 推 GitHub、改檔案 | **無**（只讀、只報告） |

## 注意事項

- 所有訊息使用**繁體中文**
- 專案藍圖檔名固定是**全大寫 `AGENTS.md`**（跨 Agent 開放標準）。Mac／Linux 會區分大小寫，寫成小寫會變成「檔案在、Agent 卻讀不到」
````

---

### 步驟三：建立 shutdown（收工）技能

把下面整段內容原封不動寫入 `~/.config/opencode/skills/shutdown/SKILL.md`：

````md
---
name: shutdown
description: 收工同步助手（三層級自動偵測）。當使用者說「收工」、「結束了」、「下班」、「準備換電腦」、「同步」、「先到這裡」、「換電腦繼續做」等任何要結束工作並保存進度的請求時，請一定要使用此技能。本技能會更新 AGENTS.md 進度與 handoff.md 交接檔、git commit + push、把詳細紀錄寫進 Obsidian，確保下次（或在另一台電腦、或換一個 Agent）打開能無縫接續。
---

# 收工同步助手（三層級）

對話結束前，把這次的工作保存到專案建到的每一層：

| 層級 | 收工動作 | 給誰看 |
|------|---------|--------|
| L1 本地 | 更新 `AGENTS.md` 進度＋改寫 `handoff.md` | 下一個 session 的任何 Agent、任何電腦 |
| L2 GitHub | commit + push | 版本歷史＋雲端備份 |
| L3 Obsidian | 詳細紀錄寫進 `專案工作流程.md` | 未來需要完整脈絡的自己 |

## 核心原則

1. **開工是「讀」、收工是「寫」**——`handoff.md` 是收工的必寫項，這是跨電腦／跨 Agent 交接的生命線
2. **不在 vacuum 中執行**——先從對話脈絡盤點今天做了什麼
3. **只動需要動的**——沒實質進度（只是問問題、沒改檔案）就不跑同步
4. **有疑問先問人**——commit 前先給訊息草稿等點頭；不確定要不要 add 的檔案先問
5. **精簡與詳細分家**——`handoff.md` 只放交接必需資訊，完整脈絡（決策原因、踩坑細節）寫 Obsidian，兩邊不重複

## 層級偵測（收工看「這個專案」建到哪層）

- **L1**：專案有 `AGENTS.md`／`handoff.md` → 更新（沒有就提議先跑「初始化專案」）
- **L2**：專案有 `.git` → commit + push
- **L3**：`AGENTS.md` 登記了 Obsidian 路徑，且**目前有可用的 Obsidian MCP 工具**（能讀寫 vault 筆記的工具）→ 寫詳細紀錄

> 判斷 L3 請看你手上實際有哪些工具，不要假設特定工具名稱。
> 低層級電腦打開高層級專案：做得到的照做，做不到的在 `handoff.md` 註明（例：「本次在無 Obsidian 的電腦收工，L3 筆記未更新」），回到高層級電腦時補。

## 收工 SOP（依序執行）

### L1：更新藍圖與交接檔（永遠執行）

1. **盤點本次成果**：從對話歷史摘要——完成了哪些檔案、做了什麼決定、踩了什麼坑
2. **更新 `AGENTS.md`**：
   - 路線圖 checklist：勾掉完成項、新增發現的待辦
   - 「資料夾結構」有新增檔案就補
3. **改寫 `handoff.md`**（整份重寫，不是往下堆）：
   - ⏯️ 目前做到哪：本次最後完成的動作
   - 🚦 目前狀態：可運行？哪些做一半？
   - ➡️ 下一步：具體、可執行的 1-3 項
   - ⚠️ 注意事項：新踩的坑、暫時 workaround
   - 🕐 最後更新：時間＋更新者（Agent 名 @ 電腦名）＋ Git push 狀態（先寫「待推」，L2 完成後回填）
     - 電腦名取得方式：Windows（PowerShell）用 `$env:COMPUTERNAME`；Mac／Linux 用 `hostname`

### L2：git 同步（專案有 `.git` 才做）

4. `git status --short` 看變動 → 擬**繁體中文** commit 訊息（標題：動詞＋對象；正文 3-5 條 bullet 描述變動＋為什麼）→ **給使用者過目，點頭再 commit**
5. commit → `git push`
6. **回填 `handoff.md` 的 Git push 欄**：成功 → `✅ 已推`；失敗 → `❌ 未推（原因）`，並在回報中特別提醒（沒推成功，另一台電腦就拿不到 GitHub 備份）
7. 不要 add：`.env`、API key、憑證檔、untracked 的不明新檔（先問）

### L3：Obsidian 詳細紀錄（可用才做）

8. 更新 `<你的 vault>/<專案資料夾名>/專案工作流程.md`：
   - 「⏯️ 上次做到哪」段：同步 handoff 摘要
   - 「🗓️ 最近更動紀錄」表格：加一行（日期＋摘要＋同步狀態）
   - 「🕳️ 踩坑筆記」：有新坑就依分類補（含原因與解法，這裡寫詳細版）
   - 決策紀錄：本次做了什麼取捨、為什麼（handoff 不放這些，放這裡）
9. 表格超過 30 行 → 提醒使用者歸檔到 `歷史日誌.md`

### 回報（層級 checklist）

```
✅ L1 本地：AGENTS.md 進度已更新、handoff.md 已改寫（更新者：<Agent> @ <電腦名>）
✅ L2 GitHub：<repo> 已 commit + push（<commit 標題>）
✅ L3 Obsidian：專案工作流程.md 已補紀錄
⚠️ 手動處理：<例：本次新增了 ~/.xxx_api_key，另一台電腦要手動建>
```

沒做到的項目用 ⚠️ 或 ❌ 並說明原因。
若本次改過 `~/.config/opencode/` 底下的全域設定或技能，要特別提醒使用者：**這些檔案不在專案 repo 裡，不會被這次的 push 帶走**，換電腦要自己再裝一次或另外複製。

## 不該做的事

- ❌ 對「沒實質進度」的對話也跑同步
- ❌ 沒更新 `handoff.md` 就收工（那是下次開工的唯一線索）
- ❌ commit message 寫「更新」、「修改」這種沒資訊的字
- ❌ 自動 add untracked 的新檔或敏感檔（要使用者確認）
- ❌ 把該寫進 Obsidian 的長篇細節塞進 `handoff.md`（交接檔要保持一頁內讀完）

## 與開工（startup）的對偶關係

| 面向 | 收工 | 開工 |
|------|------|------|
| AGENTS.md / handoff.md | **寫入** | **讀出** |
| Git 動作 | add + commit + push | status + fetch（不 pull） |
| Obsidian | 寫詳細紀錄 | 只列路徑、需要才讀 |
| 對外副作用 | 推 GitHub、改檔案 | 無 |

## 注意事項

- 所有訊息使用**繁體中文**
- 專案藍圖檔名固定是**全大寫 `AGENTS.md`**（Mac／Linux 會區分大小寫）
- Windows＋雲端硬碟資料夾內的 repo，第一次操作若遇 git 寫入錯誤：`git config windows.appendAtomically false`
````

---

### 步驟四：建立 project-init（初始化專案）技能

把下面整段內容原封不動寫入 `~/.config/opencode/skills/project-init/SKILL.md`：

````md
---
name: project-init
description: 專案初始化技能（三層級自動偵測）。當使用者說「初始化專案」、「專案初始化」、「幫這個專案做初始化」、「開新專案」、「建立專案藍圖」、「幫我 init 專案」等要為當前資料夾建立專案基礎建設的請求時，請一定要使用此技能。本技能會依這台電腦的工具鏈自動建到最高可用層級：L1 本地（AGENTS.md + handoff.md）→ L2 GitHub（私有 repo）→ L3 Obsidian（專案詳細筆記）。
---

# 專案初始化技能（三層級自動偵測）

## 設計理念

一套技能、三個層級。**這台電腦裝了什麼工具，就自動建到哪個層級**——不用問使用者「你要第幾層級」。

| 層級 | 平台 | 建立的東西 | 讀取時機 |
|------|------|-----------|---------|
| L1 本地 | 專案資料夾（建議放在你的雲端硬碟資料夾） | `AGENTS.md`（專案藍圖）＋`handoff.md`（交接檔） | **每個 session 都讀** |
| L2 GitHub | 私有 repo | git 版本控制＋雲端備份 | 指定才讀 |
| L3 Obsidian | 第二大腦 vault | `專案工作流程.md`（詳細筆記） | 有需要才讀 |

> 為什麼藍圖叫 `AGENTS.md` 而不是 `CLAUDE.md`？因為 AGENTS.md 是跨 Agent 開放標準——OpenCode、Claude Code、Codex、Gemini CLI 都讀得懂。專案層的檔案刻意用開放格式，任何 Agent 接手都能無縫工作。
> **檔名必須全大寫 `AGENTS.md`**：Windows 不分大小寫所以寫錯也能動，但 Mac／Linux 分大小寫，小寫的 `agents.md` 會變成「檔案明明在、Agent 卻讀不到」。

## 層級偵測（初始化看「這台電腦」有什麼）

依序檢查，決定本次能建到第幾層級：

1. **L1**：無條件可建
2. **L2**：跑 `gh auth status`，成功（已登入 GitHub CLI）→ 可建
3. **L3**：目前有可用的 Obsidian MCP 工具（能列目錄、建立筆記的工具）→ 可建
   - 請依「你手上實際有哪些工具」判斷，不要假設特定的工具名稱

檢查完先告訴使用者：「這台電腦可初始化至第 N 層級」，再開始執行。

## 初始化 SOP（依序執行）

### L1：本地藍圖（永遠執行）

1. **掃描資料夾現況**：列出既有檔案，若已有 `AGENTS.md` 或 `handoff.md` → 停下來問使用者是否要覆蓋
2. **詢問使用者**：專案名稱、一句話目標、關鍵時程（沒有就留白，不要硬編）
3. **建立 `AGENTS.md`**：用下方範本為底，填入實際內容；「資料夾結構」區塊由掃描結果自動生成
4. **建立 `handoff.md`**：用下方範本為底，「目前做到哪」填「專案初始化完成」，更新者填 Agent 名＋電腦名
   - 電腦名：Windows（PowerShell）用 `$env:COMPUTERNAME`；Mac／Linux 用 `hostname`
5. 若路徑含「雲端硬碟」「My Drive」「Google Drive」→ 提醒使用者確認雲端硬碟桌面版的同步圖示已打勾（檔案要真的躺在雲端，換電腦才拿得到）

#### 範本：`AGENTS.md`

```md
# <專案名稱>（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
<!-- 一段話：這個專案是什麼、目標是什麼 -->

## 關鍵時程
<!-- 格式：- 事件名稱：日期（說明）；沒有就留白 -->

## 目標與路線圖
<!-- 用 checklist 追蹤，收工技能會更新這裡 -->
- [ ] 階段一：
- [ ] 階段二：

## 資料夾結構
<!-- 初始化時自動掃描生成，之後新增檔案要更新 -->

## 同步層級（本專案初始化至第 N 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地（雲端硬碟資料夾） | `AGENTS.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | <未啟用｜<你的 GitHub 帳號>/repo-name> | 指定時 |
| L3 | Obsidian | <未啟用｜專案資料夾名/專案工作流程.md> | 有需要時 |

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構

## 安全與隱私（不可違反）
- **不把 API key、密碼、憑證寫進 repo**，也不要貼進 `AGENTS.md`／`handoff.md`；一律放 `.env` 並列入 `.gitignore`
- **學生資料只用座號**，不出現姓名、學號、班級以外的個資、照片或聯絡方式
- 要公開分享前，先確認檔案裡沒有上述兩類內容
```

#### 範本：`handoff.md`

```md
# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
<!-- 最後完成的動作，1-3 句 -->
專案初始化完成。

## 🚦 目前狀態
<!-- 可運行嗎？哪些做一半？ -->

## ➡️ 下一步
1.

## ⚠️ 注意事項
<!-- 坑、暫時 workaround、不要動的東西 -->

## 🕐 最後更新
- 時間：<YYYY-MM-DD HH:mm>
- 更新者：<Agent 名> @ <電腦名>
- Git push：<✅ 已推｜❌ 未推（原因）｜—（本專案未啟用 git）>
```

### L2：GitHub（`gh` 已登入才做，否則跳過並註明）

> 這一層的 git／GitHub 設定**不在本技能重寫**：完整做法請依懶人包 **07-github** 那一包。
> 本技能只負責「呼叫它、然後回填藍圖」。

6. 確認 `gh auth status` 通過（沒過就跳過 L2，並告訴使用者「先跑懶人包 07-github」）
7. 先建立 `.gitignore`（避免把敏感檔推上去，這是唯一在本技能處理的 git 相關動作）：
   ```
   desktop.ini
   *.tmp
   ~$*
   .env
   *.key
   credentials.*
   ```
8. 依懶人包 **07-github** 的做法，把這個資料夾變成 GitHub 上的**私有** repo 並推上去
   （repo 的英文名字要先問使用者）
9. **回填 `AGENTS.md`** 同步層級表的 GitHub 欄（repo 網址）

### L3：Obsidian（MCP 可用才做，否則跳過並註明）

10. 在 vault 根目錄建立與專案資料夾**同名**的資料夾
11. 建立 `<專案資料夾名>/專案工作流程.md`，內容包含：專案背景與詳細脈絡、決策紀錄（為什麼這樣做）、素材與相關筆記連結、🕳️ 踩坑筆記、🗓️ 最近更動紀錄表格（第一行寫今天的初始化）
12. **回填 `AGENTS.md`** 同步層級表的 Obsidian 欄（vault 內路徑）

### 回報

給使用者一個層級 checklist：

```
🏗️ 本專案初始化至第 N 層級
✅ L1 本地：AGENTS.md ＋ handoff.md
✅ L2 GitHub：<你的 GitHub 帳號>/<repo>（私有）
⚠️ L3 Obsidian：未建（這台電腦沒有 Obsidian MCP，之後可在有 Obsidian 的電腦說「補建第三層級」）
```

## 不該做的事

- ❌ 未經確認就覆蓋既有的 `AGENTS.md`／`handoff.md`
- ❌ 把藍圖檔名寫成小寫 `agents.md`（Mac／Linux 會讀不到）
- ❌ 電腦沒 `gh`／Obsidian 時報錯中斷（正確行為：跳過該層級、在回報中註明原因）
- ❌ 把 `.env`、API key 之類敏感檔 commit 進 git
- ❌ 建 public repo（預設一律 private，使用者明說才轉公開）

## 注意事項

- 所有訊息與檔案內容使用**繁體中文**
- Windows＋雲端硬碟資料夾內跑 git 若遇寫入錯誤：`git config windows.appendAtomically false`
- 之後的日常循環交給搭檔技能：開工（startup）讀、收工（shutdown）寫
````

---

### 步驟五：設定 opencode.json 權限

打開（或建立）`~/.config/opencode/opencode.json`，確認裡面有這一段：

```json
{
  "permission": {
    "skill": {
      "startup": "allow",
      "shutdown": "allow",
      "project-init": "allow",
      "*": "ask"
    }
  }
}
```

意思是：這三個技能可以直接用，其他技能一律先問你。

> ⚠️ 如果 `opencode.json` 已經有內容（例如前面懶人包加的 MCP 設定），**不要整份覆蓋**，只要把 `"permission"` 這個區塊合併進去就好。JSON 每個區塊之間要有逗號、最後一項不能有逗號。

---

### 步驟六：重啟 OpenCode

**OpenCode 只有在啟動時才會掃描技能目錄。** 剛剛新增的三個資料夾，要完全關掉 OpenCode 再重新打開，才會被認得。

（在終端機按 `Ctrl + C` 結束，或直接關掉視窗，再重新輸入 `opencode` 啟動。）

---

## 驗證步驟

重啟之後依序做這三件事：

**1. 確認技能被掃到**

跟 OpenCode 說：

> 「列出你現在可用的技能，有沒有 startup、shutdown、project-init？」

三個都要出現。沒出現 → 看下面「常見問題」第一題。

**2. 測試「開工」**

`cd` 到任何一個專案資料夾，然後說：

> 「開工」

正常的話會看到類似這樣的結構化摘要（沒有 `AGENTS.md` 的資料夾，它會問你要不要初始化，這也算成功）：

```
📂 專案：<資料夾名>（第 1 層級）
📘 上次做到哪：（尚未建立 handoff.md）
➡️ 建議下一步：要不要先跑「初始化專案」？
```

**3. 測試「初始化專案」＋「收工」**

找一個新的空資料夾，說「初始化專案」，看它有沒有建出 **`AGENTS.md`**（確認是**全大寫**）和 `handoff.md`。
接著隨便改一個檔案，說「收工」，看它有沒有回報 L1／L2／L3 checklist。

---

## 完成回報格式

請 OpenCode 用這個格式回報：

```md
## 三大技能安裝完成

- startup：~/.config/opencode/skills/startup/SKILL.md ✅
- shutdown：~/.config/opencode/skills/shutdown/SKILL.md ✅
- project-init：~/.config/opencode/skills/project-init/SKILL.md ✅
- opencode.json 權限：permission.skill 三項 allow 已設定 ✅
- 重啟 OpenCode：已完成 ✅
- 驗證 1／技能清單：三個技能都掃到 ✅
- 驗證 2／說「開工」：有正常回報摘要 ✅
- 驗證 3／說「初始化專案」：AGENTS.md（大寫）＋ handoff.md 已建立 ✅
```

沒過的項目用 ⚠️ 或 ❌ 並說明原因。

---

## 常見問題

| 問題 | 解法 |
|------|------|
| 技能沒出現在可用清單 | ①檔名要**全大寫 `SKILL.md`** ②資料夾名要跟 frontmatter 的 `name` 一致 ③最上面的 `---` 前後不能有空行或多餘文字 ④**沒重啟 OpenCode** |
| 說「開工」沒反應 | 完全關掉 OpenCode 再開一次；還是不行就檢查 `opencode.json` 的 `permission.skill` 有沒有寫對 |
| 寫進去的 SKILL.md 開頭多了 ```` ``` ```` | 外層的圍籬符號是懶人包的排版用的，不要寫進檔案。檔案第一行必須是 `---` |
| Mac／Linux 上 Agent 說找不到專案藍圖 | 檢查檔名是不是被寫成小寫 `agents.md`。**一定要大寫 `AGENTS.md`**——Windows 不分大小寫所以看不出問題，Mac／Linux 會直接讀不到 |
| 「初始化專案」跳過了 L2 | `gh auth status` 沒過。先做懶人包 **07-github** |
| 「初始化專案」跳過了 L3 | 這台電腦沒有 Obsidian MCP。先做懶人包 **04-obsidian**，或之後在另一台電腦說「補建第三層級」 |
| 雲端硬碟資料夾裡跑 git 出現寫入錯誤 | `git config windows.appendAtomically false`（Windows＋雲端硬碟的已知坑） |
| 兩台電腦可以同時開工同一個專案嗎？ | 不建議——雲端硬碟會產生「衝突副本」。開工技能會顯示上次收工的電腦與時間，幫你避開 |

