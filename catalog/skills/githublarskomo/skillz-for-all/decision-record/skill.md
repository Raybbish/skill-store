---
name: decision-record
description: Erfasst wesentliche technische, fachliche, rechtliche, Compliance- und Governance-Entscheidungen als unveränderliche, nachvollziehbare Records mit Kontext, Alternativen, Evidenz, Autorität, Folgen, Risiken und Ablösungspfad.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires: []
outputs:
  - decision-record.md
  - decision-record.json
lastEvaluated: 2026-08-28
---

# Decision Record

## Trigger

Verwenden bei irreversiblen, querschnittlichen oder sicherheits-, migrations-, architektur-, produkt-, legal-, compliance-, governance- oder betriebsrelevanten Entscheidungen.

## Voraussetzungen

Benötigt werden eine präzise Entscheidungsfrage, belastbare Artefakt- oder Zustandsreferenzen, Fakten, Annahmen, Constraints, Alternativen, Kriterien, Evidenz, Entscheidungsverantwortung und genehmigungsberechtigte Person. Repository-SHAs sind bei Softwareentscheidungen bevorzugte Referenzen, aber keine universelle Voraussetzung.

## Ablauf

### 1. Entscheidungsrahmen fixieren

Dokumentiere Frage, Scope, Fakten, Annahmen, Hypothesen, Constraints, Präferenzen und Autorisierungsgrenzen getrennt.

### 2. Alternativen bewerten

Erfasse alle realistischen Optionen einschließlich Nichtstun. Bewerte sie anhand vorab benannter Kriterien und belastbarer Evidenz.

### 3. Autorität prüfen

Akzeptierte Entscheidungen benötigen einen benannten Entscheider und einen autorisierten Genehmiger. Fehlt Autorität oder Evidenz, bleibt der Status `proposed` und irreversible Umsetzung ist blockiert.

### 4. Entscheidung dokumentieren

Halte gewählte Option, Begründung, Folgen, Risiken, Rollback- oder Exit-Pfad, Nachfolgepflichten und unveränderliche Referenzen zu den zugrunde liegenden Artefakten fest.

### 5. Historie schützen

Bestehende akzeptierte Records werden nie überschrieben. Änderungen erzeugen einen neuen Record, der den früheren mit `supersedes` referenziert; der alte Record wird als `superseded` markiert.

### 6. Übergabe erzeugen

Erzeuge menschenlesbaren Record und maschinenlesbares JSON mit genau einer ausführbaren nächsten Aktion.

## Prüfungen

Prüfe Trennung von Fakten und Annahmen, Vollständigkeit der Alternativen, Evidenzbezug, Autorität, unveränderliche Referenzen, Folgen, Risiken, Rollback und Supersession.

## Fehlerbehandlung

Stoppe bei stiller Architektur- oder Rechtswahl, nachträglicher Rationalisierung, fehlenden Alternativen, ungeklärter Autorität, Überschreiben historischer Records oder Nutzung eines technischen Prüfsignals als Entscheidungsbefugnis.

## Übergabe

```json
{
  "id": "DEC-...",
  "state": "proposed|accepted|rejected|superseded|deprecated",
  "question": "...",
  "contextRefs": [],
  "facts": [],
  "assumptions": [],
  "constraints": [],
  "alternatives": [{"name": "...", "evidence": [], "tradeoffs": []}],
  "criteria": [],
  "decision": "...",
  "authority": {"owner": "...", "approver": "..."},
  "consequences": [],
  "risks": [],
  "rollback": "...",
  "links": [],
  "supersedes": null,
  "nextAction": "exactly one executable action"
}
```

## Abschlusskriterien

Abgeschlossen ist der Skill, wenn Status, Autorität, Evidenz, Alternativen, Entscheidung, Folgen, Risiken, Rollback, unveränderliche Referenzen und genau eine nächste Aktion dokumentiert sind.