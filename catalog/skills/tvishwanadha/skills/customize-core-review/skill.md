---
name: customize-core-review
description: >-
  This skill should be used when the user asks to "customize a review",
  "override review defaults", "add project-specific review rules",
  "extend review-logic", or "create local review overrides". Create or modify
  a local review override for a core review type.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[type: logic | patterns | documentation | skill]"
---

# Customize Core Review

**Input**: `$ARGUMENTS` - one of `logic`, `patterns`, `documentation`, or `skill`.

## Examples

- `reviewer:customize-core-review patterns` - add project-specific pattern rules
- `reviewer:customize-core-review logic` - override default logic review rules

## Procedure

> `<local-skills>/` below is the project's local skills directory (e.g. `.claude/skills/`); prefer one that already exists.

### 1. Parse and validate type

Extract the review type from `$ARGUMENTS`. Must be one of: `logic`, `patterns`, `documentation`, `skill`. If missing or invalid, ask the user which type to customize.

### 2. Show current defaults

Read the plugin's default rules from the corresponding core review skill's references directory to show what's already covered:

- `${CLAUDE_PLUGIN_ROOT}/skills/review-<type>/references/default-<type>.md`

Present a summary.

### 3. Choose mode

Ask the user:
- **Extend** - add project-specific rules on top of the defaults
- **Override** - replace defaults entirely with a custom ruleset

### 4. Check for existing local skill

Check if `<local-skills>/local-review-<type>/SKILL.md` already exists on disk.

If it exists:
1. Read the file and present its current content
2. Ask: **replace** (overwrite), **merge** (append new rules), or **cancel**
3. If cancel, stop here

### 5. Gather rules

Ask the user for their project-specific review rules. Prompt for concrete, actionable checks (not vague guidelines).

### 6. Generate and write

Read the template from [assets/local-review.md](assets/local-review.md). Replace placeholders:

| Placeholder | Value |
|-------------|-------|
| `{TYPE}` | The review type (e.g., `patterns`) |
| `{MODE_LINE}` | If extend: `These rules extend the default {TYPE} review rules.` If override: `These rules replace the default {TYPE} review rules. Do NOT use the default rules.` |
| `{RULES}` | User-provided bullet list of rules |

Write the result to `<local-skills>/local-review-<type>/SKILL.md`.

### 7. Confirm

Print what was created and how it integrates with the review system.
