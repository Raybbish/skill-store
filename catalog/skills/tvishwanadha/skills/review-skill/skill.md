---
name: review-skill
description: >-
  This skill should be invoked by a review orchestrator (e.g.
  `reviewer:self-review`) to review SKILL.md files for quality, frontmatter
  correctness, and convention compliance, and to check the impact of a change on
  skills across the project.
allowed-tools: Read, Glob, Grep, Skill, WebFetch
argument-hint: "[focus-paths]"
---

# Review: Skill Quality

Review the SKILL.md files in focus against the authoring checklist, and verify what the focus files invalidate across the project's skills.

**Input**: `$ARGUMENTS` - focus paths. These are the changed files handed over by an orchestrator, a skill directory, or empty (whole project). When empty, every skill in the project is in focus, and step 3 is then a no-op since nothing outside the focus is left to check.

## Review Procedure

1. **Load rules and framework**:
   - Try to load the skill `local-review-skill`.
     - If it loads and its instructions say to NOT use the defaults, use only the local skill's guidance.
     - If it loads and does NOT prohibit defaults, read the default rules from [references/default-skill.md](references/default-skill.md) and combine them with the local guidance.
     - If it does not load (skill not found), read the default rules from [references/default-skill.md](references/default-skill.md).
   - Load `reviewer:reviewer-framework` for output format, severity definitions, and confidence scoring.

2. **Audit every skill whose files are in focus** against the full checklist:
   - **Read the file** and parse frontmatter (YAML between `---` fences) and body content
   - **Apply loaded review rules** - run through every checklist item from the loaded guidance (defaults, local, or combined)
   - **Verify file integrity** - check that all referenced files exist on disk; search file contents to verify `$ARGUMENTS` usage and file path references

3. **Verify repo-wide what the focus affects** - read the focus files and flag, across the whole project, only what they invalidate, in both directions:
   - a focus file (skill or non-skill) that invalidates a skill's content - a documented claim it makes false, a reference it leaves stale, a renamed or removed thing the skill still describes
   - a focus skill that breaks references to it elsewhere - `namespace:skill-name` mentions and markdown relative links, `marketplace.json`, README tables, agent definitions, or orchestration skills that invoke it - via rename, move, removal, or contract change

   Flag only breakage driven by the focus files; do not run the quality checklist on skills outside the focus.

4. **Report findings** using the reviewer-framework output format

## Upstream References

For edge cases not covered by the checklist, fetch the source that owns the field using WebFetch:

- Portable Agent Skills fields: [Agent Skills standard](https://agentskills.io/specification.md)
- Harness extension fields: that harness's own documentation - for Claude Code, the [Claude Code skills spec](https://code.claude.com/docs/en/skills.md)

Only fetch when a field's constraints are unclear or you encounter an uncovered pattern.
