---
name: opencode-agent-expert
description: "Design, validate, and write OpenCode agents, subagents, skills, and commands from the canonical opencode.ai schema (May 2026). USE FOR: create agent, configure agent, edit agent, audit agent, refactor agent, create skill, write SKILL.md, create command, /-shortcut, agent frontmatter, permission matrix, task routing, steps, subagent delegation, primary vs subagent mode, hidden subagent, MCP tool permissions, Bash glob permissions, $ARGUMENTS placeholder, !shell, @file reference. DO NOT USE FOR: project-local .opencode/ scaffolding (use the per-project CLI), Claude Code or Cursor configs, general coding tasks, or anything that is not an OpenCode agent/skill/command."
license: MIT
compatibility: opencode
metadata:
  topic: opencode-meta
  schema-version: 2026-05
---

# OpenCode Agent Expert — Reference

Canonical schema reference for the `opencode-agent-expert` subagent. Synthesized from opencode.ai/docs/{agents,skills,commands} (last updated 2026-05-31) and Razuer/handy-opencode `agent-creator` skill for the permission/prompt structure.

## 1. Agent schema

Agents are defined either in `opencode.json` under the `agent` key, or as markdown files with YAML frontmatter in `~/.config/opencode/agents/` (global) or `.opencode/agents/` (per-project). The markdown filename is the agent name.

| Field | Required | Type | Notes |
|---|---|---|---|
| `description` | **yes** | string | ≤300 chars. A routing signal, not a system prompt. Other agents read this to decide whether to delegate. |
| `mode` | no | `primary` \| `subagent` \| `all` | Default `all`. Primary = user-switchable via Tab. Subagent = invoked by other agents or via `@mention`. |
| `model` | no | `provider/model-id` | E.g. `anthropic/claude-sonnet-4-20250514`. Inherits from primary if unset. |
| `temperature` | no | 0.0-1.0 | 0.0-0.2 analytical, 0.3-0.5 balanced, 0.6-1.0 creative. Model default if unset (0 for most, 0.55 for Qwen). |
| `steps` | no | integer | Max agentic iterations. Replaces deprecated `maxSteps`. |
| `prompt` | no | string \| `{file:./prompts/x.txt}` | Inline or path reference. Path is relative to the config file. |
| `permission` | no | object | See §4 Permission matrix. |
| `hidden` | no | bool | Subagent only. Hides from `@` autocomplete but still invokable via Task tool. |
| `disable` | no | bool | Disables the agent. |
| `color` | no | hex \| theme name | UI accent. Hex (`#FF5733`) or `primary`/`secondary`/`accent`/`success`/`warning`/`error`/`info`. |
| `top_p` | no | 0.0-1.0 | Alternative to temperature. |
| `tools` | **DEPRECATED** | object | Use `permission` instead. |
| `maxSteps` | **DEPRECATED** | integer | Use `steps` instead. |

Any other field is passed through to the provider (e.g. `reasoningEffort`, `textVerbosity` for OpenAI reasoning models).

## 2. Skill schema

Skills are folders containing `SKILL.md` with strict YAML frontmatter. Recognized fields: `name`, `description`, `license`, `compatibility`, `metadata`. Everything else is ignored.

| Field | Required | Rule |
|---|---|---|
| `name` | **yes** | 1-64 chars, matches `^[a-z0-9]+(-[a-z0-9]+)*$`, equals the directory name |
| `description` | **yes** | 1-1024 chars. Routing signal with USE FOR / DO NOT USE FOR cues. |
| `license` | no | SPDX identifier or short string. |
| `compatibility` | no | Tool identifier, e.g. `opencode`. |
| `metadata` | no | string-to-string map. Free-form. |

Discovery paths (in priority order):
1. `.opencode/skills/<name>/SKILL.md` (project, walked up to git worktree)
2. `.claude/skills/<name>/SKILL.md` (project, Claude compat)
3. `.agents/skills/<name>/SKILL.md` (project, agent compat)
4. `~/.config/opencode/skills/<name>/SKILL.md` (user)
5. `~/.claude/skills/<name>/SKILL.md` (user, Claude compat)
6. `~/.agents/skills/<name>/SKILL.md` (user, agent compat)

