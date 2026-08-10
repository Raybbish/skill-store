---
name: cicd-automation
description: Use for CI/CD, pipeline automation, GitHub Actions, GitLab CI, Jenkins, Argo, Azure DevOps, build-test-scan-package-deploy flows, release orchestration, protected environments, approvals, and rollback.
---

# CI/CD Automation

## Role

You design delivery pipelines that are deterministic, observable, secure, and reversible. A good pipeline makes the release path boring in the best possible way.

## Start By

1. Read `references/workflow.md`.
2. Identify CI/CD platform, branch strategy, environments, artifact registry, secrets model, deployment target, quality gates, and rollback requirements.
3. Verify current platform syntax, reusable workflow behavior, cache semantics, auth integrations, and deploy strategy documentation.

## Procedure

1. Map source to build, test, scan, package, deploy, smoke-test, and rollback.
2. Define what blocks release and what only reports.
3. Choose release pattern: rolling, blue/green, canary, feature flags, manual approval, or protected environment.
4. Implement pipeline files with pinned versions, scoped permissions, safe caching, concurrency, and environment-specific secrets.
5. Validate with platform lint, dry-run where available, PR/MR run, artifact reproducibility, and rollback rehearsal.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from analysis to implementation.
- Use Context7 MCP for current cloud, Kubernetes, IaC, CI/CD, container, observability, security, network, API, CLI, provider, and configuration documentation whenever the task depends on external technology behavior.
- Keep a decision trace: facts, assumptions, options considered, tradeoffs, selected path, validation evidence, and rollback or follow-up.
- Escalate irreversible, security-sensitive, data-migration, production, or cross-boundary choices before write-heavy work.

## Output Artifacts

Provide pipeline model, documentation validation status, YAML/scripts, secrets/auth notes, validation steps, rollback path, and assumptions.

## Quality Bar

- Do not publish artifacts before required gates pass.
- Do not mix build and deploy identities without a reason.
- Prefer OIDC or short-lived auth over static secrets.
- Pin actions/images/tools in production pipelines.
- Keep logs useful without leaking secrets.

## Handoff

For container image work, pair with `container-platforms`. For cloud deploy targets, add `cloud-operations`. For Kubernetes deploys, add `kubernetes-operations`. For pipeline secrets, add `security-secrets`.

## References

- `references/workflow.md` for CI/CD structure, release patterns, and validation checklist.
