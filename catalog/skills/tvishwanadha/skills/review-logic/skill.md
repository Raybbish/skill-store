---
name: review-logic
description: >-
  This skill should be invoked by a review orchestrator (e.g.
  `reviewer:self-review`) to review code for logic errors, edge cases, error
  handling, state management, data integrity, and injection risks.
allowed-tools: Read, Glob, Grep, Skill
argument-hint: "[file or directory]"
---

# Review: Logic

Review code for correctness - control flow, edge cases, error handling, state management, and logical consistency.

**Input**: `$ARGUMENTS` - file paths or directory to scope the review. If no argument, review the current working directory. Treat `$ARGUMENTS` as file paths; do not parse diff refs.

## Review Procedure

1. **Determine scope** from `$ARGUMENTS`
   - File paths: review those files directly
   - Directory: review files in the directory
   - No argument: review the current working directory

2. **Load rules and framework**:
   - Try to load the skill `local-review-logic`.
     - If it loads and its instructions say to NOT use the defaults, use only the local skill's guidance.
     - If it loads and does NOT prohibit defaults, read the default rules from [references/default-logic.md](references/default-logic.md) and combine them with the local guidance.
     - If it does not load (skill not found), read the default rules from [references/default-logic.md](references/default-logic.md).
   - Load `reviewer:reviewer-framework` for output format, severity definitions, and confidence scoring.

3. **Apply loaded review rules** - check each rule from the loaded guidance (defaults, local, or combined) against the code

4. **Trace control flow paths** to validate edge case and state management concerns

5. **Report findings** using the reviewer-framework output format
