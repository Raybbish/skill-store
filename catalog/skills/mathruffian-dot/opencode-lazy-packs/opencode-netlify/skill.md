---
name: opencode-netlify
description: 部署網頁到公開網址，並用 Netlify Functions 把 API 金鑰藏在後端，前端看不到。說「把網頁放上網」「部署」「上線」「Netlify」「產生公開網址」「API 金鑰不能寫在前端」「金鑰藏後端」「做一個自己的後端」時載入。
---

# 部署網頁與隱藏金鑰（Netlify）

> 官方文件查證日期：**2026-07-27**
> 依據：<https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/>、<https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/>、<https://docs.netlify.com/build/functions/get-started/>、<https://docs.netlify.com/build/environment-variables/overview/>、<https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/>、<https://docs.netlify.com/api/get-started/>、<https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/>、<https://vercel.com/docs/limits/fair-use-guidelines>、<https://vercel.com/docs/cli/deploy>
>
> ⚠️ 額度與計價數字是查證當天的狀態，**服務商隨時會調整，以官方頁面為準**。

---

# 🔴 第一件事：點數紀律（不看這段，後面全白做）

Netlify 從 **2025-09-04** 起改成**點數制**。**這天之後註冊的新帳號，一律進入這個方案**（研習現場當場註冊的老師，100% 都是）。

| 事實 | 數字 |
|------|------|
| 免費方案每月點數 | **300 點** |
| 這是不是硬上限 | 🔴 **是。免費方案不能加購、不能自動儲值** |
| **一次正式部署**（`netlify deploy --prod`） | **扣 15 點** |
| 所以一個月最多正式部署幾次 | 🔴 **20 次**（而且這是理論上限，見下方） |
| 點數用完會怎樣 | 🔴 **你所有的網站全部下線**。訪客打開網址看到 `Site not available` |
| 什麼時候會回來 | **等下一個帳單週期**。沒有其他辦法，也不能求救 |

## 🔴 而這些完全不用點數（0 點）

| 動作 | 點數 |
|------|------|
| **草稿部署**（`netlify deploy`，**不加** `--prod`） | **0 點** |
| Deploy Preview、分支部署 | **0 點** |
| **失敗的部署** | **0 點** |
| **回滾**（把正式站退回上一版） | **0 點** |
| 本機預覽（`netlify dev`） | **0 點**（根本沒上傳） |

## 🔴 所以本包只有一條核心紀律

> # 先草稿，確認沒問題，才正式發布。
>
> 你可以**無限次**草稿部署，看到一模一樣的畫面、按到一模一樣的按鈕，
> **一點都不扣**。
>
> 每一次「先 `--prod` 上去看看再說」，都是把 20 分之 1 的月配額丟掉。
> 一個下午改五次版面 ＝ 75 點 ＝ **當月四分之一沒了**。

**研習現場請直接這樣講**：

- `netlify deploy` ＝ **試印**。免費、無限次、印壞了不心疼。
- `netlify deploy --prod` ＝ **送印**。一個月只有 20 張紙。

### ⚠️ 「20 次」是理論值，實際請抓 15～18 次

三個原因：

1. **點數還沒歸零，正式部署就可能先被擋。** 使用者社群有多筆回報：帳面還剩 26～30 點，正式部署已經被拒絕。官方沒有說明保留門檻是多少，所以**不要規劃用到見底**。
2. **點數不是只有部署在吃**（見下方「還有什麼會吃點數」）。
3. 撞到 API 速率限制而失敗的部署雖然 0 點，但**你會忍不住重試**，重試成功那次就扣了。

> 🔴 **給 AI Agent 的硬規則**：
> **除非使用者這一輪明確說「正式發布」「上線」「要印 QR Code 了」，否則一律只做草稿部署。**
> 不准為了「順便驗證一下」自己加 `--prod`。每一次 `--prod` 都要先問過使用者。

### 還有什麼會吃點數

除了正式部署，這些也從同一個 300 點扣：

| 項目 | 費率 | 老師會踩到嗎 |
|------|------|-------------|
| 網站流量（頻寬） | 20 點／GB | ⚠️ **會，如果你放影片或大圖**。一支 100MB 的影片給 30 個學生看 ＝ 3GB ＝ **60 點 ＝ 4 次正式部署** |
| 網頁請求數 | 2 點／1 萬次請求 | ✅ 一個班級的量微不足道 |
| 函式運算 | 10 點／GB-小時 | ✅ 一堂課的問答量微不足道 |
| **AI Gateway** | **180 點 ≈ 1 美元的 AI 用量** | 🔴 **吃同一個池子，會直接排擠部署額度** |

> 🔴 **影片、大圖不要放進 Netlify 站台。** 放 YouTube、放 Google 雲端硬碟，網頁只放連結。
> 這是本包最容易被忽略、但最會偷偷把點數吃光的一條。

> 📌 **AI Gateway 建議不要當主線。** 它是 Netlify 幫你代打 AI API 的服務，好處是不用自己申請金鑰，
> 壞處是**用掉的每一分錢都在扣你的部署配額**。本包步驟三教的是「自己的金鑰 ＋ 自己的函式」，
> 這條路的 AI 費用算在 AI 服務商那邊，不會咬掉你這個月能不能發布網頁。

---

## 這一包在研習裡的位置（兩個用途）

這一包會在研習裡出現**兩次**，因為它同時是兩種東西：

### 用途 A（第二天上午）：「連接外部工具」的第三條通道

前兩條你已經走過了：

| 通道 | 代表 | agent 拿到什麼 |
|------|------|---------------|
| ① MCP | `03-notebooklm`、`04-obsidian` | 讀寫別人的服務 |
| ② API | `09-groq-api` | 呼叫別人的運算 |
| **③ CLI** | **本包** | **讓 agent 把你做的東西推上公開網址** |

前兩條是「把外面的東西拿進來」，**這一條是把你的東西送出去**。
做完之後，你桌上那個 `index.html` 變成一個**全世界都打得開的網址**，可以印成 QR Code 貼在教室後面。

### 用途 B（第三天下午）：作品⑥ 的後端

到了第三天，你手上會有一把 API 金鑰（AI、字幕、翻譯……）。
**金鑰不能寫在網頁裡** —— 寫進去等於公告周知，任何人按 F12 就抄走，然後用你的額度。

