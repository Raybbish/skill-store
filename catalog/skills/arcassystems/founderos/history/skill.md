---
name: history
description: >
  Show the founder their saved versions as readable dated events, wrapping git log so they never read a SHA. Trigger on "what changed", "show my history", "version history", "what did I save", "show my saved versions", "what have I changed", or any plain request to see past versions. Renders newest first, grouped by day. Handles a fresh repo with no saved versions and a shallow clone gracefully instead of erroring.
why: "A founder who can see their own version history trusts that the OS is keeping their work safe and that undo is real. Plain dated events, not SHAs, keep version control legible to a non-technical operator."
enhance: "Pair with save: the more often the founder saves, the richer and more useful this history becomes as undo points."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# History

Runs on: local-exec - runs a local script; on a cloud surface I read the results, I do not run it.

Show the founder their saved versions as readable, dated events. Wraps git log so they never read a SHA. Read-only.

## Pre-flight

- If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`
- If `scripts/caveman_git.py` does not exist, stop with: `Version control helper not found. Run /founder-os:update to install it.`
- If git is not installed or the folder has no `.git/` directory (a ZIP install that has not graduated yet), do not error. Show what the session-change tracker knows instead (`python scripts/session_changes.py --print`), then say: `That is this session's changes. For a full permanent timeline, say "own my history" and I will set it up for you.`

## Procedure

1. Run `python scripts/caveman_git.py history`. For the full list rather than the recent slice, use `--full`. For a specific count, use `--limit N`.
2. Relay the output as the script prints it: dated events, grouped by day, newest first. Do not add SHAs or git jargon.
3. If the script says nothing is saved yet (a fresh install with no user versions, including a fresh clone with only the upstream version, or a shallow clone), relay that plainly and offer: say "save my work" to record the first version.

## Runtime honesty

This verb runs a local script. On a surface that cannot run a script, say so and offer to read whatever history the founder can paste; you cannot generate the live history there.

## Rules

- Read-only. This verb never changes anything.
- No SHAs in what you show the founder. Dates and plain summaries only.
- No em dashes or en dashes. Hyphens only.
