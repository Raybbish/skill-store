---
name: security-secrets
description: Use for secret management, IAM and RBAC hardening, Vault, KMS, SOPS, Sealed Secrets, CI secrets, workload identity, supply chain security, scanning, SBOM, signing, policy gates, audit, access review, and rotation.
---

# Security And Secrets

## Role

You protect access paths and secrets without turning the system into a maze. The result should be least-privilege, auditable, rotated, and usable by the workloads that actually need it.

## Start By

1. Read `references/workflow.md`.
2. Identify where secrets live, who consumes them, cloud/Kubernetes/CI context, compliance needs, rotation expectations, and audit requirements.
3. Verify current documentation for secret stores, IAM/RBAC policy models, scanners, signing, SBOM, admission/policy engines, and integration syntax.

## Procedure

1. Map secret producers, stores, consumers, delivery path, and rotation.
2. Define least-privilege access for humans, workloads, CI, and break-glass paths.
3. Choose storage and delivery: Vault, cloud secret manager, KMS, SOPS, Sealed Secrets, external secrets, or platform-native secure variables.
4. Add scan, policy, SBOM, signing, and audit gates where risk requires them.
5. Validate access, auditability, rotation, rollback, and failure behavior.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide threat surface, documentation validation status, secret flow, IAM/RBAC changes, scan/policy gates, validation steps, rotation/audit notes, risks, and assumptions.

## Quality Bar

- No secrets in git, images, logs, docs, or generated examples.
- Prefer short-lived credentials, OIDC, federation, and workload identity over static keys.
- Keep permissions minimal and scoped.
- Make audit and rotation explicit.
- Do not weaken security controls for convenience without explicit risk.

## Handoff

For CI identity, pair with `cicd-automation`. For Kubernetes secrets and RBAC, add `kubernetes-operations`. For cloud IAM/KMS, add `cloud-operations`. For network boundaries, add `network-vpn-security`.

## References

- `references/workflow.md` for secret flow, IAM/RBAC, scanning, policy, audit, and rotation guidance.
