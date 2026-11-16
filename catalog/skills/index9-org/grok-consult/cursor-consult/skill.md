---
name: cursor-consult
description: >
  Consult Cursor Agent CLI from Grok for a second opinion, plan critique,
  diff review, or occasional implementation, using the user's Cursor
  subscription models. Use when the user says "ask Cursor", "Cursor review",
  "Cursor's opinion", "use Cursor with", or cursor-consult. Never auto-invoke.
  One Cursor at a time. Parallel with other consult skills only when the user
  asked for more than one. Grok stays the default agent. Skip if
  `cursor-agent` is not on PATH.
---

# Cursor consult

Grok is the daily driver. Requires local Cursor Agent CLI (`cursor-agent login`).
The binary is `cursor-agent`, never `cursor` (that is the editor).

Plugin install sets `GROK_PLUGIN_ROOT` (`CLAUDE_PLUGIN_ROOT` is an alias).

```bash
ROOT="${GROK_PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-}}"
CURSOR_CONSULT="${ROOT}/scripts/cursor-consult"
```

If `ROOT` is empty, set `CURSOR_CONSULT` to `../../scripts/cursor-consult` relative to this SKILL.md (this file is in `skills/cursor-consult/`).

## Run

Shell tool **timeout must be 960000 ms** so the wrapper (default 900s) can return exit 124 with partial stdout. Put the plan/diff on **stdin**.

```bash
"$CURSOR_CONSULT" --mode opinion --stdin <<'EOF'
Review this plan: …
EOF
```

```bash
"$CURSOR_CONSULT" --mode review --cwd "/path/to/repo" --model composer-2.5 --stdin <<'EOF'
Severity-ordered findings with file evidence.
EOF
```

Empty stdin fails (including a clean `git diff`). That is expected.

## Modes

| Mode | When | Cursor flags |
|------|------|----------------|
| `opinion` | Plan / design critique (default) | `--mode ask`, sandbox on, no `--force` |
| `review` | Repo/diff review | `--mode ask`, sandbox on, no `--force` — paste the diff on stdin |
| `read` | Codebase Q | `--mode ask`, sandbox on, no `--force` |
| `implement` | User asked for file edits | `--force`, inherits Cursor sandbox/MCP config |

`--cwd` = project directory for review/read/implement. Omit for opinion. Never `~/.grok` or `$HOME`. Review does not require a git root.

`--model` only when the user names it. Otherwise omit (wrapper uses the Cursor CLI selected model). There is no `--effort` flag; encode effort in the model id (`claude-opus-5-thinking-high`, `grok-4.6[effort=high]`).

Cursor loads `~/.cursor` config, project `AGENTS.md`, and `.cursor/rules`. That is expected and not hermetic.

## Steps

1. Default to `opinion`. Full plan/diff via `--stdin`. Add `--model` only if named. If they name effort, fold it into `--model`.
2. `review`/`read`: `--cwd` = repo. For `review`, pipe the diff they asked for (default `git diff HEAD`). Empty diff: stop; that is expected.
3. `implement`: only if the user asked for edits; confirm if unclear. Implement applies changes without confirmation.
4. Relay **stdout** attributed to Cursor. Name the model they requested, or "Cursor default model" if omitted. Exit 124 is a timeout: say so, and if stdout is non-empty show it as a partial answer. Other non-zero exits with stdout: still treat stdout as the answer (stderr warnings are not a failure). Stop only when the command fails **and** stdout is empty.
5. Auth: `cursor-agent status` / `cursor-agent login`. No API keys.

## Do not

- Call `cursor-agent` or `cursor` directly.
- Put a long prompt on argv. Use `--stdin`.
- `--cwd ~/.grok` or `$HOME`.
- Run two Cursor consults at once. One of each CLI in parallel is OK when the user asked for more than one. Never two `implement` runs in the same `--cwd`.
