---
name: zx-script
description: Write, refactor, or improve zx-based CLI scripts. Use when creating shell automation with JavaScript/TypeScript, converting bash scripts to zx, or adding error handling and logging to existing zx scripts.
---

# ZX Script

Create portable, maintainable CLI scripts using zx with minimal dependencies.

## Use This Skill

Use this skill when:

- Writing new CLI automation scripts
- Converting existing bash/shell scripts to zx
- Refactoring zx scripts for better error handling
- Adding structured logging to zx scripts
- Creating reusable script utilities
- Packaging scripts as npm binaries

Do NOT use this skill when:
- The task is a one-off shell command (use raw bash instead)
- The script needs complex TUI interactions (use a dedicated CLI framework)
- The script requires heavy data processing (use a proper application)
- The environment cannot run Node.js

## Pre-Read Order

Read these files before writing or editing:

1. `../../rules/scripts-global.rule.md` - Base constraints for all scripts
2. `../../checklists/scripts-global.checklist.md` - Verification checklist for all scripts
3. `package.json` - Check if zx is already a dependency
4. Existing scripts in `scripts/` or `bin/` directories
5. `README.md` - For usage context and conventions
6. `.nvmrc` or `engines` field - For Node version constraints

This skill inherits all constraints from `scripts-global` and adds zx-specific guidance on top.

## Workflow

1. Check the current setup:
   - Verify zx is installed (`npm list zx` or check package.json)
   - Identify the target Node version
   - Look for existing script patterns in the repository

2. Create or refactor the script:
   - Add shebang: `#!/usr/bin/env zx`
   - Import only what's needed from zx: `import { $, cd, fetch, sleep } from 'zx'`
   - Set explicit options: `$.verbose = false` or `$.quiet = true` as needed

3. Prefer native tools over dependencies:
   - Use `fetch()` from zx instead of axios/node-fetch
   - Use `fs` module instead of fs-extra
   - Use native `Array` methods instead of lodash
   - Use built-in `path` and `os` modules

4. Structure the script:
   - Parse arguments early using `process.argv` or minimist if needed
   - Validate inputs before execution
   - Group related operations into async functions
   - Use `cd()` carefully and reset paths when needed

5. Add error handling:
   - Wrap shell commands in try-catch blocks
   - Check exit codes explicitly for critical operations
   - Provide meaningful error messages
   - Exit with non-zero codes on failure

6. Add logging:
   - Use `console.log()` for user-facing output
   - Use `console.error()` for errors
   - Use `$.verbose = true` only for debugging
   - Keep output clean and actionable

## Implementation Rules

- **Single purpose**: One script = one task
- **No side effects**: Don't modify system state without explicit flags
- **Dry-run support**: Add `--dry-run` flag when modifying files/state
- **Idempotent**: Running the script multiple times should be safe
- **Portable**: Avoid OS-specific commands; use zx helpers
- **Minimal deps**: Only add npm packages when native tools are insufficient

---

- zx scripts must use functions only.
- Do not generate classes in zx scripts.
- Use async functions and composition.
- Organize logic through small functions.
- Prefer closures when state is required.
- Avoid static utility classes.

Example pattern:

```javascript
const fetchData = async () => {
...
}

const main = async () => {
const data = await fetchData()
}

await main()
```

---

## Verification

Always test scripts before considering them complete:

1. **Syntax check**: `npx zx --check script.mjs`
2. **Dry run**: Execute with `--dry-run` if implemented
3. **Happy path**: Run with valid inputs
4. **Error cases**: Test with invalid inputs and verify error messages
5. **Exit codes**: Verify `echo $?` returns 0 on success, non-zero on failure
6. **Dependencies**: Ensure script works with locked dependencies (`npm ci`)

## Output Contract

Return results in this order:

1. **Summary** - What the script does and when to use it
2. **Usage** - Command examples with common flags
3. **Changes** - What was created or modified
4. **Verification** - How to test the script
5. **Dependencies** - Any new packages added

Keep responses focused on the script implementation. Include example commands that can be copied and run.