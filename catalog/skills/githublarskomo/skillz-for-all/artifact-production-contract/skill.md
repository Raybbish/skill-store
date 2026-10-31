---
name: artifact-production-contract
description: Materialisiert aus angemessenem Requirements-Grilling einen gefrorenen Produktionsvertrag für hochwertige PPTX-, DOCX-, PDF- und verwandte Artefakte. Fixiert Intent, Inhalt, Visuals, Figure Contracts, Drive-Delivery und Lock-Klassen INVARIANT/CONTROLLED/ADAPTIVE, damit Renderer die Nutzerabsicht nicht neu interpretieren.
userFacing: false
implicitInvocation: true
discoverability: internal
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - round-based-requirements-grilling
consumes:
  - GRILL-REPORT.md
  - requirements-handoff.json
outputs:
  - artifact-production-contract.json
  - artifact-production-contract.md
  - artifact-figure-contracts.json
lastEvaluated: 2026-09-22
---

# Artifact Production Contract

## Normative authority

Always apply `docs/ARTIFACT-PRODUCTION-CONTRACT.md` and the persistence boundary in `docs/DOCUMENT-ARTIFACT-DELIVERY-CONTRACT.md`.

This skill owns contract materialization and freeze. It does not render the final artifact and does not perform final Drive persistence.

## Trigger

Invoke before substantive first-time generation or material redesign of a user-facing document, presentation or publication artifact.

A deterministic derivative conversion from an already frozen canonical artifact reuses the active contract unless the requested change introduces material new requirements.

## Inputs

Use the smallest sufficient evidence set:

- current user instruction;
- active Project/Child-Brain context;
- existing Grilling report/handoff;
- supplied/approved template/reference;
- current content/source-of-truth artifacts;
- active design/domain contracts;
- existing frozen production contract for revisions.

Do not re-ask confirmed decisions.

## Procedure

1. Determine whether new Grilling, delta-Grilling or contract reuse is appropriate.
2. Resolve material intent/content/visual/delivery uncertainty with `round-based-requirements-grilling`.
3. Separate confirmed requirements into intent, content, visual, delivery and acceptance sections.
4. Classify material requirements as `INVARIANT|CONTROLLED|ADAPTIVE`.
5. Create Figure Contracts for material visuals.
6. Record source/template authority, protected regions and exclusions.
7. Record requested formats/editability and canonical recipient-owned Drive delivery expectations.
8. Freeze only when remaining uncertainty is non-material or explicit.
9. On material change, increment revision, record impact and re-freeze.

## Freeze gate

A contract may be `frozen` only when purpose/audience/effect, required/excluded content, evidence expectations, template/design authority, invariants, material figures, delivery formats/editability, canonical Drive destination semantics and acceptance criteria are sufficiently resolved.

## Invariants

- Never silently upgrade an inferred preference to INVARIANT.
- Never downgrade an explicit user/template requirement.
- Never replace a supplied approved figure without revision.
- Never create an independent PDF intent contract when PDF is derivative.
- Never treat a local/sandbox path as the canonical final delivery target in Skillz-for-all.
- Never let a renderer reinterpret the underlying brief from scratch.

## Completion

Complete when a frozen, versioned contract and figure-contract set can drive the format workflow without material re-interpretation and clearly state the required Drive delivery semantics.
