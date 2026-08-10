---
name: review-documentation
description: >-
  This skill should be invoked by a review orchestrator (e.g.
  `reviewer:self-review`) to review documentation for accuracy, completeness,
  structure, staleness, and link integrity.
allowed-tools: Read, Glob, Grep, Skill
argument-hint: "[file or directory]"
---

# Review: Documentation

Review documentation for accuracy, completeness, structure, and quality.

**Input**: `$ARGUMENTS` - file paths or directory to scope the review. If no argument, review documentation files in the current working directory. Treat `$ARGUMENTS` as file paths; do not parse diff refs.

## Review Procedure

1. **Determine scope** from `$ARGUMENTS`
   - File paths: review those files directly
   - Directory: find documentation files (README.md, CHANGELOG.md, docs/, *.md) in the directory
   - No argument: review documentation files in the current working directory

2. **Load rules and framework**:
   - Try to load the skill `local-review-documentation`.
     - If it loads and its instructions say to NOT use the defaults, use only the local skill's guidance.
     - If it loads and does NOT prohibit defaults, read the default rules from [references/default-documentation.md](references/default-documentation.md) and combine them with the local guidance.
     - If it does not load (skill not found), read the default rules from [references/default-documentation.md](references/default-documentation.md).
   - Load `reviewer:reviewer-framework` for output format, severity definitions, and confidence scoring.

3. **Apply loaded review rules** - check each rule from the loaded guidance (defaults, local, or combined) against the documentation

4. **Cross-reference with code** - search the codebase to verify that documented features, APIs, file paths, and examples match the actual codebase

5. **Report findings** using the reviewer-framework output format
