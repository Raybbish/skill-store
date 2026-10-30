---
name: compliance-control-assurance
description: Prüft Design und tatsächliche operative Wirksamkeit von Compliance-Kontrollen evidenzbasiert, dokumentiert Population, Sampling/Testschritte, Exceptions und Remediation und routet domänenspezifische Auditfragen an bestehende Fach-Skills.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - compliance-control-mapping
outputs:
  - compliance-assurance-plan.json
  - compliance-control-test-results.json
  - compliance-assurance-exceptions.json
lastEvaluated: 2026-08-28
---

# Compliance Control Assurance

## Zweck

Beantworte getrennt: **Ist der Control angemessen designt?** und **wurde er im relevanten Zeitraum tatsächlich wie vorgesehen durchgeführt?**

## Assurance-Modi

- `design-effectiveness`: Objective, Trigger, Owner, Segregation, Scope und erwartete Evidenz plausibel/testbar?
- `operating-effectiveness`: wurde die Kontrolle in Population und Zeitraum nachweisbar ausgeführt und wurden Exceptions korrekt behandelt?
- `follow-up`: wurde eine frühere Exception nachhaltig behoben?

## Testplan

Für jeden Control erfassen:

- Population und Prüfzeitraum,
- Datenquelle und Vollständigkeitsprüfung,
- Testschritte und erwartete Evidenz,
- Auswahlmethode/Sample und Begründung,
- Tester-Unabhängigkeit bzw. Interessenkonflikt,
- Resultat und Exceptions,
- Severity, Root-Cause-/Remediation-Routing und Retest-Datum.

Keine pseudo-statistische Sicherheit erfinden. Wenn Population oder Datenqualität kein belastbares Sampling erlauben, wird das Testlimit sichtbar.

## Evidence Gate

- Originale/autoritative Records bevorzugen; nachträgliche Erklärungen sind unterstützende, nicht automatisch ausreichende Evidenz.
- Fehlende Evidenz wird nicht als „Control performed“ interpretiert.
- Automated Controls benötigen zusätzlich Change-/Access-/Configuration-Kontext, soweit dieser die Verlässlichkeit beeinflusst.
- QMS-/Regulatory Controls können an `iso13485-qms-audit`, `mdsap-audit-readiness`, `medical-device-capa` oder andere bestehende Specialists geroutet werden.

## Resultate

Erlaubte Resultate: `effective`, `effective-with-exception`, `ineffective`, `not-testable`, `not-applicable`.

Eine Exception wird mit Fundstelle, betroffener Population, Risikowirkung, Owner, Due Date und Retest verknüpft. Keine Selbstzertifizierung ohne dokumentierte Evidenz.

## Qualitätsgate

Pass nur, wenn Design und Operation getrennt bewertet, Testpopulation/-zeitraum nachvollziehbar, Evidenz konkret referenziert und Exceptions mit Remediation/Retest geschlossen oder offen ausgewiesen werden.