Netlify Functions 就是解法：**把金鑰放在你自己的伺服器上**，前端只呼叫自己的後端。

```
❌ 壞的做法
   學生的瀏覽器 ──（帶著你的金鑰）──→ 外部 AI API
                    ↑ 金鑰在這裡，按 F12 就看得到

✅ 本包的做法
   學生的瀏覽器 ──（不帶金鑰）──→ 你的 Netlify 函式 ──（帶金鑰）──→ 外部 AI API
                                      ↑ 金鑰只存在這裡，前端永遠碰不到
```

> 💡 兩個用途**共用同一個 Netlify 帳號、同一套指令**。
> 第二天做完 A，第三天在**同一個站台**上加函式即可，不用重開一個。

---

## 這包負責什麼、不負責什麼

**負責**

- 把一個資料夾裡的網頁推上 `https://<你的站名>.netlify.app`
- 讓那個網址**重新部署也不會變**（可以放心印 QR Code）
- 用 Netlify Functions 做一個「自己的後端」，把 API 金鑰藏在裡面
- 教你怎麼**當場向老師證明**金鑰真的藏起來了（F12 前後對比）

**不負責**

- 申請 AI／字幕服務的金鑰（`09-groq-api` 的範圍）。本包假設你**手上已經有一把** OpenAI 相容格式的金鑰
- 資料庫、多人即時同步 → `06-supabase`
- 自訂網域（`xxx.edu.tw`）、SSL 憑證設定
- 前端框架、打包工具（React／Vite／Next.js）。本包只處理**純 HTML 資料夾**

> 📌 **和 `07-github`（GitHub Pages）差在哪？**
> GitHub Pages 只能放**靜態檔案**，沒有後端，所以**藏不了金鑰**。
> 需要藏金鑰 → 本包。單純放個網頁、不碰金鑰 → GitHub Pages 也可以，而且沒有點數問題。

---

## 先備條件

- [ ] 已完成 `00-env-setup` 與 `01-connect-model`（OpenCode 要能動、要接上模型）
- [ ] 有一個資料夾，裡面至少有一個 `index.html`
- [ ] 一個**你自己收得到信**的信箱（見步驟 1-4 的警告）
- [ ] 【只有用途 B 需要】手上有一把 API 金鑰

驗證：

```powershell
node --version
```

看得到版本號就往下。看不到 → **回去做 `00-env-setup`**。

---

# 步驟一：裝工具、開帳號

> 📌 研習流程裡，這一步已經在**第一天下午**跟著 `00-env-setup` 做完了。
> 但本包要能被單獨拿出來用，所以整段寫在這裡。**已經裝好的人直接跳到 1-5。**

## 1-1 Node.js 版本要夠新

Netlify 官方文件寫「Node 18.14 以上」，**但那個數字已經過期了**。
`netlify-cli` 套件自己的 `engines` 欄位要求的是：

> **Node.js 22.13.0 以上**

**以套件的要求為準**，因為擋你的是它，不是文件。

```powershell
node --version
```

| 看到 | 怎麼辦 |
|------|--------|
| `v22.13.0` 以上 | ✅ 過關 |
| 比它舊（例如 `v20.x`、`v18.x`） | ❌ 要升級。回 `00-env-setup` 重裝 Node.js LTS |
| 什麼都沒有 | ❌ 沒裝 Node.js。回 `00-env-setup` |

> ⚠️ 版本不夠時的錯誤訊息長這樣，很多人看不懂：
> `The engine "node" is incompatible with this module. Expected version ">=22.13.0"`
> **這不是你做錯什麼，就只是 Node 太舊。**

## 1-2 安裝 Netlify CLI

```powershell
npm install -g netlify-cli
```

裝完**先關掉終端機、重新開一個**，再驗證：

```powershell
netlify --version
```

> 🔴 **「重開終端機」不是客套話。**
> 剛裝好的全域指令要等 `PATH` 更新，而**已經開著的視窗不會自己更新**。
> 「明明裝好了卻說找不到指令」，八成就是這個。**先重開再說。**

## 1-3 🔴 Windows 會在這裡卡住：PowerShell 執行原則

裝完之後打 `netlify`，Windows 很可能噴這個：

```
netlify.ps1 cannot be loaded because running scripts is disabled on this system.
```

**這不是你裝壞了。** `npm -g` 裝出來的指令在 Windows 上是一個 `.ps1` 腳本檔，
而 PowerShell 預設**不准執行任何腳本檔**。

**解法（複製這一行貼上就好）**：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

| 為什麼用這一行 | 說明 |
|---------------|------|
| `-Scope Process` | **只影響你現在這個終端機視窗**。關掉就恢復原狀，不會改到電腦設定 |
| **不需要系統管理員權限** | 🔴 **這是關鍵**。學校電腦常常不給老師管理員權限，改系統層級的設定當場就卡死 |
| `RemoteSigned` | 允許本機的腳本執行，網路下載的仍需簽章。夠用且不過度放寬 |

> ⚠️ **每開一個新的終端機視窗都要重打一次。** 這是 `-Scope Process` 的代價，也是它安全的原因。
> 覺得麻煩想改成永久的？**研習現場請不要。** 那是改使用者層級的安全設定，
> 老師回學校自己判斷就好，不要在課堂上帶著三十個人一起放寬電腦的防護。

**驗證**：

```powershell
netlify --version
```

印出版本號 = 過關。

> 💡 macOS／Linux 沒有這個問題，直接跳過 1-3。

## 1-4 註冊 Netlify 帳號

> 🖐️ **全程在瀏覽器手動做。AI agent 不要代為註冊、不要代填密碼、不要代收驗證信。**

開 <https://app.netlify.com/signup>。

| 項目 | 說明 |
|------|------|
| **要信用卡嗎** | ✅ **不用**。免費方案不需要綁卡（也正因如此，點數是硬上限，見最上面） |
| 註冊方式 | 用 GitHub 登入最省事（`07-github` 那個帳號），也可以用 Email |
| 要不要驗證信箱 | **要**。沒驗證，CLI 登入會失敗 |

### ⚠️ 學校信箱可能收不到驗證信

學校 Google Workspace / 教育網信箱**常常擋掉國外服務的驗證信**，而且**不會退信、不會進垃圾桶**，就是消失。

老師會卡在「我明明註冊了」而完全不知道發生什麼事。

