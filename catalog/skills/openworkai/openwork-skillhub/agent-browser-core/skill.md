---
name: agent-browser-core
description: AI-friendly web automation driven by the agent-browser CLI — DOM snapshots, stable element refs, and structured commands for reliable browser control.
description_en: "AI-friendly web automation via agent-browser CLI with snapshots & refs"
version: 1.0.2
display_name: "网页自动化 (Agent Browser)"
tags:
  - web-automation
  - browser
  - scraping
  - ui-interaction
visibility: public
---

# Agent Browser Core

## What this skill is for
Drive a real browser from the command line to automate web work — navigation, form filling, data extraction, screenshots — using structured commands instead of brittle selectors. The CLI produces DOM **snapshots** and stable element **refs** so the agent can target precisely and verify outcomes.

## How to get oriented
- `references/agent-browser-overview.md` — install, architecture, core concepts.
- `references/agent-browser-command-map.md` — command categories and flags.
- `references/agent-browser-safety.md` — high-risk controls and safe-mode rules.
- `references/agent-browser-workflows.md` — recommended automation patterns.
- `references/agent-browser-troubleshooting.md` — common failures and fixes.

## Working model
1. **Snapshot first.** Capture page state before acting so you know what exists.
2. **Act via refs.** Target elements by their stable ref, not raw CSS/XPath.
3. **Snapshot again.** Re-read the DOM after any change to confirm it happened.
4. **Use `--json`** when scripting or piping output to other tools.
5. **Wait deliberately.** Check load state before interacting; never assume readiness.
6. **Clean up.** Close tabs/sessions when finished to free the browser.

## Safe-mode guardrails (default)
Do not enable `eval`, `--allow-file-access`, a custom `--executable-path`, or arbitrary `--args` without explicit user approval. Avoid `network route`, `set credentials`, and cookie/storage writes unless the task truly needs them. Prefer an allowlist of target domains and block localhost / private-network destinations.

## Sessions & authentication
- By default the CLI launches a **fresh, isolated** browser instance — it does **not** inherit the user's existing logins.
- To reuse a login across runs, persist state with `--user-data-dir`.
- To attach to an already-running Chrome, use `--cdp` (handy for auth that's hard to automate).
- If you hit OAuth or CAPTCHA walls that block automation, **stop and hand off to the user** rather than retrying forever.

## Orchestrating complex tasks
- State a clear plan, then execute step by step, reporting each step's outcome before continuing (batch downloads, multi-page scraping, long forms).
- Pace actions and add natural delays to avoid anti-bot triggers.
- Ask for explicit confirmation before sensitive acts: entering passwords, bulk downloads, deletions.

## Verifying results
- If extracted fields come back empty, `0.00`, or otherwise abnormal, prompt the user to confirm the source or page state.
- After any write (click/fill/submit), re-snapshot or `get` to prove the DOM actually changed.
- Never claim "done" or "success" unless the underlying state substantively changed.
