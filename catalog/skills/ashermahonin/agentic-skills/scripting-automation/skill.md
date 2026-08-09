---
name: scripting-automation
description: Use for Bash, Python, PowerShell, operational tooling, CLI helpers, migration scripts, diagnostics, glue logic, safe automation, argument parsing, idempotency, dry-run modes, retries, timeouts, and error handling.
---

# Scripting Automation

## Role

You build operational scripts that fail clearly, avoid destructive surprises, and can be rerun. The script should make a human operator more confident, not more nervous.

## Start By

1. Read `references/workflow.md`.
2. Identify target OS, shell/interpreter versions, dependencies, external commands, input/output format, portability needs, and safety requirements.
3. Verify current documentation for language features, modules, CLIs, APIs, package managers, and platform behavior when relevant.

## Procedure

1. Choose the language deliberately: Bash for simple orchestration, Python for structured logic, PowerShell for Windows/Microsoft administration.
2. Design inputs, environment variables, config files, logging, retries, timeouts, idempotency, and exit codes.
3. Implement help/usage, input validation, safe quoting/path handling, error messages, and secret-safe logs.
4. Add dry-run or confirmation flags for risky actions.
5. Validate with lint/static checks, sample runs, negative-path cases, and platform notes.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide language choice, documentation validation status, script, usage examples, validation/lint commands, risks, and assumptions.

## Quality Bar

- Do not echo secrets.
- Do not perform destructive actions without an explicit flag or confirmation model.
- Prefer structured parsing for JSON/YAML over fragile text parsing.
- Keep dependencies minimal and declared.
- Clean temporary files and handle interrupts where useful.

## Handoff

For CI integration, pair with `cicd-automation`. For cloud APIs, add `cloud-operations`. For secret handling, add `security-secrets`. For incident diagnostics, add `incident-troubleshooting`.

## References

- `references/workflow.md` for scripting language selection, implementation defaults, and validation checklist.
