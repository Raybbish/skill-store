---
name: reviewer-init
description: >-
  This skill should be used when the user asks to "set up reviewer", "initialize
  reviews", "configure the reviewer plugin", or "set up code review". Interactive
  setup wizard for the reviewer plugin.
allowed-tools: Read, Glob, Grep, Skill, AskUserQuestion
disable-model-invocation: true
---

# Reviewer Init

## Examples

- `reviewer:reviewer-init` - run the interactive setup wizard

## Procedure

> `<local-skills>/` below is the project's local skills directory (e.g. `.claude/skills/`); prefer one that already exists.

### 1. Detect existing setup

Scan for existing reviewer configuration:
- Search on disk for `local-review-*` directories in `<local-skills>/`
- Check for `<local-skills>/self-review-extension/SKILL.md`
- Search on disk for custom `review-*` directories in `<local-skills>/` (excluding the 4 built-in types)
- Check for custom agent files in `.claude/agents/`

Present a summary of what already exists.

### 2. Present menu

Show available setup options (multi-select). Mark already-configured items:

1. **Self-review extension** - customize which review types run, agents, scopes, threshold
2. **Local review overrides** - add project-specific rules for built-in types (logic, patterns, documentation, skill)
3. **Custom review type** - create a new review category (e.g., security, performance)
4. **Custom reviewer agent** - create a specialized agent with a specific model

### 3. Execute selected options

For each selected option, load the corresponding creation skill:

| Selection | Skill to invoke | Arguments |
|-----------|----------------|-----------|
| Self-review extension | `reviewer:extend-self-review` | (none) |
| Local review overrides | `reviewer:customize-core-review` | `<type>` for each selected type |
| Custom review type | `reviewer:add-core-review` | `<name>` |
| Custom reviewer agent | `reviewer:create-reviewer-agent` | `<name>` |

Invoke skills sequentially - each one is interactive and needs user input. Run selected options in dependency order regardless of menu order: custom agents first, then custom review types, then local overrides, then the self-review extension last.

### 4. Print summary

After all selected options are complete, roll up what each sub-skill reported, then print: "Run `reviewer:self-review` to test the configuration".
