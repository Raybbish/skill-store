---
name: opencode-file-toolkit
description: 安裝 agent 的內部工具包三合一——A 文件處理（Word/Excel/PPT/PDF/圖片/QR/轉 Markdown 的 Python 標配 10 套件）、B 影音工具（yt-dlp／FFmpeg／deno）、C 語音（Edge-TTS 讓 agent 開口說話）。說「裝內部工具包」「裝教學檔案處理工具包」「裝 Python 檔案工具」「裝 yt-dlp」「裝影音下載工具」「讓 agent 會說話」「裝 Edge-TTS」「裝語音」時載入。
---

# 內部工具包 三合一（文件／影音／語音）

研習六「作品階梯」的**內部工具**級：不是給學生用的網頁作品，而是**讓 agent 長出手腳**的一組工具。裝好之後，你對 OpenCode 說一句人話，它就能真的幫你產出獎狀、成績表、簡報、PDF、QR Code，也能下載影片抽字幕，還能**開口把結論唸給你聽**。

## 這一包裝三類工具，各自解決什麼

| 段 | 裝什麼 | 解決什麼問題 | 今天用得到嗎 |
|----|--------|--------------|--------------|
| **標配 A：文件處理** | Python 10 套件（`uv` 裝進專案 `.venv`） | 讀 PDF 生教案、套印獎狀、算成績、做簡報、生 QR Code | ✅ **今天下午就用** |
| **標配 B：影音工具** | `yt-dlp`／`FFmpeg`／`deno`（系統工具，`winget`／`brew`） | 下載影片、抽字幕、轉 mp3 餵 AI | ⏭️ **今天不會用到，第二、三天的影片剪輯會** |
| **標配 C：語音** | `edge-tts`（Python 模組，微軟雲端語音、免金鑰） | 讓 agent 用台灣中文把結論唸出來 | ✅ **今天就用，裝完 30 秒內聽得到** |

> 🔀 **三段彼此獨立，任一段失敗不影響其他兩段。**
> 每段都有自己的驗證步驟與成功訊號。研習現場如果進度落後，**先裝 A 和 C（今天要用），B 留課後自己補**——B 沒裝完全不影響 A、C 能不能用。

> 這一份是**懶人包入口**。A 段實際的安裝腳本與驗證程式放在另一個 repo：
> **https://github.com/mathruffian-dot/ai-agent-ep03**（預設分支是 `master`，不是 `main`）
> 本文件只負責：這是什麼、怎麼裝、怎麼驗、卡住怎麼辦。細部腳本以那個 repo 為準。

---

## 這包能幹嘛（裝完就能對 agent 說的話）

**A 段（文件）**

| 你想做的事 | 裝完後直接說 |
|-----------|-------------|
| 套印獎狀／通知單 | 「讀這份名單 Excel，套進這個獎狀 Word 模板，每人產一份」 |
| 成績計算＋標紅 | 「算總分與排名，不及格標紅，各班平均放最後一列」 |
| 大綱變簡報 | 「把這份教材大綱，每個重點做成一頁投影片」 |
| PDF 合併／抽頁／浮水印 | 「把這些 PDF 合併，第 5～8 頁另存，每頁加淡灰浮水印」 |
| 連結變 QR Code | 「把這 5 個連結各生一張 QR Code」 |
| 課本轉乾淨文字餵 AI | 「把這份 PDF 轉成 Markdown」 |

**B 段（影音）**

| 你想做的事 | 裝完後直接說 |
|-----------|-------------|
| 抓公開影片的字幕當逐字稿 | 「幫我抓這支影片的中文字幕，轉成 SRT」 |
| 只要聲音餵給 AI 摘要 | 「把這支影片下載成 mp3」 |
| 下載素材影片來剪 | 「用最高畫質下載這支影片」 |

**C 段（語音）**

| 你想做的事 | 裝完後直接說 |
|-----------|-------------|
| 讓 agent 唸結論 | 「把剛剛的結論用語音唸給我聽」 |
| 生一段旁白音檔 | 「把這段課程說明存成 mp3，我要放進影片」 |

---

## 先備條件

**共同**

- [ ] 網路連線（三段都需要：A 抓套件、B 抓影片、C 走微軟雲端語音）

**A 段／C 段**

- [ ] `uv` 已安裝（沒有的話先跑 `00-env-setup`）
- [ ] **Python ≥ 3.11**（見下方版本下限說明）

**B 段**

- [ ] Windows：`winget` 可用（`winget --version` 有輸出）
- [ ] macOS：`brew` 可用／Linux：`apt` 或官方安裝腳本

---

## ⛔ 給 Agent 的七條規則（安裝前先讀，這幾條是防呆用的）

使用者說「裝內部工具包」「裝教學檔案處理工具包」時，**逐條遵守**：

1. **只在專案資料夾內工作** — A 段以 `ai-agent-ep03` 資料夾為根，不要去掃其他磁碟或其他 agent 的目錄。
2. **只裝三段標配（A 的 10 個套件、B 的三個系統工具、C 的 edge-tts）** — 下方 A 段「選配」與「其他系統工具」一律不裝，除非使用者明確點名用途。
   > 📌 **v2 起 `edge-tts` 與 `yt-dlp` 已從「選配」升級為標配 B／C**，這是本次擴充的刻意變更，不是誤裝。舊版文件把這兩個列在「預設不要裝」，以本文件為準。
