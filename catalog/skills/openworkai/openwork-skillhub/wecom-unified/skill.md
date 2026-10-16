---
name: wecom-unified
description: WeCom (Enterprise WeChat) CLI suite covering six domains — contacts, messages, documents, calendars, meetings, and todos. Look up people by name/alias, send/receive messages (text/image/file/voice/video), create/read/edit docs, manage online sheets and smart tables, schedule meetings, and track todos. Trigger even without the words "WeCom" when the message involves doc.weixin.qq.com URLs, messages, schedules, todos, documents, sheets, meetings, or finding a person.
description_en: "WeCom CLI suite covering docs, messages, calendars, meetings, todos, and contacts. For organizations with 10+ members: create and read docs, smart sheets, and smart docs. For individuals and small teams (10 or fewer): read/write docs, send/receive direct and group messages, manage calendars, meetings, and todos, and look up contacts."
version: 1.0.2
display_name: "企业微信套件"
tags:
  - wecom
  - enterprise-wechat
  - messaging
  - collaboration
visibility: public
---

# WeCom Unified

The `wecom-cli` suite talks to Enterprise WeChat from the command line across six domains: contacts, messages, documents (doc / sheet / smartsheet / smartpage), schedules, meetings, and todos.

## Pre-check (run before any command)
1. Is the CLI installed?
   ```bash
   wecom-cli --version
   ```
   If missing: `npm install -g @wecom/cli@0.1.9`
2. Are credentials configured?
   ```bash
   wecom-cli auth show --auth-status
   ```
   `authorized` → ready. `unauthorized` → run step 3.
3. Authorize (only if needed):
   ```bash
   wecom-cli init --noninteractive
   ```
   This prints an auth link + QR and blocks until the user scans; it exits on success and only runs once.

## Domains
- **Contacts** — list visible members, search by name/alias, resolve userid. See `references/wecom-contact.md`.
- **Messages** — list conversations, pull history (text/image/file/voice/video), fetch media, send text. See `references/wecom-msg.md`.
- **Documents** — create/read/edit `/doc/*` (doc_type=3) as Markdown; locate by docid or URL. See `references/wecom-doc.md`.
- **Sheets (online)** — full management of `/sheet/*`: create blank, read content (Markdown, async poll), read base info + sub-sheet list, edit a range, append a row, add/remove sub-sheets. See `references/wecom-sheet.md`.
- **Smartpage (smart doc)** — create (from local Markdown, multi-page) and export (two-step async). Trigger only when the user says "智能文档"/"智能主页". See `references/wecom-smartpage.md`.
- **Smartsheet** — create `/smartsheet/*` (doc_type=10); CRUD sub-tables / fields / records; write records with images or files; Webhook fallback when writes are restricted. See `references/wecom-smartsheet.md`.
- **Schedule** — list/detail, create/modify/cancel, add/remove attendees, query free/busy across members and find common free time. See `references/wecom-schedule.md`.
- **Meeting** — create/schedule, list/detail, cancel, update attendees. See `references/wecom-meeting.md`.
- **Todo** — list/detail, create/update/delete, change handling status (accept/reject/complete), assign. See `references/wecom-todo.md`.

Shared calling format, return shape, error handling, contact lookup, and time-format rules: `references/wecom-shared.md`.

## Quick examples
```bash
wecom-cli contact get_userlist '{}'

wecom-cli msg get_msg_chat_list '{"begin_time":"2026-04-08 00:00:00","end_time":"2026-04-15 23:59:59"}'

wecom-cli msg send_message '{"chat_type":1,"chatid":"zhangsan","msgtype":"text","text":{"content":"hello"}}'

wecom-cli doc create_doc '{"doc_type":3,"doc_name":"项目周报"}'
wecom-cli doc get_doc_content '{"docid":"DOCID","type":2}'

wecom-cli doc create_doc '{"doc_type":4,"doc_name":"项目排期表"}'
wecom-cli doc sheet_get_info '{"docid":"DOCID"}'
wecom-cli doc sheet_update_range_data '{"docid":"DOCID","sheet_id":"SHEET_ID","grid_data":{"start_row":0,"start_column":0,"rows":[{"values":[{"cell_value":{"text":"完成需求文档"},"cell_format":{}},{"cell_value":{"text":"张三"},"cell_format":{}}]}]}}'
wecom-cli doc sheet_append_data '{"docid":"DOCID","sheet_id":"SHEET_ID","row":{"values":[{"cell_value":{"text":"新任务"},"cell_format":{}},{"cell_value":{"text":"李四"},"cell_format":{}}]}}'
wecom-cli doc sheet_add_sub '{"docid":"DOCID","sheet":{"title":"新子表","row_count":100,"column_count":26},"index":0}'
wecom-cli doc sheet_delete_sub '{"docid":"DOCID","sheet_id":"SHEET_ID"}'

# smartpage create needs the leading '+'
wecom-cli doc +smartpage_create '{"title":"项目概览","pages":[{"page_title":"需求文档","content_type":1,"page_filepath":"/path/to/requirements.md"}]}'
wecom-cli doc smartpage_export_task '{"docid":"DOCID","content_type":1}'

wecom-cli schedule get_schedule_list_by_range '{"start_time":"2026-04-15 00:00:00","end_time":"2026-04-15 23:59:59"}'
wecom-cli meeting create_meeting '{"title":"周例会","meeting_start_datetime":"2026-04-16 15:00","meeting_duration":3600}'
wecom-cli todo get_todo_list '{}'
wecom-cli todo create_todo '{"content":"完成Q2规划文档","remind_time":"2026-04-20 09:00:00"}'
```

Note: `+smartpage_create` requires the `+` prefix — it applies only to that command, not other `doc` subcommands.
