---
name: create-reviewer-agent
description: >-
  This skill should be used when the user asks to "create a reviewer agent",
  "add a custom agent", "create a review agent", or "add a specialized
  reviewer". Create a custom reviewer agent with a specific model and tools.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "[agent-name]"
compatibility: Claude Code only - writes Markdown agent definitions to .claude/agents/. On Codex, author reviewer agents as TOML in .codex/agents/.
---

# Create Reviewer Agent

**Input**: `$ARGUMENTS` - name for the new agent.

## Examples

- `reviewer:create-reviewer-agent security-reviewer` - create a security-focused reviewer
- `reviewer:create-reviewer-agent fast-reviewer` - create a fast haiku-based reviewer

## Procedure

### 1. Parse agent name

Extract the agent name from `$ARGUMENTS`. Validate:
- Not empty (ask if missing)
- Lowercase, hyphens allowed, no spaces or underscores
- 3-50 characters, starts and ends with alphanumeric
- If the name is `reviewer` or `simple-reviewer`, warn: "`reviewer` and `simple-reviewer` are the plugin's built-in agent names - a project agent with this name can be mistaken for the plugin agent in self-review extensions. Continue?" Proceed only on explicit confirmation.

### 2. Check for existing agent

Check if `.claude/agents/<name>.md` already exists on disk.

If it exists:
1. Read the file and present its current content
2. Ask: **replace** (overwrite), **update** (modify), or **cancel**
3. If cancel, stop here

### 3. Gather agent definition

Ask the user for:
- **Model** - `opus` (deep reasoning), `sonnet` (balanced), `haiku` (fast), or `inherit` (default when omitted; uses the session model); full model IDs and `fable` are also valid
- **Description** - what this agent specializes in
- **Additional tools** - beyond the default `Read, Glob, Grep, Skill, WebFetch`
- **Additional skills** - beyond `reviewer-framework`
- **Extra instructions** - any specialized behavior to add to the system prompt
- **Optional fields** - `color` (red, blue, green, yellow, purple, orange, pink, cyan) and `effort` (low, medium, high, xhigh, max), if the agent should have either set

### 4. Generate and write

Read the template from [assets/reviewer-agent.md](assets/reviewer-agent.md). Replace placeholders:

| Placeholder | Value |
|-------------|-------|
| `{NAME}` | Agent name |
| `{DESCRIPTION}` | Agent description |
| `{MODEL}` | Selected model |

Apply the options gathered in step 3 to the template output:

| Input | Handling |
|-------|----------|
| Additional tools | Append to the template's `tools:` line |
| Additional skills | Append to the template's `skills:` list |
| Extra instructions | Append after the template's final paragraph |
| `color` / `effort` | Insert after the `model:` line, only when provided |

Write the result to `.claude/agents/<name>.md`.

### 5. Confirm

Print what was created and how to reference it in self-review extensions or Task calls.