3. **禁止全域 `pip install`** — A 段一律裝進該資料夾的 `.venv`，C 段用 `uv tool install`（獨立隔離環境），都不要污染使用者原有的 Python。
4. **禁止逐項上網研究** — 版本解析交給 `uv`，不要為每個套件開網頁、寫長篇計畫或重複說明。
5. **最多重試一次** — 失敗就回報原始錯誤訊息與建議，不要反覆改指令、重裝、或自行提權。
6. **不自動切換執行環境** — Windows、WSL、Docker、沙盒是不同環境，不要為了裝成功就自己跳去 WSL 或換 agent。
7. **三段各自獨立、各自回報** — A／B／C 任一段失敗，**繼續把其他兩段做完**，最後在成功訊號裡分段標示，不要整份中斷、也不要用「裝別段」來補救失敗那段。

---

# 🟢 標配 A：文件處理（Python 10 套件）

> ✅ **今天下午就會用到。** 裝好之後 agent 才有辦法讀 PDF 生教案、套印獎狀、做簡報。
> 這一段完全不需要 B、C 段的任何東西。

## A 段步驟

### A1. 取得工具包

```bash
git clone https://github.com/mathruffian-dot/ai-agent-ep03.git
cd ai-agent-ep03
```

> ⚠️ 預設分支是 `master`。不要硬指定 `-b main`，會失敗。

### A2. 確認版本釘選是最新的

打開 `requirements-core.txt`，確認內容如下（**`matplotlib` 要是 `3.11.1`**，舊版檔案可能還寫 `3.11.0`，請改掉）：

```
python-docx==1.2.0
openpyxl==3.1.5
python-pptx==1.0.2
pypdf==6.14.2
PyMuPDF==1.28.0
reportlab==5.0.0
Pillow==12.3.0
matplotlib==3.11.1
qrcode[pil]==8.2
markitdown[pdf,docx,pptx,xlsx]==0.1.6
```

### A3. 安裝

**Windows（有現成腳本，走這條）**

在 `ai-agent-ep03` 資料夾內執行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\install_windows.ps1"
```

腳本會依序：找 `uv`（沒有就用 WinGet 裝官方 `astral-sh.uv`）→ 建 `.venv` → 依 `requirements-core.txt` 安裝 → 執行 `verify_core.py`。

> 🔒 **沒有管理員權限時**（學校電腦常見）：腳本內建的 `winget install --id astral-sh.uv` 可能被擋。先自己跑一次使用者範圍安裝，再重跑腳本：
> ```powershell
> winget install --id astral-sh.uv --exact --scope user --accept-source-agreements --accept-package-agreements
> ```
> 還是不行就用官方腳本備案：`powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

**macOS / Linux / WSL（原 repo 沒有腳本，用這組等價手動步驟）**

```bash
# 沒有 uv 才需要這行
curl -LsSf https://astral.sh/uv/install.sh | sh

cd ai-agent-ep03
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements-core.txt
.venv/bin/python verify_core.py
```

> `install_windows.ps1` 寫死 Python 3.12 且只認 3.12 的既有 `.venv`。手動這條同樣建議用 3.12（最穩），但 3.11～3.14 都可行。

### A4. 驗證 A 段（不需要 B、C 段）

```bash
# Windows
.\.venv\Scripts\python.exe verify_core.py
# macOS / Linux / WSL
.venv/bin/python verify_core.py
```

`verify_core.py` 不只 import，還會真的產一份 docx／xlsx／pptx／pdf／png／QR／圖表，再用 MarkItDown 轉回文字比對。判讀方式：

| 結果 | 標準輸出 | Exit code |
|------|---------|-----------|
| ✅ 成功 | `CORE_OK: 10/10 imports and file smoke tests (Python 3.x.y)` | `0` |
| ❌ 套件缺漏 | `CORE_FAIL: n/10` ＋ 逐項錯誤 | `1` |
| ❌ 匯入過了但實際操作失敗 | `CORE_SMOKE_FAIL: <錯誤類型>: <訊息>` | `1` |

**只有看到 `CORE_OK: 10/10` 且 exit code 為 `0`，才算安裝成功。**

### A5. 告訴 agent 用哪個 Python

裝完之後，**所有** Python 程式都要用這個直譯器跑，不要用系統的 `python`：

- Windows：`.\.venv\Scripts\python.exe`
- macOS / Linux / WSL：`.venv/bin/python`

---

## A 段標配 10 個（預設就裝這些）

已在 **Windows + Python 3.14** 實測全數安裝成功，`verify_core.py` 輸出 `CORE_OK: 10/10`。

| 套件 | 用途 |
|------|------|
| `python-docx` | 生成／讀寫 Word |
| `openpyxl` | 讀寫與格式化 Excel |
| `python-pptx` | 生成／改寫 PowerPoint |
| `pypdf` | PDF 合併、拆分、浮水印 |
| `PyMuPDF` | PDF 抽文字、抽頁、轉圖片 |
| `reportlab` | 生成 PDF 與浮水印圖層 |
| `Pillow` | 圖片裁切、去白邊、合成 |
| `matplotlib` | 產生統計圖表 |
| `qrcode[pil]` | 產生 QR Code |
| `markitdown[pdf,docx,pptx,xlsx]` | PDF／Word／PPT／Excel 轉 Markdown |

