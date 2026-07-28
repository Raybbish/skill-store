---
name: opencode-connect-model
description: 連接免費模型（OpenCode Zen），讓剛裝好的 OpenCode 真的能對話與動手做事。說「連接模型」「設定 API key」「OpenCode 裝好了但不能用」「選模型」「要用免費模型」時載入。
---

# 連接免費模型（OpenCode Zen）

> 官方文件查證日期：**2026-07-27**
> 依據：<https://opencode.ai/docs/zen/>、<https://opencode.ai/docs/>、<https://opencode.ai/docs/providers/>、<https://opencode.ai/docs/models/>、<https://opencode.ai/docs/troubleshooting/>

---

## ⚠️ 先看這裡：為什麼這包一定要做

裝完 OpenCode **不等於能用**。

OpenCode 只是「駕駛座」，它自己不會思考。你必須先幫它接上一顆「腦袋」（模型），它才會回話、才會幫你建檔案、才會操作 NotebookLM。

如果你照 **#00 環境建置** 裝完，打開 OpenCode 卻發現：

- 打字進去沒有反應
- 跳出 `No providers configured` 之類的訊息
- 右下角看不到任何模型名稱

**那不是你裝壞了，是還沒做這一包。**

> 📌 建議順序：**#00 環境建置 → #01 連接模型（本包）→ 其他所有懶人包**
> 沒接模型，後面每一包都跑不動。

---

## 這個懶人包會幫你做什麼？

1. 註冊 **OpenCode Zen**（OpenCode 官方的模型入口）
2. 拿到一組 **API key**（就是那把鑰匙）
3. 在 OpenCode 裡把鑰匙插進去（**桌面版**與 **CLI 終端機版**兩種做法都教）
4. **選一個免費模型**
5. 做一次**真的會動手**的測試（請它建一個 `test.txt`），確認整條線是通的

---

## 原理說明（30 秒看懂）

```
你  →  OpenCode（駕駛座）  →  OpenCode Zen（模型總機）  →  實際的 AI 模型
                              ↑
                        用 API key 認人
```

**OpenCode Zen** 是 OpenCode 官方整理的模型清單。官方文件的原話是：這是一份「經過測試與驗證的模型清單」。

它的好處是：**一組 key 通到多個模型**，包含一批**目前免費**的模型。老師不用一家一家去申請 OpenAI、Google、Anthropic 的帳號。

> 💡 Zen 是**選用**的，不是強制。官方文件明講「completely optional」。你也可以接自己的其他供應商，但對零程式基礎的老師來說，Zen 是最短路徑。

---

## 先備條件

- [ ] 已完成 **#00 環境建置**（`opencode --version` 有版本號）
- [ ] 電腦有網路連線
- [ ] 有一個可以收信的 Email 帳號（註冊用）
- [ ] 一個空資料夾，等一下拿來做測試（例如 `Documents\opencode-test`）

---

## 桌面版還是 CLI？兩條路都寫，選一條走完

| | 桌面版（Desktop App） | CLI（終端機） |
|---|---|---|
| 長相 | 一般視窗程式，有滑鼠可以點 | 黑底白字的文字介面 |
| 研習現場 | ✅ **建議用這條**，投影出來大家看得懂 | 進階或遠端排錯時用 |
| 連 key 的方式 | 設定畫面點一點、貼上 | 輸入 `/connect` 指令 |
| 兩者關係 | 桌面版背景跑的其實就是同一套 OpenCode 伺服器 | — |

> 🔑 **步驟一（註冊拿 key）兩條路完全一樣，都要做。**
> 做完再依你的情況跳到 **步驟二A（桌面版）** 或 **步驟二B（CLI）**。

---

## 桌面版還沒裝？（CLI 使用者可跳過）

**#00 環境建置**只裝了 CLI。桌面版要另外裝：

- **Windows（主線）**：開 <https://opencode.ai/download>，下載 Windows 版安裝檔，雙擊安裝
- **macOS**：同一個下載頁抓 `.dmg`；或用 Homebrew
  ```bash
  brew install --cask opencode-desktop
  ```
- **Linux**：同一個下載頁抓 `.deb` 或 `.rpm`

---

# 請 OpenCode（或你自己）依序執行以下步驟

