---
name: compliance-management-workflow
description: Orchestriert ein evidenzbasiertes Compliance-System von aktuellem Obligation Register über Risk-based Control Mapping und Assurance bis zu Gaps, Remediation, Change Monitoring und Final Gate. Verwenden für Compliance-Frameworks und Management-Reviews jenseits einzelner Rechtsfragen.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - compliance-obligation-register
  - compliance-control-mapping
  - compliance-control-assurance
  - legal-matter-final-gate
  - project-second-brain
outputs:
  - compliance-management-status.json
  - compliance-gap-remediation-plan.json
  - compliance-management-handoff.json
lastEvaluated: 2026-08-28
---

# Compliance Management Workflow

## Zweck

Halte Compliance als geschlossenen, versionierten Kreislauf: **aktuelle Pflicht → Risiko → Control → Evidenz/Test → Exception → Remediation → Retest → Rechts-/Scope-Änderung**.

## Workflow

1. Scope, Rechtsträger, Rollen und Jurisdiktionen festlegen.
2. `compliance-obligation-register` erstellen/aktualisieren.
3. Materielle Risiken priorisieren und mit `compliance-control-mapping` auf Controls oder Gaps abbilden.
4. Risk-based Assurance-Plan aufbauen; nicht jeder Control benötigt dieselbe Testtiefe oder Frequenz.
5. `compliance-control-assurance` durchführen bzw. passende QMS-/Regulatory-Audit-Specialists beauftragen.
6. Exceptions in Remediation, Owner, Due Date, Interim Control und Retest überführen.
7. Änderungen an Recht, Geschäft, Produkten, Systemen, Ländern, Organisation oder Verträgen als Reassessment Trigger behandeln.
8. Vor Management-Freigabe oder „compliant“-Aussage `legal-matter-final-gate` anwenden.

## Statusmodell

`compliance-management-status.json` enthält mindestens Scope/AsOf, Obligation Coverage, Control Coverage, Assurance Coverage, Critical Gaps, Overdue Actions, Current-Law Freshness, Specialist Escalations und Next Review Triggers.

Der Workflow verspricht keine Hintergrundüberwachung. Er definiert Monitoring-Trigger und Frequenzen; eine tatsächliche wiederkehrende Ausführung muss separat technisch/s organisatorisch eingerichtet werden.

## Quality Principles

- Keine Compliance-by-Policy: Policies sind Controls/Evidenzquellen, nicht automatisch Wirksamkeitsnachweis.
- Keine Compliance-by-Audit: ein bestandenes Audit ersetzt nicht alle materiellen Rechts- oder Vertragsanforderungen.
- Keine grüne Gesamtampel bei kritischen ungeprüften Obligations, offenen L3-Fragen oder überfälligen High-Risk-Remediations.
- Bestehende Fach-Skills besitzen ihre domänenspezifischen Anforderungen und Testmethoden.

## Qualitätsgate

Pass nur, wenn Obligation-, Risk-, Control-, Evidence-, Exception- und Remediation-Lineage nachvollziehbar ist und der Management-Status Unsicherheit und offene High-Risk-Gaps nicht kaschiert.