> **`markitdown` 一定要帶 extras。** 只裝裸的 `markitdown` 不會啟用各文件格式，`pdf,docx,pptx,xlsx` 四組才符合示範用途。
>
> **`PyMuPDF` 的 import 名稱：** 1.28.0 起官方新名稱是 `import pymupdf`，但舊寫法 `import fitz` **仍然可用**，兩者皆可，不必改既有程式碼。

### 版本下限：Python 3.11（不是只有 3.12 能跑）

原文件只提 3.12，但依相依關係實際推算：標配裡卡最緊的是 `matplotlib 3.11.1`（`requires_python >=3.11`），其次 `PyMuPDF`／`Pillow`／`markitdown` 要 ≥3.10。所以：

| Python | 結果 |
|--------|------|
| 3.10 以下 | ❌ 解析失敗（`uv` 會直接報 matplotlib 不支援） |
| **3.11** | ✅ 可裝（實質下限） |
| 3.12 | ✅ 安裝腳本預設值，最穩 |
| 3.13 / 3.14 | ✅ 可裝，3.14 已實測 `CORE_OK: 10/10` |

---

## 🟡 A 段選配（預設不要裝）

| 套件 | 為什麼不是標配 |
|------|----------------|
| `pandas` | **已由 `markitdown[xlsx]` extras 自動帶入，不需另裝。** 要做大量資料分析時本來就已經在了。 |
| `pdfplumber` | **已由 `markitdown[pdf]` extras 自動帶入，不需另裝。** 精準擷取 PDF 表格時直接用即可。 |
| `xlsxwriter` | **已由 `python-pptx` 相依自動帶入，不需另裝。** |
| `docxcompose` | 只有「合併多份 Word」才需要。 |
| `pdf2image` | 需另裝 Poppler；PDF 轉圖用 PyMuPDF 就夠。 |
| `fpdf2` | 與標配的 `reportlab` 功能重疊。 |
| `ocrmypdf` | 需 Tesseract（＋Windows 可能還要 Ghostscript），不適合研習現場全自動安裝。 |
| `docx2pdf` | 只支援 Windows／macOS，且本機必須有 Microsoft Word。 |
| `pywin32` | 只有 Windows Office COM 自動化才需要。 |
| ~~`edge-tts`~~ | **已升級為標配 C**，見下方「標配 C：語音」。不要在這裡裝。 |
| ~~`yt-dlp`~~ | **已升級為標配 B**，見下方「標配 B：影音工具」。B 段用 winget／brew 裝系統版，不要用 pip 裝進 `.venv`。 |
| `youtube-transcript-api` | 只有抓 YouTube 既有字幕時需要；無字幕影片無法處理。**標配 B 的 `yt-dlp` 已能抓字幕，通常不必再裝這個。** |

> 前三項（`pandas`、`pdfplumber`、`xlsxwriter`）**裝完標配後就已經在 `.venv` 裡了**，這是相依關係自動帶進來的，不是誰裝錯。不要為了「清乾淨」去 uninstall，會把 `markitdown` 或 `python-pptx` 弄壞。
>
> 其餘項目使用者日後明確點名任務時，再由 agent 裝進**同一個** `.venv`。不要一次把整張表裝完。

---

## ⚙️ A 段用不到的其他系統工具（不是 pip 套件，預設不要裝）

| 系統工具 | 何時才需要 | 限制 |
|----------|------------|------|
| Tesseract OCR | 掃描 PDF／圖片 OCR | 繁體中文還要 `chi_tra` 語言資料 |
| Ghostscript | OCRmyPDF 部分 PDF/A 流程 | Windows 安裝可能需管理員 |
| Poppler | 使用 `pdf2image` | 標配已用 PyMuPDF 轉圖，可不裝 |
| ~~ffmpeg~~ | ~~影音下載、轉檔、合併~~ | **已升級為標配 B**，見下方「標配 B：影音工具」 |
| Microsoft Office | `docx2pdf`、`pywin32` COM | 沒有 Word／PowerPoint 就不能用 |

**不要因為讀到這張表就去跑 `winget install`**（唯一例外是已升級為標配 B 的 ffmpeg，照 B 段步驟裝）。

---

# 🎬 標配 B：影音工具（yt-dlp／FFmpeg／deno）

> ⏭️ **今天不會用到，第二、三天的影片剪輯與逐字稿會用到。**
> 現場時間不夠可以整段跳過，回家再補；**跳過完全不影響 A 段與 C 段**。
> 這一段裝的是**系統工具**（不是 Python 套件），不進 `.venv`，跟 A 段的環境無關。

## B 段裝什麼、為什麼

| 工具 | 用途 | 為什麼要 |
|------|------|----------|
| **yt-dlp** | 下載影音平台的影片、音訊、字幕 | 抓公開影片當教材、抓字幕當逐字稿 |
| **FFmpeg** | 影音格式轉換、把音訊和影片合併 | yt-dlp 下載高畫質時，影音是分開的兩軌，要靠 FFmpeg 合起來 |
| **deno** | JavaScript 執行環境 | yt-dlp 解析 YouTube 新格式時需要，**隨 yt-dlp 自動安裝，不必自己裝** |

### ⚠️ FFmpeg 有兩套，不要重複裝