**研習現場的處理順序**：

1. 先去**垃圾郵件**看一眼
2. 等 5 分鐘（有些學校信箱有延遲隔離）
3. 還是沒有 → 🔴 **直接改用個人 Gmail 重註冊，不要跟學校網管耗。**
   一場研習卡在等網管放行，全班就停在這裡了

### 🔴 一人一個帳號

不要為了省事全班共用一個帳號。三個理由：

1. **300 點是整個帳號共用的。** 三十個人分 300 點，等於一人 10 點，**連一次正式部署都不夠**
2. 部署有 API 速率限制（**每分鐘 3 次**），三十個人同時按下去 → 一片 `429 Too Many Requests`
3. 站名全球唯一，會互相撞名

## 1-5 讓 CLI 登入

```powershell
netlify login
```

瀏覽器會跳出授權頁。

> 🖐️ **確認右上角是你自己的帳號再按 Authorize。**
> 瀏覽器同時登著多個帳號時，很容易授權到別人身上——尤其是共用電腦的教室。

**驗證**：

```powershell
netlify status
```

看得到你的 Email 和帳號名稱 = 過關。

| 卡住的樣子 | 解法 |
|-----------|------|
| 瀏覽器沒跳出來 | 終端機會印一段網址，**自己複製貼到瀏覽器** |
| 授權完 CLI 還在轉圈 | 學校網路擋掉回呼。用手機熱點試一次 |
| `Not logged in` | 重跑 `netlify login`；還是不行先 `netlify logout` 再登 |

---

# 步驟二【用途 A】把網頁推上公開網址

假設你有一個資料夾，裡面是 `index.html`（`02-file-toolkit` 或 OpenCode 做出來的都行）。

## 2-1 建立站台

**在那個資料夾裡**執行：

```powershell
netlify sites:create --name class-demo-wang01 --json
```

### 🔴 站名怎麼取（這裡有兩個坑）

| 規則 | 說明 |
|------|------|
| 只能用**小寫英文、數字、連字號** | 中文、空白、底線都不行 |
| 🔴 **全世界唯一** | 不是你的帳號裡唯一，是**整個 Netlify 唯一** |

所以 `class-demo`、`test`、`my-site` 這種名字**一定已經被別人用掉了**，會噴：

```
name is taken
```

**研習現場的取名規則**：後面**加上你自己的代號**。
`class-demo-wang01`、`math7-lin-0727`——難聽沒關係，**不會撞名比較重要**。

> 💡 `--json` 是給 agent 讀的：它會把站台資訊印成 JSON，agent 可以直接抓出 `name` 和 `url`，
> 不用去猜終端機的文字排版。**人自己打的話可以不加。**

### 確認資料夾和站台連上了

```powershell
netlify link --name class-demo-wang01
netlify status
```

`netlify status` 要看得到站名 = 連上了。

> 🔴 **這一步不要跳過。** 沒連上的話，後面 `netlify env:set` 會反問你「要設哪個站？」，
> **agent 在非互動模式下會直接卡死在那個提問上**，而且看起來像當機。

## 2-2 草稿部署（0 點，可以無限次）

```powershell
netlify deploy --dir=.
```

`--dir=.` 的意思是「把**現在這個資料夾**當成網頁根目錄」。網頁放在 `public/` 就寫 `--dir=public`。

跑完會印出一個 **Website Draft URL**，長這樣：

```
https://68f1a2b3c4d5e6--class-demo-wang01.netlify.app
```

**打開它，完整檢查一遍**：字有沒有跑版、按鈕會不會動、手機上看起來對不對。

> 🔴 **這一步想試幾次就試幾次，一點都不扣。**
> 改一行 → 再 `netlify deploy` → 再看。這才是正確的工作方式。

## 2-3 🔴 網址穩定性（決定 QR Code 能不能印）

| | 草稿網址 | 正式網址 |
|---|---------|---------|
| 長相 | `https://<一長串隨機字元>--<站名>.netlify.app` | `https://<站名>.netlify.app` |
| **重新部署之後** | 🔴 **每次都是全新的一個** | ✅ **完全不變** |
| 能印 QR Code 嗎 | 🔴 **絕對不行** | ✅ **可以** |
| 點數 | 0 點 | 15 點 |

> # 🔴 草稿網址不能印 QR Code。
>
> 你下一次部署，那個網址就指向舊版本了（它不會壞掉，但它凍結在你當時那一版）。
> 貼在教室後牆的那張紙，會永遠停在你上禮拜的半成品。
>
> **要印的，只有 `https://<站名>.netlify.app` 這一個。**

### 站名已經是隨機亂碼了怎麼辦

沒帶 `--name` 建站的話，Netlify 會給你 `graceful-tartufo-8c9f71` 這種名字。
QR Code 沒差（掃了都能到），但**唸不出來、寫不上黑板、學生打錯字就進不來**。

**建議建站當下就用 `--name` 取好名字。** 已經建成亂碼的話，去後台改：

> Netlify 後台 → 選你的站 → **Domain management** → **Options** → **Edit site name**

改完網址立刻變成新的，**舊網址就失效了**——所以**改名要在印 QR Code 之前做完**。

## 2-4 正式部署（🔴 15 點，問過使用者才做）

草稿看過、確認沒問題，**才**執行：

```powershell
netlify deploy --prod --dir=.
```

> 🔴 **給 AI Agent**：這一行**要先問使用者**。
> 講法建議：「草稿看起來沒問題了。要正式發布嗎？**這會用掉 15 點，本月剩下的額度大約還能發布 N 次。**」
> 使用者說「好」才執行。**不准自己順手加 `--prod`。**

跑完印出的 **Website URL** 就是那個**永久網址**。

## 2-5 產生 QR Code

**現在**才產 QR Code（網址已經固定了）：

```
請用 02-file-toolkit 的工具，把 https://class-demo-wang01.netlify.app 產成 QR Code 圖檔
```

> 💡 沒做過 `02-file-toolkit` 也沒關係，任何線上 QR 產生器都行。重點是**網址要是正式的那一個**。

## 2-6 驗證（每一項都要看到）

