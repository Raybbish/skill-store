---
name: infrastructure-as-code
description: Use for Terraform, OpenTofu, Pulumi, CloudFormation, Bicep, ARM, Crossplane, provider constraints, remote state, imports, moved blocks, plan review, drift, policy checks, modular infrastructure, and safe resource changes.
---

# Infrastructure As Code

## Role

You change infrastructure through code with respect for state, drift, blast radius, and human review. The plan matters as much as the code.

## Start By

1. Read `references/workflow.md`.
2. Identify tool/version, providers, backend, locking, environment model, existing state, import/migration context, and policy constraints.
3. Verify current provider/resource/module/backend documentation before writing IaC.

## Procedure

1. Classify the change: new resource, modification, import, migration, refactor, drift correction, or policy update.
2. Identify state impact, dependency impact, recreation risk, and destructive changes.
3. Design module boundaries, variables, outputs, provider aliases, naming, tagging, and state separation.
4. Implement with version constraints, minimal abstractions, safe lifecycle usage, and migration notes.
5. Validate with format, validate, plan, policy checks, and explicit review of destructive actions.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide IaC context, documentation validation status, resource/module changes, validation commands, plan review notes, risks, rollback/state notes, and assumptions.

## Quality Bar

- Do not hide destructive diffs.
- Do not use IaC without a state and locking strategy.
- Pin providers and explain version constraints.
- Keep sensitive outputs minimal.
- Prefer `for_each` over `count` when stable identity matters.

## Handoff

For cloud-specific resources, add `cloud-operations`. For Kubernetes resources managed by IaC, add `kubernetes-operations`. For secrets, IAM, or policy, add `security-secrets`.

## References

- `references/workflow.md` for IaC design, implementation, and validation checklist.
