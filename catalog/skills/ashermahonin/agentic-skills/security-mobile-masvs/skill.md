---
name: security-mobile-masvs
description: "Review native iOS and Android applications against OWASP MASVS and MASTG-aligned mobile security controls: local storage, cryptography, authentication, network communication, platform interaction, WebViews, code quality, app signing, anti-tampering, privacy, root/jailbreak assumptions, and release-store constraints. Use before any native mobile release, after changes to authentication, storage, networking, WebView, deep links, permissions, signing, or SDK dependencies, and alongside security-owasp-web for mobile backend/API surfaces."
---

# Security: Mobile MASVS

## Role

Be the mobile security release gate. Native iOS and Android risks are not fully covered by web/API OWASP checks. Use OWASP MASVS to verify device storage, platform APIs, permissions, WebViews, signing, privacy, and resilience before a mobile build ships.

## Start By

1. Read `references/masvs-checklist.md`.
2. Pull the platform matrix from `platform-detector`: iOS/Android versions, distribution channel, SDKs, backend/API dependencies, auth flow, and privacy region.
3. Pull mobile architecture, permissions, deep links, local storage, crypto, networking, WebView usage, signing/notarization, and CI build artifacts. Read-only unless a fix has been assigned.
4. Use Context7 MCP for current Apple, Android, OWASP MASVS/MASTG, app-store policy, SDK, and framework security guidance.

## Procedure

1. Build a mobile attack-surface inventory: storage, credentials, biometrics, network, IPC/deep links, WebViews, SDKs, telemetry, permissions, signing, update flow, and anti-tamper expectations.
2. For each MASVS family, mark Pass, Concern, Fail, or Out-of-scope with evidence paths and test commands.
3. Run platform-specific checks: Android manifest/exported components, cleartext traffic, backup policy, Play Integrity/signing; iOS entitlements, keychain access groups, ATS, associated domains, jailbreak assumptions.
4. Cross-check backend/API findings with `security-owasp-web`, dependency findings with `cve-zero-day-scanner`, and secrets/signing keys with `security-secrets`.
5. For Concern/Fail, name the exploit path, affected platform, blast radius, mitigation, owner, and verification test.
6. Produce a release-gate verdict: Go, Conditional, or Hold.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before approving a mobile release or accepting a mobile security risk.
- Use Context7 MCP for current MASVS/MASTG, Apple, Android, store-policy, SDK, and framework security guidance.
- Keep a decision trace: tested build, platform versions, store channel, source docs, evidence paths, skipped checks, and accepted risks.
- Refuse to mark a MASVS family Pass without an evidence path and a verification step.
- Escalate before release if credentials, payments, health data, child data, or production write paths are exposed on device.

## Output Artifacts

- Mobile attack-surface inventory
- MASVS family status table with evidence
- Platform-specific findings for iOS and Android
- Store-policy and signing/privacy concerns
- Remediation plan with owner and verification test
- Release-gate verdict

## Quality Bar

- No release with unencrypted sensitive local storage.
- No release with debug WebView or cleartext traffic enabled outside explicitly approved development builds.
- No release with exported Android components or iOS URL/deep-link handlers lacking authorization checks.
- No release with signing keys, API keys, or long-lived credentials embedded in the app package.
- No Pass without naming the tested build artifact, platform version, and verification command or manual check.

## Handoff

Hand off findings to `service-implementation`, `security-secrets`, `container-platforms`, or `cicd-automation` as applicable. Hand the mobile release verdict to `qa-eval`, `release-management`, and `pr-review`.

## References

- `references/masvs-checklist.md`: MASVS family checklist, iOS/Android checks, and release-blocking conditions.