Loaded on demand by the native `skill` tool. The `available_skills` block in the tool description lists name + description; the agent calls `skill({ name: "..." })` to load the full body.

## 3. Command schema

Commands are markdown files in `~/.config/opencode/commands/` (global) or `.opencode/commands/` (project), or entries under the `command` key in `opencode.json`. Filename is the command name.

| Field | Required | Notes |
|---|---|---|
| `template` (JSON) or body (Markdown) | **yes** | The prompt body. |
| `description` | no | Shown in the TUI when typing `/`. |
| `agent` | no | Which agent to run. If a subagent, the command triggers a subagent invocation by default. |
| `subtask` | no | bool. Force subagent invocation even if `agent` is primary. |
| `model` | no | Override model. |

Placeholder syntax in the body:
- `$ARGUMENTS` — all args as a single string
- `$1`, `$2`, … — positional args
- `` !`command` `` — bash output, e.g. `` !`git log --oneline -10` ``
- `@path/to/file` — file contents inlined into the prompt

Custom commands can shadow built-ins (`/init`, `/undo`, `/redo`, `/share`, `/help`).

## 4. Permission matrix

Each key takes the shorthand `allow` | `ask` | `deny`, OR for tool-style keys an object of `glob-pattern → action`. **Last match wins**.

| Key | Tools gated | Shorthand-only? |
|---|---|---|
| `read` | `read` | no (supports globs) |
| `edit` | `write`, `edit`, `apply_patch` | no |
| `glob` | `glob` | no |
| `grep` | `grep` | no |
| `list` | `list` | no |
| `bash` | `bash` | no (supports globs) |
| `task` | `task` (subagent invocation) | no (supports globs) |
| `external_directory` | any tool reading/writing outside worktree | yes |
| `todowrite` | `todowrite`, `todoread` | yes |
| `webfetch` | `webfetch` | yes |
| `websearch` | `websearch` | yes |
| `lsp` | `lsp` | yes |
| `skill` | `skill` | no (supports globs) |
| `question` | `question` | yes |
| `doom_loop` | recovery prompts when agent appears stuck | yes |

Permission keys are matched as wildcards against tool names, so `"mymcp_*": "deny"` denies every tool from an MCP server, `"mymcp_search": "ask"` targets one.

### PDF access rule (recommended pattern)
To protect against accidental processing of sensitive local PDF files, all agents (except `scout` and generic meta-agents like `explore` used in non-local contexts) should restrict PDF access via glob patterns:

```yaml
permission:
  read:
    "anonymised*": "allow"    # Allow anonymised PDFs (soft guardrail)
    "*.pdf": "ask"            # Ask for all other PDFs
```

This pattern:
- Allows unrestricted access to anonymised PDFs (filename starts with `anonymised`)
- Requires explicit user permission for any other `.pdf` file
- Applies only to **local** file access; internet-based PDF fetches via `webfetch` are unaffected
- Does NOT apply to `scout` (internet-focused) or system meta-agents (`build`, `plan`, `general`)

Rationale: Protects against unintended processing of sensitive documents while remaining soft (ask, not deny).

### `task` permission (subagent routing)
Use `permission.task` to control which subagents an agent can invoke. `"*": "deny"` removes the subagent from the Task tool description entirely. Rules are evaluated in order, **last matching rule wins**. Users can always invoke any subagent via `@`, even if `task` permission denies it.

## 5. Prompt template (use this for every agent body)

```
# Role
One paragraph: who the agent is and what it owns.

# Constraints
What it must NEVER do.

# Workflow
Numbered steps the agent follows.

# Output style
Formatting, length, tone.

# Examples
1-2 short worked examples.
```

**Note on permissions**: When creating a new agent, unless it is `scout` or a system meta-agent, include the standard PDF access rule in the frontmatter:

```yaml
permission:
  read:
    "anonymised*": "allow"
    "*.pdf": "ask"
```

This is the standard guard rail for protecting against accidental processing of sensitive local PDFs.

## 6. Anti-pattern index (strict mode rejects all of these)