這是最容易多花 20 分鐘的地方：

| 版本 | 從哪來 | 要不要自己裝 |
|------|--------|--------------|
| **yt-dlp 專用版**（`yt-dlp.FFmpeg`） | **裝 yt-dlp 時自動帶入** | ❌ 不用，裝 yt-dlp 就有了 |
| **系統版**（`Gyan.FFmpeg`） | `winget install Gyan.FFmpeg` | 🟡 只有你想在別的地方直接用 `ffmpeg` 指令（剪片、轉檔）才裝 |

**兩者可以並存，不會互相打架。** 但如果你只是要下載影片和字幕，**裝完 yt-dlp 就夠了，不需要再裝系統版**。

## B 段步驟

### B1. 安裝 yt-dlp（會自動帶 FFmpeg 與 deno）

**Windows**

```powershell
winget install --id yt-dlp.yt-dlp -e --accept-source-agreements --accept-package-agreements
```

> 🔒 **沒有管理員權限時**（學校電腦常見）：
> ```powershell
> winget install --id yt-dlp.yt-dlp -e --scope user --accept-source-agreements --accept-package-agreements
> ```
> 兩個都失敗就用 Python 版備案（不需要管理員）：`uv tool install yt-dlp`

**macOS**

```bash
brew install yt-dlp
```

**Linux（Debian / Ubuntu）**

```bash
# 發行版內建的 yt-dlp 常常太舊，YouTube 一改格式就壞掉，建議用這條
sudo apt update && sudo apt install -y ffmpeg
uv tool install yt-dlp          # uv 來自 00-env-setup；真的沒有 uv 才退而求其次用 sudo apt install -y yt-dlp
```

> 🍎🐧 **macOS / Linux 的 deno 不會自動裝。** 「裝 yt-dlp 順便帶 deno」是 **Windows winget** 的行為。mac／Linux 要等實際下載遇到「需要 JS 執行環境」的錯誤時再補：
> `brew install deno`（macOS）／`curl -fsSL https://deno.land/install.sh | sh`（Linux）

### B2. （選用）安裝系統版 FFmpeg

**只有**你要直接用 `ffmpeg` 指令剪片、轉檔才需要。單純下載影片／字幕請跳過這步。

**Windows**

```powershell
winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
```

> 🔒 沒有管理員權限：`winget install --id Gyan.FFmpeg -e --scope user --accept-source-agreements --accept-package-agreements`

**macOS**：`brew install ffmpeg`
**Linux**：`sudo apt install -y ffmpeg`

### B3. 🚨 重開終端機（這一步跳過就會誤以為裝失敗）

裝完之後，**已經開著的終端機讀不到新的 PATH**，打 `yt-dlp` 一定說「找不到」——不是沒裝好，是視窗太舊。

**做法**：關掉目前的 PowerShell／終端機，開一個新的。

不想關視窗的話，Windows 可以就地刷新 PATH：

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

macOS / Linux：`source ~/.zshrc`（或 `source ~/.bashrc`）。

### B4. 驗證 B 段（不需要 A、C 段）

**Windows（PowerShell 用 `;` 不要用 `&&`）**

```powershell
yt-dlp --version; ffmpeg -version; deno --version
```

**macOS / Linux**

```bash
yt-dlp --version; ffmpeg -version; deno --version
```

> 這裡刻意用 `;` 不用 `&&`：`&&` 會在第一個缺的工具就中斷，你會看不到後面兩個到底有沒有裝好。

| 結果 | 長相 |
|------|------|
| ✅ 成功 | `yt-dlp` 印出日期型版本（如 `2026.xx.xx`）、`ffmpeg` 印出 `ffmpeg version …` |
| ❌ 失敗 | 出現「無法辨識」／`command not found` → 九成是沒重開終端機，回 B3 |

> `deno` 沒有也不算失敗——它是 yt-dlp 遇到 YouTube 新格式時才用到的相依工具。**只要 `yt-dlp --version` 有輸出，B 段就算通過**；`deno` 缺了等實際下載失敗再補。

## yt-dlp 常用指令備忘（第二、三天會回來查這張表）

| 想做的事 | 指令 |
|----------|------|
| 先看這支影片有沒有字幕 | `yt-dlp --list-subs <網址>` |
| 下載中文字幕轉成 SRT | `yt-dlp --skip-download --write-subs --sub-langs "zh-Hant,zh-TW,zh" --convert-subs srt <網址>` |
| 人工字幕＋自動字幕一起抓 | `yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "zh-Hant,zh-TW,zh,en" --convert-subs srt <網址>` |
| 只下載音訊成 mp3（餵 NotebookLM 用） | `yt-dlp -x --audio-format mp3 <網址>` |
| 下載整段影片（最高畫質） | `yt-dlp -f "bv*+ba/b" <網址>` |
| 自我更新（YouTube 一改格式就跑這個） | `yt-dlp -U` |

> 📌 **不是每支影片都有字幕。** 很多官方宣導頻道既沒上字幕、也沒開自動字幕，**下載前先用 `--list-subs` 確認**。真的沒有字幕，就要走「下載 mp3 → 語音轉文字」那條路（`09-groq-api`）。

## ⚠️ B 段兩個一定要知道的坑

**坑 1：`--print` 會偷偷變成「只模擬、不下載」**

