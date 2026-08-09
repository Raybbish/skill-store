---
name: add-core-review
description: >-
  This skill should be used when the user asks to "add a review type", "create
  a custom review", "add security review", "add performance review", or "create
  a new review category". Create a new custom review type with project-specific
  rules.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Skill
argument-hint: "[type-name (e.g., security, plugin, codex)]"
---

# Add Core Review

**Input**: `$ARGUMENTS` - name for the new review type (e.g., `security`, `plugin`, `codex`).

## Examples

- `reviewer:add-core-review security` - create a security review type
- `reviewer:add-core-review plugin` - create a plugin-specific review type

## Procedure

> `<local-skills>/` below is the project's local skills directory (e.g. `.claude/skills/`); prefer one that already exists.

### 1. Parse and validate name

Extract the type name from `$ARGUMENTS`. Validate:
- Not empty (ask if missing)
- If name starts with `review-`, strip the prefix (e.g., `review-security` becomes `security`)
- Not a built-in type name (`logic`, `patterns`, `documentation`, `skill`) - if it is, stop and redirect the user to `reviewer:customize-core-review`
- Lowercase, hyphens allowed, no spaces - if it contains invalid characters, normalize to lowercase-hyphen form and confirm the normalized name with the user

### 2. Check for existing skill

Check if `<local-skills>/review-<name>/SKILL.md` already exists on disk.

If it exists:
1. Read the file and present its current content
2. Ask: **replace** (overwrite), **update** (modify rules), or **cancel**
3. If cancel, stop here

### 3. Gather review definition

Ask the user for:
- **Focus area** - a short domain summary of what this review checks for (used directly in the skill's description)
- **Scope** - `packet` (review the changed lines via the diff packet; the common case) or `explore` (investigate the whole codebase for what the change affects; for change-impact types). Defaults to `packet` when not declared.
- **Review rules** - categorized bullet list of specific checks
- **Additional tools** - any tools beyond Read, Glob, Grep, Skill (e.g., shell access for running linters)

### 4. Generate and write

Read the template from [assets/review-type.md](assets/review-type.md). Replace placeholders:

| Placeholder | Value |
|-------------|-------|
| `{NAME}` | The review type name |
| `{FOCUS}` | Short domain summary of what this review checks for |
| `{RULES}` | Categorized bullet list of review rules |

If additional tools were specified, add them to the `allowed-tools` frontmatter field.

Write the result to `<local-skills>/review-<name>/SKILL.md`.

### 5. Auto-wire into self-review extension

Check if `<local-skills>/self-review-extension/SKILL.md` exists:

- **If yes**:
  1. Read the file and show its current content
  2. Offer to add the new review type; if declined, stop
  3. If the review type needs tools the standard agents lack, invoke `reviewer:create-reviewer-agent`, then return here and continue at the next sub-step with the new agent as a choice
  4. Ask which agent to use (`reviewer:reviewer`, `reviewer:simple-reviewer`, or a custom agent)
  5. Record the scope gathered in step 3 (`packet` or `explore`)
  6. Edit the extension to include the new type with its agent and scope
- **If no**: print instructions suggesting `reviewer:extend-self-review` to configure the orchestrator to include this new type, its agent, and its scope.

### 6. Confirm

Print what was created and how to invoke it (e.g., `review-<name> src/`).
