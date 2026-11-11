---
name: connect
description: >
  Connect a tool to Founder OS by asking in plain English. Trigger on "connect Telegram", "connect my calendar", "connect my email", "set up notifications", "hook up <tool>", "wire up <tool>", or any request to link an external tool. Routes by connector type: env-key tools (Telegram, ElevenLabs) get their key stored in the gitignored .env and a real reachability check; account-level MCP tools (calendar, email) are guided to the Claude Code MCP setup because the OS cannot hold their tokens; manual-link tools store a reference URL. A secret never lands in a tracked file - the writer refuses any target that is not gitignored, and the pre-commit guard blocks token-shaped strings as a backstop. A skipped connector leaves a visible marker the SessionStart brief surfaces.
why: "Connecting a tool is the first thing a new user wants and the easiest place to either leak a secret or quietly fail. Natural-language connect with mechanical secret enforcement and a reachability check that cannot lie makes setup honest from the first minute."
enhance: "Connect only what you actually use. Each env-key connector stores its key in .env, which is gitignored - your tokens never enter the repo or the assistant's transcript when you paste them on stdin."
allowed-tools: ["Bash", "Read", "Write", "Edit"]
mcp_requirements: []
---

# Connect

Runs on: local-writes - stores keys in your gitignored .env and writes a status marker; env-key connectors also run a local script. On a surface that cannot write local files it guides only and says so.

Link an external tool to Founder OS by asking for it. The skill routes by how the tool authenticates and never lets a secret reach a tracked file.

## Pre-flight

- If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`
- If `scripts/connect.py` does not exist, stop with: `Connector helper not found. Run /founder-os:update to install it.`

## The connector registry

Run `python scripts/connect.py registry` to see the live registry. Connectors fall into three classes:

- **env-key** (`telegram`, `elevenlabs`): the OS can walk the steps and store the key locally. The key goes ONLY to the gitignored `.env`.
- **guide-only** (`calendar`, `email`): account-level MCP tools. The OS does NOT control these, cannot run their OAuth, and cannot store their tokens. It hands you the Claude Code MCP-add steps and records the status. OAuth scopes are owned by the MCP / account layer - the OS does not pretend to set them.
- **manual-link** (`docs` and similar): store a reference URL you paste. Honest that it is a bookmark, not a live integration.

## Procedure

1. Identify the tool the user named and its class (`python scripts/connect.py registry`). If the tool is not in the registry, say so and offer the closest class (env-key, guide-only, or manual-link).

2. **env-key class (e.g. Telegram):**
   - Give the setup steps from the registry (for Telegram: open @BotFather, `/newbot`, copy the token, then message the new bot once so it has a chat to reply to).
   - Store the token WITHOUT putting it in your own message or a command argument. Have the user paste it on stdin:
     `python scripts/connect.py set-secret TELEGRAM_BOT_TOKEN` then the pasted value on stdin. The writer refuses any target that is not on the allowlist (`.env`, `.mcp.local.json`) and not proven ignored, so the token cannot land in a tracked file. Where the install has version history, git supplies the proof; on a ZIP install with no git, the shipped `.gitignore` is read directly. Connectors work on both - a missing git is never a reason to refuse.
   - Run the reachability check: `python scripts/connect.py telegram-test`. It resolves the chat id via getUpdates if needed, sends a live test message, and reports the Bot API result.
   - **The API accepting the message does NOT prove the user saw it.** Ask the user directly: "did the test message arrive in Telegram?" Only mark connected after a yes.
   - Record status: `python scripts/connect.py status set telegram "connected (token in .env)"`.

3. **guide-only class (e.g. calendar, email):**
   - This is reasoning only - no local write of a secret. Give the exact Claude Code MCP-add steps (see `docs/tools-and-mcps.md`). State plainly that the OS cannot store the credential or set the OAuth scopes; that lives at the account level.
   - Record status: `python scripts/connect.py status set calendar "guide-only - add the MCP at the Claude Code account level"`.

4. **manual-link class:**
   - Ask for the share URL, store it where the relevant skill expects it (or in `stack.json` as a plain reference - never a secret), and record status.

5. **Skipped connector:** if the user declines or it fails, record the skip so it stays visible:
   `python scripts/connect.py status set <name> "not connected - say 'connect <name>' to set up"`. The SessionStart brief surfaces it day to day.

## How this differs from reconnect-prompt

One posture repo-wide, no conflict:

- `connect` = first-time local-env setup. It MAY store a secret, but only in a gitignored local file (`.env` / `.mcp.local.json`) the OS never commits.
- `reconnect-prompt` = manual re-auth after a 401 / expired token. It never stores a token and never persists to the repo.

If a connected tool later throws a 401, route to `reconnect-prompt`, not back here.

## Revoke

Every connector documents its revoke path in the registry. Telegram: `/revoke` in @BotFather. ElevenLabs: delete the key in the dashboard. MCP tools: remove the MCP in Claude Code settings or revoke at the provider's security page. Surface the revoke line whenever you connect a tool.

## Runtime honesty

env-key connectors need a local runtime (they run `scripts/connect.py` and write `.env`). On a web-only agent that cannot run a script or write local files, do NOT claim a connection. Guide the user through the steps and say the actual key storage and reachability check have to run in Claude Code (or any local-runtime agent pointed at the folder). guide-only and manual-link routing is pure reasoning and works on any surface.

## Rules

- A secret goes ONLY to `.env` or `.mcp.local.json` (both gitignored). Never to `stack.json`, a company or project `.mcp.json`, or any tracked file. The writer enforces this; do not work around it.
- Never report "connected" off an API 200 the user cannot confirm. Ask "did it arrive?" for anything the API cannot prove was delivered.
- Never echo a token back to the user or into a file you write.
- No em dashes or en dashes in anything you write. Hyphens only.