> 這份檔案可以整份貼給 AI agent 讓它帶你做。
> 遇到 🖐️ 圖示的地方是**必須人工操作**（要登入、要點網頁），agent 會停下來等你。

---

## 步驟一：註冊 OpenCode Zen、拿到 API key

> 🖐️ 這一步全程在瀏覽器裡做。

### 1-1. 開啟登入頁

網址（官方文件指定的入口）：

```
https://opencode.ai/auth
```

> 這個網址會自動轉到 OpenCode 的登入畫面（`auth.opencode.ai`）。**看到網址變了是正常的，不是被釣魚。**

### 1-2. 登入 / 註冊

用你的 Email（或畫面提供的登入方式）建立帳號並登入。

### 1-3. 建立 API key

登入後會進到 Console（管理後台）。找到 **API Keys** 相關的區塊，建立一組新的 key。

> 畫面上的按鈕字樣可能是 `Create API Key` 或 `Add API Key`，也可能藏在 `Settings` 底下。
> **官方文件沒有逐格說明後台 UI，以你看到的畫面為準。** 只要找到「建立金鑰」的按鈕就對了。

### 1-4. 複製並保管好

> ⚠️ **API key 通常只會完整顯示一次。** 建立後立刻複製。

**保管建議（給老師）**：

- 先貼到「記事本」暫存，確認**整串在同一行、前後沒有多餘空白、沒有被自動換行切開**
- ❌ 不要貼到共用的 Google 文件、班級群組、簡報備忘稿
- ❌ 不要放進之後要上傳 GitHub 的資料夾
- ✅ 之後真的要存，存在自己的密碼管理器裡

### 1-5. 關於「帳單資料」

官方文件的流程原話是：登入 → **加入帳單資料** → 複製 API key。

實務上請這樣處理：

1. 先直接嘗試建立 API key
2. **如果後台不讓你建、明確要求先填付款資料**，才依畫面指示處理
3. 學校公務機／不想綁卡的老師，**到這裡先停下來問承辦或自行決定**，不要在研習現場趕著輸入信用卡

> ❓ **本包無法從官方文件確認**：「只用免費模型」是否也一定要先填帳單資料。官方 `/docs/zen/` 沒有針對免費模型另外說明。**請以你當下看到的後台畫面為準。**
>
> 💰 本懶人包**不寫任何金額、儲值額度、扣款門檻**。價格會變，一律以官方 <https://opencode.ai/docs/zen/> 的 Pricing 表為準。

---

## 步驟二A：桌面版連接（研習現場走這條）

> 🖐️ 需要人工點畫面。

1. **打開 OpenCode 桌面版**
2. 進入 **Settings（設定）**
3. 找到 **Providers（供應商）** 這一區
4. 找到 **OpenCode Zen**（找不到就用搜尋框打 `zen` 或 `opencode`；清單可能要點「顯示更多供應商」才會全部展開）
5. 點 **Connect（連接）**
6. 把步驟一複製的 **API key 貼上**，按 **Continue / 確認**
7. **完全關閉桌面版再重新打開**

> ⚠️ **第 7 點不要跳過。** 新加的供應商常常要重啟才會出現在模型清單裡。
>
> ℹ️ 桌面版的實際選單文字**官方文件未逐項載明**（官方只寫了 CLI 的 `/connect` 流程），版本不同字樣可能微調。找不到就認關鍵字：`Settings` → `Providers` → `Connect`。

### 桌面版連不起來？有兩個備援

**備援 1：在聊天框直接打指令**

有些版本的桌面版聊天輸入框也吃斜線指令。試著輸入：

```
/connect
```

跳出選單就照 **步驟二B** 的流程走。

**備援 2：用 CLI 連，桌面版接手**

桌面版背景跑的是同一支 OpenCode 伺服器（官方 Troubleshooting 稱為 `opencode-cli` sidecar），憑證是同一份。所以：

1. 照 **步驟二B** 用終端機把 key 連好
2. 完全關閉桌面版再重開
3. 模型清單裡就會出現 OpenCode Zen

> ❓ 「桌面版與 CLI 共用同一份憑證檔」這點官方文件**沒有明文寫死**，是從「桌面版背景跑 opencode-cli」推得。實測可行率高，但若無效請回到備援 1 或直接用 CLI 工作。

