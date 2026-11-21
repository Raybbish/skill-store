---
name: audit-inspection-finding-response
description: Strukturiert Antworten auf Audit-, Inspection- und MDSAP-Findings aus Originalwortlaut, Criteria, Evidence, Fristen und Actions und routet Investigation, CAPA, Risk und Regulatory Follow-up ohne externe Closure zu simulieren.
userFacing: true
implicitInvocation: false
category: regulated-engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - regulatory-evidence-traceability
  - decision-record
outputs:
  - audit-finding-response-map.json
  - finding-action-plan.json
  - finding-closure-status.json
lastEvaluated: 2026-08-07
---

# Audit and Inspection Finding Response

## Zweck und Grenze

Dieser Skill strukturiert die Antwort auf ein bereits dokumentiertes Audit-/Inspection-Finding, eine Nonconformity, Observation oder vergleichbare formale Feststellung. Er erhält den Originalbefund und dessen Source-/Criteria-/Severity-/Timing-Kontext, trennt Immediate Containment, Correction, Investigation, Corrective Action, Systemic Impact und externe Response/Closure und routet die Arbeit an bestehende Owner.

Er ist **keine** Root-Cause-Engine, kein CAPA-Ersatz und keine Authority-/Auditing-Organization-Entscheidung. Er darf den Wortlaut, die Klassifikation oder Frist eines externen Findings nicht zugunsten einer internen Interpretation verändern.

## Kernprinzipien

- **Preserve the source finding:** Originalwortlaut, Criteria/Requirement, Objective Evidence, Source, Date und formale Klassifikation bleiben unverändert referenzierbar.
- **Source severity is not normalized away:** MDSAP-NC-Grade, ISO-/Certification-Finding-Kategorie, FDA Observation/Inspection Context oder interne Audit-Klassifikation werden nicht in eine erfundene universelle Severity-Skala übersetzt.
- **Containment is not root cause:** Sofortmaßnahmen und Correction können nötig sein, ersetzen aber keine evidenzbasierte Ursachenanalyse.
- **CAPA ownership stays external:** systemische Corrective Action und Effectiveness Verification gehören zu `medical-device-capa`; der Response-Skill verfolgt nur deren Referenzen und Status.
- **Deadline provenance matters:** Response-/Action-/Follow-up-Fristen stammen aus dem tatsächlichen Finding, aktueller Programmanforderung oder bestätigter externer Kommunikation; fehlende Fristen werden nicht erfunden.
- **Response submitted is not finding closed:** Ein eingereichter Response, CAPA-Plan oder korrigierter Record ist keine externe Closure, solange diese nicht verifiziert ist.

## Workflow

### 1. Finding Record fixieren

Erfasse Finding ID, Source (`internal-audit|iso-certification|mdsap|fda-inspection|notified-body|other`), Original Text, Criteria/Requirement Reference, Objective Evidence, Date, Site/Product/Process Scope, formale Severity/Grade soweit tatsächlich vergeben, Response Due Date/Source und externe Reference IDs.

Falls ein Finding nur mündlich/inoffiziell bekannt ist, kennzeichne dessen Status; erfinde keinen formalen Befund.

### 2. Facts, Interpretation und Unknowns trennen

Trenne:
- extern/objektiv dokumentierte Facts,
- interne Interpretation der System-/Product-Auswirkung,
- fehlende Evidence/Unknowns,
- externe Forderung bzw. erwartetes Deliverable.

Widersprüche oder unklare Criteria werden nicht still umformuliert, sondern als Clarification Need dokumentiert.

### 3. Immediate Risk und Containment prüfen

Prüfe, ob Patient/User Safety, Product Conformity, Data Integrity, Released Product, Distribution, Regulatory Reporting oder kritische QMS-Prozesse betroffen sein könnten. Erforderliche unmittelbare Containment-/Correction-Actions werden mit Owner und Evidence geführt.

Mögliche Vigilance/MDR/Field-Action-/Recall-/Correction-Fragen gehen sofort an die vorhandenen marktbezogenen Spezialisten; die Auditantwort wartet nicht auf vollständige Root Cause, wenn eine zeitkritische externe Pflicht möglich ist.

### 4. Investigation und CAPA routen

