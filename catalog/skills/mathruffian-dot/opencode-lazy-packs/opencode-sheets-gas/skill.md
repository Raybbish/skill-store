---
name: opencode-sheets-gas
description: 用 Google 試算表當資料庫、Apps Script 網頁應用程式當後端，讓網頁作品「關掉還記得住」。零安裝、不用 clasp、不用 Node。說「用試算表存資料」「GAS 後端」「表單收資料」「讓網頁能存東西」「做課堂回饋牆」「做線上報名表」時載入。
---

# Google Sheets ＋ Apps Script 網頁應用程式（懶人包 #05）

前面幾包做出來的網頁，關掉就什麼都沒了。
這一包讓作品**記得住事情**：學生填的、投的、交的，全部進到一份 Google 試算表。

---

## 這包負責什麼、不負責什麼

**負責**

- 用一份 Google 試算表當資料庫
- 用 Apps Script 的「網頁應用程式」同時當**前端網頁**和**後端**
- 部署成一個學生可以直接開的網址，縮短並產出 QR Code
- 改版之後**網址不變**（QR Code 不用重印）

**不負責**

- 多人**即時**同步（文字雲、搶答、即時排行榜）→ 見下方「什麼時候不該走這條路」
- 學生登入、身分驗證、成績系統
- clasp、Node.js、任何要在電腦上安裝的東西——**這包全程零安裝**

---

## ⚠️ 先講清楚：這包為什麼不用 clasp

網路上大多數的 GAS 教學都在教 `clasp`（Google 官方的命令列工具，可以把本機的程式碼推上 Apps Script）。
本包**刻意不走那條路**。理由不是「clasp 不好」，是**研習現場會塞死**。

| | clasp 路線 | 本包：網頁應用程式路線 |
|---|---|---|
| 要裝東西嗎 | 要 Node.js（版本要求會隨 clasp 改版往上抬）、要 `npm install` | **完全不用裝** |
| 要開額外設定嗎 | 要去 `script.google.com/home/usersettings` 手動打開 Apps Script API，**還要等幾分鐘才生效** | 不用 |
| 會有憑證檔嗎 | 會（`~/.clasprc.json`），是個不小心就會被 commit 上 GitHub 的東西 | **沒有任何憑證檔** |
| 學校 Google 帳號能用嗎 | **常常不行**。管理員擋掉第三方應用程式時會噴 `admin_policy_enforced`，或直接顯示「你無權存取這項服務」 | **可以**。老師自己寫的腳本屬於自己帳號的內部腳本，不是第三方應用程式，不吃那條政策 |
| Windows 會卡嗎 | 會。PowerShell 執行原則預設會擋掉全域安裝出來的 `clasp.ps1` | 不會，根本沒有指令要跑 |
| 改版之後網址 | 要記得更新同一個部署作業，指令打錯就換網址 | 在網頁上點「編輯 → 新版本」，**網址不變** |

**決定性的那一條**：`admin_policy_enforced` 的修復步驟有一半只有學校網管做得到——老師本人在現場**無解**。
一班二十幾位老師，只要有三五位用學校 Google Workspace 帳號，整場研習就會停在那裡等網管回信。

> 📌 如果你是自己在家慢慢玩、而且用個人 Gmail，clasp 是個好工具。
> 但**研習現場、多人同時做**的場合，本包一律走網頁應用程式路線。

---

## 先確認：你真的需要資料庫嗎？

動手之前先誠實回答這三題。答錯方向，後面白做。

| 問題 | 如果答「是」 |
|------|-------------|
| 我只是要**收一份表單**（報名、回饋、繳交連結），不需要自訂畫面 | **去用 Google 表單就好**，零程式。回覆本來就會自動寫進試算表 |
| 我要的是**大家同時看到別人剛剛送出的東西**（文字雲、搶答、即時排行榜） | 這條路會卡。往下看「什麼時候不該走這條路」 |
| 我要**自訂的網頁畫面**，而且送出的東西要留下來、下次打開還在 | ✅ 這一包就是為你寫的，繼續往下 |

> 💬 給 Agent：使用者說「我想做一個收資料的網頁」時，**先問這三題**，不要直接開始寫 GAS。
> 有一半的情況答案是「Google 表單」，那樣他今天就能收工。

---

## 整條路長什麼樣

