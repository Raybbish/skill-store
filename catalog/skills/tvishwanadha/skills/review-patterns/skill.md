---
name: review-patterns
description: >-
  This skill should be invoked by a review orchestrator (e.g.
  `reviewer:self-review`) to review code for naming conventions, structural
  patterns, style consistency, test quality, module organization, reuse and
  simplification, and efficiency.
allowed-tools: Read, Glob, Grep, Skill
argument-hint: "[file or directory]"
---

# Review: Patterns

Review code for adherence to naming conventions, structural patterns, style consistency, test quality, and reuse/simplification/efficiency cleanups (duplication, needless complexity, and clear performance wins).

**Input**: `$ARGUMENTS` - file paths or directory to scope the review. If no argument, review the current working directory. Treat `$ARGUMENTS` as file paths; do not parse diff refs.

## Review Procedure

1. **Determine scope** from `$ARGUMENTS`
   - File paths: review those files directly
   - Directory: review files in the directory
   - No argument: review the current working directory

2. **Load rules and framework**:
   - Try to load the skill `local-review-patterns`.
     - If it loads and its instructions say to NOT use the defaults, use only the local skill's guidance.
     - If it loads and does NOT prohibit defaults, read the default rules from [references/default-patterns.md](references/default-patterns.md) and combine them with the local guidance.
     - If it does not load (skill not found), read the default rules from [references/default-patterns.md](references/default-patterns.md).
   - Load `reviewer:reviewer-framework` for output format, severity definitions, and confidence scoring.

3. **Apply loaded review rules** - check each rule from the loaded guidance (defaults, local, or combined) against the code

4. **Compare against project norms** - sample nearby code and search file contents to judge whether a flagged pattern is inconsistent with the codebase or an established convention

5. **Report findings** using the reviewer-framework output format
