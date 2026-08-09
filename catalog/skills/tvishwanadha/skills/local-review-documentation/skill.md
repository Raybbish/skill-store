---
name: local-review-documentation
description: Project-specific documentation review rules.
user-invocable: false
---

# Local Review: documentation

These rules extend the default documentation review rules.

## Rules

- Consult the `claude-plugins-guide` and `codex-plugins-guide` skills for marketplace registration conventions
- Verify cross-reference accuracy (search on disk to confirm):
  - `AGENTS.md` directory layout matches actual repo structure
  - `AGENTS.md` guide skills table lists all guide skills in `.claude/skills/` (search for `*-guide` directories)
  - Root `README.md` plugin table matches `.claude-plugin/marketplace.json` entries
  - README's Codex-availability statement matches `.agents/plugins/marketplace.json` membership
  - `CLAUDE.md` references `AGENTS.md`