---

## 步驟二B：CLI（終端機）連接

> Windows 請用 **PowerShell**，不要用舊的 CMD。

### 2B-1. 啟動 OpenCode

先切到你的測試資料夾再啟動：

```bash
cd ~/Documents/opencode-test
opencode
```

> Windows 找不到資料夾就先建一個：`mkdir ~/Documents/opencode-test`

### 2B-2. 輸入連接指令

在 OpenCode 畫面裡輸入：

```
/connect
```

### 2B-3. 選 OpenCode Zen

用方向鍵選 **OpenCode Zen**，按 Enter。

> ⚠️ 清單裡還有一個長很像的 **OpenCode Go**。
> 那是**付費訂閱制**方案，不是本包要的。**這一包只走 OpenCode Zen。**

### 2B-4. 貼上 API key

畫面會出現輸入框，貼上 key 後按 Enter：

```txt
┌ API key
│
│
└ enter
```

> **貼上小技巧**：Windows PowerShell 裡按滑鼠右鍵通常就是貼上。貼完先看一眼有沒有整串進去。

### 2B-5. 確認憑證存進去了

離開 OpenCode，在終端機執行：

```bash
opencode auth list
```

清單裡要看得到 OpenCode Zen 相關的項目。

> **憑證存在哪？**（官方 Troubleshooting 明列）
> - macOS / Linux：`~/.local/share/opencode/auth.json`
> - Windows：按 `WIN+R`，貼上 `%USERPROFILE%\.local\share\opencode`
>
> ⚠️ **這個檔案裡面就是你的 API key 明文。不要備份到雲端硬碟、不要 commit 進 Git。**

### 2B-6. 也可以用純指令連（進階）

不想進畫面選單的話：

```bash
opencode auth login
```

它一樣會問你要連哪一家、要你貼 key。

---

## 步驟三：選一個免費模型

### 3-1. 打開模型清單

在 OpenCode 裡輸入：

```
/models
```

（快捷鍵：`ctrl+x` 然後 `m`）

CLI 也可以直接列出 Zen 的所有模型：

```bash
opencode models opencode
```

> 這裡的 `opencode` 是 OpenCode Zen 在設定檔裡的**供應商代號**（provider id）。

### 3-2. 怎麼認出哪個是免費的

**不要背清單，學會自己查。** 免費方案變動很快，官方隨時會加、會下架。

三個查法，可信度由高到低：

| 方法 | 做法 |
|------|------|
| ① 官方 Pricing 表（最準） | 開 <https://opencode.ai/docs/zen/>，捲到 **Pricing**，Input / Output 標成 `Free` 的就是免費 |
| ② 機器可讀清單 | 官方文件提供 <https://opencode.ai/zen/v1/models>，可以取得完整模型清單與 metadata |
| ③ `/models` 裡看名字 | 名稱結尾帶 **`Free`** 的通常就是免費款（但**這不是保證**，仍以①為準）|

### 3-3. 2026-07-27 當下查到的免費模型（⚠️ 清單會變，僅供參考）

以下是 **2026-07-27** 於官方 `/docs/zen/` Pricing 表查到、標示為 `Free` 的模型：

| 模型名稱 | model id（設定檔要用的） |
|----------|--------------------------|
| Big Pickle | `big-pickle` |
| DeepSeek V4 Flash Free | `deepseek-v4-flash-free` |
| MiMo-V2.5 Free | `mimo-v2.5-free` |
| Laguna S 2.1 Free | `laguna-s-2.1-free` |
| Ling-3.0-flash Free | `ling-3.0-flash-free` |
| North Mini Code Free | `north-mini-code-free` |
| Nemotron 3 Ultra Free | `nemotron-3-ultra-free` |

> 🔴 **這張表一定會過期。**
> 官方對這些模型的原文說明是「**免費為限時提供**（available for a limited time）」——廠商在收集回饋、改進模型的期間才免費。
> **你在讀這份文件的當下，請務必回到 <https://opencode.ai/docs/zen/> 的 Pricing 表重新確認一次。**
> 這份表格的功能是「讓你知道長什麼樣子」，不是「照抄就能用」。

