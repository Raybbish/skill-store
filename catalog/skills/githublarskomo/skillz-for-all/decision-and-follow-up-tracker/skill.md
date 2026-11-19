---
name: decision-and-follow-up-tracker
description: Konsolidiert bestätigte Entscheidungen, Commitments, Follow-ups, Waiting- und Delegationszustände aus Meeting-, Projekt- und Review-Artefakten zu einem auditierten Register. Verwenden, wenn offene Schleifen und Entscheidungspflichten über mehrere Arbeitskontexte hinweg nachvollziehbar gehalten werden sollen, ohne Task-, Kalender-, Mail- oder Issue-Systeme selbst zu verändern.
userFacing: true
implicitInvocation: true
category: productivity
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - meeting-preparation
  - project-status-brief
  - daily-and-weekly-review
outputs:
  - decision-follow-up-register.json
  - decision-follow-up-register.md
lastEvaluated: 2026-08-02
---

# Decision and Follow-up Tracker

## Zweck und Grenze

Erzeuge aus bestätigten Upstream-Artefakten ein einheitliches Register für Entscheidungen und offene Schleifen. Der Skill **konsolidiert**, aber führt keine Tasks, Kalenderänderungen, Nachrichten, Issues oder Erinnerungen aus.

Er konsumiert `meeting-preparation`, `project-status-brief` und `daily-and-weekly-review`. Er ersetzt weder deren Kontextbildung noch `decision-record`, das dauerhafte, wesentliche Entscheidungen dokumentiert.

## Kernobjekte

- `decision`: bestätigte Entscheidung mit Quelle, Datum, Autorität und Konsequenz.
- `commitment`: bestätigte Zusage einer Person oder Rolle.
- `followUp`: offene Folgeaktion.
- `waiting`: externe Antwort oder Voraussetzung steht aus.
- `delegated`: bestätigte Delegation mit Empfänger.
- `blocker`: Hindernis, das eine offene Schleife verhindert.
- `unknown`: Ownership, Due Date, Status oder Abhängigkeit nicht bestätigt.

## Regeln

### Provenance bleibt erhalten
Jeder Record verweist auf mindestens ein Upstream-Artefakt und, soweit vorhanden, dessen Claim/Decision/Action-ID. Zeitstempel, Confidence und Status werden nicht still verändert.

### Status nur aus Evidenz
`done`, `delegated`, `scheduled`, `sent`, `closed`, `verified` oder gleichwertige Zustände sind nur zulässig, wenn externe oder upstream bestätigte Evidenz vorliegt. Ein Vorschlag oder Plan bleibt `pending`.

### Ownership und Fristen nicht erfinden
Eigentümer, Entscheidungsträger und Due Dates werden nur übernommen, wenn sie bestätigt sind. Sonst `unknown` statt Herleitung aus Titel, Hierarchie oder Tonfall.

### Duplikate vorsichtig behandeln
Ähnliche Follow-ups dürfen gruppiert werden, aber nur bei semantischer Übereinstimmung. Unterschiedliche Owner, Fristen, Status oder Quellen bleiben als Konflikt sichtbar und werden nicht still zusammengeführt.

### Entscheidungen nicht rückwirkend umdeuten
Ein Prep-Ziel oder Vorschlag ist keine getroffene Entscheidung. Nur bestätigte Entscheidungen werden unter `decisions` geführt. Wesentliche dauerhafte Entscheidungen können anschließend an `decision-record` übergeben werden.

## Ablauf

1. **Input-Snapshot fixieren** – Artefakt-IDs, Standzeitpunkte und Gültigkeit dokumentieren.
2. **Records extrahieren** – Entscheidungen, Commitments, Follow-ups, Waiting, Delegated und Blocker getrennt erfassen.
3. **Status normalisieren** – `pending`, `waiting`, `delegated`, `blocked`, `done`, `unknown`; nur bestätigte Übergänge übernehmen.
4. **Ownership/Fristen prüfen** – fehlende Felder explizit als unbekannt markieren.
5. **Überlappungen erkennen** – mögliche Duplikate gruppieren, Konflikte aber nicht verschmelzen.
6. **Priorität ableiten** – nur aus bestätigter Frist, Blockerwirkung, Entscheidungskritikalität und upstream Priorität; keine künstliche Dringlichkeit.
7. **Register und Summary erzeugen** – aktive Schleifen zuerst, dann Entscheidungen, Waiting/Delegated und abgeschlossene, verifizierte Punkte.

## Output

`decision-follow-up-register.json` enthält mindestens:

```json
{
  "schemaVersion": 1,
  "asOf": "ISO-8601",
  "sourceArtifacts": [],
  "decisions": [],
  "commitments": [],
  "followUps": [],
  "waiting": [],
  "delegated": [],
  "blockers": [],
  "conflicts": [],
  "unknowns": [],
  "summary": {}
}
```

Jeder aktive Record enthält `id`, `type`, `description`, `status`, `owner`, `due`, `sourceRefs`, `confidence`, `lastConfirmedAt` und gegebenenfalls `dependencies`.

`decision-follow-up-register.md` ist die kompakte menschliche Sicht mit: offene Entscheidungen, nächste Follow-ups, Waiting/Delegated, Blocker, unbekannte Ownership/Fristen und zuletzt bestätigte Abschlüsse.

## Datenschutz und Persistenz

Persistiere nur arbeitsrelevante Fakten und notwendige Provenance. Keine Secrets, Tokens, privaten Rohkommunikationen oder unnötigen personenbezogenen Details übernehmen. Sensible Inhalte bevorzugt referenzieren statt kopieren.

## Übergaben

- `decision-record`: für wesentliche bestätigte Entscheidungen.
- `daily-and-weekly-review`: für fällige Follow-ups, Waiting und Blocker.
- `meeting-preparation`: für offene Entscheidungen und ungeklärte Schleifen vor einem Termin.
- externe Task-/Calendar-/Mail-Tools: nur wenn ein späterer Auftrag die konkrete Ausführung verlangt.

## Qualitätsgate

Bestanden nur wenn:
- Entscheidungen und Vorschläge getrennt bleiben,
- Status nicht ohne Evidenz hochgestuft wird,
- Ownership/Fristen nicht erfunden werden,
- Duplikate keine Konflikte verschlucken,
- Provenance und letzte Bestätigung erhalten bleiben,
- externe Ausführung niemals vorgetäuscht wird.
