---
name: clinical-evidence-update-impact
description: Bewertet neue klinische oder wissenschaftliche Evidenz als Delta gegen bestehende Claims, Risk, Performance- und Regulatory-Baselines und routet erforderliche Lifecycle-Updates, ohne eine vollständige Clinical/Performance Evaluation zu duplizieren.
userFacing: true
implicitInvocation: true
category: regulated-engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - regulated-product-context
  - research-to-evidence-note
  - regulatory-evidence-traceability
  - decision-record
outputs:
  - clinical-evidence-delta.json
  - clinical-evidence-impact-map.json
  - clinical-evidence-actions.json
lastEvaluated: 2026-08-07
---

# Clinical Evidence Update Impact

## Zweck und Grenze

Dieser Skill bewertet neue klinische oder wissenschaftliche Evidenz als Delta gegen eine bestehende Produkt-, Claim-, Risk-, Performance- und Regulatory-Baseline. Er entscheidet, welche bestehenden Fachbewertungen erneut geöffnet oder gezielt aktualisiert werden müssen, und erzeugt nachvollziehbare Lifecycle-Actions.

Er ist **keine** vollständige Clinical Evaluation, IVDR Performance Evaluation, Scientific-Validity-Bewertung, Literaturrecherche oder Risk-Neubewertung. Quellenqualität und Widersprüche kommen aus `research-to-evidence-note`; fachliche Neubewertungen bleiben bei den jeweiligen Specialist Skills.

## Kernprinzipien

- **Delta, not full re-evaluation:** bewertet wird die Änderung gegenüber der akzeptierten Baseline, nicht das gesamte Evidence Corpus neu.
- **Applicability before impact:** Device/Version, Intended Use, Population, Specimen/Setting, Comparator, Endpoint und Zeitbezug werden vor einer Impact-Entscheidung geprüft.
- **Contradictory evidence stays visible:** negative oder widersprechende Evidenz wird nicht wegen einer starken historischen Baseline verworfen.
- **Evidence strength and applicability stay separate:** eine hochwertige Studie kann für das konkrete Device trotzdem nur indirekt anwendbar sein.
- **Claims are not auto-edited:** neue Evidenz erzeugt Claim-/Labeling-Review-Bedarf; der Skill ändert keinen freigegebenen Claim autonom.
- **Markets stay separate:** dieselbe Evidenz kann je Markt, Authorization Scope oder Claim unterschiedliche Regulatory-Auswirkungen haben.

## Workflow

### 1. Current Baseline fixieren

Erfasse Product/Version, Intended Use, Claims, Scientific-/Clinical-/Performance-Baseline, relevante Risk Controls/Residual Risks, Labeling, aktuelle Regulatory Authorizations/Conformity States, PMS/PMPF Context und `asOf`. Fehlende Baseline-Evidenz wird als Gap markiert.

### 2. Neue Evidenz normalisieren

Übernimm Evidence Note/Source References, Publikations-/Datenstand, Study/Population/Specimen/Setting, Device/Assay/Version, Comparator, Endpoints, Results, Limitations, Conflicts und Confidence. Patient-Level-/personenbezogene Rohdaten werden nicht unnötig kopiert.

### 3. Applicability Gate

Klassifiziere `direct|partial|indirect|not-applicable|uncertain` mit Rationale. Prüfe insbesondere Product/Version, Intended Use, Population/Clinical Context, Specimen/Matrix, Method/Comparator, Endpoint und relevante Standard-of-Care-/Technology-Unterschiede.

Eine Evidenzquelle wird nicht allein wegen gleichem Analyten, Biomarker oder Disease Label als direkt anwendbar behandelt.

### 4. Evidence Delta klassifizieren

Bewerte gegenüber der Baseline mindestens:

- `supports-current-baseline`,
- `weakens-current-baseline`,
- `contradicts-current-baseline`,
- `new-risk-or-safety-signal`,
- `new-benefit-or-performance-signal`,
- `scope-or-applicability-change`,
- `evidence-gap`,
- `no-material-impact`,
- `undetermined`.

