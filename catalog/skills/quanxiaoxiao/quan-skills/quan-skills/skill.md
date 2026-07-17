---
name: quan-skills
description: Global Node.js and TypeScript skill pack for repositories that should follow functional architecture, runtime-first dependency choices, and explicit verification workflows on macOS or Linux.
---

# Quan Skills

Use this repository-level skill when a task should inherit the shared defaults that apply across the rest of the pack.

## Use This Skill

Use this skill when the task needs:

- the shared JavaScript / TypeScript functional-style default
- the shared Node.js dependency and verification baseline
- guidance on which `quan-skills` sub-skill to apply next
- a consistent macOS + Linux scope statement

Do not use this skill as a substitute for the more specific skills under `skills/` when one of them clearly matches the task.

## Shared Defaults

Coding principles and conventions are defined in [AGENTS.md](AGENTS.md). Apply these defaults unless a more specific skill or the user overrides them:

- prefer functions, closures, and composition over classes
- do not expand existing class-based patterns unless a framework requires them
- keep backend responsibilities separated by layer
- prefer runtime-first, minimal, pure-JavaScript dependencies
- preserve existing runtime and package-manager choices unless change is requested
- verify work with the repository's own scripts instead of ad hoc substitutes

## Shared Repository Resources

Use these bundled resources when a task needs them:

- `quan-skills:rules/` for durable repo-wide standards (coding + Node.js + Hurl + scripts)
- `quan-skills:checklists/` for verification checklists
- `quan-skills:prompts/` for reusable maintenance prompts
- `quan-skills:docs/workflows/` for Node.js audit, fix, and modernization workflows

When a task targets `scripts/`, read `quan-skills:rules/scripts-global.rule.md` and `quan-skills:checklists/scripts-global.checklist.md` before choosing a sub-skill.

## Skill Routing

Choose the narrowest matching skill:

- `quan-skills:skills/ts-backend-standard/` for Hono, Zod, TypeScript, and ESLint backend structure
- `quan-skills:skills/behavior-safe-code-repair/` for lint, typecheck, or build repair with risk-aware test decisions
- `quan-skills:skills/hurl-testing/` for Hurl contract generation, repair, and regression coverage
- `quan-skills:skills/doc-evidence-compare/` for repo-wide documentation versus code evidence gathering, mismatch checks, and coverage audits
- `quan-skills:skills/doc-governance-init/` for bootstrapping or refactoring repository documentation into a layered governance structure
- `quan-skills:skills/zx-script/` for zx-based CLI automation
- `quan-skills:skills/auto-proxy-detect/` for network diagnostics, proxy detection, and execution path selection
- `quan-skills:skills/admin-crud-style/` for consistent React + shadcn/ui CRUD admin page scaffolding and review

## Output Contract

When this repository-level skill is used directly, respond with:

1. the shared defaults you are applying
2. the sub-skill you are routing to, if any
3. the verification approach you will use