`--print` 這個參數會**隱含 simulate 模式**。也就是說，你以為自己下的是「印出標題**並且**下載字幕」：

```bash
# ❌ 這樣寫不會真的下載到任何字幕檔
yt-dlp --print "%(title)s" --write-subs --sub-langs "zh-Hant" <網址>
```

實際上 yt-dlp 只會印字幕、**一個檔案都不會存**。要邊印邊下載，必須**同時加 `--no-simulate`**：

```bash
# ✅ 正確：印出標題，同時真的把字幕存下來
yt-dlp --print "%(title)s" --no-simulate --write-subs --sub-langs "zh-Hant" <網址>
```

> 🩹 **這個坑實測踩過**：一次批次處理 76 部影片，因為少了 `--no-simulate`，**76 部全部誤報「沒有字幕」**——其實字幕都在，只是根本沒下載。看到「整批都沒字幕」這種太整齊的結果，先回頭檢查有沒有 `--print`。

**坑 2：重開終端機 PATH 才生效**

見 B3。這是新裝完當下最常見的假失敗，指令沒錯、東西也裝好了，只是視窗太舊。

---

# 🔊 標配 C：語音（Edge-TTS）

> ✅ **今天就會用到，而且裝完 30 秒內就聽得到聲音。**
> 這一段跟 A、B 段完全無關，**A 段沒裝完也可以先裝這段**。

Edge-TTS 是走 Edge 瀏覽器「大聲朗讀」背後的微軟雲端語音：**不用申請金鑰、不用付費、聲音很自然**。裝好之後 agent 就能把結論唸給你聽。

## C 段步驟

### C1. 安裝 edge-tts

**所有平台通用（用 `00-env-setup` 裝好的 `uv`，不需要先做完 A 段）**

```bash
uv tool install edge-tts
```

`uv tool install` 會把 `edge-tts` 裝進一個**獨立的隔離環境**並加到 PATH，不會污染系統 Python，也不會動到 A 段的 `.venv`。

> 💡 **不想安裝、只想試一次**：把下面所有指令的 `edge-tts` 換成 `uvx edge-tts`，`uv` 會臨時抓下來跑完就算，不留在電腦上。
>
> 🔒 **沒有 `uv`**（例如跳過了 `00-env-setup`）：`pip install --user edge-tts` 也可以，但仍**不要**用系統管理員權限做全域 `pip install`。
>
> ⚠️ **裝好了但打 `edge-tts` 說找不到指令？** 先重開終端機（跟 B3 同一個原因）。重開還是不行，代表模組裝好了、但那支 Python 的 `Scripts` 資料夾不在 PATH 上——**把所有指令的 `edge-tts` 換成 `python -m edge_tts`，參數完全一樣**（注意模組名是底線 `edge_tts`，指令名是連字號 `edge-tts`）。實測這條備案可正常出聲。

### C2. 🎉 一行聽到聲音（研習現場的 wow 時刻）

**Windows（PowerShell，整段複製貼上，一行就好）**

```powershell
edge-tts --voice zh-TW-YunJheNeural --text "老師好，我是你的 AI 助理，從現在開始我會說話了。" --write-media "$env:TEMP\hello.mp3"; Add-Type -AssemblyName PresentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([Uri]"$env:TEMP\hello.mp3"); Start-Sleep -Seconds 1; $p.Play(); Start-Sleep -Seconds 8; $p.Close()
```

**macOS**

```bash
edge-tts --voice zh-TW-YunJheNeural --text "老師好，我是你的 AI 助理，從現在開始我會說話了。" --write-media /tmp/hello.mp3 && afplay /tmp/hello.mp3
```

**Linux**

```bash
edge-tts --voice zh-TW-YunJheNeural --text "老師好，我是你的 AI 助理，從現在開始我會說話了。" --write-media /tmp/hello.mp3 && (mpv --no-video /tmp/hello.mp3 || ffplay -nodisp -autoexit -loglevel quiet /tmp/hello.mp3)
```

**聽到聲音就成功了。** 這就是 C 段的驗證——**耳朵就是驗證工具**。

### C3. 驗證 C 段（機器判讀用）

耳朵聽到聲音是給人的驗證；agent 要判讀請看**音檔有沒有真的生出來**：

**Windows**

```powershell
Test-Path "$env:TEMP\hello.mp3"; (Get-Item "$env:TEMP\hello.mp3").Length
```

**macOS / Linux**

```bash
test -f /tmp/hello.mp3 && wc -c < /tmp/hello.mp3
```

| 結果 | 判讀 |
|------|------|
| ✅ 成功 | 檔案存在**且大小 > 10000 bytes**（約 1 秒以上的語音） |
| ❌ 失敗 | 檔案不存在，或大小為 0（多半是沒網路，或 `--text` 是空的） |

> 檔案有生出來但聽不到聲音 → 不是 edge-tts 的問題，是**播放**的問題（音量、輸出裝置、耳機沒插）。先把音量開起來，再用檔案總管點兩下那個 mp3 確認。
>
> 🧹 **重跑驗證前先把舊的 `hello.mp3` 刪掉**，否則這次明明失敗，卻讀到上次留下的檔案而誤判成功。
> Windows：`Remove-Item "$env:TEMP\hello.mp3" -Force -ErrorAction SilentlyContinue`／mac、Linux：`rm -f /tmp/hello.mp3`