| # | 做什麼 | 通過的樣子 |
|---|--------|-----------|
| 1 | 打開正式網址 | 網頁正常顯示，網址列有鎖頭（HTTPS） |
| 2 | 用**手機**（不同網路）打開同一個網址 | 一樣打得開 ← 這才證明是真的公開了 |
| 3 | 改一個字 → `netlify deploy`（草稿）→ 開草稿網址 | 看得到改動，**而正式網址還是舊的** |
| 4 | 再 `netlify deploy --prod` → 重整正式網址 | 改動出現，**而網址完全沒變** ← 這就是能印 QR 的原因 |
| 5 | 後台 → **Usage** | 看得到點數用掉多少、還剩多少 |

> 🔴 **第 5 項每次做完都要看一眼。** 這是本包唯一的煞車。

## 2-7 ⚠️ 備案：Netlify Drop（追進度用，不能印 QR）

有老師卡在安裝或註冊、追不上進度時，用這個讓他**先看到成果**：

開 <https://app.netlify.com/drop> → **把整個資料夾拖進去** → 30 秒後拿到一個網址。

| 好處 | 代價 |
|------|------|
| **免註冊、免安裝、免登入** | 🔴 **沒有認領的站，大約 1 小時後連站帶網址一起消失** |
| 30 秒就有畫面 | 不能用 CLI 更新，改版要整包重拖 |
| 卡住的老師不會被落下 | 🔴 **絕對不能印 QR Code**——下課前就死了 |

> 💡 **這是「讓他跟上這節課」的工具，不是「做出作品」的工具。**
> 課後還是要回頭把步驟一～二做完。
> 想留住 Drop 出來的站 → 在那一小時內註冊帳號並**認領（claim）**它。

---

# 步驟三【用途 B】用 Functions 把金鑰藏在後端

## 3-1 🔥 教學橋段（上）：先讓大家親眼看見金鑰

> **這一段是整個下午的靈魂。跳過它，後面的技術細節就只是「照著打指令」。**

**做法**：先做一個**故意寫錯**的版本，把金鑰直接寫在網頁裡。

```html
<script>
  // ⚠️⚠️⚠️ 這是「錯誤示範」，等一下就要把它拆掉 ⚠️⚠️⚠️
  const API_KEY = "gsk_這裡是我的金鑰";

  async function ask(q) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: q }]
      })
    });
    return (await res.json()).choices[0].message.content;
  }
</script>
```

**用草稿部署上去（0 點）**，然後帶著全班做這兩件事：

### 抓法一：看原始碼（一定看得到）

**F12** → **來源／Sources** 分頁 → 點開 `index.html` → **金鑰就在那裡，明碼**。

### 抓法二：看網路請求（更有衝擊力）

**F12** → **網路／Network** 分頁 → 在網頁上按一次送出 → 點那筆請求 → **標頭／Headers** →
往下找 **Request Headers** → 看到這一行：

```
authorization: Bearer gsk_這裡是我的金鑰
```

**投影出來，讓全班一起唸出來。**

> 🔴 **現場請把這句話講完整**：
> 「**這不是我設定沒做好，是前端網頁的本質。**
> 網頁的所有程式碼都要送到學生的瀏覽器上才能執行——
> 所以**寫在網頁裡的東西，全世界都看得到，沒有例外。**
> 沒有任何『加密一下』『混淆一下』能解決，那只是讓它多花三分鐘被抄走。」

### 🔴 三條現場紀律

1. **示範用的金鑰，用完當場作廢。** 它已經在投影幕上、在錄影裡、在三十支手機的照片裡了。
   示範結束就去服務商後台**撤銷（revoke）並重新產一把**。
   🔴 **刪掉檔案、刪掉部署沒有用。金鑰已經在別人手上了，換掉它才是唯一有效的處置。**
2. **壞範例只用草稿部署**（0 點），不要 `--prod`。
3. 🔴 **免費方案沒有金鑰外洩偵測。** Netlify 的「Smart secret detection」是 Personal（付費）方案才有的功能。
   也就是說：**你把金鑰寫死在網頁裡部署上去，Netlify 不會警告你、不會擋你、不會寄信給你。**
   **沒有安全網。這就是為什麼要靠紀律。**

## 3-2 資料夾結構（🔴 放錯位置就是不會動）

```
你的專案資料夾/
├── public/                    ← 網頁放這裡（要公開的東西）
│   └── index.html
├── netlify/
│   └── functions/             ← 🔴 函式一定要在這個路徑
│       └── ask-ai.mjs         ← 🔴 副檔名一定要 .mjs
└── netlify.toml               ← 設定檔
```

| 規則 | 為什麼 | 放錯的症狀 |
|------|--------|-----------|
| 函式必須在 `netlify/functions/` | 這是 Netlify 認得的預設路徑 | 部署成功，但呼叫函式回 **404** |
| 副檔名用 **`.mjs`** | 這樣才能用 `export default` 這種 ES module 寫法 | 部署時報 `Cannot use import statement outside a module` |
| 網頁放 `public/`、不要放根目錄 | 這樣**公開出去的只有 `public/` 裡的東西**，函式原始碼和設定檔不會混進去 | （不會壞，但版面會多出一堆不該公開的檔案）|

> 💡 `.mts` 也可以（TypeScript 版）。**老師用 `.mjs` 就好**，不用學 TypeScript。

## 3-3 完整最小範例（三個檔，可以直接用）

> ✅ 以下三段程式碼都通過 `node --check` 語法檢查。

### 檔案 1／3：`netlify.toml`

```toml
[build]
  publish = "public"
  functions = "netlify/functions"
```

這個檔的作用是**告訴 Netlify「網頁在哪、函式在哪」**，這樣以後部署就不用每次都打一長串參數。

### 檔案 2／3：`netlify/functions/ask-ai.mjs`（🔴 金鑰藏在這裡）

