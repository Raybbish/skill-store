---
name: contract-matter-workflow
description: Führt den kanonischen Vertrags-Matter-State von Deal-Type-Analyse über Review oder Drafting, Risiko, Negotiation und iterative Redlines bis zum Legal Final Gate. Verwenden bei expliziter Contract-Matter-Steuerung; für normale Vertragsanfragen bleibt contract-workflow der bevorzugte user-facing Einstieg.
userFacing: true
implicitInvocation: false
discoverability: advanced
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - agreement-type-analysis
  - contract-review
  - contract-drafting
  - legal-negotiation-strategy
  - legal-redline-review-loop
  - legal-matter-final-gate
consumes:
  - agreement-deal-model.json
  - agreement-clause-coverage.json
  - agreement-specialist-routes.json
  - contract-review.json
  - contract-issue-list.json
  - contract-risk-input.json
  - contract-draft.md
  - contract-drafting-report.json
  - contract-open-points.md
  - negotiation-positions.json
  - redline-delta.json
  - negotiation-state.json
  - legal-final-gate.json
  - legal-open-points.md
outputs:
  - contract-matter-status.json
  - contract-matter-plan.md
  - contract-matter-handoff.json
lastEvaluated: 2026-08-28
---

# Contract Matter Workflow

## Zweck

Halte einen Vertragsfall als versionierten Matter State zusammen. `contract-workflow` bleibt aus Kompatibilitätsgründen der bevorzugte user-facing Einstieg und projiziert diesen State auf die bisherigen Legacy-Outputs. Dieser kanonische Workflow ist discoverable, wird aber wegen `implicitInvocation: false` nicht automatisch anstelle von `contract-workflow` geroutet.

## Modes

Unterstütze:

- `review`
- `draft`
- `template-draft`
- `revise`
- `redline`
- `negotiate`
- `final-check`

Der Mode beschreibt die aktuelle Aktion; ein Matter kann im Lebenszyklus mehrere Modes durchlaufen.

## State Machine

### 1. Deal Model Gate

`agreement-type-analysis` muss einen belastbaren `agreement-deal-model.json`, Clause Coverage und Specialist Routes erzeugen. Fehlende Mandantenentscheidungen gehen an den vorgelagerten Intake/Grilling-Pfad zurück.

### 2. Review or Draft Gate

- vorhandener Gegenparteientext → `contract-review`
- Neuerstellung oder Template → `contract-drafting`
- Revision eines eigenen Drafts kann Drafting plus zielgerichteten Review erfordern.

Review und Drafting bleiben getrennte Work Products; ein Review wird nicht durch sofortiges Umschreiben verdeckt.

### 3. Risk Gate

Material Findings werden in `legal-compliance-risk-assessment` konsolidiert. `contract-risk-input.json` liefert den vertragsbezogenen Input; andere Specialist Risks können ergänzt werden.

### 4. Negotiation Gate

Bei verhandelbaren materiellen Issues → `legal-negotiation-strategy`. Ohne bestätigte Authority darf ein Fallback oberhalb der Freigabegrenze nicht als akzeptiert gespeichert werden.

### 5. Redline Loop

Neue Gegenfassungen → `legal-redline-review-loop`. Issue Lineage und Negotiation State bleiben über Versionen erhalten; Regressions öffnen frühere Issues wieder.

### 6. Final Gate

Vor `ready` oder `ready-with-accepted-risk` → `legal-matter-final-gate`. Vertragstypische Form-, Specialist- und Counsel-Gates bleiben zusätzlich sichtbar.

## State Output

`contract-matter-status.json` enthält mindestens:

```json
{
  "schemaVersion": 1,
  "matterId": "LM-...",
  "mode": "review|draft|template-draft|revise|redline|negotiate|final-check",
  "dealModelVersion": "...",
  "documentVersions": [],
  "reviewStatus": "...",
  "draftStatus": "...",
  "riskStatus": "...",
  "negotiationStatus": "...",
  "specialistStatus": "...",
  "finalGate": "...",
  "openPoints": [],
  "nextAction": "..."
}
```

## Legacy Projection

Der bestehende `contract-workflow` darf daraus weiterhin `contract-case.json`, `contract-plan.md` und `contract-handoff.json` erzeugen. Diese sind Compatibility Views; der kanonische Prozesszustand bleibt `contract-matter-*`.

## Qualitätsgate

Pass nur, wenn Deal Model vor Review/Drafting steht, Version-/Issue-Lineage erhalten bleibt, Negotiation an Client Strategy und Authority gebunden ist und das Legal Final Gate vor einer Ready-Aussage erfolgreich durchlaufen wurde.
