---
name: ima-skills
description: Manage Tencent IMA notes and knowledge bases through the IMA OpenAPI — read, write, search, upload, and link. Routes by intent to the notes or knowledge-base module.
description_en: "IMA notes & knowledge base management (read, write, search)"
version: 1.1.9
display_name: "腾讯 IMA 笔记与知识库"
tags:
  - ima
  - notes
  - knowledge-base
  - tencent
visibility: public
---

# IMA Skills

Unified client for the Tencent IMA OpenAPI. Two modules: **notes** and **knowledge-base**.

## Mandatory rules (read before any call)
1. **UTF-8 for note writes.** Before `import_doc` / `append_doc`, validate `content` and `title` as legal UTF-8. Non-UTF-8 input causes irreversible mojibake.
2. **Filename = title.** When uploading, `title` must equal `file_name` (with extension). Never rename, translate, or shorten the original name.
3. **Unsupported inputs.** Reject video files, Bilibili/YouTube URLs, and `file://` URLs outright with a clear message — tell the user to use the IMA desktop client. Don't ask "want to try anyway?".
4. **Upload integrity.** Keep file bytes unchanged (PDF, images, Excel, etc.) — no transcoding for binary uploads.
5. **PowerShell 5.1.** If the agent runs in PowerShell, detect the version before the first call; PS 5.1 silently re-encodes request bodies to GBK. Use UTF-8 byte-array mode (see below).

## Route by intent
| User says | Module | Read |
| --- | --- | --- |
| search / browse / read / create / append a **note** | notes | `notes/SKILL.md` |
| upload file / add link / search / browse a **knowledge base** | knowledge-base | `knowledge-base/SKILL.md` |
| view / analyze / export source (needs media_id) | knowledge-base | `knowledge-base/SKILL.md` |

**Cross-module intents — read BOTH sub-skills before acting:**
- "Save this KB content as a note" → KB read → Notes create/append
- "Add this note to a KB" → Notes search for `note_id` → KB `add_knowledge` (`media_type=11`)
- "View source" of a note-type media → KB `get_media_info` → Notes `get_doc_content`

Core rule: content of a **note** → notes; an **entry in a knowledge base** (file/link/note association) → knowledge-base; **raw source of a KB entry** → knowledge-base (falls through to notes if the source is a note).

## Credentials
```bash
test -f ~/.config/ima/client_id && test -f ~/.config/ima/api_key && echo "ok" || echo "setup needed"
```
If not configured, walk the user through it before any API call:
1. Get **Client ID** + **API Key** from https://ima.qq.com/agent-interface
2. Store them (pick one):
   - Config files (recommended):
     ```bash
     mkdir -p ~/.config/ima
     echo "your_client_id" > ~/.config/ima/client_id
     echo "your_api_key" > ~/.config/ima/api_key
     ```
   - Environment variables:
     ```bash
     export IMA_OPENAPI_CLIENTID="your_client_id"
     export IMA_OPENAPI_APIKEY="your_api_key"
     ```
The agent tries env vars first, then config files. Missing credentials make `node ima_api.cjs …` exit with code `-100` and print `msg` to stderr.

> Security: credentials are sent only as HTTP headers to `ima.qq.com`, never elsewhere.

## Calling the API
All requests are HTTP POST + JSON body to the official base URL `https://ima.qq.com`. The transport is wrapped in `./ima_api.cjs`:

```bash
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
OPTS=$(printf '{"clientId":"%s","apiKey":"%s"}' "$IMA_OPENAPI_CLIENTID" "$IMA_OPENAPI_APIKEY")

if ! resp=$(node "$SKILL_DIR/ima_api.cjs" "openapi/list_docs" '{"limit":10}' "$OPTS" 2>/tmp/ima_err); then
  err_json=$(cat /tmp/ima_err)
  err_code=$(echo "$err_json" | jq -r '.code // empty' 2>/dev/null)
  err_msg=$(echo "$err_json" | jq -r '.msg // empty' 2>/dev/null)
  [ "$err_code" = "-200" ] && echo "[update] $err_msg" >&2 || echo "[error] $err_msg" >&2
  exit 1
fi
echo "$resp"
```

**Two error layers, both must be checked:**
1. **Script errors** (non-zero exit, detail on **stderr**): `-100` program error (missing creds / bad args / network) — show `msg`; `-200` skill needs update, original request not sent, stdout carries an update-context JSON with an `instruction`.
2. **Business errors** (clean exit, response on **stdout**): JSON `{"code":0,"msg":"…","data":{…}}`. `code=0` → success, read `data`; `code≠0` → show `msg` directly.

## Skill self-update
`ima_api.cjs` checks for updates automatically on the first call each day. `-200` means an update is available: read the update context from stdout, follow its `instruction`, then retry. Set `IMA_FORCE_UPDATE_CHECK=1` to force a check. If the update check itself fails, it is skipped and the original request proceeds.

## UTF-8 handling (notes writes)
Before building any notes write body, confirm `content`/`title` are valid UTF-8 — regardless of source (user input, file, WebFetch, clipboard, external API). Transcode as needed:
- **Python:** try `utf-8 → gbk → gb2312 → big5 → latin-1` decode; or `sys.stdin.buffer.read().decode('utf-8','ignore')`.
- **Node:** `fs.readFileSync(p).toString('utf8')`; known GBK → `new TextDecoder('gbk').decode(...)`.
- **Unix:** `iconv -f "$(file -b --mime-encoding p)" -t UTF-8 p`.
- **PowerShell 5.1:** read with `[System.IO.File]::ReadAllText(p, [System.Text.Encoding]::Default)` then write via `ConvertTo-Json -Depth 10` and send as a **UTF-8 byte array** (`[System.Text.Encoding]::UTF8.GetBytes($body)`). PS 7+ can send the string directly.
