---
name: init
user-invocable: false
description: "Use when explicitly invoked to set up specwright in a repository: scaffold the .specwright vault, add the specwright section to the canonical AGENTS instructions with its Claude symlink, install the two Codex role profiles, and add the ignore rules for the chosen mode. Idempotent — re-running it is the upgrade. Trigger on '/sw:init', '$sw:init', 'set up specwright here', or 'initialize specwright in this repo'."
---

# init — set up specwright in this repository

The plugin already provides every workflow skill. This command creates only
project-scoped content, and only what is missing:

- the `.specwright/` vault;
- a `## specwright` section in the canonical AGENTS instructions, plus the Claude
  adapter symlink;
- the ignore rules for the chosen mode.

That is the whole list. Role profiles are **not** project state — see step 5.

It never installs or enables a plugin, edits personal host configuration, copies
skill bodies, or creates `.claude/settings.json`.

**Announce at start:** "Setting up specwright..."

## 1. Resolve the plugin root

Resolve `SW_PLUGIN_ROOT` before any project write:

1. use `PLUGIN_ROOT` when it contains `.codex-plugin/plugin.json`;
2. otherwise use `CLAUDE_PLUGIN_ROOT` when it contains `.claude-plugin/plugin.json`;
3. otherwise derive it from this loaded `skills/init/SKILL.md` real path — the
   plugin root is two parents above the `skills/init/` directory.

Require `scripts/sw_init.py` and both `templates/codex-agents/sw-*.toml` beneath
that root. Stop before writing if resolution fails, and report the missing path.
Never look for bundled resources inside the target repository.

## 2. Pick the mode

Ask once, unless `$ARGUMENTS` already says `shared` or `local`:

- **shared** — specwright state is versioned with the project. Tracks
  `.specwright/`, `AGENTS.md`, `CLAUDE.md -> AGENTS.md`, and the two Codex
  profiles. Ignores only `.specwright/worktrees/`. Pick this for your own repo.
- **local** — specwright state stays private to this checkout. Uses
  `AGENTS.override.md`, `CLAUDE.local.md -> AGENTS.override.md`, and ignores the
  whole vault, both instruction paths, and the profiles. Pick this for a repo you
  cannot or would rather not commit workflow artifacts to.

The canonical instruction file is always the `AGENTS*` path; the `CLAUDE*` path is
only a compatibility symlink, never the source of truth.

## 3. Run the scaffolder

```bash
python3 "$SW_PLUGIN_ROOT/scripts/sw_init.py" \
  --project "$PWD" \
  --mode "<shared-or-local>"
```

It reports every path as `created`, `updated`, or `present`, and writes nothing
that already exists. Show its output.

A **conflict** — reported with a non-zero exit and nothing written — means a path
exists in a shape specwright cannot use, most often a `CLAUDE.md` that is a
regular file where the adapter symlink belongs. Relay the conflict verbatim and
let the maintainer decide; never move, delete, or overwrite their file to clear
it, and never fall back to copying a file where a symlink is required.

## 4. Verify

```bash
python3 "$SW_PLUGIN_ROOT/scripts/sw_init.py" --project "$PWD" --mode "<mode>"
```

A second run must report every path as `present` and create nothing. Then confirm:

- the canonical AGENTS file is a regular file containing one `## specwright` section;
- the Claude adapter is a relative symlink to it (`readlink` returns the bare filename);
- `.specwright/` holds `changes/` and `deliveries/`;
- in local mode, `git check-ignore` reports the vault, both instruction paths, and
  the profiles as ignored, while unrelated project files are not.

## 5. Check the Codex roles — never install them silently

Claude Code finds its roles inside the installed plugin, so nothing is needed.
Codex reads role profiles from **its own home**, not from the project, so they
install once per machine and then serve every repository. They are not written
into the repo, and this command never installs them on its own: writing outside
the project is the maintainer's call.

Only when the machine has Codex, check and report:

```bash
python3 "$SW_PLUGIN_ROOT/scripts/sw_init.py" --install-codex-roles --format json
```

Run that **only if the maintainer asks for it**. To check without writing, test
for `sw-change-owner.toml` and `sw-reviewer.toml` under `${CODEX_HOME:-~/.codex}/agents/`.
If either is missing, print the command above and say it is a one-time,
machine-wide step — like installing the plugin itself, not part of this repo.

Codex also gates subagents behind a feature that ships **disabled**, so the
roles stay inert until it is on:

```bash
codex features enable multi_agent_v2
```

Without it, `sw:delivery` and `sw:review` still work — they run their passes
inline instead of spawning, exactly as on any agent without subagents.

## Then

Report the mode and the paths created. Do not stage or commit them unless the
maintainer separately authorizes Git actions.

Say what comes next: **`/sw:propose`** (`$sw:propose` in Codex) turns a
conversation into a change. The `## specwright` section now tells this
repository's agents to offer that command rather than starting the workflow on
their own.
