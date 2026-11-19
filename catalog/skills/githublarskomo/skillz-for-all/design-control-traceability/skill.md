---
name: design-control-traceability
description: Verknüpft Medical-Device-Design-Inputs, Outputs, Verifikation, Validierung, Risiken, Reviews und Changes zu einer prüfbaren Design-Control-Traceability ohne Dokumentduplikation.
userFacing: true
implicitInvocation: true
category: regulated-engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - regulated-product-context
  - medical-device-risk-management-iso14971
  - two-axis-compliance-review
outputs:
  - design-control-traceability.json
  - design-evidence-gaps.json
lastEvaluated: 2026-08-07
---

# Design Control Traceability

## Zweck und Grenze

Dieser Skill erzeugt eine prüfbare Traceability über Medical-Device-/IVD-Design- und Entwicklungsartefakte: User/Intended-Purpose-Needs, Design Inputs, Design Outputs, Risk Controls, Verification, Validation, Design Reviews, Transfer-/Release-Evidence und relevante Changes. Er erzeugt **keine zweite Dokumentenablage** und ersetzt weder QMS-Prozessdefinition, Risk Management noch Testauswertung.

Er ist regulatorisch bewusst marktneutral genug, um ISO-13485-/QMSR- und EU/FDA-Workflows gemeinsam zu speisen. Markt- oder submission-spezifische Entscheidungen werden von nachgelagerten Regulatory-Skills getroffen.

## Kernprinzipien

- **Trace links statt Kopien:** Artefakte werden referenziert, nicht in eine neue Master-Datei dupliziert.
- **Bidirectional coverage:** Inputs müssen Outputs/Verification/Validation tragen; Outputs/Tests müssen auf Inputs/Risks zurückführbar sein.
- **Risk integration:** Risk Controls besitzen Design-/Process-/Information-for-Safety-Umsetzung und Verification Evidence; der Skill führt kein zweites Risk Register.
- **Review state sichtbar:** Design Reviews/Approvals werden als Evidence/Decision References geführt, nicht simuliert.
- **Change lineage:** Baseline, Revision, Change Reason und betroffene Links bleiben nachvollziehbar.
- **Requirement ≠ evidence:** ein Link auf ein Dokument beweist nicht automatisch Erfüllung; `two-axis-compliance-review` liefert Coverage-/Evidence-Semantik.

## Workflow

### 1. Design Scope fixieren

Übernimm Product Context, Device/Software/Reagent/System Scope, Lifecycle Stage, Sites/Teams und relevante Baseline/Revision. Trenne Produktfamilien-/Plattform-Inputs von produktspezifischen Inputs.

### 2. Artifact Registry bilden

Indexiere vorhandene Design Needs/Inputs/Outputs, Architecture/Specifications, Risk Controls, Verification/Validation Evidence, Reviews, Transfer/Release Evidence und Changes mit stabilen IDs, Version/Date/Source und Status.

### 3. Traceability Links erzeugen

Erzeuge mindestens Relationen wie:
- `need -> design-input`,
- `design-input -> design-output`,
- `design-input -> verification`,
- `intended-purpose/claim -> validation`,
- `risk-control -> design/process-output`,
- `risk-control -> verification`,
- `design-output -> transfer/release evidence`,
- `change -> affected inputs/outputs/risks/tests/records`.

### 4. Coverage und Evidence prüfen

Bewerte fehlende oder schwache Links getrennt als Coverage Gap, Evidence Gap, Effectiveness Gap oder Identity/Version Ambiguity. Ein existierender Testname ohne belastbares Resultat schließt keinen Evidence Gap.

### 5. Baseline-/Change-Lineage prüfen

Stelle sicher, dass aktuelle Design Outputs und Verification/Validation zur richtigen Input-/Risk-Baseline gehören. Stale Tests gegen überholte Versionen werden sichtbar statt still als aktuelle Evidenz wiederverwendet.

### 6. Gap Routing

- Risk Link/Control Gap → `medical-device-risk-management-iso14971`
- QMS/Design-Control-Prozessgap → `medical-device-qms-iso13485` / `fda-qmsr-iso13485-gap`
- neue Änderung → `design-change-regulatory-impact`
- fehlende/fehlerhafte Evidence → zuständiger Engineering-/Clinical-/Analytical-Skill
- kontrollierte Records → `controlled-quality-documentation`.

## Output-Verträge

`design-control-traceability.json` enthält Product/Baseline Context, Artifact Registry, Versioned Trace Links, Coverage/Evidence Status, Risk Links, Review/Approval References, Change Lineage und `asOf`.

`design-evidence-gaps.json` enthält Gap-ID, Source/Target Artifact, Gap Type, Impact, Risk/Requirement Link, Needed Evidence/Action, Owner/Next Skill und Stop Condition.

## Memory Path

Persistenzwürdig sind validierte Traceability-Muster, stabile produktfamilienbezogene Design-Dependency-Heuristiken und wiederverwendbare Gap-/Baseline-Prüfregeln. Aktuelle Design-Baselines, konkrete Spezifikationen, vertrauliche technische Details, offene Verification-/Validation-Ergebnisse und momentane Change-States bleiben run-only bzw. in kontrollierten Projekt-/Quality-Records. Kandidaten benötigen `sourceRefs`; version-/lifecycleabhängige Learnings zusätzlich `asOf`/`reviewAfter`. Übergib nur abstrahierte geeignete `memory-candidate-handoff-v1`-Kandidaten an `communication-memory-governance`; der Skill persistiert nichts selbst.

## Qualitätsgate

Bestanden nur wenn:

- Traceability Links statt Dokumentkopien verwendet werden,
- Inputs/Outputs/Verification/Validation/Risk Controls bidirektional nachvollziehbar sind,
- Version/Baseline-Zuordnung geprüft ist,
- vorhandene Links nicht automatisch als ausreichende Evidence gelten,
- Design Reviews/Approvals nicht simuliert werden,
- Gaps fachlich an bestehende Owner geroutet werden,
- konkrete vertrauliche Designartefakte nicht in globales Memory gelangen.
