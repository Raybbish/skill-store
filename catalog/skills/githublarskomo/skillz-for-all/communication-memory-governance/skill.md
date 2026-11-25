---
name: communication-memory-governance
description: Verwaltet stabile Kommunikationspräferenzen und bestätigte Langzeit-Memory-Einträge getrennt von transientem Gesprächs-, Projekt- und Agentenzustand. Verwenden, wenn wiederkehrende User-Präferenzen, dauerhafte Fakten oder Korrekturen nachvollziehbar, scope-begrenzt und datenschutzsicher über Sitzungen hinweg verfügbar bleiben sollen, ohne Agent-Handoff, Decision Records oder Projektstatus zu duplizieren.
userFacing: true
implicitInvocation: true
category: communication-memory
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
outputs:
  - communication-profile.json
  - memory-ledger.json
lastEvaluated: 2026-08-02
---

# Communication Memory Governance

## Zweck und Grenze

Der Skill operationalisiert die Idee von `chatgpt-communication` als dauerhaften, prüfbaren Kommunikations- und Memory-Vertrag. Er speichert **keine Rohkonversation**, sondern nur gezielt abstrahierte, längerfristig nützliche Informationen.

Er ist bewusst getrennt von:
- `agent-handoff`: kurzfristiger Arbeits-/Sessionzustand,
- `project-status-brief`: aktueller Projektzustand,
- `decision-record`: wesentliche Entscheidungen,
- `decision-and-follow-up-tracker`: offene Schleifen und Follow-ups.

## Zwei getrennte Speicherbereiche

### Communication Profile
Nur stabile Interaktionspräferenzen, z. B. bevorzugte Sprache, gewünschte Struktur, bekannte Terminologie, gewünschte Art von Rückfragen oder wiederkehrende Bedienkonventionen.

### Memory Ledger
Bestätigte, längerfristig nützliche Fakten oder Constraints mit Scope, Provenance, Confidence und Lebenszyklus.

## Zustände

Jeder Memory-Eintrag besitzt einen der Zustände:
- `candidate`: aus Interaktion extrahiert, aber noch nicht stabil genug,
- `active`: ausreichend bestätigt und zulässig für Wiederverwendung,
- `superseded`: durch neuere Information ersetzt,
- `expired`: zeitlich nicht mehr verlässlich,
- `rejected`: ausdrücklich verworfen oder ungeeignet.

Transienter Gesprächskontext wird **nicht** als Ledger-Eintrag persistiert.

## Aktivierungsregeln

Ein Eintrag darf `active` werden, wenn mindestens eines gilt:
- der User hat ihn ausdrücklich als dauerhaft bestätigt,
- dieselbe stabile Präferenz/Faktlage wurde wiederholt und widerspruchsfrei bestätigt,
- eine autoritative externe Quelle bestätigt eine nicht-sensitive, langlebige Eigenschaft und der Scope rechtfertigt Persistenz.

Eine einzelne mehrdeutige Aussage reicht nicht.

## Datenmodell

Jeder aktive oder historische Ledger-Eintrag enthält mindestens:
- `id`
- `kind`: `communication-preference|durable-fact|durable-constraint`
- `statement`
- `scope`: z. B. `global`, `domain:<name>`, `project-family:<name>`
- `state`
- `sourceRefs`
- `confidence`: `high|medium|low`
- `firstObservedAt`
- `lastConfirmedAt`
- `supersedes` / `supersededBy`
- `expiresAt` oder `reviewAfter`, falls zeitabhängig

## Kommunikationsprofil

`communication-profile.json` enthält nur aktive, nicht-sensitive Präferenzen. Bei Konflikten gilt nicht automatisch „neu gewinnt“: Korrektur oder explizite Präferenz hat Vorrang; ansonsten bleibt der Konflikt sichtbar, bis er geklärt ist.

## Datenschutzgrenzen

Niemals persistieren:
- Passwörter, Tokens, API-Keys, Security-Fragen oder andere Secrets,
- Rohpayloads privater Connectoren,
- unnötige vollständige Chatlogs,
- hochsensitive persönliche Kategorien wie Gesundheitsdaten, Religion, politische Überzeugungen, sexuelle Orientierung/-leben, Strafhistorie oder vergleichbare sensible Profile,
- spekulative Persönlichkeits-, Motiv- oder Beziehungsprofile.

Wenn ein solcher Inhalt für eine laufende Aufgabe benötigt wird, bleibt er run-only und wird nicht in den dauerhaften Ledger übernommen.

## Korrektur, Vergessen und Supersession

Explizite User-Korrektur schlägt frühere Einträge. Historie darf auditierbar als `superseded` erhalten bleiben, aber der alte Wert darf nicht weiter als aktiv verwendet werden.

Bei ausdrücklichem Forget/Delete-Wunsch wird der aktive Eintrag aus dem nutzbaren Profil entfernt. Falls das Speichersystem Löschung unterstützt, ist echte Löschung vorzuziehen; andernfalls muss mindestens `rejected/removed` sicherstellen, dass der Inhalt nicht erneut genutzt wird.

## Ablauf

1. **Input klassifizieren** – transienter Kontext, Präferenz, langlebiger Fakt oder ungeeigneter Memory-Inhalt.
2. **Persistenzwürdigkeit prüfen** – Nutzen über die aktuelle Sitzung hinaus, Sensitivität, Scope und Haltbarkeit.
3. **Provenance erfassen** – Quelle, Zeitpunkt, Bestätigungsgrad.
4. **Status bestimmen** – candidate, active, superseded, expired oder rejected.
5. **Konflikte/Korrekturen anwenden** – alte Werte nicht still überschreiben.
6. **Outputs aktualisieren** – Profil enthält nur aktive Präferenzen; Ledger enthält auditierbaren Lebenszyklus.
7. **Downstream anwenden** – aktive Einträge dürfen Antworten personalisieren, dürfen aber keine aktuellen Tool-/Projektzustände ersetzen.

## Output-Verträge

### `communication-profile.json`

```json
{
  "schemaVersion": 1,
  "asOf": "ISO-8601",
  "preferences": [],
  "conflicts": [],
  "sourceLedgerIds": []
}
```

### `memory-ledger.json`

```json
{
  "schemaVersion": 1,
  "asOf": "ISO-8601",
  "entries": [],
  "rejectedCandidates": [],
  "retentionNotes": []
}
```

## Qualitätsgate

Bestanden nur wenn:
- transienter Kontext nicht versehentlich durable Memory wird,
- sensible Kategorien und Secrets nicht persistiert werden,
- aktive Einträge nachvollziehbare Provenance besitzen,
- Korrekturen/Supersession alte Werte deaktivieren,
- Ambiguität nicht als dauerhafte Präferenz ausgelegt wird,
- Memory niemals aktuelle Repository-, Kalender-, Inbox- oder Toolzustände ersetzt.