## 建議聲音（台灣中文）

| 聲音代號 | 性別 | 感覺 |
|----------|------|------|
| `zh-TW-YunJheNeural` | 男 | 沉穩，適合唸結論、旁白（**預設建議**） |
| `zh-TW-HsiaoChenNeural` | 女 | 親切，適合教學提示、學生端說明 |
| `zh-TW-HsiaoYuNeural` | 女 | 另一個台灣女聲，想換換口味時用 |

> 以上三個是**實測 `edge-tts --list-voices` 確認存在的全部台灣中文聲音**。其他 `zh-CN-*` 開頭的是大陸口音，唸給台灣學生聽會怪，不建議用。

換聲音只要改 `--voice` 後面那串。想看全部可用聲音：

```bash
edge-tts --list-voices
```

## 🪟 播放不要開外部播放器視窗

研習現場（和日常使用）最惱人的就是**每唸一句就彈出一個播放器視窗**。做法上要避開 `Start-Process`／`start`／`open` 這類「交給系統預設程式開檔」的指令，改用**行內播放**：

| 平台 | 行內播放做法 | 會不會跳視窗 |
|------|--------------|--------------|
| Windows | PowerShell `System.Windows.Media.MediaPlayer`（就是 C2 那行用的） | ❌ 不會 |
| Windows（進階） | `ffplay -nodisp -autoexit`（需要 B 段的 FFmpeg） | ❌ 不會 |
| macOS | `afplay` | ❌ 不會 |
| Linux | `mpv --no-video` 或 `ffplay -nodisp -autoexit` | ❌ 不會 |
| 任何平台 | `Start-Process` ／ `start` ／ `open` | ✅ **會，不要用** |

## 想要完整的「用語音回答」技能？

本包**只負責裝起來、確認出得了聲**。真正好用的語音回覆技能（串流播放、首聲約 1–2 秒、離線備援、`-Voice`／`-Out` 參數）已經是一套獨立技能，**不要在這裡重寫**，直接裝那份：

**https://github.com/mathruffian-dot/agent-speak-skill**

把該 repo 的 `speak/` 資料夾複製到 OpenCode 的技能目錄 `~/.config/opencode/skills/speak/`，之後對 agent 說「用語音回答我」「唸給我聽」就會觸發。

> 那份技能同時支援 Claude Code／Codex／OpenCode／AntiGravity，技能目錄各自不同，詳見該 repo 的 README。

---

## 怎麼讓 agent「記得」這些規則

> ⚠️ 這一節的「做法一／二／三」是**三種讓 agent 記住規則的方式**，跟上面的標配 A／B／C 三段沒有關係，不要看混了。

`ai-agent-ep03` 裡那份 `AGENT_SETUP_教學檔案處理工具包.md` 的檔名，**不是任何 agent 會自動載入的慣例檔名**。它不會自己生效，你得主動遞交。三種做法擇一：

**做法一：一次性遞交（最簡單）**
把該檔案拖進對話，或說：

> 「讀 `ai-agent-ep03/AGENT_SETUP_教學檔案處理工具包.md`，只安裝核心工具，選用工具先不要裝。」

**做法二：讓它在該專案常駐（推薦）**
在 `ai-agent-ep03/` 根目錄建立 `AGENTS.md`（OpenCode 的專案指令檔，會自動載入），寫進去：

```markdown
# 本專案 Python 環境
- 一律使用本資料夾的 `.venv`，禁止全域 pip install。
- Windows 直譯器：`.\.venv\Scripts\python.exe`
- macOS/Linux：`.venv/bin/python`
- 只裝 requirements-core.txt 的標配 10 項；A 段選配套件要使用者明確點名才裝。
- 安裝或修環境後，一律跑 `verify_core.py`，看到 `CORE_OK: 10/10` 才算完成。

# 影音與語音工具（不在 .venv 裡）
- yt-dlp / ffmpeg / deno 是系統工具，用 winget / brew 裝，不要用 pip 裝進 .venv。
- yt-dlp 加 `--print` 時必須同時加 `--no-simulate`，否則不會真的下載。
- edge-tts 用 `uv tool install edge-tts` 裝在獨立環境；播放一律行內播放，禁止 Start-Process 開播放器視窗。
```

**做法三：讓它全域常駐**
把本份 SKILL.md 裝成全域技能，之後在任何專案說「裝內部工具包」都會載入：

```bash
npx skills add mathruffian-dot/opencode-lazy-packs --skill 02-file-toolkit -g -y
```

---

## 常見卡關

**A 段（文件處理）**

| 症狀 | 原因 | 解法 |
|------|------|------|
| 腳本說找不到 `uv` 的新 PATH | 終端機還是舊的環境變數 | 重開 OpenCode 再跑一次（不要自己改 PATH） |
| 腳本說既有 `.venv` 不是 3.12 | 資料夾裡有別的舊環境 | 把舊 `.venv` 改名，再重跑；**不要**讓 agent 自動刪掉 |
| `import fitz` 找不到 | 沒裝 PyMuPDF，或用錯直譯器 | 確認是用 `.venv` 那支 python，不是系統 python |
| 裝在 WSL 但 Windows 用不到 | 兩邊 Python 環境彼此獨立 | WSL 另建一份 `.venv`，不能共用 |
| `CORE_SMOKE_FAIL` | 套件裝到了但實際操作壞掉 | 貼出完整錯誤訊息，**不要**用「把選配全裝一遍」來硬補 |