- unklare Ursache → `evidence-based-causal-investigation`
- systemische Corrective Action → `medical-device-capa`
- Risk Impact → `medical-device-risk-management-iso14971`
- Supplier → `supplier-quality-medical-device`
- Process Validation → `process-validation-iq-oq-pq`
- Design/Change → `regulatory-change-impact-orchestrator` / `design-change-regulatory-impact`
- Record Integrity → `quality-record-integrity`
- Dokumentkontrolle → `controlled-quality-documentation`
- PMS/Complaint/Regulatory Reporting → jeweiliger Specialist Owner.

Der Response-Skill erfindet keine Root Cause und startet kein paralleles Finding-CAPA-System.

### 5. Response Argumentation bauen

Mappe Finding → Immediate Correction/Containment → Investigation Reference → Root-Cause Evidence soweit vorhanden → Corrective/Preventive/System Actions → Responsible Owner → Due Date → Completion Evidence → Effectiveness Verification Plan/Reference.

Wenn Root Cause noch offen ist, wird das sichtbar dokumentiert; eine plausible Hypothese wird nicht als abgeschlossene Ursache ausgegeben.

### 6. Source-spezifische Anforderungen erhalten

Verwende die jeweils aktuelle Methodik/Guidance des Finding-Urhebers. Für MDSAP bleiben z. B. der aktuelle Audit-/NC-Reporting-Kontext und die tatsächlich vergebene Grade-Klassifikation erhalten; für FDA, Certification Body oder NB gelten deren jeweilige aktuelle Anforderungen. Keine universelle Response-Frist oder Severity-Konversion wird angenommen.

### 7. Submission/Communication State verfolgen

Status mindestens `draft|internally-approved|submitted-unverified|submission-verified|external-follow-up|accepted-or-closed-verified|rejected-or-more-information|required-action-open|unknown`.

Externe Übermittlung oder Closure wird nur nach verifizierter Evidenz als erfolgt markiert.

### 8. Lifecycle Learning und Recurrence prüfen

Nach bestätigter Fachanalyse können systemische Auswirkungen in Risk, PMS, Training, Supplier, Validation, Design oder QMS zurückgeführt werden. Wiederkehrende Finding-Muster dürfen als abstrahierte Lernkandidaten behandelt werden; konkrete Findings bleiben kontrollierte Records.

## Output-Verträge

`audit-finding-response-map.json` enthält Original Finding/Source/Criteria/Evidence, formale Klassifikation, Due-Date-Provenance, Facts/Interpretations/Unknowns, Scope/Impact und Specialist References.

`finding-action-plan.json` enthält Containment/Correction, Investigation/CAPA/Risk/Regulatory Actions, Owner, Due Date, Completion Evidence, Effectiveness Reference und Dependencies.

`finding-closure-status.json` enthält Internal Response State, verified submission evidence, external feedback/closure evidence, remaining actions, blockers und Re-evaluation Trigger.

## Memory Path

Persistenzwürdig sind abstrahierte Finding-Response-Muster, wiederverwendbare Routing-Heuristiken und validierte Recurrence-/Evidence-Gap-Patterns. Konkrete Audit-/Inspection-Findings, Site-/Produktdaten, Root-Cause-/CAPA-Zustände, externe Korrespondenz, Due Dates, MDSAP-NC-Grades, FDA-/NB-/AO-Response- und Closure-States bleiben run-only bzw. kontrollierte Quality/Regulatory Records. Regulatory Candidates benötigen `sourceRefs`, `asOf` und `reviewAfter`; übergib nur abstrahierte `memory-candidate-handoff-v1`-Kandidaten an `communication-memory-governance`.

## Qualitätsgate

Bestanden nur wenn:

- Original Finding, Criteria, Evidence, Source und formale Klassifikation unverändert referenzierbar bleiben,
- Facts, interne Interpretation und Unknowns getrennt sind,
- Containment/Correction nicht als Root Cause oder CAPA-Closure ausgegeben werden,
- Investigation/CAPA/Risk/Regulatory-Arbeit an bestehende Owner geroutet wird,
- Fristen und Severity/Grades nicht erfunden oder frameworkübergreifend normalisiert werden,
- zeitkritische mögliche Safety-/Reporting-Fragen nicht auf Root-Cause-Abschluss warten,
- Submission/Response nicht mit externer Finding-Closure gleichgesetzt wird,
- konkrete Findings, externe Kommunikation und aktuelle Closure-States nicht in globales dauerhaftes Memory gelangen.