Trenne beobachteten Evidence Delta von der späteren Fachentscheidung.

### 5. Lifecycle Impact Domains bestimmen

Erzeuge gezielten Review-Bedarf für:

- Scientific Validity / Clinical-/Performance Evaluation,
- Risk Management,
- Claims/Labeling/IFU,
- PMS/PMPF,
- Design/V&V soweit die Evidence technische Annahmen berührt,
- Regulatory Submission/Notification/Consultation je Markt,
- Clinical/Performance Study Need,
- CAPA/Investigation nur wenn eine systemische Nonconformity oder Ursache evidenzgebunden angezeigt ist.

### 6. Specialist Routing

- IVDR Performance → `ivdr-performance-evaluation` bzw. Scientific-/Analytical-/Clinical-Performance Owner
- Risk → `medical-device-risk-management-iso14971`
- Claims/Labeling → `regulatory-claims-consistency` / `medical-device-labeling-ifu`
- PMS/PMPF → `medical-device-pms-system`, `ivdr-pmpf` oder marktbezogener PMS/Vigilance Owner
- technische Produktänderung → `regulatory-change-impact-orchestrator` / `design-change-regulatory-impact`
- FDA/EU Submission-/Consultation Impact → jeweiliger Regulatory Front Door/Specialist.

### 7. Dringlichkeit und Actions dokumentieren

Klassifiziere `routine|priority|time-critical|unknown` auf Basis der Evidence und möglichen Safety-/Performance-/Claim-Auswirkung. Eine potenzielle Reportability-/Field-Action-Frage wird sofort an den zuständigen Markt-Spezialisten geroutet; der Skill selbst trifft keine Reportability-Entscheidung.

### 8. Closure und Re-evaluation

`clinical-evidence-actions.json` gilt erst als geschlossen, wenn die erforderlichen Specialist Reviews verlinkt und offene Blocker/External States geklärt oder bewusst offen dokumentiert sind. Neue Publikationen, neue Daten, geänderte Produktbaselines oder Regulatory Feedbacks sind Re-evaluation Trigger.

## Output-Verträge

`clinical-evidence-delta.json` enthält Baseline References, neue Evidence/Source References, Applicability State/Rationale, Delta Classification, Confidence, Conflicts, Unknowns und `asOf`.

`clinical-evidence-impact-map.json` enthält pro Claim/Risk/Performance-/Regulatory-Domain Impact Hypothesis, Specialist Owner, Required Review, Urgency, Evidence References und Open Questions.

`clinical-evidence-actions.json` enthält Action, Owner, Specialist Decision Reference, Completion Evidence, Market Scope, External State und Re-evaluation Trigger.

## Memory Path

Persistenzwürdig sind validierte Evidence-Delta-Heuristiken, stabile Applicability-Muster und abstrahierte Routing-/Impact-Patterns. Konkrete unveröffentlichte Studien, Patient-Level-Daten, aktuelle negative/positive Produktbefunde, momentane Claim-/Risk-/Submission-Entscheidungen und offene Safety-/Performance-Signale bleiben run-only bzw. kontrollierte Clinical/Quality/Regulatory Records. Regulatory Candidates benötigen `sourceRefs`, `asOf` und `reviewAfter`; übergib nur abstrahierte `memory-candidate-handoff-v1`-Kandidaten an `communication-memory-governance`.

## Qualitätsgate

Bestanden nur wenn:

- Baseline und neue Evidenz getrennt und referenzierbar sind,
- Provenance/Quality/Conflicts aus der Evidence Note erhalten bleiben,
- Applicability vor Impact bewertet wird,
- widersprechende Evidenz nicht still verworfen wird,
- der Skill keine vollständige Clinical-/Performance-/Risk-Neubewertung dupliziert,
- Claims/Labeling nicht autonom geändert werden,
- marktbezogene Regulatory Decisions getrennt bleiben,
- zeitkritische mögliche Safety-/Reportability-Fragen an Spezialisten eskaliert werden,
- patientenbezogene oder aktuelle produkt-/submission-spezifische Zustände nicht in globales dauerhaftes Memory gelangen.
