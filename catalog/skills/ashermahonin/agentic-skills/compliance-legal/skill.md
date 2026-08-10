---
name: compliance-legal
description: "Map the product against applicable regulatory, contractual, and platform compliance frameworks: GDPR, CCPA/CPRA, HIPAA, SOC 2, ISO 27001, PCI DSS, COPPA, FedRAMP, DPDP (India), LGPD (Brazil), KVKK (Türkiye), PDPL (Saudi/UAE), ePrivacy, AI Act (EU), NIST AI RMF, store-platform legal terms (App Store, Google Play, Steam), open-source license obligations, accessibility law (ADA, EAA, Section 508, AODA), and any product-domain-specific rules (FinTech, HealthTech, EdTech, kids). Produces an applicability matrix, per-framework gap analysis, data-processing register, DPIA/AIPIA when triggered, vendor sub-processor list, and a release-gate verdict that names the binding constraints. Use early in init for products entering regulated markets, and as a recurring gate before any release that adds regions, data types, integrations, or AI capabilities."
---

# Compliance / Legal

## Role

Be the responsible adult that names the laws and policies that apply, what they require, what is in place, what is missing, and what is binding before release. Translate compliance from "we'll check with legal" into a per-framework status with evidence and owners.

## Start By

1. Read `references/compliance-frameworks.md`.
2. Pull platform matrix from `platform-detector`, data flow from `data-ml-pipeline`, security posture from `security-owasp-*` and `security-secrets`.
3. Identify scope: regions/markets, data subjects (consumer, employee, child, patient, EU resident, California resident, etc.), data categories (PII, health, financial, biometric, location, kids), AI capabilities, payment processing, content moderation, advertising.
4. Use Context7 MCP for current text and guidance on each framework. Regulatory law changes often; do not rely on training data.

## Procedure

1. **Applicability matrix.** Per framework: applies (yes/no) + why. Anchor each "yes" to a specific user/data/region/feature.
2. **Per-framework gap analysis.** For each "yes", walk the required controls (lawful basis, consent, retention, access, deletion, breach notification, audit trail, vendor management). Mark Pass / Concern / Fail / Out-of-scope with evidence.
3. **Data Processing Register / RoPA.** For GDPR-like regimes, list processing activities: purpose, lawful basis, data categories, subjects, retention, recipients, transfers, safeguards.
4. **DPIA / AIPIA.** Run a Data Protection Impact Assessment (or AI Impact Assessment) when triggered: large-scale sensitive data, automated decisions, biometric, kids, public-space monitoring, AI Act high-risk categories.
5. **Vendor / sub-processor register.** List every third party that touches user data; verify contracts (DPA, SCCs where needed), security posture, breach SLAs.
6. **Open-source license check.** Coordinate with `cve-zero-day-scanner` SBOM. Flag copyleft (AGPL/GPL) in proprietary distributions; flag attribution requirements.
7. **Accessibility law.** If selling into the EU (EAA), US public sector (Section 508), Canada (AODA), require `accessibility-audit` verdict before release.
8. **Store-platform legal.** Validate against current App Store / Play / Steam / console legal terms (paid content, IAP, subscriptions, cancellation flow, refunds).
9. **Release-gate verdict.** Per framework: Go / Conditional / Hold. Conditional requires named approver and expiry.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current legal text and guidance; do not paraphrase from memory.
- Keep a decision trace: applicable frameworks, why included or excluded, jurisdictional choices, accepted-risk register.
- Refuse to mark a framework Pass without named evidence (contract, policy, control, audit record).
- Refuse to ship into a new region/market without an applicability check.
- This skill is not legal counsel. Escalate binding interpretations to qualified counsel before release.

## Output Artifacts

- Applicability matrix per framework
- Per-framework gap analysis with evidence
- Data Processing Register / RoPA (when applicable)
- DPIA / AIPIA (when triggered)
- Vendor / sub-processor register with DPA / SCC status
- Open-source license report
- Accessibility-law verdict link
- Store-platform legal verdict
- Release-gate verdict with named approver and conditions

## Quality Bar

- No "we comply" without a per-control evidence link.
- No new region launched without an applicability check for that region.
- No AI feature deployed in EU without an AI Act risk classification.
- No vendor processing user data without a DPA on file.
- No open-source dependency under restrictive license shipped in a proprietary product without review.

## Handoff

Hand off to `service-implementation` per control gap, to `documentation-graph-curator` to store register/DPIA in the project vault, and to `release-management` to integrate the verdict into the go/no-go report.

## References

- `references/compliance-frameworks.md`: per-framework one-pager (scope, triggers, controls, evidence, common pitfalls).
