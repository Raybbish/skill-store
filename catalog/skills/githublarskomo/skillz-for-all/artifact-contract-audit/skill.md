---
name: artifact-contract-audit
description: Prüft die exakt auszuliefernde PPTX-, DOCX-, PDF-, EPUB- oder Cross-Format-Revision gegen den gefrorenen Artifact Production Contract und seine Figure Contracts. Klassifiziert Abweichungen nach INVARIANT/CONTROLLED/ADAPTIVE und blockiert Release bei offenen Critical/Major Findings.
userFacing: false
implicitInvocation: true
discoverability: internal
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - artifact-production-contract
consumes:
  - artifact-production-contract.json
  - artifact-figure-contracts.json
outputs:
  - artifact-contract-audit.json
  - artifact-contract-audit.md
lastEvaluated: 2026-09-22
---

# Artifact Contract Audit

## Normative authority

Always apply `docs/ARTIFACT-PRODUCTION-CONTRACT.md`.

This skill audits the exact candidate release. It does not author content, change layout or perform the final Drive write.

## Required runtime inputs

The invoking workflow supplies references to:

- the exact candidate artifact(s);
- the exact frozen contract revision;
- relevant template/design profile;
- structural/layout/render/parity QA;
- delivery manifest where available;
- documented CONTROLLED deviations.

## Audit sequence

1. Verify exact contract revision.
2. Check all INVARIANT requirements.
3. Check material CONTROLLED requirements and documented deviations.
4. Verify ADAPTIVE decisions did not change intent/meaning.
5. Check material Figure Contracts.
6. Verify required/excluded content and claim/source fidelity.
7. Verify template/design authority and protected regions.
8. Verify canonical-source relationships for derivative formats.
9. Verify requested editability/format set.
10. Link structural/render/parity QA evidence.
11. Verify the candidate is intended for the canonical recipient-owned Drive delivery route.
12. Classify deviations and set final audit status.

## PASS rule

PASS requires all invariants satisfied, all material controlled deviations documented, required QA completed, and zero open critical/major findings.

## Result

`artifact-contract-audit.json` contains artifact ID, contract revision, artifact refs, checks, figure checks, QA refs, deviations, openCritical, openMajor and `status: pass|review|fail`.

## Boundary to delivery

Audit PASS means the artifact is approved for release, not yet delivered.

The exact audited revision must next pass `docs/DOCUMENT-ARTIFACT-DELIVERY-CONTRACT.md`: write to canonical recipient-owned Drive, read back, register, return observed Drive link.

## Completion

Complete when the exact release candidate has a traceable PASS or an explicit review/fail state with unresolved deviations identified.