**B 段（影音工具）**

| 症狀 | 原因 | 解法 |
|------|------|------|
| 裝完打 `yt-dlp` 說「無法辨識」 | 終端機太舊，讀不到新 PATH | **九成是這個**：重開終端機（B3），或跑 B3 那段刷新 PATH |
| winget 說需要系統管理員權限 | 學校電腦沒有管理員 | 加 `--scope user` 重跑；再不行用 `uv tool install yt-dlp` |
| 整批影片都「沒有字幕」 | 指令裡有 `--print`，被隱含 simulate | 加上 `--no-simulate`（見 B 段坑 1） |
| 下載到的影片沒有聲音／畫質很低 | 高畫質影音分軌，缺 FFmpeg 合不起來 | 確認 `ffmpeg -version` 有輸出；沒有就回 B1／B2 |
| 昨天還能下載，今天突然壞了 | YouTube 改格式了 | 跑 `yt-dlp -U` 自我更新，再試一次 |
| 我已經裝過 FFmpeg 了，還要再裝嗎 | 兩套 FFmpeg 的混淆 | 不用。yt-dlp 自帶一套，系統版只有要直接剪片才裝（見 B 段說明） |

**C 段（語音）**

| 症狀 | 原因 | 解法 |
|------|------|------|
| 打 `edge-tts` 說「無法辨識」 | 重開終端機後仍不行 = 模組裝好了但 `Scripts` 不在 PATH | 改用 `python -m edge_tts`，參數一模一樣（**實測可用**） |
| 沒有產生 mp3 檔 | 沒網路，或 `--text` 是空的 | Edge-TTS 走雲端，一定要連得上網 |
| mp3 有生出來但聽不到 | 播放問題，不是 TTS 問題 | 開音量、確認輸出裝置、用檔案總管點兩下那個 mp3 試聽 |
| 每唸一句就跳出播放器視窗 | 用了 `Start-Process`／`start`／`open` | 改用行內播放（見「播放不要開外部播放器視窗」） |
| 唸中文變成怪腔怪調 | `--voice` 用到英文或大陸口音聲音 | 換成 `zh-TW-YunJheNeural` 或 `zh-TW-HsiaoChenNeural` |
| 用一陣子後突然連不上 | Edge-TTS 是非官方管道，微軟偶爾調整介面 | `uv tool upgrade edge-tts`（或 `uvx edge-tts@latest`）再試 |

> 「一個 agent 裝一次，其他 agent 都能用」只在**同一個作業系統、同一份資料夾、同一個 `.venv`** 時才成立。Windows、WSL、Docker、雲端、沙盒之間不能共用 Python 套件。
> B 段的系統工具（yt-dlp／ffmpeg／deno）則是**裝在作業系統層**，同一台電腦的所有 agent 都叫得動——但 WSL 與 Windows 仍然算兩台。

---

## 🤖 機器可判讀的成功訊號（三段分別回報）

**執行完請完整輸出下面這個區塊**，讓後續的 agent（或「一次全裝」那一包）可以直接判讀，不必讀懂中文說明。
**三段各自獨立判定**：某一段 `FAIL` 不會讓其他兩段變成 `FAIL`。

```
=== OPENCODE_INTERNAL_TOOLKIT ===
result=PARTIAL            # PASS | PARTIAL | FAIL（整體，見下方判定規則）
os=windows                # windows | macos | linux

# --- 標配 A：文件處理 ---
section_a=PASS            # PASS | FAIL | SKIPPED
a_python=3.12.8           # 版本號 | missing
a_venv=D:\ai-agent-ep03\.venv    # 路徑 | missing
a_core=CORE_OK 10/10      # verify_core.py 的原始輸出 | CORE_FAIL n/10 | CORE_SMOKE_FAIL

# --- 標配 B：影音工具 ---
section_b=SKIPPED         # PASS | FAIL | SKIPPED（現場時間不夠可正當跳過）
b_ytdlp=2026.07.21        # 版本號 | missing
b_ffmpeg=bundled          # bundled（yt-dlp 自帶）| system（Gyan.FFmpeg）| both | missing
b_deno=2.5.4              # 版本號 | missing（不影響 section_b 判定）

# --- 標配 C：語音 ---
section_c=PASS            # PASS | FAIL | SKIPPED
c_edge_tts=installed      # installed | uvx（未安裝，臨時執行）| missing
c_audio_bytes=41328       # 驗證音檔位元組數 | 0
c_heard=yes               # yes | no | unknown（使用者有沒有回報聽到聲音）

next=03-notebooklm
=== END ===
```

**判定規則（agent 請照這個判斷，不要自行認定）：**

| 段 | `PASS` 的條件 |
|----|--------------|
| **A** | `verify_core.py` 輸出 `CORE_OK: 10/10` **且** exit code 為 `0` |
| **B** | `yt-dlp --version` 有版本號（`deno` 缺不算失敗；系統版 FFmpeg 沒裝也不算失敗） |
| **C** | 驗證音檔存在**且** `c_audio_bytes > 10000` |

