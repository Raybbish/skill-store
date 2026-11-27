---
name: qqbrowser-skill
description: Browser automation for AI agents via the qqbrowser-skill CLI — drive QQ Browser from the command line to navigate, fill forms, click, screenshot, extract data, and download files. Supports live automation and reusable playbook replay.
description_en: "QQBrowserUse is a browser automation skill for AI agents. It lets AI drive QQ Browser via command line to perform web interactions including page navigation, form filling, button clicks, screenshots, data extraction, and file downloads."
version: 1.0.7
display_name: "QQ 浏览器自动化"
tags:
  - browser
  - automation
  - qq-browser
visibility: public
---

# QQBrowserUse

A browser-automation CLI for AI agents. Every task runs inside an isolated Chrome tab group; it supports both live control and replaying saved playbooks.

## Platforms
Linux x86_64, Windows, macOS. Other Linux arches (ARM, etc.) are unsupported.

## Install
```bash
# Linux / macOS
pipx install qqbrowser-skill
qqbrowser-skill install   # downloads QQ Browser

# Windows
pip install qqbrowser-skill
qqbrowser-skill install
```

## Reference files (load on demand)
| File | Load when |
| --- | --- |
| `references/commands.md` | You need exact flags for any `browser_*` command |
| `references/session-lifecycle.md` | Full session rules, or the request is composite (multi-site) |
| `references/playbook.md` | User asks to record / save / reuse a task, or run an existing playbook |

## Key concepts
- **Element index** — an encoded string like `2_sfli_qp0u` produced by `browser_snapshot`. Indices regenerate on every snapshot; always re-snapshot before reusing one, and never invent numeric indices like `1` or `2` — copy the encoded value verbatim from the latest snapshot.
- **Snapshot** — returns indexed page elements. Re-snapshot after any DOM change (navigate, submit, modal, AJAX). Avoid needless standalone snapshots (they cost tokens).
- **Session** — wrap every task in `browser_start_session` / `browser_end_session` for tab-group isolation.
- **Recording** — wrap manual tasks in `task_begin` / `task_end` to generate a replayable playbook.
- **Playbook** — a parameterized JSON script that replays a recorded task without AI.

## Mandatory core workflow
Every automation MUST begin with `browser_start_session`, MUST call `playbook_list` before any `task_begin` or `browser_go_to_url`, and MUST end with `browser_end_session`. Never start manual work without first checking for existing playbooks.

```
Step 0  Composite request? (multi-site data flow)
        YES → one session for the whole task; run each sub-task through Steps 2-3; end once.
        NO  → single task ↓
Step 1  browser_start_session
Step 2  playbook_list            ← required, pick a branch
Step 3  Match?
        YES → Branch A: browser_replay
        NO  → Manual:
              B (record): task_begin … browser_* … task_end   (only on explicit user request)
              C (one-off): browser_* operations…
Step 4  browser_end_session       ← always
```

Recording (Branch B) only triggers on an explicit request ("record this", "save as script", "录一下", "下次还要用"). Otherwise use Branch C — do not wrap in `task_begin`/`task_end`.

### Step 1 — start session
```bash
qqbrowser-skill browser_start_session --sessionId task-<purpose>-<counter>
```
`sessionId` must be unique per task (e.g. `task-form-001`).

### Step 2 — list playbooks
```bash
qqbrowser-skill playbook_list
```
Match by name, description, keywords, and target URL. A partial match is enough to prefer replay.

### Branch A — replay matched playbook
`browser_replay` may run up to 10 minutes. Do not interrupt, retry, or fall back to manual while it runs — replays are usually non-idempotent (posting, submitting, messaging), so a premature retry duplicates side effects.
```bash
qqbrowser-skill browser_replay --script <path> --variables '{...}'
```

### Branch B — record on explicit request
Read `references/playbook.md` before `task_begin`. Wrap operations so a playbook can be generated afterward.
```bash
qqbrowser-skill task_begin --description "描述任务"
qqbrowser-skill browser_go_to_url --url <url>
qqbrowser-skill browser_snapshot
# interact using encoded indices from the latest snapshot
qqbrowser-skill browser_snapshot
qqbrowser-skill task_end
```
After `task_end`, follow `references/playbook.md` to load `task_latest`, emit the playbook JSON, save, and verify.

### Branch C — plain manual (default)
```bash
qqbrowser-skill browser_go_to_url --url <url>
qqbrowser-skill browser_snapshot
# interact using encoded indices
```

### Step 4 — end session
```bash
qqbrowser-skill browser_end_session --sessionId task-<purpose>-<counter>
```

## Common patterns
**Form submission (Branch C)**
```bash
qqbrowser-skill browser_start_session --sessionId task-form-001
qqbrowser-skill playbook_list
qqbrowser-skill browser_go_to_url --url https://example.com/signup
qqbrowser-skill browser_snapshot
qqbrowser-skill browser_input_text --index "<name-index>" --text "Jane Doe"
qqbrowser-skill browser_input_text --index "<email-index>" --text "jane@example.com"
qqbrowser-skill browser_select_dropdown_option --index "<state-index>" --text "California"
qqbrowser-skill browser_check_op --index "<terms-index>" --value
qqbrowser-skill browser_click_element --index "<submit-index>"
qqbrowser-skill browser_wait --seconds 2
qqbrowser-skill browser_snapshot
qqbrowser-skill browser_end_session --sessionId task-form-001
```

**Data extraction** — pick by how output is used:
| Approach | When | Replayable |
| --- | --- | --- |
| `browser_snapshot --markdown` | AI reads/summarizes once (Branch C) | no |
| `browser_snapshot` + `browser_get_info` | one element's text/attribute | no |
| `browser_eval_content_js` | structured JSON / many items / only safe option in Branch B | yes |

Structured extraction (Branch C):
```bash
qqbrowser-skill browser_start_session --sessionId task-extract-001
qqbrowser-skill playbook_list
qqbrowser-skill browser_go_to_url --url https://example.com/products
qqbrowser-skill browser_eval_content_js --script "JSON.stringify(Array.from(document.querySelectorAll('.product-item')).slice(0,10).map(el=>({name:el.querySelector('.name')?.textContent?.trim(), price:el.querySelector('.price')?.textContent?.trim()})))"
qqbrowser-skill browser_end_session --sessionId task-extract-001
```

**Infinite scroll**
```bash
qqbrowser-skill browser_start_session --sessionId task-feed-001
qqbrowser-skill playbook_list
qqbrowser-skill browser_go_to_url --url https://example.com/feed
qqbrowser-skill browser_scroll_to_bottom
qqbrowser-skill browser_wait --seconds 2
qqbrowser-skill browser_snapshot
qqbrowser-skill browser_end_session --sessionId task-feed-001
```
