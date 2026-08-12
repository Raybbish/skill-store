---
name: security-owasp-web
description: "Review or design a web, API, or mobile-backend system against the current OWASP Top 10 risk categories, including the 2025 order: broken access control, security misconfiguration, software supply chain failures, cryptographic failures, injection, insecure design, authentication failures, software or data integrity failures, security logging and alerting failures, and mishandling of exceptional conditions. Produces a per-category status table, evidence list, residual risks, and a remediation plan that maps each finding to a code or configuration owner. Use before any web/API/mobile-backend release, on every major change to auth, data flows, third-party integrations, exception handling, or supply chain, and as a recurring gate alongside qa-eval and pr-review."
---

# Security: OWASP Web Top 10

## Role

Be the responsible adult before a web, API, or mobile-backend system ships. Convert the OWASP Top 10 from a vague "we should look at security" into a concrete per-category status with code/config evidence, residual risk, and ownership.

## Start By

1. Read `references/owasp-web-top10.md`.
2. Pull the platform matrix from `platform-detector` and the architecture views from `architecture-review`.
3. Pull dependency manifests, CI configs, IAM/RBAC definitions, auth flows, and observability surfaces. Read-only.
4. Use Context7 MCP to confirm current OWASP wording and any framework's current security guidance (Spring, Django, FastAPI, Express, Rails, Next.js, Phoenix, etc.).

## Procedure

1. For each Top 10 category, collect evidence: route to the relevant files/configs without writing.
2. Mark per-category status: Pass, Concern, Fail, Out-of-scope.
3. For Concern/Fail, name: file/config path, what is wrong, blast radius, exploit path sketch, mitigation, owner, and verification test.
4. Cross-check with `security-secrets`, `cve-zero-day-scanner`, and `infrastructure-as-code` for shared concerns (secrets, dependencies, IAM).
5. Produce a remediation plan ordered by exploit risk × ease of fix.
6. Hand off to `service-implementation` for fixes and `qa-eval` for security test cases.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before raising a finding to "Fail" or stopping a release.
- Use Context7 MCP for the current OWASP categories, definitions, and framework-specific guidance. Treat `references/owasp-web-top10.md` as a local checklist, not the authority of record.
- Keep a decision trace: source documents, framework version, what was checked, what was not checked, and why.
- Refuse to "approve" a category without a named artifact and verification test.
- Escalate before authorizing a release with any unmitigated High finding.

## Output Artifacts

- Per-category status table (Pass/Concern/Fail/Out-of-scope) with evidence paths
- Findings register: severity, exploit sketch, mitigation, owner, verification test
- Remediation plan ordered by risk × ease
- Cross-links to `security-secrets`, `cve-zero-day-scanner`, `infrastructure-as-code`
- Release gate verdict: Go / Conditional / Hold

## Quality Bar

- No category marked Pass without an evidence path and a verification test.
- No High finding silently accepted; every accepted risk needs a named approver and expiry.
- No security test that only mocks the vulnerable boundary.
- No release gate verdict without naming the platform, version, and date evaluated.

## Handoff

Hand off to `service-implementation` per finding with: file path, mitigation, verification test, rollback note. Hand off the release-gate verdict to `qa-eval` and `pr-review`.

## References

- `references/owasp-web-top10.md`: per-category checklist, framework-specific notes, and verification-test patterns.
