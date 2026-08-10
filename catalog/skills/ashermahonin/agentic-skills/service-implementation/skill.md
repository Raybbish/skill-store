---
name: service-implementation
description: "Implement a specific service, module, feature slice, bug fix, migration step, or bounded-context task after requirements, architecture, contracts, file ownership, validation pack, and documentation expectations are clear. Use for coding work where the agent owns a defined path or component and must preserve surrounding behavior, tests, data safety, and project memory."
---

# Service Implementation

## Role

Do the actual code work without losing the system contract. Implement narrowly, respect existing patterns, and leave evidence that the change behaves correctly.

## Start By

- Read the assigned task, requirements, architecture notes, and write scope.
- Read the `tdd-workflow` failing test and implementation contract when present.
- Inspect nearby code before choosing patterns.
- Confirm tests or validation commands before editing.
- Check for dirty files and avoid overwriting unrelated user changes.

## Procedure

1. Make the smallest coherent code change that satisfies the task and, when present, the failing TDD contract.
2. Use existing helpers, conventions, APIs, and test style before adding new abstractions.
3. Keep migrations, contracts, and backward compatibility explicit.
4. Update or add tests when no TDD contract exists, or when the current contract needs an additional boundary/failure assertion to avoid false confidence.
5. Run the TDD validation command first, then the broader validation pack, or report why either could not run.
6. Update docs or Obsidian notes when behavior, architecture, commands, or decisions change.

## Coding Conventions

Every line follows `.claude/rules/coding-conventions.md`:

- Comments and docstrings are written in the user's session language. Russian session → Russian comments; English → English; Spanish → Spanish; Chinese → Chinese. If the codebase already uses a different language consistently, follow the codebase.
- Comments explain the non-obvious WHY only. No comments that restate the next line. No ALL-CAPS signal words (`IMPORTANT`, `NOTE`, `WARNING`, `CRITICAL`, `XXX`, `HACK`, bare `TODO`). No marketing voice ("elegant", "robust", "powerful", "clean"). No banner separators.
- `TODO` is allowed only as `TODO(owner, ticket-id): short reason`. Bare `TODO` is rejected.
- Error messages are professional, actionable, lowercase, no emojis, no exclamation marks, no apology language.
- Logs are structured key/value, lowercase snake-case event names, no PII or secrets.
- Identifiers do the work that comments do badly. Prefer `expired_session_count` over `count // expired sessions`.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current library, framework, platform, API, CLI, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

- Changed files summary
- Behavior summary
- TDD contract status plus tests and validation evidence
- Docs updated
- Risks or follow-ups

## Quality Bar

- Do not broaden scope silently.
- Do not rewrite working code just to make it prettier.
- Do not hide test failures.
- Prefer boring correctness over cleverness.

## Handoff

Hand off changed files, TDD evidence, validation results, residual risk, and docs touched to QA or PR review.

## References

- `references/implementation-contract.md`: Use this as the implementation handoff contract.