```js
// netlify/functions/ask-ai.mjs
// 前端呼叫這支函式；金鑰只存在 Netlify 伺服器上，前端永遠拿不到。

export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  if (req.method !== "POST") {
    return json({ error: "只接受 POST" }, 405);
  }

  // ① 從 Netlify 的環境變數拿金鑰（不是從前端拿）
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return json({ error: "伺服器還沒設定 AI_API_KEY" }, 500);
  }

  // ② 讀前端送來的問題
  let question = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").trim();
  } catch {
    return json({ error: "請求格式不對，要送 JSON" }, 400);
  }
  if (!question) {
    return json({ error: "問題是空的" }, 400);
  }
  if (question.length > 500) {
    return json({ error: "問題太長，請縮短到 500 字以內" }, 400);
  }

  // ③ 帶著金鑰去打外部 AI API
  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "你是國中小老師的教學助理。請用繁體中文回答，200 字以內。" },
        { role: "user", content: question }
      ]
    })
  });

  if (!upstream.ok) {
    // 錯誤細節只寫進伺服器日誌，不回給前端
    console.error("上游 API 錯誤：", upstream.status, await upstream.text());
    return json({ error: "AI 服務暫時無法使用，請稍後再試" }, 502);
  }

  const data = await upstream.json();
  const answer = data.choices?.[0]?.message?.content ?? "（沒有拿到回覆）";

  return json({ answer });
};

// ④ 自訂網址：前端就用 fetch("/api/ask-ai") 呼叫
export const config = { path: "/api/ask-ai" };
```

**這段程式碼的四個重點**：

| # | 程式碼 | 白話 |
|---|--------|------|
| ① | `process.env.AI_API_KEY` | **金鑰從伺服器的環境變數拿**，不在檔案裡、不在前端 |
| ② | `req.json()` | 收前端送來的問題。**有做基本檢查**：空的、太長的擋掉 |
| ③ | `Authorization: Bearer ${apiKey}` | **這一行在伺服器上執行**，學生的瀏覽器看不到 |
| ④ | `export const config = { path: "/api/ask-ai" }` | 幫這支函式取一個好記的網址 |

> 🔴 **`console.error` 那一行的用意**：外部 API 的錯誤訊息**有時候會把金鑰片段回吐**。
> 所以錯誤細節只寫進伺服器日誌（只有你看得到），前端只收到「暫時無法使用」。
> **不要為了好除錯就把 `upstream.text()` 直接回給前端**——那等於白做了。

> 💡 **換別家 API 只要改兩行**：③ 的網址、和 `model` 名稱。
> 只要是 OpenAI 相容格式的服務（Groq、OpenRouter、Together……）都是同一套。
> **申請金鑰不在本包範圍**（`09-groq-api` 寫好後會涵蓋）；手上有任何一把就能做這一段。