```
OpenCode 在你電腦上產出兩個檔      你在瀏覽器上做的事
┌──────────────────────┐        ┌───────────────────────────┐
│  Code.gs   （後端）   │        │  貼進 Apps Script 編輯器   │
│  index.html（前端）   │  ───▶  │  儲存 → 執行一次（授權）    │
└──────────────────────┘        │  部署 → 網頁應用程式        │
                                └───────────┬───────────────┘
                                            ▼
                            https://script.google.com/macros/s/xxx/exec
                                            │
                          ┌─────────────────┴─────────────────┐
                          ▼                                   ▼
                   學生用手機掃 QR 開網頁              資料寫進你的 Google 試算表
```

**關鍵理解**：那個 `/exec` 網址**同時是網頁、也是後端**。
不是「網頁放這裡、資料庫放那裡」，是同一個東西。這就是它不會出問題的原因。

---

## 為什麼不把前端放 GitHub Pages？（架構決策）

很多人的直覺是：前端放 GitHub Pages 做得漂亮一點，用 `fetch()` 去打 GAS 的網址存取資料。
**不要這樣做。** 你會撞上 CORS。

發生什麼事：

1. 瀏覽器看到「A 網站的 JS 要打 B 網站的 API」，而且帶了 `Content-Type: application/json`
2. 於是它先送一個 **OPTIONS 預檢請求（preflight）** 去問 B 網站「你准我打嗎」
3. **Apps Script 不回應 OPTIONS**——它只有 `doGet` 和 `doPost`
4. 預檢失敗，你的 `fetch` 連送都沒送出去就被瀏覽器擋下

有變通做法（把 `Content-Type` 改成 `text/plain;charset=utf-8` 讓瀏覽器不做預檢，後端再用 `JSON.parse(e.postData.contents)` 自己解），能動，但你多了一層永遠要記得的規矩，而且錯了不會有明顯錯誤訊息，只會「沒反應」。

**更簡單的做法**：前端直接由 GAS 的 `HtmlService` 提供。

```
前端和後端在同一個網域       →  沒有跨網域
用 google.script.run 溝通    →  根本不走 HTTP 請求，沒有預檢
                            →  CORS 這個詞你今天可以不用學
```

代價是你不能用 GitHub Pages 那套熟悉的部署方式。
但對「一份課堂用的收資料網頁」來說，這個交換非常划算。

---

## 先備條件

- [ ] 已完成 `00-env-setup` 與 `01-connect-model`（OpenCode 要能動）
- [ ] 有一個 **Google 帳號**
- [ ] 瀏覽器（Chrome / Edge 都可以）
- [ ] **沒有**任何要安裝的東西 ✅

> 🚨 **研習現場請一律用個人 Gmail，不要用學校的 Google Workspace 帳號。**
> 原因見下方「三個卡關點」的第二點。這是本包成敗的第一條。

---

## ⛔ 給 AI Agent 的六條規則

1. **不要試圖幫使用者點瀏覽器**。授權、部署都在 Google 的網頁上，agent 只負責產出檔案、**唸步驟給使用者聽、等他回報**。
2. **不要代填任何 Google 帳號資訊**，不要要求使用者把密碼、驗證碼貼給你。
3. **不要在程式碼裡硬寫使用者的試算表 ID、Email、部署 ID** 之後又叫他上傳 GitHub。要上傳前先提醒他這些是什麼。
4. **每一步都要等使用者回報看到什麼畫面**再往下。GAS 的錯誤幾乎都是「上一步沒真的完成」。
5. **不要主動教 clasp**，除非使用者明確說他要用。理由見上方對照表。
6. **看到使用者想收學生真名、身分證字號、家長電話——停下來**，唸「資料保護」那一段給他聽。

---

# 請 OpenCode 依序執行以下步驟

---

## 步驟一：建一份當資料庫的試算表

🖐️ **這步使用者自己做**（agent 唸步驟）：

1. 開 <https://sheets.google.com>，建立一份新的試算表
2. 命名，例如「課堂回饋資料庫」
3. 左下角的分頁名稱改成 **`回覆`**（等一下程式會找這個名字；程式也會自動建，但先改好比較不會亂）
4. 第一列打上標題：`時間`、`暱稱`、`內容`

**驗證**：試算表的第一列有三個欄位標題，分頁叫「回覆」。

> 💡 欄位設計的一條原則：**第一欄永遠放時間戳記**。
> 之後不管你要排序、篩掉測試資料、還是找「上禮拜那節課的回饋」，都靠它。
> 事後才想加，前面的資料就沒有了。

---

## 步驟二：打開 Apps Script 編輯器

有兩條路，**推薦路線 A**。

### 路線 A：從試算表開（推薦，少一個出錯機會）

在剛剛那份試算表上：**擴充功能 → Apps Script**

