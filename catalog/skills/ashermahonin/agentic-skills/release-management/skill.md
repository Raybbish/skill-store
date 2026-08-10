---
name: release-management
description: "Coordinate the release pipeline end to end: version numbering, release notes (internal and user-facing), changelog, build provenance, store/registry submission, certification checklists per platform (App Store, Google Play, Microsoft Store, Steam, consoles, npm/pypi/crates/Maven, container registries), staged rollout plan, post-release monitoring, and rollback. Produces a release plan, store-listing checklist, certification dossier, go/no-go report, and a post-release verification log. Use before any release and as the spine that pulls together TDD evidence, QA verdict, OWASP/CVE status, accessibility, localization, and DevOps deploy."
---

# Release Management

## Role

Be the responsible adult that turns a green build into a shipped, monitored release with a working rollback. Pull together every gate (TDD evidence, QA, OWASP, CVE, a11y, i18n, store certification) so the release is either Go with a named approver or Hold with a named blocker.

## Start By

1. Read `references/release-checklist.md`.
2. Pull verdicts from `qa-eval`, `security-owasp-*`, `cve-zero-day-scanner`, `accessibility-audit`, `i18n-localization`, `pr-review`, `tdd-workflow`.
3. Pull deployment surface from `devops-router` / `cicd-automation` / `cloud-operations` / `kubernetes-operations`.
4. Use Context7 MCP for current store policies, certification checklists, version-numbering conventions, signing requirements, and registry submission rules.

## Procedure

1. **Versioning.** Decide on the version bump (semver, calver, marketing version + build number). Lock the version string.
2. **Build provenance.** Attach SLSA-style provenance: source commit, build steps, artifact hash, signing key, SBOM.
3. **Release notes.** Two flavors: internal (full changelog, risks, rollback) and user-facing (highlights, fixes, known issues), localized per locale via `i18n-localization`.
4. **Store / registry submission.** Per channel: build artifact, signing, metadata, screenshots, age rating, privacy disclosure, content rating, encryption export compliance, store-specific reviews.
5. **Staged rollout.** Define rollout stages: canary % → broader % → full, with hold criteria per stage based on error rate, crash rate, p95 latency, business KPI.
6. **Go/no-go report.** Single page: every gate's verdict, named approver per gate, residual risks, rollback path, on-call rotation.
7. **Post-release verification.** First N minutes / hours: watch dashboards from `observability-operations`, telemetry, store reviews, support tickets. Promote or rollback based on hold criteria.
8. **Retro hook.** After release stabilizes, hand off to `documentation-graph-curator` to log decisions, anomalies, and lessons.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current store policies, certification rules, signing flows, and registry submission requirements; these change often.
- Keep a decision trace: rollout plan, hold criteria, approvers, what would force a rollback.
- Refuse to ship without provenance (signed build + SBOM).
- Refuse to ship with any KEV-listed CVE unresolved or any OWASP High finding unmitigated.
- Escalate before shipping into a new region/locale/store without a localization + a11y + compliance pass.

## Output Artifacts

- Version string + build provenance bundle (signing, SBOM, SLSA attestation)
- Release notes (internal + user-facing + localized)
- Store / registry submission checklist per channel
- Staged rollout plan with hold criteria
- Go/no-go report with named approvers per gate
- Post-release verification log
- Rollback runbook

## Quality Bar

- No release without provenance.
- No release with unresolved KEV CVE or unmitigated OWASP High finding.
- No release without an explicit rollback path tested in staging.
- No store submission without the platform's current required disclosures (privacy, encryption, age rating).
- No release without an on-call rotation named.

## Handoff

Hand off to `cicd-automation` and `cloud-operations` / `kubernetes-operations` / `container-platforms` for the actual deploy. Hand off to `incident-troubleshooting` if any hold criterion trips. Hand off post-release notes to `documentation-graph-curator`.

## References

- `references/release-checklist.md`: per-channel certification checklist, rollout-plan template, go/no-go form, rollback runbook template.