### 檔案 3／3：`public/index.html`

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>問問 AI</title>
</head>
<body>
  <h1>問問 AI</h1>
  <input id="question" placeholder="輸入你的問題" style="width:20em">
  <button id="send">送出</button>
  <pre id="answer" style="white-space:pre-wrap"></pre>

  <script>
    const btn = document.getElementById("send");
    const box = document.getElementById("question");
    const out = document.getElementById("answer");

    btn.addEventListener("click", async () => {
      const question = box.value.trim();
      if (!question) { out.textContent = "先輸入問題喔"; return; }

      btn.disabled = true;
      out.textContent = "思考中…";
      try {
        // ⬇️ 打的是「自己的網站」，不是外部 AI 服務。這裡沒有金鑰。
        const res = await fetch("/api/ask-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question })
        });
        const data = await res.json();
        out.textContent = data.answer ?? ("錯誤：" + (data.error ?? "未知"));
      } catch (err) {
        out.textContent = "連線失敗：" + err.message;
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>
```

> 🔴 **整份 `index.html` 裡沒有任何金鑰。** 這就是重點。
> `fetch("/api/ask-ai")` 開頭的那個 `/` 代表「**我自己這個網站**」——
> 學生的瀏覽器只知道要問你的網站，**完全不知道背後有哪一家 AI、用哪把金鑰。**

## 3-4 設定環境變數（兩種做法，都要會）

金鑰要放進 Netlify，**不是放進檔案**。兩條路，選一條。

### 做法 A：一個指令（適合 agent 執行）

```powershell
netlify env:set AI_API_KEY "gsk_你的金鑰" --secret
```

| 部分 | 說明 |
|------|------|
| `AI_API_KEY` | 變數名稱，要和函式裡 `process.env.AI_API_KEY` **一模一樣**（大小寫也要一樣）|
| `"..."` | 🔴 **金鑰用雙引號包起來**。不包的話，含特殊字元的金鑰會被 PowerShell 拆掉 |
| `--secret` | 標記為機密值，後台只會顯示遮蔽過的樣子 |

> 🔴 **要在有 `netlify link` 過的資料夾裡執行**（步驟 2-1）。
> 沒連結的話它會反問你要設哪個站，**agent 會卡在那個提問上**。

驗證：

```powershell
netlify env:list
```

看得到 `AI_API_KEY` 這個名字（值會被遮起來，這是正常的）= 過關。

### 做法 B：後台網頁（四步，老師回學校比較記得住）

1. Netlify 後台 → 點你的站
2. **Project configuration**
3. 左邊選 **Environment variables**
4. **Add a variable** → Key 填 `AI_API_KEY`、Value 貼金鑰 → 勾 **Contains secret values** → **Create**

> 💡 **研習現場兩種都示範一次。**
> 做法 A 快、可以交給 agent；**做法 B 是老師三個月後自己回來換金鑰時真正會用的那一個**——
> 因為那時候他大概已經忘記 CLI 指令了，但後台的按鈕還在原地。

### 🔴 一個好消息：改金鑰不用重新部署

Netlify 官方文件寫明：**Functions 範圍的環境變數，改了立刻生效，不需要重新部署。**

> 這件事**直接省你 15 點**。
> 金鑰打錯了、金鑰要換了、換一家 AI 服務商了——
> **只要改環境變數，不用 `--prod`。** 函式下一次被呼叫就會拿到新的值。
>
> （對照組：**建置期**的環境變數才需要重新部署。本包用不到那種。）

## 3-5 本機測試（0 點，先在這裡把錯誤都改完）

```powershell
netlify dev
```

它會在 `http://localhost:8888` 起一個**跟線上一模一樣的環境**：網頁、函式、環境變數全部都在。

**在這裡把功能測到好**——送出問題、看有沒有回答、看 F12 有沒有紅字。
**完全不上傳、完全不扣點。**

按 `Ctrl + C` 結束。

| 卡住的樣子 | 解法 |
|-----------|------|
| 函式回 404 | 檔案位置或副檔名錯了 → 回 3-2 對照 |
| 回 `伺服器還沒設定 AI_API_KEY` | 環境變數沒設，或**變數名稱拼錯**；或這個資料夾沒 `netlify link` |
| 回 `AI 服務暫時無法使用` | 金鑰無效／額度用完／模型名稱打錯。**看終端機的 `console.error` 那行**，真正的原因在那裡 |
| 連 `netlify dev` 都起不來 | 先 `netlify status` 確認登入和連結都在 |

## 3-6 部署（先草稿，再正式）

`netlify.toml` 已經寫好路徑了，所以指令很短：

```powershell
netlify deploy
```

> 💡 沒有 `netlify.toml` 的話要自己帶參數：
> `netlify deploy --dir=public --functions=netlify/functions`
> **🔴 少了 `--functions`，函式不會被上傳，線上就是 404。**

打開草稿網址，**完整測一次**（這次是真的線上環境，跟本機還是有差）。

確認沒問題**才**問使用者要不要正式發布：

```powershell
netlify deploy --prod
```

## 3-7 🔥 教學橋段（下）：再按一次 F12

> **這一刻就是整個下午的收尾。**

回到步驟 3-1 那個一模一樣的動作：**F12 → 網路／Network → 送出一個問題 → 點那筆請求**。

| 這次看到的 | |
|-----------|---|
| 請求的網址 | `https://<你的站名>.netlify.app/api/ask-ai` ← **是你自己的網站** |
| Request Headers | 🔴 **沒有 `Authorization`。沒有金鑰。什麼都沒有。** |
| Response | 只有一句 `{"answer":"..."}` |
| **來源／Sources 分頁** | 翻遍整份 `index.html`，**找不到任何金鑰** |

**請把這三句話講出來**：

> 1. 「**同一個功能，一模一樣的畫面。**」
> 2. 「**剛剛全班一起唸出來的那把金鑰，現在按到底也找不到了。**」
> 3. 「**因為它在伺服器上。學生的瀏覽器從來沒拿到過它。**」

> 🔴 **前後對比才是這一段的靈魂。**
> 只講「要用 Functions 藏金鑰」，老師點頭但不會做；
> **先讓他親眼看見金鑰裸奔、再親眼看見它消失**，這件事他一輩子記得。
> 所以**不要為了省時間跳過 3-1 的壞範例**——那才是這節課真正在教的東西。

## 3-8 驗證（每一項都要看到）

| # | 檢查 | 通過的樣子 |
|---|------|-----------|
| 1 | 網頁送出問題 | 有回答出現 |
| 2 | F12 → Network → 該請求的 Request Headers | **沒有 `Authorization` 這一項** |
| 3 | F12 → Sources → `index.html` 全文搜尋你的金鑰 | **找不到** |
| 4 | `netlify env:list` | 看得到 `AI_API_KEY` |
| 5 | 專案資料夾全文搜尋金鑰字串 | **一個檔案都搜不到**（金鑰只在 Netlify 上）|
| 6 | 後台 → **Usage** | 確認點數還夠 |

> 🔴 **第 5 項要真的做。**
> 常見狀況：老師測試時先把金鑰寫死在某個檔案裡，改成環境變數之後**忘了刪那一行**，
> 或是留在 `.env`、`test.html`、`備份.html` 裡然後一起部署上去。
>
> PowerShell 搜法（在專案資料夾執行）：
> ```powershell
> Get-ChildItem -Recurse -File | Select-String -Pattern "gsk_|sk-" | Select-Object Path, LineNumber
> ```
> **有結果就是還沒藏好。**

---

## 為什麼不用 Vercel

同類服務裡 Vercel 最有名，但本包**主線不走它**。三個理由，第一個最重要。

### ① 🔴 免費方案（Hobby）明文禁止商業用途，而「商業」的定義踩到老師

Vercel 的 Fair Use Guidelines 白紙黑字：Hobby 方案**限非商業的個人用途**。
而它對「商業使用」的定義包含——

> 任何對參與該專案製作的人產生財務利益的部署，**包括由受薪員工或顧問撰寫的程式碼**。

**老師是受薪員工。** 你在上班時間、為了教學做的網頁，**照字面就落在這個定義裡**。

這是**灰區**，不是「一定會被停權」。但：

> 🔴 **研習不能把三十位老師放進一個「條款上說不定不准」的位置。**
> 老師回學校自己判斷可以；但**台上教的東西必須是乾淨的**。

Netlify 的免費方案**沒有這條限制**——教學用途明確可用。這一條就足以決定主線。

### ② CLI 的第一次部署強制是正式部署

Vercel 官方文件寫明：**新專案的第一次部署一定是 production，就算你沒加 `--prod`。**

也就是說：**你沒有「先看看再決定」的機會。**
而本包整包的核心紀律就是「先草稿、確認、才正式」——這條路直接和它牴觸。

Netlify 相反：**不加 `--prod` 永遠是草稿**，你要多看幾次就看幾次。

### ③ 官方 MCP 目前是唯讀

Vercel MCP 現階段**只能讀**（查文件、看專案、看部署紀錄），**不能部署**。
所以就算裝了，agent 還是得走 CLI。多裝一層卻少一半功能。

### 那 Vercel 什麼時候可以用

當備案：Netlify 點數用完、或 Netlify 服務中斷時的臨時出口。

> 🔴 **但同一個專案不要換平台。**
> 換平台 = 換網址 = QR Code 要重印 = 已經貼出去的那些全部作廢。
> 真的要換，**在印 QR Code 之前換完**。

---

## 為什麼走 CLI，不走 MCP

前面幾包（`03-notebooklm`、`04-obsidian`）都在教 MCP，這一包卻叫你打指令。原因很實際：

| | MCP | **本包：CLI** |
|---|-----|--------------|
| 官方支援清單有 OpenCode 嗎 | 🔴 **Netlify 和 Vercel 的清單都沒有列 OpenCode**（列的是 Claude Code、Codex、Cursor、VS Code、Antigravity 等）| **不需要清單。CLI 就是個指令，誰都能執行** |
| 要 OAuth 授權嗎 | 要，而且**學校網路很會擋回呼** | 不用（`netlify login` 只做一次，之後 token 存在本機）|
| 壞掉的時候 | 「agent 說它沒有這個工具」——查起來很痛苦 | 指令直接印錯誤訊息出來，**貼給 agent 就能修** |
| 老師看得懂嗎 | 看不到發生什麼事 | **看得到每一行指令和結果**，這件事在教學上有價值 |

> 🔴 **「官方支援清單沒有列」不等於「一定不能用」**，但也不等於能用。
> 研習現場**不賭這種事**。CLI 是確定會動的那條路。

### 真的想試 MCP（自己在家玩，不要在研習現場）

| 方式 | 設定 |
|------|------|
| 遠端（官方建議） | `https://netlify-mcp.netlify.app/mcp` |
| 本機 | `npx -y @netlify/mcp`（需要 Node 22 以上）|

寫進 `~/.config/opencode/opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "netlify": {
      "type": "remote",
      "url": "https://netlify-mcp.netlify.app/mcp",
      "enabled": true
    }
  }
}
```

> 🔴 **務必自己先實測**：完全關閉 OpenCode 再重開 → `opencode mcp list` → 對它說「列出我的 Netlify 站台」。
> 列得出來才算通。**列不出來就回去用 CLI，不要在研習前一晚跟它耗。**
>
> ⚠️ 而且要記得：**MCP 也會部署，也會扣 15 點。**
> 交給 agent 用自然語言部署很爽，但它可能在你沒注意的時候做了正式部署。
> 用 MCP 的話，**點數紀律要講得比 CLI 更嚴。**

---

## 常見坑

| 症狀 | 原因 / 解法 |
|------|------------|
| `netlify.ps1 cannot be loaded because running scripts is disabled` | 🔴 PowerShell 執行原則。跑 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned`（見 1-3）。**每個新視窗都要重跑一次** |
| `The engine "node" is incompatible... Expected ">=22.13.0"` | Node 太舊。官方文件寫的 18.14 已過期，**以套件要求的 22.13 為準**。回 `00-env-setup` 升級 |
| 明明裝好了卻說 `netlify` 不是可辨識的指令 | `PATH` 沒更新。🔴 **關掉終端機、重開一個**再試 |
| 註冊後收不到驗證信 | 學校信箱擋掉了，而且不會退信。先看垃圾郵件 → 等 5 分鐘 → **直接改用個人 Gmail 重註冊**，不要等網管 |
| `npm install` 卡住或逾時 | 學校防火牆。請網管放行 `registry.npmjs.org` |
| `netlify login` 瀏覽器沒反應／授權完卡住 | 學校防火牆。請網管放行 `api.netlify.com`；先用手機熱點測一次確認是網路問題 |
| 部署成功但學生打不開網址 | 學校防火牆擋 `*.netlify.app`。請網管放行（**這條要事先請學校處理，現場來不及**）|
| `name is taken` | 站名全球唯一。加自己的代號：`class-demo-wang01` |
| `429 Too Many Requests` | 部署速率限制：**每分鐘 3 次、每天 100 次**。等一分鐘。🔴 **共用帳號一定會撞到這個**，一人一帳號 |
| 印出去的 QR Code 內容是舊的 | 🔴 印到**草稿網址**了。草稿網址每次部署都不同、而且凍結在當時那一版。只能印 `<站名>.netlify.app` |
| 改了站名，舊 QR Code 全失效 | 改名會換網址。**改名一定要在印 QR 之前做完** |
| Netlify Drop 的網站不見了 | 未認領的站約 1 小時後刪除。這是設計，不是故障。要留就在那一小時內註冊並認領 |
| 呼叫函式回 **404** | ① 檔案不在 `netlify/functions/`；② 部署時沒帶 `--functions`（或沒有 `netlify.toml`）；③ `config.path` 和前端 `fetch` 的路徑對不上 |
| `Cannot use import statement outside a module` | 副檔名不是 `.mjs`。改名就好 |
| 函式回「伺服器還沒設定 AI_API_KEY」 | ① 環境變數沒設；② **名稱拼錯或大小寫不同**；③ 這個資料夾沒 `netlify link` |
| `netlify env:set` 停在那裡不動 | 資料夾沒連結到站台，它在等你選。先 `netlify link --name <站名>` |
| 改了金鑰卻沒生效 | Functions 範圍的環境變數是**立即生效**的，不用重新部署。沒生效通常是**改到別的站**——用 `netlify status` 確認你在哪個站 |
| 點數還有 30 點，正式部署卻被擋 | 已知回報：歸零前就會被擋，官方未說明門檻。**不要規劃用到見底**，抓 15～18 次 |
| 網站突然全部顯示 `Site not available` | 🔴 點數用完。**免費方案不能加購**，只能等下一個帳單週期，或升級付費方案 |
| 點數掉得比想像快 | 看是不是**站上放了影片或大圖**（頻寬 20 點／GB），或是用了 **AI Gateway**（180 點 ≈ 1 美元） |
| 不小心把金鑰部署上去了 | 🔴 **立刻去服務商後台撤銷那把金鑰並重新產一把。** 刪檔案、刪部署、改成私有 repo **都沒有用**。而且免費方案**不會警告你**（沒有 secret detection）|
| 想串多個指令卻語法錯誤 | PowerShell 5.1 **不支援 `&&`**，改用 `;` |

---

## 🔒 安全紅線（三條）

### 紅線一：金鑰只能存在兩個地方

✅ **可以**：Netlify 的環境變數、你自己的密碼管理器。
❌ **不可以**：網頁檔案、GitHub（連私有 repo 都不要）、聊天視窗、投影片、`.env` 被一起部署。

### 紅線二：外洩的處置只有一種——換掉它

刪檔案、刪部署、改成私有、跟大家說「不要用喔」——**全部無效**。
🔴 **去服務商後台撤銷（revoke）並重新產生。這是唯一有效的動作。**

而且免費方案**沒有外洩偵測**，不會有人提醒你。**是你自己要記得。**

### 紅線三：函式不要把上游錯誤原封不動回給前端

外部 API 的錯誤訊息**有時候會回吐金鑰片段**。
範例裡用 `console.error` 寫進伺服器日誌、只回一句「暫時無法使用」給前端，就是為了這件事。

---

## ✅ 成功訊號（機器可判讀）

依序執行，agent 依規則判定：

```powershell
node --version                 # 要 >= 22.13.0
netlify --version              # 印得出版本號
netlify status                 # 要看得到帳號與站名
netlify env:list               # 要看得到金鑰的變數名稱（用途 B 才需要）
```

| 檢查項 | 通過條件 |
|--------|---------|
| `NL_NODE` | `node --version` >= `v22.13.0` |
| `NL_CLI` | `netlify --version` 印出版本號（Windows 需已解除執行原則）|
| `NL_LOGIN` | `netlify status` 顯示已登入的帳號 |
| `NL_LINK` | `netlify status` 顯示已連結的站名 |
| `NL_DRAFT` | `netlify deploy` 成功，草稿網址打得開 |
| `NL_PROD` | `netlify deploy --prod` 成功，正式網址打得開（**須經使用者同意才執行**）|
| `NL_URL_STABLE` | 連續兩次 `--prod`，正式網址字串完全相同 |
| `NL_FN_200` | `curl.exe -X POST <正式網址>/api/ask-ai -H "Content-Type: application/json" -d "{\"question\":\"測試\"}"` 回 HTTP 200 且含 `answer` |
| `NL_ENV` | `netlify env:list` 含該變數名稱 |
| `NL_NO_KEY_IN_REPO` | 專案資料夾全文搜尋金鑰字串，**零命中** |
| `NL_NO_KEY_IN_BROWSER` | F12 → Network 的請求標頭**不含 `Authorization`** |
| `NL_CREDITS` | 後台 Usage 頁面剩餘點數已記錄並回報 |

最後輸出這一段（沒做的填 `SKIP`，失敗填 `FAIL:<原因>`）：

```
NETLIFY_PACK_STATUS=OK
NL_NODE=OK
NL_CLI=OK
NL_LOGIN=OK
NL_LINK=OK
NL_DRAFT=OK
NL_PROD=OK
NL_URL_STABLE=OK
NL_FN_200=OK
NL_ENV=OK
NL_NO_KEY_IN_REPO=OK
NL_NO_KEY_IN_BROWSER=OK
NL_CREDITS=OK
```

> 🔴 **`NL_NO_KEY_IN_REPO` 或 `NL_NO_KEY_IN_BROWSER` 任一為 `FAIL`，`NETLIFY_PACK_STATUS` 就必須是 `FAIL`。**
> 這兩項就是整個用途 B 的意義所在。**不准跳過、不准「先繼續之後再補」。**
>
> 🔴 **`NL_PROD` 沒有使用者明確同意就不准執行**，未執行時填 `SKIP`，不算失敗。

---

## 完成回報格式

```md
## Netlify 部署結果

### 點數（🔴 每次都要回報）
- 本次正式部署（--prod）次數：<N> 次 → 消耗 <N×15> 點
- 草稿部署次數：<N> 次 → 0 點
- 後台 Usage 顯示剩餘點數：<剩餘>/300
- 本月估計還能正式部署：<約 N 次>（建議抓 15～18 次上限，不要用到見底）

### 環境
- Node.js：<版本>（需 >= 22.13.0）：PASS / FAIL
- netlify-cli：<版本>：PASS / FAIL
- Windows 執行原則已解除（本次視窗）：是 / 否 / 非 Windows
- 帳號：<email>　一人一帳號：是 / 否

### 用途 A：網頁部署
- 站名：<站名>
- 正式網址：https://<站名>.netlify.app
- 草稿網址（🔴 不可印 QR）：<url>
- 網址穩定性驗證（NL_URL_STABLE）：PASS / FAIL
- QR Code 已產生：是 / 否　→ 用的是**正式**網址：是 / 否

### 用途 B：Functions 藏金鑰
- 函式檔案：`netlify/functions/<名稱>.mjs`
- 對外路徑：`/api/<名稱>`
- 環境變數名稱：<KEY_NAME>（值未記錄，也不應記錄）
- 函式端對端測試（NL_FN_200）：PASS / FAIL / SKIP
- 🔴 專案內全文搜尋金鑰（NL_NO_KEY_IN_REPO）：PASS / FAIL
- 🔴 瀏覽器請求標頭無 Authorization（NL_NO_KEY_IN_BROWSER）：PASS / FAIL
- F12 前後對比教學橋段已完成：是 / 否 / 不適用
- 示範用的金鑰已作廢並換新：是 / 否 / 未做示範

### 安全確認
- 已告知「免費方案沒有金鑰外洩偵測，不會警告你」：是 / 否
- 已告知「金鑰外洩唯一處置是撤銷重產」：是 / 否
- 站台內沒有影片、大圖等會吃頻寬點數的檔案：是 / 否

### 待處理
- <把 FAIL 的項目與原因列在這裡；全部 PASS 就寫「無」>
```

---

## 如果做壞了，怎麼重來

> 💡 **好消息：重來不用花點數。** 草稿部署、失敗的部署、回滾，全都是 0 點。

| 想重來的東西 | 做法 | 點數 |
|-------------|------|------|
| 這一版正式站爛掉了，想退回上一版 | 後台 → **Deploys** → 找到上一個好的版本 → **Publish deploy** | **0 點** |
| 資料夾連錯站台 | `netlify unlink` 再 `netlify link --name <正確站名>` | 0 點 |
| 站名取壞了（還沒印 QR）| 後台 → Domain management → Options → **Edit site name** | 0 點 |
| 環境變數設錯 | `netlify env:unset <KEY>` 再重設。**不用重新部署** | 0 點 |
| 金鑰外洩了 | 🔴 去 **AI 服務商**後台撤銷重產 → `netlify env:set` 更新 → **不用重新部署** | 0 點 |
| 整個站不要了 | 後台 → Project configuration → General → 最下面 **Delete project** | 0 點 |
| CLI 登入壞了 | `netlify logout` 再 `netlify login` | 0 點 |

> 🔴 **回滾是 0 點，這件事要記住。**
> 正式站發現有錯時，**不要**「趕快改一改再 `--prod` 上去」（那是 15 點）。
> **先回滾到上一版（0 點）**，把畫面救回來，然後慢慢在草稿上改到好，最後才發布一次。

---

## 下一步

- 網頁要存資料（報名、繳交、點名）→ **`05-sheets-gas`**
- 網頁要多人同時寫（文字雲、搶答、即時排行榜）→ **`06-supabase`**
- 專案要備份、要換電腦接得回來 → **`07-github`**
- 要把正式網址做成 QR Code → **`02-file-toolkit`**

> 📌 **本包和 `07-github` 的分工**：
> GitHub 存**原始碼**（改壞了救得回來），Netlify 負責**上線**（外面的人打得開）。
> 兩個都做，才是完整的：**程式碼有備份、網址可以印。**
