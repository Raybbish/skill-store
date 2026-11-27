---
name: gongzhonghao-daily-v1
description: Daily content-production skill for a WeChat Official Account. Each run produces one Markdown article + one cover image + two inline illustrations + a paste-ready HTML file, pushes the draft to the Official Account draft box (email as fallback), and archives to a knowledge base. Triggers: write official-account copy, prep draft, today's content, Day N, generate cover, generate illustration, send email, archive to knowledge base.
description_en: "WeChat Official Account daily content production skill (v1)"
version: 1.0.0
display_name: "公众号日更 (WeChat Official Account Daily)"
tags:
  - wechat
  - official-account
  - content-production
  - publishing
visibility: public
---

# Official Account Daily Production (v1)

## Overview
Produce a complete daily deliverable for a WeChat Official Account: one Markdown article + one cover image + two inline illustrations, then push the draft to the Official Account draft box (email as fallback) and archive it to a knowledge base. The example account here is an AI-popularization publication aimed at general readers — plain language, low barrier.

Configure these per your own account (env vars or a small `config.json`):
- `WECHAT_PUB_EMAIL` — fallback recipient email.
- `WECHAT_DRAFT_RELAY` — base URL of your draft-relay service (a server that calls the WeChat API on your behalf; set up once, add its IP to the Official Account IP allowlist).
- `KB_SPACE_ID` / your KB import tool — where finished articles are archived (e.g. a Lexiang/Ima space).

## Working directory
```
Claw/
├── 稿件/                    # daily articles  → DayN-title.md
├── images/                  # inline illustrations
│   ├── dayN_illustration_01.png
│   └── dayN_illustration_02.png
├── cover_template.jpg       # cover master (do not modify)
├── cover_dayN.jpg           # daily cover
└── 公众号内容规划.md          # editorial calendar
```

## Viral-content strategy
Six rules, validated against real traffic data — check each before writing and publishing:
1. **Short titles.** Main title ≤ 14 Chinese characters; drop filler words and question-mark tails. Put extras in the subtitle/summary.
2. **Ride the WeChat Index.** Before writing, check WeChat Index (weixin.sogou.com) for rising keywords; fold a hot term into the title or opening hook.
3. **Control length.** Body 800–1200 chars; tutorials up to 1500 but say so up front. Keep paragraphs ≤ 3 lines (2–3 fit one phone screen).
4. **Shareability.** Hit at least 2 of: resonance, emotion, actionable value, humor. If you can't say why someone would forward it, rewrite the hook or add a memorable line.
5. **30-minute window.** Forwards in the first 30 minutes decide whether the post enters the first traffic pool — remind the operator to share to groups/moments immediately after publishing.
6. **Reuse winners.** Log per-article stats (reads/likes/shares/completion); past winning title patterns and angles tend to win again.

## Daily production flow
**Step 1 — Topic + pre-check.** From `references/content_plan.md`, confirm the day number, title, and type. Pre-check: WeChat Index for hot terms; title ≤ 14 chars; length target; which 2 shareability levers drive shares.

**Step 2 — Write the article.** Path `稿件/DayN-title.md`. Fixed five-part structure:
1. Opening hook (life scene / problem, 2–3 sentences) — can ride a hot term.
2. Core explanation (1 concept + 1 metaphor, ≤ 300 chars).
3. Concrete examples (something an ordinary reader can copy, 3–5 items).
4. One-line summary (blockquote) — a shareable line.
5. Interaction prompt (comment topic + next-episode teaser).
Tone: plain spoken language, like talking to a friend; paragraphs ≤ 3 lines; body 800–1200 chars.

**Step 3 — Cover image.** `scripts/generate_cover.py` builds from `cover_template.jpg`: gradient over the old title area, write today's title + subtitle, output `cover_dayN.jpg` (1920×814, 2.35:1).
```bash
python3 scripts/generate_cover.py "标题" "副标题" "输出路径"
```

**Step 4 — Two inline illustrations.** PIL drawings, style matched to the cover: 1200×800, warm purple-grey gradient `#F7F2F5`→`#EBE4ED`, accent `#7B6B8D`/`#B0A1C3`/`#D2C8DC`, text `#2D3E4F`, rounded cards + flat icons + soft shadows. Pick concepts per section (comparison / scene / flow / metaphor). Output `images/dayN_illustration_01.png` and `_02.png`.

**Step 5 — Insert image references** into the Markdown (cover right under the title; the two illustrations after their sections).

**Step 6 — Convert to WeChat HTML.** The editor can't paste Markdown image refs directly, so build an HTML file with base64-embedded images (email fallback):
```bash
python3 md_to_wechat_html.py "稿件/DayN-标题.md" "稿件/DayN-标题.html"
```
Inlines CSS, base64-encodes all images, fits the 677px editor width. Open in a browser → select all → copy → paste into the editor.

**Step 7 — Push draft to the Official Account (preferred, via relay).**
```bash
python3 publish_to_wechat_draft.py "稿件/DayN-标题.md" <day_number>
```
Your relay service fetches a token, uploads cover + illustrations, and calls `cgi-bin/draft/add`. The operator then opens the draft box, clicks publish, and sets the scheduled send. (An unverified subscription account can't auto-publish, only draft.)

**Step 8 — Email the HTML (fallback).** If draft push fails:
```bash
python3 send_html_email.py "稿件/DayN-标题.html" <day_number> "<文章标题>"
```
Sends to `WECHAT_PUB_EMAIL` via the configured mail API.

**Step 9 — Archive to knowledge base.** Import the article Markdown into `KB_SPACE_ID` via your KB import tool.

**Step 10 — Delivery + 30-minute reminder.** After a successful draft push, tell the operator: (1) open the draft box → publish → schedule 10:00; (2) if push failed, check email and paste manually; (3) share to groups/moments immediately after publishing — first-30-minute forwards drive the traffic pool; (4) log the day's stats 24h later.

## Color spec
| Use | Hex |
| --- | --- |
| Cover/illustration top | #F7F2F5 |
| Cover/illustration bottom | #EBE4ED |
| Primary accent | #7B6B8D |
| Secondary | #B0A1C3 |
| Decorative | #D2C8DC |
| Card bg | #FFFFFF |
| Body text | #2D3E4F |
| Card border | #E8E2ED |

## Fonts
Prefer system PingFang.ttc, fall back to STHeiti Light.