| 整體 `result` | 條件 |
|--------------|------|
| `PASS` | A、B、C 三段都是 `PASS` |
| `PARTIAL` | 至少一段 `PASS`，其餘為 `SKIPPED` 或 `FAIL`（**研習當天只裝 A＋C、B 標 `SKIPPED` 屬正常，不是出錯**） |
| `FAIL` | 三段都不是 `PASS` |

---

## 完成回報格式（給人看的）

```text
內部工具包 三合一 安裝完成回報：

【A 文件處理】
✅ uv：已存在／已安裝
✅ Python：3.x.x（下限 3.11）
✅ 環境：<資料夾>/.venv
✅ 標配套件：CORE_OK: 10/10（exit code 0）
ℹ️ pandas / pdfplumber / xlsxwriter：已由標配相依自動帶入（正常，不需處理）
🟡 A 段其餘選配：未安裝（正確）

【B 影音工具】
✅ yt-dlp：<版本>
✅ FFmpeg：yt-dlp 自帶版（系統版未裝，正確——要直接剪片時再裝）
✅ deno：<版本>／未裝（不影響下載）
（時間不夠跳過的話寫：⏭️ B 段本次跳過，課後再補，不影響 A、C）

【C 語音】
✅ edge-tts：已安裝
✅ 驗證音檔：<路徑>（<位元組數> bytes）
🔊 已聽到聲音：是／否
ℹ️ 要完整語音回覆技能 → github.com/mathruffian-dot/agent-speak-skill

下一步：所有 Python 程式請用 <venv 的 python 路徑> 執行
```

失敗時只列出失敗步驟與原始錯誤摘要，**不要**自動安裝選用工具當補救，也**不要**因為某一段失敗就把其他兩段一起標成失敗。

---

## 已知修正（A 段：相對於 `ai-agent-ep03` 原始文件）

本包修正了三處實測發現的問題，原 repo 若尚未更新，以本文件為準：

1. **「選配未安裝」的說法與現實不符。**
   原文件把 `pandas`、`pdfplumber`、`xlsxwriter` 列在「選配、預設不要裝」，回報範本還要 agent 印「🟡 選用套件：未安裝（正確）」——但實際跑完標配安裝後，這三個**都已經在 `.venv` 裡**，那句話是假的。
   實際來源（`uv pip compile` 解析驗證）：`pandas` ← `markitdown[xlsx]`、`pdfplumber` ← `markitdown[pdf]`、`xlsxwriter` ← `python-pptx`（注意：xlsxwriter 是標配的 `python-pptx` 帶的，不是 markitdown extras）。
   本包已在選配表逐項加註來源，並把回報範本那句改成「已由標配相依自動帶入（正常）」。

2. **`matplotlib` 版本落後。** 原 `requirements-core.txt` 釘 `3.11.0`，PyPI 最新為 `3.11.1`。本包 A 段步驟 **A2** 要求安裝前先改掉。

3. **Python 版本下限沒寫。** 原文件只提 3.12，讀者會誤以為非 3.12 不可。依相依關係推算實質下限是 **3.11**（`matplotlib 3.11.1` 要求 `>=3.11`；3.10 會直接解析失敗）。本包補上完整版本對照表。

另補兩個原工具包的缺口：

4. **只有 Windows 安裝腳本。** 跑 WSL／macOS／Linux 的人會斷在這裡。本包補上 uv 建 venv ＋ 裝 requirements 的等價手動步驟。

5. **`AGENT_SETUP_教學檔案處理工具包.md` 不是 agent 自動載入的慣例檔名。** 本包補上「怎麼讓 agent 記得」三種做法（一次性遞交／專案 `AGENTS.md` 常駐／全域技能）。

---

## 本次三合一擴充做了什麼（給維護者）

原本這一包只有 A 段（Python 套件），影音與語音的資料散在三個地方，老師要裝齊得自己拼。本次把三處合併：

| 段 | 原本在哪 | 合併時的處理 |
|----|----------|--------------|
| A | 本檔既有內容 | **原樣保留**，只加 `A1～A5` 編號與 `--scope user` 備案 |
| B | 私人筆記「agents 必需工具」（從未公開） | 整理成安裝步驟＋指令備忘表；**保留兩個實測踩坑**（`--print` 隱含 simulate、重開終端機刷 PATH） |
| C | `agent-speak-skill` / `claude-speak-skill` 兩個 repo | **只搬「安裝＋最小可用驗證」**，完整語音回覆技能仍指向 `agent-speak-skill`，不在本包重寫 |

**合併時解掉的三處衝突（原文件互相矛盾之處）：**

1. A 段選配表原本寫「`edge-tts`、`yt-dlp` 預設不要裝」，與新增的 B、C 段直接打架 → 兩列改標「已升級為標配 B／C」，並在七條規則第 2 條加註記。
2. A 段系統工具表原本寫「ffmpeg：文件處理不需要」＋「不要因為讀到這張表就去跑 `winget install`」 → ffmpeg 那列改指向 B 段，禁令加上唯一例外。
3. 「怎麼讓 agent 記得」原本用 **A／B／C** 當三種做法的編號，與標配 A／B／C 撞名 → 改成「做法一／二／三」。

**刻意沒做的事：** 不在本包寫死任何價格與版本號（A 段既有的 `requirements-core.txt` 釘選除外，那是刻意釘的）；B、C 段的工具都會持續更新，寫死只會讓文件過期。