### 3-4. 在設定檔裡怎麼寫

模型的完整 ID 格式是 `供應商代號/模型代號`。OpenCode Zen 的供應商代號是 **`opencode`**。

所以完整寫法長這樣：

```
opencode/big-pickle
opencode/deepseek-v4-flash-free
```

---

## 步驟四：驗證真的通了（⭐ 不要跳過）

**「AI 有回話」不代表通了。** 對老師來說真正有用的是「它會幫我動手做事」。

有些便宜或免費的模型很會聊天，但**不會正確呼叫工具**（不會建檔、不會讀檔）——這種模型接上去，後面的 NotebookLM、Obsidian、生圖懶人包**全部會失敗**，而且錯誤訊息看起來完全不像模型的問題。

所以驗證要驗「會不會動手」。

### 4-1. 測試指令（桌面版與 CLI 通用）

在你的測試資料夾開啟 OpenCode，貼進去這段：

```
請在目前這個資料夾建立一個檔案叫 test.txt，
內容寫一行：OpenCode 連線成功。
建立完成後，把這個檔案的內容讀出來給我看。
```

### 4-2. 三個都要看到才算通過

| 檢查點 | 通過的樣子 |
|--------|-----------|
| ① 會回話 | AI 有正常的中文回應，不是錯誤訊息 |
| ② 會動手 | 畫面上看得到它「呼叫工具寫檔案」的動作（可能會跳出詢問你是否允許 → 選允許）|
| ③ 檔案真的在 | 打開資料夾，`test.txt` 存在，內容正確 |

只有 ① 沒有 ②③ → **模型的 tool calling 不行，換一個免費模型重測。**

### 4-3. CLI 一行驗證（懶人版）

```bash
opencode run --model opencode/big-pickle "請在目前資料夾建立 test.txt，內容寫：OpenCode 連線成功"
```

跑完檢查檔案：

```bash
ls test.txt        # macOS / Linux
dir test.txt       # Windows
```

> `--model` 後面請換成你在步驟三查到、當下真的免費的那個 model id。

### 4-4. 測完清乾淨

```bash
rm test.txt        # macOS / Linux
del test.txt       # Windows
```

---

## 步驟五（選用）：把常用模型設成預設

每次開都要重選很煩，可以寫進設定檔。

**設定檔位置**（官方 Troubleshooting 明列）：

- macOS / Linux：`~/.config/opencode/opencode.json`
- Windows：按 `WIN+R`，貼上 `%USERPROFILE%\.config\opencode`（檔名 `opencode.json` 或 `opencode.jsonc`）

內容：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle"
}
```

> ⚠️ **JSON 常見地雷**：最後一項後面不能有逗號；所有引號要用英文半形 `"`，不能用中文全形「」。
> 檔案不存在就直接新建一個。

---

## 怎麼判斷「這個模型適不適合這個任務」

> 呼應 **OpenCode 基本功 EP06「各種模型正確用法全解析」**。
> 核心觀念：**沒有最強的模型，只有適合這個任務的模型。**

### 四個判準（照這個順序想）

| 判準 | 白話 | 怎麼影響你 |
|------|------|-----------|
| **① 會不會用工具** | 它能不能真的建檔、改檔、跑指令 | 只要是「請 OpenCode 幫我做事」，這項不合格就直接出局。**最重要。** |
| **② 吃得下多少字**（context） | 一次能讀多長的東西 | 要餵一整份備課教材、整份逐字稿的話，context 太小會讀不完、會忘記前面 |
| **③ 快 vs 好** | 秒回但普通 vs 慢但細膩 | 現場示範要快；期末報告可以慢 |
| **④ 資料敏不敏感** | 這段內容能不能給對方看 | 學生個資、成績、家長資料 → 見下方隱私提醒 |

### 任務對照表（實務建議）

