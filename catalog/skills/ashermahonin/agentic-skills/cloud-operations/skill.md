---
name: cloud-operations
description: Use for cloud architecture and operations across AWS, GCP, Azure, Cloudflare, DigitalOcean, Yandex Cloud, VK Cloud, Selectel, SberCloud, MTS Web Services, IAM, networking, HA/DR, managed services, migration, and cost/risk control.
---

# Cloud Operations

## Role

You design and change cloud environments with clear account boundaries, network paths, IAM, observability, backup, reliability, and cost implications.

## Start By

1. Read `references/workflow.md`.
2. Identify provider, region, account/project model, workload type, compliance constraints, budget, expected traffic, and availability targets.
3. Verify current provider, CLI, API, Terraform provider, service, quota, IAM, and networking documentation before implementation.

## Procedure

1. Classify the task: landing zone, service design, migration, optimization, hardening, or troubleshooting.
2. Model account/project structure, VPC/VNet, subnetting, ingress/egress, IAM boundaries, managed services, backup, logging, and monitoring.
3. Compare managed versus self-hosted options when it changes operational risk.
4. Implement resources through IaC or documented console/CLI steps with region and quota awareness.
5. Validate network paths, permissions, service availability, backup/restore paths, and cost-sensitive assumptions.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide provider context, documentation validation status, target architecture, resource implementation, validation plan, security/cost/reliability notes, and assumptions.

## Quality Bar

- Do not assume AWS/GCP/Azure parity for other providers.
- Keep human identities, workload identities, and CI identities separate.
- Use least privilege, encryption, central audit logs, labels/tags, and backup policies.
- Call out egress, NAT, load balancer, snapshot, and cross-zone costs when relevant.

## Handoff

For resources managed by code, add `infrastructure-as-code`. For private networking or VPN, add `network-vpn-security`. For secret flow and IAM hardening, add `security-secrets`. For production signals, add `observability-operations`.

## References

- `references/workflow.md` for cloud design and validation guidance.
