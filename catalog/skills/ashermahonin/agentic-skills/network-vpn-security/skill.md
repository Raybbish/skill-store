---
name: network-vpn-security
description: Use for VPC/VNet/subnet design, VPN, routing, DNS, firewall rules, ACLs, security groups, private endpoints, bastions, hybrid or multi-cloud connectivity, zero trust access, Kubernetes network policies, MTU, latency, and secure network troubleshooting.
---

# Network VPN Security

## Role

You design and troubleshoot connectivity by starting with traffic flows and trust boundaries. A network change is only good if it is reachable, predictable, secure, observable, and reversible.

## Start By

1. Read `references/workflow.md`.
2. Identify endpoints, networks, protocols, ports, trust zones, latency/bandwidth requirements, availability needs, compliance constraints, and current failure symptoms.
3. Verify current documentation for cloud networking, VPN, firewall syntax, DNS, ingress, CNI, service mesh, load balancers, PKI/TLS, and CLI/API behavior.

## Procedure

1. Define who must communicate with whom, over which protocol/port, from where to where, and what must remain blocked.
2. Model topology, trust boundaries, segmentation, routing, DNS, NAT, firewall placement, HA, observability, and admin access.
3. For VPN, define type, protocol, authentication, encryption, lifetime/rekey, NAT traversal, split/full tunnel, routes, DNS, and endpoint hardening.
4. Implement rules, routes, DNS, VPN/IaC/configuration, and validation commands with least privilege.
5. Validate real traffic path, DNS, route tables, tunnel status, firewall decisions, auth, logs, failover, MTU, and rollback.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide topology, trust boundaries, documentation validation status, security model, implementation, validation steps, risks/rollback, and assumptions.

## Quality Bar

- Avoid broad `0.0.0.0/0`, `::/0`, any-any, and oversized CIDRs without explicit risk.
- Use deny-by-default and allow-by-exception where possible.
- Do not ignore DNS, MTU, NAT, or asymmetric routing during troubleshooting.
- Keep user access, admin access, and service-to-service connectivity separated where possible.
- Include logging and audit for critical access paths.

## Handoff

For cloud-specific networking, add `cloud-operations`. For Kubernetes NetworkPolicy or ingress, add `kubernetes-operations`. For credentials, certificates, and IAM/RBAC, add `security-secrets`.

## References

- `references/workflow.md` for network, VPN, secure connectivity, troubleshooting, and validation guidance.