好處：腳本跟試算表綁在一起，程式裡**不用填試算表 ID**——少一個「複製錯網址」的坑。

### 路線 B：從 script.google.com 開新專案

1. 開 <https://script.google.com>
2. 左上角「新增專案」
3. 這種寫法叫「獨立腳本」，程式裡**要填試算表 ID**

試算表 ID 是網址中間那一段，**不是整條網址**：

```
https://docs.google.com/spreadsheets/d/1AbC...這一段才是ID...XyZ/edit#gid=0
                                      └──────────┬──────────┘
                                            只複製這一段
```

**驗證**（兩條路共通）：你看到一個叫 `Code.gs` 的檔案，裡面有一段 `function myFunction() {}`。
把專案名稱從「未命名的專案」改成看得懂的名字，例如「課堂回饋後端」。

---

## 步驟三：貼上後端程式碼 `Code.gs`

🤖 **這段由 OpenCode 產出**，使用者只負責複製貼上。

把編輯器裡 `Code.gs` 原本的內容**全部刪掉**，換成下面這份：

```javascript
/**
 * 課堂回饋 —— 後端
 * 這份檔案做三件事：
 *   1. doGet        有人打開網址時，把 index.html 這個網頁送出去
 *   2. submitFeedback  前端按「送出」時，把一筆資料寫進試算表
 *   3. listFeedback    前端載入時，把最新幾筆讀回來顯示
 */

const SHEET_NAME = '回覆';   // 要跟試算表左下角的分頁名稱一模一樣

/** 有人打開網址 → 回傳網頁 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('課堂回饋')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** 前端呼叫：寫入一筆 */
function submitFeedback(data) {
  // 全班同時按送出時，用鎖排隊，避免兩個人寫到同一列互相蓋掉
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);   // 最多等 10 秒
  } catch (err) {
    return { ok: false, error: '現在同時送出的人太多，請過幾秒再按一次' };
  }

  try {
    const message = String(data.message || '').trim().slice(0, 500);
    if (!message) {
      return { ok: false, error: '內容不能空白' };
    }
    const nickname = String(data.nickname || '').trim().slice(0, 20) || '匿名';

    const sheet = getSheet_();
    sheet.appendRow([new Date(), nickname, message]);
    return { ok: true, count: sheet.getLastRow() - 1 };
  } finally {
    lock.releaseLock();   // 不管成功失敗都要放開，否則後面的人會一直等
  }
}

/** 前端呼叫：讀最新 20 筆（新的在上面） */
function listFeedback() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];               // 只有標題列 = 還沒有資料

  const start = Math.max(2, lastRow - 19);
  const rows = sheet.getRange(start, 1, lastRow - start + 1, 3).getValues();

  return rows.reverse().map(function (r) {
    const t = (r[0] instanceof Date) ? r[0] : new Date(r[0]);
    return {
      // ⚠️ 一定要轉成字串再回傳，google.script.run 傳不了 Date 物件
      time: Utilities.formatDate(t, 'Asia/Taipei', 'MM/dd HH:mm'),
      nickname: String(r[1]),
      message: String(r[2])
    };
  });
}

/** 內部用：拿到工作表，沒有就自動建一個並補上標題列 */
function getSheet_() {
  // 路線 A（從試算表的「擴充功能」開的）用這行：
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 路線 B（從 script.google.com 開的獨立腳本）改成這行，並填入你的試算表 ID：
  // const ss = SpreadsheetApp.openById('把試算表 ID 貼在這裡');

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['時間', '暱稱', '內容']);
  }
  return sheet;
}

/** 只給老師手動執行一次，用來觸發授權畫面（見步驟五） */
function 一鍵授權() {
  const sheet = getSheet_();
  Logger.log('工作表就緒：' + sheet.getName() + '，目前有 ' + (sheet.getLastRow() - 1) + ' 筆資料');
}
```

按 **儲存**（磁片圖示，或 `Ctrl` + `S`）。

**驗證**：編輯器上方的函式下拉選單裡，看得到 `doGet`、`submitFeedback`、`listFeedback`、`一鍵授權`。
如果下拉選單是空的或只有一個 → 程式碼有語法錯誤，往下捲看紅色波浪底線。

> 🔍 **函式名稱結尾的底線是什麼？** `getSheet_()` 這種寫法在 GAS 代表「私有函式」——
> 它不會出現在部署選單裡，前端也叫不到。這是刻意的，避免學生從網頁直接呼叫內部函式。

---

## 步驟四：新增前端網頁 `index.html`

