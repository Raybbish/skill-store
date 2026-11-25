---
name: compliance-control-mapping
description: Übersetzt verifizierte Compliance-Pflichten in prüfbare Control Objectives, präventive/detektive/korrigierende Kontrollen, Owner, Frequenzen, Systeme und Evidenz und identifiziert Design- und Coverage-Gaps. Verwenden nach einem Compliance Obligation Register.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - compliance-obligation-register
  - legal-compliance-risk-assessment
outputs:
  - compliance-control-map.json
  - compliance-control-gaps.json
  - compliance-control-design-note.md
lastEvaluated: 2026-08-28
---

# Compliance Control Mapping

## Zweck

Mache aus Pflichten ein testbares Kontrollsystem. Ein Control ist nur dann sinnvoll, wenn klar ist, welche Pflicht bzw. welches Risiko es adressiert und welche Evidenz seine tatsächliche Durchführung zeigt.

## Mapping-Kette

`Authority → Obligation → Risk/Failure Mode → Control Objective → Control Activity → Owner/System/Frequency → Evidence → Assurance Test`

Mehrere Pflichten dürfen denselben Control nutzen und eine Pflicht darf mehrere Controls benötigen. Diese Many-to-many-Beziehung wird explizit modelliert.

## Control Design

Klassifiziere Controls mindestens nach:

- `preventive | detective | corrective`,
- `manual | automated | hybrid`,
- `entity-level | process-level | transaction-level`,
- Frequenz/Trigger,
- Control Owner und unabhängiger Reviewer soweit nötig.

Jeder Control enthält `controlId`, verknüpfte `obligationIds`, `riskIds`, Objective, konkrete Activity, Population/Scope, Owner, System, Frequency/Trigger, erwartete Evidenz, Eskalationsweg und Testbarkeit.

## Statusdisziplin

Zulässige Zustände:

- `designed`
- `implemented-unverified`
- `operating-effective`
- `exception`
- `gap`
- `not-applicable`

`operating-effective` darf **nicht** allein aus einer Prozessbeschreibung oder Policy abgeleitet werden; dafür ist Evidenz aus `compliance-control-assurance` erforderlich.

## Gap Analysis

Erkenne mindestens:

- Pflicht ohne Control,
- Control ohne nachvollziehbare Pflicht/Risk Rationale,
- unklare Ownership,
- nicht prüfbare oder fehlende Evidenz,
- Frequenz passt nicht zum Trigger/Risiko,
- Segregation-of-Duties-/Interessenkonflikt,
- vollständig manuelle Kontrolle bei hohem Volumen ohne begründete Sampling-/Systemlogik,
- redundante Controls mit widersprüchlicher Ownership.

Regulatory-/QMS-spezifische Controls werden an bestehende Fach-Skills zurückgespielt, statt hier fachlich neu definiert zu werden.

## Qualitätsgate

Pass nur, wenn jede materielle Pflicht auf mindestens einen begründeten Control oder einen sichtbaren Gap abgebildet ist und kein Control ohne Assurance als wirksam zertifiziert wird.