| 你要做的事 | 挑選原則 |
|-----------|---------|
| 隨口問問、翻譯、改錯字、想標題 | 最便宜／最快的免費模型就夠，不用挑 |
| 請它建檔案、改檔案、跑安裝流程（**大部分懶人包**）| **優先看 ① 工具能力**。先用免費的測，測不過才換 |
| 讀一整本教材、一整份逐字稿再整理 | 看 **② context**，選標榜長文本的 |
| 寫程式、做互動網頁、做 Firebase | 選名稱帶 `code` / `coder` 或官方標為 coding 導向的 |
| 規劃課程、拆解複雜任務、寫教案架構 | 選推理型（reasoning）的，慢一點沒關係 |
| 一次要跑很多次的重複雜工 | 選最便宜最快的，不要用大模型輾螞蟻 |

### 給老師的三條實用心法

1. **從最便宜的開始，卡住再往上換。** 不要一開始就用最貴的——大部分教學情境，免費模型就夠了。
2. **換模型不用重做設定。** key 只連一次；之後 `/models` 隨時換，換完下一句話就生效。
3. **同一個任務失敗兩次以上，先換模型再懷疑自己。** 很多「懶人包跑不動」其實是模型不會用工具，不是步驟寫錯。

> 📎 官方 `/docs/models/` 也點出同一件事：市面上模型很多，但**同時擅長寫程式又擅長呼叫工具的只有少數**。這正是我們在步驟四要測「會不會建檔」的原因。

---

## 🔒 隱私提醒（免費模型特別重要）

官方 `/docs/zen/` 的 **Privacy** 段落白紙黑字寫著：

- 這些模型在**免費期間**，**收集到的資料可能被用來改進模型**
- 其中 **North Mini Code Free** 與 **Nemotron 3 Ultra Free** 官方另外加註：**請勿提交個人或機密資料**

**翻成老師聽得懂的話：**

> 用免費模型時，你打進去的東西**有可能被對方留下來訓練模型**。

### 老師守則（請直接遵守）

- ❌ 不要丟：學生姓名、學號、身分證字號、成績單、輔導紀錄、家長聯絡方式、班級名冊
- ❌ 不要丟：學校內部公文、未公開的試題
- ✅ 可以丟：公開教材、自己寫的教案、講義草稿、程式碼、示範用的假資料
- ✅ 需要處理真實學生資料時：把姓名換成「學生A、學生B」再丟，或改用有零留存政策的付費模型

> 這條規則跟省錢無關，是**個資保護**。研習現場請務必提醒。

---

## 常見失敗與排除

| 症狀 | 可能原因 | 怎麼解 |
|------|---------|--------|
| `Unauthorized` / `invalid api key` / 401 | **key 貼錯**：貼到一半、前後有空白、被換行切斷 | 重跑 `/connect` 再貼一次。貼之前先在記事本確認整串在同一行 |
| 貼完沒反應、清單裡沒東西 | 沒重啟 | **完全關閉** OpenCode（桌面版要整個結束，不是關視窗）再開 |
| 出現要付款／餘額不足的錯誤 | **選到付費模型了** | 回 `/models` 換成免費的。確認方式：官方 Pricing 表標 `Free` |
| 本來能用，某天突然要收費 | **免費期結束了**（官方原文：限時提供） | 回 <https://opencode.ai/docs/zen/> 重查現在還有哪些 `Free`，換一個 |
| `ProviderModelNotFoundError` | model id 格式寫錯 | 一定要 `供應商/模型`，Zen 是 `opencode/<model-id>`（例：`opencode/big-pickle`）|
| 完全連不到、一直轉圈、逾時 | **學校網路擋掉了** | 用手機熱點測一次：能通就是校網問題，請資訊組放行 `opencode.ai` 與 `auth.opencode.ai` |
| 登入頁跳到 `auth.opencode.ai` 覺得怪 | 正常轉址 | 這是官方登入網域，不是釣魚 |
| AI 會聊天，但不會建檔案 | **模型 tool calling 能力不足** | 換另一個免費模型，重跑步驟四 |
| 桌面版卡在啟動畫面 / `Connection Failed` | 設到了自訂 server 位址 | 依官方 Troubleshooting 檢查桌面版的 server URL 設定 |
| `opencode` 指令找不到 | #00 沒裝完 | 回頭做 **#00 環境建置** |
| 不小心把 key 貼進聊天室／文件 | 外洩 | **立刻回 Console 把那把 key 停用／刪除，重新建一把** |

---

## 如果連錯了，怎麼砍掉重來