在編輯器左側「檔案」旁邊按 **`+` → HTML**。

檔名輸入 **`index`**（**不要打 `.html`**，編輯器會自己補；打了會變成 `index.html.html`，然後 `doGet` 就找不到它）。

把預設內容全部刪掉，換成：

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, "Noto Sans TC", sans-serif;
           max-width: 640px; margin: 0 auto; padding: 16px; line-height: 1.6; }
    input, textarea, button { width: 100%; font-size: 16px; padding: 10px;
                              margin-top: 8px; box-sizing: border-box;
                              border: 1px solid #ccc; border-radius: 6px; }
    button { background: #1a73e8; color: #fff; border: 0; cursor: pointer; }
    button:disabled { opacity: .5; cursor: wait; }
    #status { min-height: 1.5em; color: #1a7f37; }
    ul { padding: 0; }
    li { list-style: none; border-bottom: 1px solid #eee; padding: 10px 0; }
    .meta { color: #666; font-size: 13px; }
  </style>
</head>
<body>
  <h2>課堂回饋</h2>

  <input id="nickname" placeholder="暱稱（可以留白）" maxlength="20">
  <textarea id="message" rows="3" placeholder="想說的話" maxlength="500"></textarea>
  <button id="send">送出</button>
  <p id="status"></p>

  <h3>最新回覆</h3>
  <ul id="list"></ul>

  <script>
    // ⚠️ 前端 JS 一定要寫在這裡（index.html 的 script 區塊裡）
    //    絕對不要另存成 .gs 檔，那會被當成伺服器程式執行然後爆掉
    var $ = function (id) { return document.getElementById(id); };

    function show(text) { $('status').textContent = text; }
    function lock(on)  { $('send').disabled = on; }

    function send() {
      var message = $('message').value.trim();
      if (!message) { show('內容不能空白'); return; }

      lock(true);
      show('送出中…');

      google.script.run
        .withSuccessHandler(function (res) {
          lock(false);
          if (res && res.ok) {
            $('message').value = '';
            show('已送出，目前共 ' + res.count + ' 筆');
            load();
          } else {
            show('送出失敗：' + ((res && res.error) || '未知原因'));
          }
        })
        .withFailureHandler(function (err) {
          lock(false);
          show('送出失敗：' + err.message);
        })
        .submitFeedback({
          nickname: $('nickname').value,
          message: message
        });
    }

    function load() {
      google.script.run
        .withSuccessHandler(function (rows) {
          var ul = $('list');
          ul.innerHTML = '';
          rows.forEach(function (r) {
            var li = document.createElement('li');
            var meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = r.nickname + '　' + r.time;
            var body = document.createElement('div');
            // 用 textContent 不用 innerHTML，學生打進來的東西不會被當成程式執行
            body.textContent = r.message;
            li.appendChild(meta);
            li.appendChild(body);
            ul.appendChild(li);
          });
        })
        .withFailureHandler(function (err) { show('讀取失敗：' + err.message); })
        .listFeedback();
    }

    $('send').addEventListener('click', send);
    load();
  </script>
</body>
</html>
```

按 **儲存**。

**驗證**：左側檔案清單有兩個檔：`Code.gs` 和 `index.html`。名字錯了現在改還來得及。

> 🧩 `google.script.run.submitFeedback(...)` 這行在做的事：
> 呼叫 `Code.gs` 裡**同名的那個函式**。名字打錯不會有錯誤訊息，只會「按了沒反應」。
> 前端後端的函式名字必須**一字不差**。

---

## 步驟五：手動執行一次，完成授權

**這一步不能跳過。** 沒授權的話，部署出去的網址學生一打開就是錯誤頁。

1. 編輯器上方的函式下拉選單，選 **`一鍵授權`**
2. 按 **執行**
3. 跳出「需要授權」→ 按 **審查權限**
4. 選你的 Google 帳號
5. **會跳出一個很嚇人的畫面**（見下方「卡關點 1」）→ 按 **進階** → **前往「你的專案名稱」（不安全）**
6. 按 **允許**

**驗證**：編輯器下方的「執行紀錄」出現：

```
工作表就緒：回覆，目前有 0 筆資料
```

看到這行 = 授權完成、程式碼能讀到試算表。**兩件事一次驗證掉。**

> ⚠️ **之後如果你在程式裡加了新功能**（例如寄 Gmail、寫行事曆），
> 那是新的權限，**要再手動執行一次重新授權**。
> 症狀：學生端突然全部壞掉，你在編輯器裡卻一切正常。

---

## 步驟六：部署成網頁應用程式

1. 右上角 **部署 → 新增部署作業**
2. 左邊齒輪「選取類型」→ **網頁應用程式**
3. 填寫：

| 欄位 | 選什麼 | 為什麼 |
|------|--------|--------|
| 說明 | 隨便寫，例如「第一版」 | 只是給你自己看的標籤 |
| 執行身分 | **我（你的信箱）** | 學生沒有你的試算表權限。選「我」= 用**你的身分**去寫資料，學生不用登入、試算表也可以維持私有 |
| 誰可以存取 | **所有人** | 學生不必登入 Google 就能打開 |

> 畫面上的文字可能與這裡略有出入（Google 會調整）。認關鍵字就好：**執行身分選「我」、存取權選「所有人」**。

4. 按 **部署**
5. 複製 **網頁應用程式網址**，長這樣：

```
https://script.google.com/macros/s/AKfycb.../exec
                                          └─┬─┘
                                     結尾一定是 exec
```

**驗證**：你手上有一條 `/exec` 結尾的網址。

> 🚨 **編輯器裡另外那條 `/dev` 結尾的網址不要發給學生。**
> `/dev` 只有**有編輯權限的人**打得開，而且永遠跑最新的草稿。
> 老師自己測沒問題、學生一開就「你沒有存取權」——十次有八次是複製到 `/dev`。
> **發出去的一定是 `/exec`。**

---

## 步驟七：用無痕視窗實測（不要跳過）

🖐️ 開一個**無痕視窗**（`Ctrl` + `Shift` + `N`），貼上 `/exec` 網址。

為什麼一定要無痕：你的瀏覽器現在登著自己的 Google 帳號，**你測到的不是學生看到的東西**。
而且同時登入多個 Google 帳號時，GAS 常常把請求送到錯的帳號，出現莫名其妙的權限錯誤。
無痕視窗 = 乾淨、沒有登入、跟學生的手機同一個狀態。

依序測：

1. 網頁打得開，看得到輸入框
2. 打一句話按送出 → 出現「已送出，目前共 1 筆」
3. 下方「最新回覆」立刻多一列
4. 切回試算表 → **第 2 列真的有那筆資料**，時間戳記正確

四項全過才算通。任一項掛掉，到下方「常見坑」對照。

---

## 步驟八：縮網址 ＋ QR Code

那條 `/exec` 網址又長又醜，沒有人抄得起來。

### 產 QR Code（推薦：本機產，不外送）

如果做過 `02-file-toolkit`，你電腦上已經有 Python 的 `qrcode` 套件。
直接對 OpenCode 說：

```
幫我用 qrcode 套件，把這條網址做成 QR Code 圖檔，存到桌面：
https://script.google.com/macros/s/.../exec
```

好處：網址不會經過任何第三方服務。

### 縮網址（選用）

需要口頭唸給學生打的時候才需要。可以用免註冊的縮網址服務，或直接把 QR 投影出來就好。

> 🔒 **送出去之前想一下**：縮網址服務會知道你這條網址。
> 網址本身不含密碼，但它是你作品的入口——**已經收了資料的頁面，網址就不要再拿去外部服務轉一手**。

---

# 🔁 改版不換網址（本包最重要的一頁）

老師最怕的事：QR Code 印在講義上發下去了，改個錯字結果**網址變了**。

**改完程式碼之後，正確的操作是：**

```
部署  →  管理部署作業  →  找到那筆部署，按右上角的鉛筆（編輯）
      →  「版本」下拉選單選【新版本】
      →  部署
```

網址**完全不變**。QR Code 繼續有效。學生手上的講義不用重印。

**錯誤的操作（會換網址）：**

```
部署  →  新增部署作業     ← ❌ 這是「再開一個全新的」，會給你一條新網址
```

| 你要做什麼 | 走哪條 | 網址 |
|-----------|--------|------|
| 改錯字、加功能、修 bug | 管理部署作業 → 編輯 → 新版本 | **不變** ✅ |
| 同一份程式碼要給兩個班用不同入口 | 新增部署作業 | 換新的 |

> 💡 **記法**：鉛筆 = 改這一個；「新增部署作業」= 再生一個。
> 研習前先自己走一次「改個字 → 編輯 → 新版本 → 部署 → 無痕重開」，確認網址真的沒變，你才敢在台上講。

> ⚠️ 重新部署後，如果無痕視窗看到的還是舊畫面，按 `Ctrl` + `F5` 強制重新載入。
> 這是瀏覽器快取，不是部署失敗。

---

# 🚨 三個一定會遇到的卡關點

研習開始前**先講**這三件事，不要等它發生。

## 卡關點 1：授權時跳「Google 尚未驗證這個應用程式」

**畫面長這樣**：一個灰底、有警告符號的頁面，寫著「這個應用程式未經 Google 驗證」，
只有一個看起來很兇的「返回安全性頁面」按鈕。

**老師的第一反應是關掉視窗。** 所以要先講。

**正確操作**：

```
點左下角很小的【進階】
  → 點【前往「你的專案名稱」（不安全）】
    → 點【允許】
```

**為什麼不用怕**：這個「應用程式」就是**你自己五分鐘前寫的那份腳本**。
Google 的驗證流程是給要上架給全世界用的軟體走的，你自己的腳本沒送審，所以它不認得——
它警告的是「Google 不認識這支程式」，不是「這支程式有問題」。
你在授權的對象，是你自己。

> 🗣️ 台上這樣講：「等一下會出現一個很嚇人的紅字畫面，那是正常的。
> 那支它說不安全的程式，就是你剛剛自己寫的那一份。請按『進階』，再按『前往（不安全）』。」

## 卡關點 2：學校 Workspace 帳號可能看不到「所有人」

**症狀**：部署設定裡的「誰可以存取」下拉選單，**只有**「只有我」和「◯◯學校的所有人」，
**沒有**「所有人」這個選項。

**原因**：學校的 Google 管理員限制了對外分享。這是機構政策，**老師本人改不了**。

**後果**：校外的人、學生用家裡的帳號、家長——**全部打不開**。研習現場最常見的死法。

**解法**：

| 情境 | 做法 |
|------|------|
| 研習現場 | **一律用個人 Gmail 帳號做**。不要用學校帳號 |
| 回學校要正式上線 | 如果學生都有學校帳號，選「◯◯學校的所有人」也可以用 |
| 需要對校外開放 | 只能請學校網管調整政策，或改用個人帳號 |

> 🚨 **這條是本包最該提早講的一句話**：
> 「今天請大家先用**個人的 Gmail** 登入 Google 試算表。用學校帳號的話，
> 你等一下部署會發現少一個選項，然後我們全班要停下來等網管。」

## 卡關點 3：多帳號登入造成 session 衝突

**症狀**：網頁時好時壞、跳出莫名其妙的權限錯誤、或一直轉圈。
你把網址傳給旁邊的人卻正常。

**原因**：瀏覽器同時登入多個 Google 帳號（例如個人 Gmail ＋ 學校帳號）時，
GAS 有時會把請求算到錯的帳號頭上。

**解法**：**一律用無痕視窗實測**。

這條也適用於你日常的除錯：**只要行為很怪，先開無痕再說**。
八成的「怪事」在無痕視窗裡就消失了。

---

## 🔒 資料保護：什麼不該放進去

這份試算表在你的雲端硬碟裡，但那個 `/exec` 網址**任何拿到的人都能打開**。
網址被轉貼出去，就等於誰都能送資料進來。

**不要收**：

- ❌ 學生真實姓名、身分證字號、生日
- ❌ 家長姓名、電話、Email、住址
- ❌ 成績、輔導紀錄、健康狀況、家庭狀況
- ❌ 任何你不希望被截圖轉貼的內容

**可以收**：

- ✅ 座號 ＋ 班級代號（去識別化，你自己對得回來就好）
- ✅ 暱稱、代號
- ✅ 對課程內容的回饋、答案、投票
- ✅ 作品連結

**還有這些習慣**：

| 做法 | 為什麼 |
|------|--------|
| 試算表本身**維持私有**，不要設成「知道連結的任何人可編輯」 | 部署時選了「執行身分：我」，GAS 是用**你的身分**寫入的。試算表根本不需要對外開放——很多人誤以為要，結果把整份資料公開了 |
| 活動結束後，把部署**停用** | 部署 → 管理部署作業 → 封存。網址就失效了 |
| 資料收完，另存一份備份再清空 | 下次上課重用同一個網址，但不要跟上次的資料混在一起 |
| 網址不要放進公開的 GitHub repo | 那條網址等於一支對外開放的資料入口 |

> 💬 給 Agent：使用者要求收姓名或電話時，**先停下來**把上面這張表唸給他聽，
> 建議改成「座號 ＋ 班級代號」，等他回覆再繼續。不要默默照做。

---

## ⛔ 什麼時候不該走這條路

這條路很好用，但它有明確的天花板。**踩到下面任何一條，換路。**

| 你的需求 | 為什麼這條路不行 | 改走哪裡 |
|---------|-----------------|---------|
| **多人即時同步**：文字雲、線上對戰、即時排行榜、全班搶答 | Google 試算表寫入有延遲，而且每次寫入都要排隊。**大約十幾個人同時寫就會開始卡**，全班三十人一起按送出，後面的人會等到超時 | **`06-supabase`**（即時資料庫）。加碼路線 `extras/firebase` 也是同一類做法 |
| **只是要收表單**，不需要自訂網頁畫面 | 你根本不需要寫任何程式 | **Google 表單**。回覆自動進試算表，零程式、零部署、零踩坑 |
| 要存**大量**資料（幾萬列以上）、要複雜查詢 | 試算表不是資料庫，資料一多讀取就會慢到不能用 | 真正的資料庫（超出本研習範圍） |
| 要**上傳檔案**（照片、作業檔） | 可以做但很麻煩，而且容易踩到容量與權限問題 | 用 Google 表單的檔案上傳題型，或請學生交雲端連結 |
| 需要**學生登入**、要知道誰是誰 | 「執行身分：我 ＋ 所有人」的組合就是**不記名**設計 | 改用「執行身分：存取網頁應用程式的使用者」＋ 學校帳號，或直接用 Google 表單（可強制登入並記錄帳號） |

> 🎯 **最誠實的一句話**：如果 Google 表單能解決，就用 Google 表單。
> 這一包存在的價值，是「表單做不到、又還沒到要架真資料庫」的那一段中間地帶——
> 自訂畫面、讀回資料、即時顯示別人送的東西。搞清楚這件事，你才不會在該用表單的時候寫程式。

---

## 常見坑

| 症狀 | 原因 | 解法 |
|------|------|------|
| 學生開網址：「你沒有存取權」 | 發到 `/dev` 網址了 | 改發 `/exec`。`/dev` 只有編輯者能開 |
| 學生開網址：「很抱歉，目前無法開啟這個檔案」 | 步驟五的授權沒做，或加了新權限沒重新授權 | 回編輯器手動執行一次任何函式，走完授權 |
| 部署設定裡找不到「所有人」 | 學校 Workspace 帳號的機構限制 | 見卡關點 2。改用個人 Gmail |
| 按送出「沒反應」，也沒錯誤訊息 | 前端呼叫的函式名，跟 `Code.gs` 裡的名字**不一樣** | 一字一字對過。大小寫也算 |
| `TypeError: ... is not a function` | 同上，或 `Code.gs` 有語法錯誤導致整份沒載入 | 看編輯器的紅色底線 |
| 執行紀錄：`ReferenceError: document is not defined` | 把前端 JS 存成 `.gs` 檔了 | 前端 JS **只能**寫在 `index.html` 的 `<script>` 裡 |
| 執行紀錄：`ReferenceError: google is not defined` | 同上，反過來——把 `google.script.run` 寫進 `.gs` 了 | 那是瀏覽器端的東西，不能出現在 `.gs` |
| 「腳本已完成但未回傳任何內容」 | `doGet` 沒有 `return` | `doGet` 一定要 return 一個 HtmlOutput |
| 前端拿到的時間是 `null` 或怪東西 | `google.script.run` **傳不了 Date 物件** | 後端先用 `Utilities.formatDate(...)` 轉成字串再回傳（本包範例已經這樣寫） |
| 改了程式碼，網址打開還是舊的 | 只按了「儲存」，沒有重新部署 | 儲存 ≠ 上線。要走「管理部署作業 → 編輯 → 新版本」 |
| 重新部署了還是舊的 | 瀏覽器快取 | `Ctrl` + `F5`，或換一個無痕視窗 |
| 全班同時送出，有人的資料不見了 | 併發覆寫 | 本包範例已用 `LockService` 排隊。真的要即時，見「什麼時候不該走這條路」 |
| 時好時壞、莫名權限錯誤 | 多帳號 session 衝突 | 無痕視窗 |
| `doGet` 找不到 `index` | HTML 檔名打成 `index.html`，變成 `index.html.html` | 新增 HTML 檔時只打 `index`，副檔名由編輯器加 |
| 中文變亂碼 | `index.html` 少了 `<meta charset="utf-8">` | 補上（本包範例已含） |

---

## ❓ 本包無法保證不變的項目（現場請自行確認）

| 項目 | 狀況 |
|------|------|
| 部署對話框的欄位文字 | Google 會調整 UI 用字。**認關鍵字**：「執行身分」選「我」、存取權選「所有人」 |
| 未驗證應用程式警告頁的按鈕文字 | 措辭偶有變動，但「進階」→「前往…（不安全）」的結構是穩定的 |
| 學校 Workspace 的可用選項 | 完全取決於貴校管理員怎麼設，各校不同 |
| GAS 的執行時間與同時執行數上限 | 有上限，且會隨 Google 政策調整。**本包不寫死數字**，以官方當下說明為準；實務上就是「全班同時按送出會排隊」 |

---

## 🤖 機器可判讀的成功訊號

以下**全部**成立才算完成本包：

```
CHECK_1  Apps Script 專案中同時存在 Code.gs 與 index.html 兩個檔案
CHECK_2  index.html 的檔名為 index（不是 index.html.html）
CHECK_3  手動執行「一鍵授權」後，執行紀錄輸出「工作表就緒：回覆」，且無錯誤
CHECK_4  已建立「網頁應用程式」類型的部署，執行身分＝我、存取權＝所有人
CHECK_5  取得的網址以 /exec 結尾（不是 /dev）
CHECK_6  無痕視窗開啟該網址，網頁正常顯示輸入框（非任何錯誤頁）
CHECK_7  在無痕視窗送出一筆測試資料，前端顯示「已送出」
CHECK_8  Google 試算表「回覆」分頁中，該筆資料實際出現，且時間戳記正確
CHECK_9  修改程式碼後走「管理部署作業 → 編輯 → 新版本 → 部署」，網址與 CHECK_5 完全相同
CHECK_10 測試資料已從試算表清除
```

任一項為 `FAIL` → 到「常見坑」對照處理，**不要往下做其他懶人包**。

---

## 完成回報範本（給人看的）

```md
## Google Sheets ＋ GAS 網頁應用程式 完成

- 使用帳號類型：個人 Gmail / 學校 Workspace
- 試算表：已建立（分頁名稱：回覆）
- 腳本類型：容器繫結（路線 A）/ 獨立腳本（路線 B）
- Code.gs：CHECK_1 PASS / FAIL
- index.html 檔名正確：CHECK_2 PASS / FAIL
- 授權完成（執行紀錄）：CHECK_3 PASS / FAIL
- 部署設定（我＋所有人）：CHECK_4 PASS / FAIL
- 網址結尾為 /exec：CHECK_5 PASS / FAIL
- 無痕視窗可開啟：CHECK_6 PASS / FAIL
- 送出測試：CHECK_7 PASS / FAIL
- 資料確實寫入試算表：CHECK_8 PASS / FAIL
- 改版後網址不變：CHECK_9 PASS / FAIL
- 測試資料已清除：CHECK_10 PASS / FAIL

- 網頁應用程式網址：<.../exec>
- QR Code：已產生 / 未產生
- 資料保護提醒已告知使用者：是 / 否

### 待處理
- <把 FAIL 的項目與原因列在這裡；全部 PASS 就寫「無」>
```

---

## 如果做壞了，如何重來

好消息：**這一包不會弄壞你的電腦**，因為它什麼都沒裝。全部在 Google 帳號裡。

由輕到重：

1. **只是程式碼壞了** → 把 `Code.gs` 和 `index.html` 全選刪掉，重貼一次範例，重新部署（編輯 → 新版本）
2. **部署設定選錯了**（例如存取權選成「只有我」）→ 部署 → 管理部署作業 → 編輯 → 改設定 → 部署。**網址不變**
3. **整個部署想砍掉** → 管理部署作業 → 封存。網址立刻失效
4. **整個專案重來** → 在 Apps Script 首頁把專案刪掉，回步驟二重建。試算表裡的資料不受影響
5. **資料想清空** → 直接在試算表刪列。建議先「檔案 → 建立副本」留一份

> 對 OpenCode 說：「上次 GAS 那包做壞了，幫我從步驟三重來一次，程式碼重新產一份給我貼。」

---

## ➡️ 下一步

作品會存資料了。接著可以：

- **`06-supabase`** — 真的需要**即時**同步（文字雲、搶答、即時排行榜）時，換那條路
- **`07-github`** — 把作品的原始碼備份起來（記得**不要**把 `/exec` 網址寫進公開 repo）
- **`02-file-toolkit`** — 把收到的資料下載成 `.xlsx`，請 OpenCode 算統計、排名次、產報表

> 💡 這一包學到的模式，比這一包本身重要：
> **前端和後端放在同一個地方 → 沒有跨網域問題 → 少掉一整類永遠查不出原因的錯誤。**
> 之後你看到任何「前端放這、API 放那」的教學，先問一句「這樣會不會撞 CORS」。
