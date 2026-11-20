---
name: claude-consult
description: >
  Consult Claude Code CLI (Claude Pro or Max, no API key) for a second
  opinion, plan critique, diff review, or occasional implementation. Use when
  the user says "ask Claude", "Claude's opinion", "have Claude review",
  "second opinion from Claude Code", or claude-consult. Never auto-invoke.
  One Claude at a time. Parallel with other consult skills only when the
  user asked for more than one. Grok stays the default agent. Prefer brain-only opinion
  mode. Skip if `claude` is not on PATH.
---

# Claude Code consult

Grok is the daily driver. Requires local Claude Code (`claude auth login`, Pro or Max). Never `--bare`.

Plugin install sets `GROK_PLUGIN_ROOT` (`CLAUDE_PLUGIN_ROOT` is an alias).

```bash
ROOT="${GROK_PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-}}"
CLAUDE_CONSULT="${ROOT}/scripts/claude-consult"
```

If `ROOT` is empty, set `CLAUDE_CONSULT` to `../../scripts/claude-consult` relative to this SKILL.md (this file is in `skills/claude-consult/`).

## Run

Shell tool **timeout must be 960000 ms** so the wrapper (default 900s) can return exit 124 with partial stdout. Put the plan/diff on **stdin**.

```bash
"$CLAUDE_CONSULT" --mode opinion --stdin <<'EOF'
Review this plan: …
EOF
```

```bash
git diff HEAD | "$CLAUDE_CONSULT" --mode review --cwd "/path/to/repo" --stdin
```

Empty stdin fails (including a clean `git diff`). That is expected.

## Modes

| Mode | When | Tools |
|------|------|-------|
| `opinion` | Plan / design critique (default) | none |
| `review` | Repo/diff review | Read, Glob, Grep only — paste the diff on stdin |
| `read` | Codebase Q | Read, Glob, Grep only |
| `implement` | User asked for file edits | default tools |

`--cwd` = git root for review/read/implement. Omit for opinion. Never `~/.grok` or `$HOME`.

`--model` and `--effort` only when the user names them. Otherwise omit (wrapper defaults: model `opus`, effort `high`, `read` is `medium`).

- `--model` `sonnet` | `opus` | `fable` | full id (`claude-opus-5`, `claude-opus-4-8`, `claude-fable-5`). Full id if they do not want latest.
- `--effort` `low` | `medium` | `high` | `xhigh` | `max`

## Steps

1. Default to `opinion`. Full plan/diff via `--stdin`. Add `--model` / `--effort` only if named.
2. `review`/`read`: `--cwd` = repo. For `review`, pipe the diff they asked for (default `git diff HEAD`). Empty diff: stop; that is expected. Claude cannot run Bash.
3. `implement`: only if the user asked for edits; confirm if unclear.
4. Relay **stdout** attributed to Claude. Exit 124 is a timeout: say so, and if stdout is non-empty show it as a partial answer. Other non-zero exits with stdout: still treat stdout as the answer (stderr warnings are not a failure). Stop only when the command fails **and** stdout is empty.
5. Auth: `claude auth status` / `claude auth login`. No API keys.

## Do not

- Call `claude` directly.
- Put a long prompt on argv. Use `--stdin`.
- Use `--bare` or `--cwd ~/.grok`.
- Run two Claude consults at once. One of each CLI in parallel is OK when the user asked for more than one. Never two `implement` runs in the same `--cwd`.
