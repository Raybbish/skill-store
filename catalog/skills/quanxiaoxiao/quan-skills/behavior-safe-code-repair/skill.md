---
name: behavior-safe-code-repair
description: Repair ESLint errors and TypeScript build failures using a behavior-safe, risk-aware workflow that preserves business logic and chooses appropriate test strategies based on impact.
---

# Behavior-Safe Code Repair

Repair lint, typecheck, and build failures without silently changing business behavior.

## Use This Skill

Use this skill when the task involves:

- ESLint failures
- TypeScript typecheck or build failures
- strictness upgrades that surface latent defects
- refactors required only to satisfy lint or types
- repairs where green checks are necessary but not sufficient

## When NOT to use

Do not use this skill when:

- the task is pure formatting or a safe lint autofix
- the user is asking for a feature or behavior change
- generated code should be fixed at the generator instead
- the work is really an architectural refactor rather than a scoped repair

## Pre-Read Order

Read the target repository first:

1. `README.md`
2. `package.json`
3. the failing scripts and current error output
4. existing tests that cover the affected area

Then load bundled guidance from this skill pack:

5. `../../prompts/lint-build-repair.md`
6. `../../checklists/lint-build-repair-checklist.md`
7. `references/risk-and-test-matrix.md`

## Workflow

1. Classify the failure before editing.
   State whether the root cause is mechanical, behavior-preserving, or behavior-sensitive.

2. Choose a test policy from the matrix.
   Pick between no new tests, fix-then-test, test-before-fix, or higher-level coverage. Explain why.

3. Repair the root cause with the smallest justified diff.
   Fix upstream type or contract mismatches before downstream symptoms. Separate mechanical cleanup from logic edits when possible.

4. Preserve runtime truth.
   Do not distort working behavior just to satisfy TypeScript. Avoid `any`, `as any`, blind non-null assertions, swallowed errors, or weakened validation unless explicitly justified.

5. Add or update protection only where it buys safety.
   Reuse meaningful existing tests first. Add targeted regression coverage when the repair touches branching, validation, lifecycle rules, or caller-visible behavior.

6. Verify with repository scripts.
   Prefer the repository's own `lint`, `typecheck`, `build`, `test`, integration, or Hurl commands over ad hoc substitutes.

## Reference Guide

Load these only when needed:

- `references/risk-and-test-matrix.md` for risk levels, test policies, heuristics, and stop conditions
- `../../prompts/lint-build-repair-with-tests.md` when the task explicitly includes test authoring

## Verification

Run the relevant repository scripts for the affected scope:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. relevant test, integration, or Hurl commands when the repair is not purely mechanical

If a script does not exist or cannot run, report that explicitly and state the residual risk.

## Output Contract

Return results in this order:

1. `Issue Summary`
2. `Risk Level`
3. `Test Decision`
4. `Changes Made`
5. `Validation Results`
6. `Residual Risk`
