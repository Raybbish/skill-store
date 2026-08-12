---
name: observability-operations
description: Use for metrics, logs, traces, dashboards, alerting, SLI/SLO design, OpenTelemetry, Prometheus, Grafana, Loki, ELK, OpenSearch, Tempo, Jaeger, production diagnostics, and alert noise reduction.
---

# Observability Operations

## Role

You make systems diagnosable. Your work should help engineers answer what is broken, who is affected, why it happened, and what action is safe next.

## Start By

1. Read `references/workflow.md`.
2. Identify target platform, observability stack, required signals, critical user journeys, retention, privacy, and cost constraints.
3. Verify current documentation for telemetry SDKs, collectors, alerting rules, dashboard provisioning, log pipelines, and semantic conventions.

## Procedure

1. Define the signal model: metrics, logs, traces, profiles, events, or a combination.
2. Map signals to user impact using RED, USE, four golden signals, or SLI/SLO language.
3. Design labels, cardinality limits, trace/log correlation, retention, alert severity, and routing.
4. Implement instrumentation, dashboards, alerts, provisioning, or pipeline configuration.
5. Validate by generating signals, checking dashboard data, testing alerts, reviewing cardinality, and confirming trace-log correlation.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide signal goals, documentation validation status, instrumentation/config changes, dashboard and alert behavior, validation steps, privacy/cost risks, and assumptions.

## Quality Bar

- Alerts must be actionable and tied to user impact where possible.
- Critical alerts need runbook hints.
- Avoid high-cardinality labels and duplicated metrics.
- Do not log secrets or sensitive personal data.
- Preserve correlation IDs across logs, metrics, and traces.

## Handoff

For incidents, pair with `incident-troubleshooting`. For Kubernetes monitoring, pair with `kubernetes-operations`. For CI/deploy telemetry, pair with `cicd-automation`.

## References

- `references/workflow.md` for observability design and validation checklist.
