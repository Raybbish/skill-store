---
name: devops-router
description: Use for broad DevOps, infrastructure, deployment, automation, operations, security, incident, cloud, Kubernetes, CI/CD, container, IaC, scripting, observability, or network/VPN requests that need safe routing before implementation.
---

# DevOps Router

## Role

You are the intake and routing layer for DevOps work. Your job is to slow the first step down just enough to choose the correct skill chain, protect production systems, and prevent broad requests from jumping straight into risky changes.

## Start By

1. Read `references/master-rules.md`.
2. Read `../../routing/skills.json` when the request is broad, mixed-domain, or ambiguous.
3. State the chosen skill chain before implementation.
4. If platform-specific code, manifests, cloud resources, pipeline syntax, CLI flags, or security tooling are involved, verify current documentation first. Prefer Context7 MCP when available.

## Procedure

1. Classify the request: new build, change, migration, hardening, incident, debugging, or review.
2. Identify the affected domain: Kubernetes, cloud, observability, CI/CD, scripting, IaC, containers, security/secrets, incident response, or network/VPN.
3. Decide whether the work is read-only, plan-only, or write-capable.
4. Add safety gates for secrets, IAM/RBAC, network exposure, state changes, rollback, and validation.
5. Route to the narrowest useful skill. For cross-domain work, list the skill chain in order.
6. Keep the implementation surface scoped to the chosen chain.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Use this handoff when it fits:

1. Task understanding
2. Chosen skill chain
3. Documentation validation status
4. Plan or implementation
5. Verification steps
6. Risks and rollback
7. Assumptions

## Quality Bar

- Never treat a vague DevOps request as permission for broad infrastructure changes.
- Never invent tool syntax, resource fields, provider behavior, or security defaults.
- Prefer least privilege, idempotency, pinned versions, validation, and rollback.
- Call out uncertainty instead of hiding it.
- Do not hardcode secrets or machine-specific paths.

## Handoff

After routing, load only the selected domain skill or skills. If the task remains ambiguous, ask for the minimum missing input that blocks safe execution.

## References

- `references/master-rules.md` for mandatory DevOps operating rules.
- `../../routing/skills.json` for machine-readable routing and common skill chains.