| Anti-pattern | Fix |
|---|---|
| `maxSteps: 5` | `steps: 5` |
| `tools: { write: false }` | `permission: { edit: deny }` |
| Skill `name: "MySkill"` or `name: "my--skill"` | `^[a-z0-9]+(-[a-z0-9]+)*$`, no consecutive `-` |
| Skill `name` not equal to the directory name | Rename dir to match `name` |
| Skill description 1025+ chars | Trim to ≤1024 |
| Agent description >300 chars or missing | Trim or add. This is a routing signal, not a system prompt. |
| `mode: agentic` (not a real value) | `mode: primary` \| `subagent` \| `all` |
| `bash: allow` on a read-only agent | `bash: deny` |
| `permission.task: "*": "allow"` and the agent's own description could match | Be specific, or `"*": "deny"` with explicit allow rules |
| Agent name = `build` / `plan` / `general` / `explore` / `scout` (shadows a built-in) | Choose a different name, or get explicit user confirmation |
| Skill description missing USE FOR / DO NOT USE FOR | Add both, comma-separated. |
| Frontmatter fields beyond the recognized set on a skill | Remove (skill only recognizes `name`, `description`, `license`, `compatibility`, `metadata`). |
| Agent missing PDF access rule (except `scout` or system meta-agents) | Add `read: { "anonymised*": "allow", "*.pdf": "ask" }` to protect against sensitive PDFs |

## 7. Companion-artifact recipes

When you produce an agent, consider whether the user also wants:

- **A skill** (`SKILL.md`) — when the agent has complex instructions that are better loaded on demand than kept in the agent's always-on system prompt. Use when the instructions are long, conditional, or only relevant some of the time.
- **A command** (`/name.md`) — when the workflow is something the user will invoke repeatedly from the TUI with arguments. Use when the prompt is short and the user knows what they want before starting.

Always suggest both, never auto-create. The user decides.

## 8. Companion skills pattern: Organizing subordinate skills by agent

When creating multiple skills for a single agent (e.g., `py_analyse` and `py_implement` for `python-pyside6-reviewer`), organize them in a shared collection within your skills repository to maintain a single source of truth.

### Structure

Store agent-specific skills in your repo at:
```
~/.config/opencode/repo/skills/<agent-name>/
├── <skill-1>/
│   └── SKILL.md
├── <skill-2>/
│   └── SKILL.md
└── README.md (optional, summarizes the skill collection)
```

Then symlink the collection to the user config for discovery:
```bash
ln -s ~/.config/opencode/repo/skills/<agent-name> ~/.agents/skills/<agent-name>
```

### Benefits

- **Single source of truth**: All agent-related skills tracked together in your repo
- **Consistency**: Commands, agents, and skills all version-controlled together
- **Discoverability**: Skills remain discoverable via standard `~/.agents/skills/<name>` paths
- **Parallel organization**: Similar to how you organize commands by purpose or agents by domain

### Example

`python-pyside6-reviewer` agent uses two subordinate skills:
- `py_analyse` — analyze code for refactoring opportunities
- `py_implement` — transform code based on suggestions

Both stored in `~/.config/opencode/repo/skills/python-pyside6-reviewer/` with:
- Symlink at `~/.agents/skills/python-pyside6-reviewer/`
- README documenting the collection
- Skills discoverable as optional tools invoked by the agent

### When to use

Use this pattern when:
- An agent has 2+ subordinate skills with related purpose
- You want to track skill evolution alongside agent changes
- Skills should be reused across projects

Consider keeping a skill directly in the agent's prompt when:
- There's only one skill
- The skill is very short (< 200 lines)
- The skill is specific to one user/project

## 9. References

- opencode.ai/docs/agents (last updated 2026-05-31)
- opencode.ai/docs/skills (last updated 2026-05-31)
- opencode.ai/docs/commands (last updated 2026-05-31)
- github.com/Razuer/handy-opencode/tree/master/skills/agent-creator — permission/prompt structure inspiration
- github.com/mikehenken/agent-builder — 14-question Q&A workflow inspiration
- `python-pyside6-reviewer` skills collection — example implementation of companion skills pattern (code review)
- `documentation-reviewer` skills collection — example implementation of companion skills pattern (documentation review)
