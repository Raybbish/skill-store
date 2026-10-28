---
name: design-change-regulatory-impact
description: Bewertet bestätigte Medical-Device-Design- oder Produktänderungen marktübergreifend auf Risk, V&V, QMS, 510(k)/FDA- und EU-Regulatory-Impact mit nachvollziehbaren Decisions.
userFacing: true
implicitInvocation: false
category: regulated-engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - design-control-traceability
  - medical-device-risk-management-iso14971
  - regulatory-evidence-traceability
  - decision-record
outputs:
  - design-change-impact.json
  - regulatory-change-decisions.json
  - change-verification-needs.json
lastEvaluated: 2026-08-07
---

# Design Change Regulatory Impact

## Zweck und Grenze

Dieser Skill bewertet eine **konkret beschriebene und technisch verstandene** Design-/Produkt-/Software-/Manufacturing-/Labeling-Änderung auf Design-Control-, Risk-, Verification/Validation- und marktbezogene Regulatory-Auswirkungen. Er führt die Entscheidungskette zusammen, ersetzt aber weder technische Change-Implementierung noch FDA-/EU-spezifische Fachlogik.

Für US-510(k)-Devices werden aktuelle FDA-„when to submit“-Guidances und Device-/Software-Kontext geprüft; für EU/IVDR/MDR werden aktuelle regulatorische/Guidance-Anforderungen über die passenden Regulatory-Skills ermittelt. Der Skill simuliert keine Behördengenehmigung und entscheidet nicht anhand alter Flowcharts aus Erinnerung.

## Kernprinzipien

- **Change first, classification second:** die Änderung muss technisch und funktional fixiert sein, bevor Regulatory Impact bewertet wird.
- **Baseline comparison:** Current Approved/Cleared/Released Baseline vs Proposed Change wird explizit verglichen.
- **Risk-based:** neue/geänderte Hazards, Failure Modes, Risk Controls und Residual Risks werden über `medical-device-risk-management-iso14971` bewertet.
- **V&V follows impact:** Verification/Validation Need entsteht aus betroffenen Inputs/Outputs/Risks/Claims, nicht aus einer statischen Testliste.
- **Market decisions stay separate:** FDA 510(k), De Novo/PCCP soweit relevant, EU Significant-Change-/NB-Fragen und interne QMS-Changes werden einzeln bewertet; eine Marktentscheidung wird nicht auf andere Märkte kopiert.
- **Document the rationale:** eine Entscheidung „keine neue Submission“ benötigt genauso nachvollziehbare Evidence/Rationale wie eine positive Submission-Entscheidung.

## Workflow

### 1. Change und Baseline fixieren

Erfasse Change ID, Reason, Before/After State, betroffene Komponenten/Software/Reagenzien/Manufacturing/Labeling/Claims, Released/Cleared/Certified Baseline und bekannte Abhängigkeiten aus `design-control-traceability`.

### 2. Technical Impact analysieren

Identifiziere betroffene Design Inputs/Outputs, Interfaces, Architecture, Performance Characteristics, Manufacturing Controls, Usability, Software/Cybersecurity, Labeling/Claims und Verification/Validation Evidence.

### 3. Risk Impact aktualisieren

Prüfe neue/geänderte Hazards, Sequences, Failure Modes, Risk Controls, detectability/exposure soweit relevant und Residual Risk. Risk-Veränderungen werden im bestehenden Risk-System geführt, nicht als zweites Change-Risk-Register.

### 4. V&V Need ableiten

Erzeuge pro betroffenem Input/Output/Risk/Claim eine Verification-/Validation-Need-Entscheidung: `reuse-existing-evidence|targeted-verification|validation-required|new-study/evidence-required|not-applicable-with-rationale|unknown`.

### 5. Market-spezifische Regulatory Impact Decisions

Für jeden Zielmarkt separat:

- **FDA 510(k):** aktuelle allgemeine bzw. Software-Change-Guidance anwenden, Risk-/Labeling-/Technology-/Performance-Auswirkungen dokumentieren und `new-510k-likely|required-not-indicated|qsub-recommended|uncertain` begründen.
- **FDA De Novo/andere Authorization:** prüfen, ob die Änderung bestehende Classification/Special Controls/Authorization-/PCCP- oder neue Submission-Fragen berührt; an entsprechende FDA-Skills routen.
- **EU IVDR/MDR:** aktuelle Significant-Change-/Conformity-/NB-relevante Guidance/Regulation über EU Regulatory Front Door/MDCG Navigator prüfen.
- **QMS:** Document/Process/Training/Supplier/Validation/Record Impacts an QMS/Controlled Documentation routen.

### 6. Cross-market Decision Record

`regulatory-change-decisions.json` hält pro Markt Decision, Rationale, Evidence, Source/Guidance `asOf`, Approver/Human Decision State, Re-evaluation Trigger und offene Fragen. Eine interne Empfehlung wird nicht als Behördentscheidung ausgegeben.

### 7. Implementation Gates

Vor Release müssen die aus Change Impact abgeleiteten V&V-, Risk-, QMS-, Labeling-, Regulatory- und Approval-Gates nachvollziehbar geschlossen oder ausdrücklich blockierend offen sein.

## Output-Verträge

`design-change-impact.json` enthält Change/Baseline, betroffene Design-/Risk-/Claim-/Process-Elemente, Technical Impact, Cross-References und `asOf`.

`change-verification-needs.json` enthält betroffene Requirement/Risk/Claim-IDs, Needed V&V, Existing Evidence Reuse, Gaps, Owner und Completion Evidence.

`regulatory-change-decisions.json` enthält pro Markt Regulatory Question, Current Source/Guidance, Decision State, Rationale, Evidence, Human/Authority Boundary, Next Skill/Action und Re-evaluation Trigger.

## Memory Path

Persistenzwürdig sind validierte Change-Impact-Heuristiken, stabile produktfamilienbezogene Dependency-Muster und wiederverwendbare market-spezifische Decision-Factors. Konkrete unreleased Designs, Change Details, aktuelle Submission-/NB-Entscheidungen, offene V&V-Ergebnisse und momentane Guidance-Snapshots bleiben run-only bzw. in Project/Quality/Decision Records. Regulatory Candidates benötigen `sourceRefs`, `asOf` und `reviewAfter`. Übergib nur abstrahierte geeignete `memory-candidate-handoff-v1`-Kandidaten an `communication-memory-governance`; der Skill persistiert nichts selbst.

## Qualitätsgate

Bestanden nur wenn:

- Before/After-Baseline und Change Scope eindeutig sind,
- Design-/Risk-/V&V-Auswirkungen traceable sind,
- Marktentscheidungen separat statt pauschal bewertet werden,
- aktuelle FDA-/EU-Quellen statt erinnerter Flowcharts verwendet werden,
- „keine neue Submission“ ebenso evidenzgebunden begründet wird,
- interne Entscheidungen nicht als FDA-/NB-/Authority-Entscheidung dargestellt werden,
- Release Gates offene Regulatory-/V&V-/Risk-Gaps nicht verdecken,
- konkrete Change-/Submission-Zustände nicht in globales dauerhaftes Memory gelangen.
