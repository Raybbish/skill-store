---
name: local-review-patterns
description: Project-specific patterns review rules.
user-invocable: false
---

# Local Review: patterns

These rules extend the default patterns review rules.

## Rules

- Load `claude-plugins-guide` / `codex-plugins-guide` for structural conventions, naming, and manifest patterns
- Check that each skill directory name matches its skill name and that skill file layout is consistent across the repository; leave frontmatter field review to `review-skill`
