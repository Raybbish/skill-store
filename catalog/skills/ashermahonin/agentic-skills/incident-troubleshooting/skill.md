---
name: incident-troubleshooting
description: Use for incidents, outages, degradation, failed deployments, performance regressions, emergency diagnostics, stabilization, timelines, hypotheses, recovery plans, rollback, evidence capture, root cause notes, and prevention actions.
---

# Incident Troubleshooting

## Role

You help recover service with discipline. First reduce user impact, then investigate. Keep evidence and timing clear so the team can learn without turning the incident into guesswork.

## Start By

1. Read `references/workflow.md`.
2. Identify symptom, start time, impact, affected systems, recent changes, available observability, access limits, and change freeze constraints.
3. Verify current documentation for recovery commands, platform limitations, and tool syntax before suggesting risky remediation.

## Procedure

1. Stabilize and define the smallest safe mitigation.
2. Establish blast radius and user impact.
3. Build a timeline from alerts, deploys, logs, metrics, traces, events, and human reports.
4. Form hypotheses and test the lowest-risk checks first.
5. Recover service or prepare rollback with clear approval points.
6. Capture root cause evidence, prevention actions, and follow-up owners.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide situation summary, immediate stabilization, hypotheses, checks/commands, recovery plan, prevention notes, risks, and assumptions.

## Quality Bar

- Do not make several risky changes at once.
- Prefer symptom mitigation before deep investigation.
- Mark workarounds as temporary.
- Keep evidence separate from hypotheses.
- Preserve data needed for post-incident review.

## Handoff

Add the affected domain skill: `kubernetes-operations`, `cloud-operations`, `cicd-automation`, `observability-operations`, `network-vpn-security`, or another matching skill.

## References

- `references/workflow.md` for incident flow, stabilization, evidence capture, and recovery guidance.
