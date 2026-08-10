---
name: review-plugin
description: >-
  This skill should be used when the user asks to "review a plugin",
  "audit plugin quality", "check plugin structure", or "validate a plugin".
  Review plugin directory structure, agent definition validity, manifest
  validity for both harnesses, marketplace registries, cross-manifest
  consistency, and file organization.
allowed-tools: Read, Glob, Grep, Skill
argument-hint: "[file or directory]"
---

# Review: plugin

Review plugin directory structure, agent definition validity, manifest validity (both harnesses), marketplace registries, cross-manifest consistency, and file organization.

**Input**: `$ARGUMENTS` - file paths or directory to scope the review. If no argument, review the current working directory.

## Examples

- `/review-plugin plugins/reviewer` - review the reviewer plugin
- `/review-plugin plugins/` - review all plugins in the directory

## Review Procedure

1. **Determine scope** from `$ARGUMENTS`
   - Map files to plugin directories under `plugins/<name>/`
   - If no plugin directories in scope, report "No plugin directories found in scope" and exit

2. **Load skills**:
   - `claude-plugins-guide` / `codex-plugins-guide` for plugin conventions
   - `reviewer:reviewer-framework` for output format and scoring methodology

3. **Apply review rules** for each plugin against the loaded conventions:
   - Verify plugin directory structure, agent definition validity, manifest validity (both harnesses), marketplace registries, cross-manifest consistency, and file organization
   - If both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` exist, shared fields (`name`, `version`, `description`, `author`, `license`) must match

4. **Verify findings** - search the codebase to confirm issues rather than guessing

5. **Report findings** using the reviewer-framework output format
