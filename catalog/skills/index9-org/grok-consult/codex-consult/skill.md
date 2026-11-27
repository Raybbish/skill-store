---
name: codex-consult
description: >
  Consult Codex CLI (ChatGPT login) from Grok for a second opinion, plan
  critique, uncommitted/branch/commit review, or occasional implementation.
  Use when the user says "ask Codex", "Codex review", "OpenAI second opinion",
  "have Codex look at", or codex-consult. Never auto-invoke. One Codex at
  a time. Parallel with other consult skills only when the user asked for
  more than one. Grok stays the default agent. Default model gpt-5.6-sol.
  Skip if `codex`
  is not on PATH.
---

# Codex consult

Grok is the daily driver. Requires local Codex CLI (`codex login`, ChatGPT subscription). Codex is part of that subscription.

Plugin install sets `GROK_PLUGIN_ROOT` (`CLAUDE_PLUGIN_ROOT` is an alias).

```bash
ROOT="${GROK_PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-}}"
CODEX_CONSULT="${ROOT}/scripts/codex-consult"
```

If `ROOT` is empty, set `CODEX_CONSULT` to `../../scripts/codex-consult` relative to this SKILL.md (this file is in `skills/codex-consult/`).

## Run

Shell tool **timeout must be 960000 ms** so the wrapper (default 900s) can return exit 124 with partial stdout. Put the prompt on **stdin**.

```bash
"$CODEX_CONSULT" --mode opinion --stdin <<'EOF'
Review this plan: …
EOF
```

```bash
"$CODEX_CONSULT" --mode review --cwd "/path/to/repo" --stdin <<'EOF'
Severity-ordered findings with file evidence.
EOF
```

## Modes

| Mode | When | Sandbox | `--cwd` |
|------|------|---------|--------|
| `opinion` | Plan / design critique (default) | read-only (host still readable) | optional (temp dir) |
| `review` | `codex exec review` | read-only | required (git root) |
| `read` | Codebase Q | read-only | required |
| `implement` | User asked for edits | workspace-write | required |

Approvals: `approval_policy=never`. Always `--ephemeral`. Opinion uses `--ignore-user-config` (auth still from `CODEX_HOME`).

Review targets (exclusive): default `--uncommitted` · `--base <branch>` · `--commit <sha>`.

`--model` and `--effort` only when the user names them. Otherwise omit (wrapper defaults: model `gpt-5.6-sol`, effort `high`, `read` is `medium`).

- `--model` default `gpt-5.6-sol`
- `--effort` `low` | `medium` | `high` | `xhigh` | `max`

## Steps

1. Default to `opinion`. Full plan/diff via `--stdin`. Add `--model` / `--effort` only if named.
2. `review`: `--cwd` = git root. One target flag (default `--uncommitted`). Stdin is extra instructions, not a second copy of the diff. `read`: `--cwd` = repo.
3. `implement`: only if the user asked for edits.
4. Relay **stdout** attributed to Codex. Exit 124 is a timeout: say so, and if stdout is non-empty show it as a partial answer. Other non-zero exits with stdout: still treat stdout as the answer (stderr warnings are not a failure). Stop only when the command fails **and** stdout is empty.
5. Auth: `codex login status` / `codex login`. Wrapper unsets API keys and common secret env vars.

## Do not

- Call `codex` directly.
- Put a long prompt on argv. Use `--stdin`.
- `--cwd ~/.grok` or `$HOME`.
- Run two Codex consults at once. One of each CLI in parallel is OK when the user asked for more than one. Never two `implement` runs in the same `--cwd`.
