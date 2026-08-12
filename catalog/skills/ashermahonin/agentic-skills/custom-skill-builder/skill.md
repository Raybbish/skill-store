---
name: custom-skill-builder
description: "Create or update user-defined skills for Codex, Claude Code, and local agent workspaces. Use when the user wants a new reusable skill, a project-specific skill, a team workflow skill, a tool-integration skill, a domain-knowledge skill, or a revision of an existing skill with proper frontmatter, concise instructions, references, agent metadata, routing integration, and validation."
---

# Custom Skill Builder

## Role

Build skills that agents can actually use: small, specific, triggerable, validated, and easy to route. This skill adapts the repository's skill format for user-defined skills while preserving the core `skill-creator` principles: concise body, clear trigger metadata, progressive disclosure, deterministic resources when needed, and validation before handoff.

## Start By

1. Read `references/skill-authoring-contract.md`.
2. Clarify the skill intent in one sentence: what recurring job should this skill make easier?
3. Decide whether this is a new skill, an update to an existing skill, or a project-local overlay.
4. Check for overlap with existing skills. Extend an existing skill when the new behavior is a narrow variant; create a new skill when it has a distinct trigger, workflow, or ownership boundary.
5. If the skill depends on current libraries, APIs, CLIs, MCP servers, or platform behavior, verify those docs with Context7 MCP before writing procedural guidance.

## Procedure

1. **Define trigger metadata.** Write `name` and `description` so an agent can decide when to load the skill. The description must include when to use it.
2. **Choose scope.** Keep the skill focused on one repeatable job. Move detailed tables, examples, schemas, and provider-specific variants into `references/`.
3. **Create structure.** Use `SKILL.md`, `agents/openai.yaml`, and optional `references/`, `scripts/`, or `assets/` only when they directly support the skill.
4. **Write the workflow.** Include Role, Start By, Procedure, Principal-Level Defaults, Output Artifacts, Quality Bar, Handoff, and References.
5. **Add metadata.** Create `agents/openai.yaml` with display name, short description, default prompt, and Context7 MCP dependency when the skill can touch external technology.
6. **Add routing.** Register the skill in `agentic/routing/skills.json` and add it to entrypoints only where it is genuinely useful.
7. **Validate.** Run `python3 agentic/scripts/validate.py`, check links, check placeholder markers, and run install dry-run when installer behavior changes.
8. **Forward-test.** Try at least one realistic prompt the skill should handle and one prompt it should not capture. Adjust trigger wording if it is too broad.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before adding a skill that changes routing, permissions, tool access, or memory behavior.
- Use Context7 MCP for current external technical guidance included in the skill or its references.
- Prefer small skills with strong trigger descriptions over large skills that try to cover a whole discipline.
- Do not copy long external docs into a skill. Link primary sources and summarize only the operational rules the agent needs.
- Do not create auxiliary files like skill-level README, install guides, or changelogs unless the repository validator explicitly requires them.

## Output Artifacts

- New or updated skill folder
- `SKILL.md` with complete frontmatter and required sections
- `agents/openai.yaml` metadata
- Reference files, scripts, or assets only when justified
- Routing update in `agentic/routing/skills.json`
- Documentation update when user-facing behavior changes
- Validation and forward-test evidence

## Quality Bar

- Skill name is lowercase hyphen-case and matches its folder.
- Description is specific enough to avoid accidental activation.
- `SKILL.md` stays lean; detailed material goes into directly linked references.
- Every reference named in `SKILL.md` exists.
- No unresolved placeholder markers remain.
- The skill passes repository validation and does not introduce machine-specific paths.
- The final handoff tells the user how to invoke the skill and where it is installed.

## Handoff

Hand off with: skill name, trigger summary, files created or changed, routing impact, validation result, and one example prompt. If the skill came from a failed agent behavior, hand off also to `self-improvement-loop` for regression tracking.

## References

- `references/skill-authoring-contract.md`: compact rules for skill scope, anatomy, progressive disclosure, metadata, validation, and forward testing.
