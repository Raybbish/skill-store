---
name: extend-self-review
description: >-
  This skill should be used when the user asks to "customize self-review",
  "change review types", "adjust confidence threshold", "add review types to
  self-review", or "configure the review orchestrator". Create or modify a
  self-review-extension skill.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Extend Self-Review

Create or modify a `self-review-extension` skill to customize which review types run, agent assignments, scopes, confidence threshold, and pre/post-review steps.

## Examples

- `reviewer:extend-self-review` - create or modify the self-review extension

## Procedure

> `<local-skills>/` below is the project's local skills directory (e.g. `.claude/skills/`); prefer one that already exists.

### 1. Check for existing extension

Check if `<local-skills>/self-review-extension/SKILL.md` exists on disk.

If it exists, read and present its current content.

### 2. Show built-in defaults

Read the "Built-in Defaults" section of `${CLAUDE_PLUGIN_ROOT}/skills/self-review/SKILL.md` and present it to the user - review types, agent assignments, scopes, and confidence threshold.

### 3. Discover custom review types

Search on disk for `review-*` directories in `<local-skills>/` that aren't the 4 built-in types. Present any discovered custom types as candidates to add.

### 4. Guide through modifications

Ask the user what to change (multi-select):

- **Add review types** - include custom types discovered above; for each, ask which agent to assign and which scope to declare (`packet` - review the changed lines via the diff packet; `explore` - investigate the whole codebase for what the change affects). Scope defaults to `packet` when not declared.
- **Remove review types** - exclude specific defaults
- **Change agent or scope assignments** - switch a type's agent between `reviewer:reviewer`, `reviewer:simple-reviewer`, or a custom agent; switch its scope between `packet` and `explore`
- **Adjust confidence threshold** - raise or lower from the default 80
- **Add pre-review steps** - actions to run before launching reviews (e.g., build, lint)
- **Add post-review steps** - actions to run after coalescing findings

### 5. Generate and write

Read the template from [assets/self-review-extension.md](assets/self-review-extension.md). Replace placeholders:

| Placeholder | Value |
|-------------|-------|
| `{PROJECT}` | Project name (infer from directory or ask) |
| `{SUMMARY}` | One-line summary of the selected modifications |
| `{MODIFICATIONS}` | One `## <category>` section per selected modification category (added review types, removed review types, agent or scope changes, confidence threshold, pre-review steps, post-review steps); emit only the sections the user selected. Format review types as `<type> - assign to <agent>, scope <packet\|explore>`. Format pre-review and post-review steps as numbered lists. |

Write the result to `<local-skills>/self-review-extension/SKILL.md`.

### 6. Confirm

Print what was created and how it affects the self-review workflow.
