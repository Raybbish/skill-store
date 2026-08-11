---
name: skills-guide
description: >-
  This skill should be loaded when creating a skill, modifying a SKILL.md,
  writing skill frontmatter, reviewing skill quality, or authoring skill
  descriptions. Defines conventions for SKILL.md files - frontmatter, content
  structure, and review criteria.
user-invocable: false

---

# Skill Conventions - Quick Reference

## Frontmatter Essentials

- **`name`** - lowercase with hyphens, matching the containing directory name; the agentskills.io standard requires the match, Claude Code makes the field optional and defaults it to the directory name
- **`description`** - third-person; states what the skill does and when to use it; include concrete trigger phrases
- Set `user-invocable: false` only for background-knowledge/guide skills; guide skills do not need `allowed-tools`
- Set `disable-model-invocation: true` for side-effect workflows (deploy, commit, send)
- Consume an `argument-hint` value in the body via the dollar-sign ARGUMENTS placeholder or positional substitutions

## Content Rules

- Under 500 lines; use supporting files (`references/`, `assets/`) for detailed content
- Step-by-step instructions, not walls of text
- If `argument-hint` is set, define behavior when no argument is provided
- Bundled supporting-file references must use relative paths and resolve to existing files
- Prefer the `.md` form of any doc URL over its rendered HTML page - the consumer is an agent that fetches it

## Agent-Facing Content

SKILL.md is read by the agent executing the skill, not by a human browsing docs. Cut on sight:

- Justification/rationale - sentences explaining why a rule exists
- Reassurance - meta-claims about coverage or safety
- Illustrative examples that explain mechanism rather than direct action
- Tool names as guidance - describe the capability and let the model pick the tool (naming tools in `allowed-tools` is fine - that is a permission grant, not guidance)

Write imperatives. If a sentence explains why or that something is true rather than telling the agent what to do, delete it.

When revising a skill, do not patch-fix - bolting a clause onto the skill per reviewer finding turns it to sediment. Rewrite the section from its goal and audience in one pass; test every line by "does an agent need this to act, and can it not derive it?".

Before splitting a skill into sub-sections or separate skills, check that the parts have divergent mechanics. Identical mechanism with varying input, stance, or trigger is one capability - keep it as one skill.

## Key Anti-patterns

- Vague descriptions ("Helps with X")
- Auto-invocation on side-effect workflows
- Over-permissive `allowed-tools`
- `context: fork` on guideline-only content

## Cross-Harness Portability

- Codex documents only `name` and `description` in SKILL.md frontmatter - do not rely on any other field to carry behavior under Codex
- Do not rely on `disable-model-invocation` to block implicit invocation under Codex; it has no effect there. Add an `agents/openai.yaml` file in the skill directory instead, setting `policy.allow_implicit_invocation: false` (default `true`) - invoking the skill explicitly by name still works when it is false. For a plugin-shipped skill, also include a top-level `interface` object with non-empty `display_name` and `short_description`; the Codex preflight validator rejects a policy-only file
- Do not rely on argument substitution (the dollar-sign ARGUMENTS placeholder or positional substitutions) to deliver a required input under Codex; Codex documents no substitution mechanism, so the token carries through literally. State the required input directly in the body instead
- Do not rely on `user-invocable: false` to control invocability under Codex; it has no Codex equivalent

## Full Reference

- Agent Skills open standard (the portable `SKILL.md` spec): https://agentskills.io/specification.md
- Claude Code's field spec, covering extensions on top of that standard: https://code.claude.com/docs/en/skills.md
- Codex's field spec, documenting only `name` and `description`: https://learn.chatgpt.com/docs/build-skills.md
- Full frontmatter field spec and review checklist: `reviewer:review-skill`'s default rules

## This Repository

- When adding a local skill, create `.agents/skills/<name>` pointing to `../../.claude/skills/<name>` - Codex scans `.agents/skills` and follows symlink targets
- Do not add `disable-model-invocation` to orchestration or review skills (e.g., `self-review`)
- Open `description` with "This skill should be used/loaded when...", then state what the skill does