對 OpenCode 說：「我的 OpenCode Zen 連錯了，幫我清掉重連。」

或手動依序做：

**第 1 級：重連（最常用，先試這個）**

```
/connect
```

再選一次 OpenCode Zen、貼新的 key，會直接覆蓋舊的。

**第 2 級：先移除再連**

```bash
opencode auth list      # 看目前連了哪些
opencode auth logout    # 依提示移除指定的供應商
opencode auth login     # 重新連
```

**第 3 級：重置設定（最後手段）**

官方 Troubleshooting 針對 `ProviderInitError` 的作法是刪掉 OpenCode 的資料目錄：

- macOS / Linux：`~/.local/share/opencode`
- Windows：`%USERPROFILE%\.local\share\opencode`

> 🔴 **警告：這會一併清掉你過去的對話紀錄與 session 資料。** 前兩級都試過才用。
> 刪完要重跑 `/connect` 重新連。

**如果是 key 本身有問題**：回 <https://opencode.ai/auth> 的 Console，把舊 key 刪掉、建一把新的，再回來重連。

---

## ❓ 本包無法從官方文件確認的項目（現場請自行驗證）

| 項目 | 狀況 |
|------|------|
| 只用免費模型是否也必須先填帳單資料 | 官方 `/docs/zen/` 的流程寫「加入帳單資料」，但未針對免費模型另作說明。**以你看到的後台畫面為準。** |
| 桌面版連接供應商的實際選單文字 | 官方文件只完整記載 CLI 的 `/connect` 流程，桌面版 UI 未逐項載明。**以實際畫面為準。** |
| 桌面版與 CLI 是否共用同一份 `auth.json` | 官方只說明桌面版背景執行 `opencode-cli` sidecar，未明文寫憑證共用。**實測為主。** |
| 免費模型是否有隱藏的速率／每日上限 | 官方 Pricing 表僅標示 `Free`，未列出限制條件。 |

---

## ✅ 成功訊號（機器可判讀）

以下**全部**成立才算完成本包：

```
CHECK_1  `opencode auth list` 輸出包含 OpenCode Zen 的項目
CHECK_2  `/models`（或 `opencode models opencode`）能列出 Zen 的模型清單，且清單非空
CHECK_3  目前選用的 model id 格式為 opencode/<model-id>，且該模型在官方 Pricing 表標示為 Free
CHECK_4  對 agent 下「建立 test.txt」指令後，agent 實際觸發了寫檔工具（非只用文字回覆）
CHECK_5  test.txt 於測試資料夾中實際存在，且內容與指令一致
CHECK_6  測試完成後 test.txt 已刪除
```

任一項為 `FAIL` → 到「常見失敗與排除」對照處理，不要往下做其他懶人包。

---

## 完成回報格式

```md
## OpenCode 模型連接完成

- OpenCode 版本：<版本>
- 操作路徑：桌面版 / CLI
- Zen 帳號註冊：成功 / 失敗
- API key 取得：成功 / 失敗
- 憑證寫入（opencode auth list）：CHECK_1 PASS / FAIL
- 模型清單可列出：CHECK_2 PASS / FAIL
- 選用模型：opencode/<model-id>（免費 / 付費）
- 免費狀態查證日期：<YYYY-MM-DD>（依官方 /docs/zen/ Pricing 表）
- 工具呼叫測試：CHECK_4 PASS / FAIL
- test.txt 建立驗證：CHECK_5 PASS / FAIL
- 測試檔已清除：CHECK_6 PASS / FAIL
- 預設模型是否寫入 opencode.json：是 / 否
- 隱私提醒已告知使用者：是 / 否

### 待處理
- <把 FAIL 的項目與原因列在這裡；全部 PASS 就寫「無」>
```

---

## 下一步

模型接通了，OpenCode 才真正「活了」。接著可以做：

- **`02-file-toolkit`** — 裝內部工具包，讓 agent 能讀 PDF、產 Word、生語音
- **`03-notebooklm`** — 自動產簡報、音訊、資訊圖表
- **`07-github`** — 作品備份與跨電腦協作

> 💡 之後每一包如果跑到一半怪怪的、AI 亂答或不動手，**第一個先懷疑模型**：回 `/models` 換一個再試。

