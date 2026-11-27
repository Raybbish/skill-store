---
name: daily-and-weekly-review
description: Verdichtet bestätigte Kalender-, Aufgaben-, Projekt- und Inbox-Triage-Daten zu einem priorisierten Tages- oder Wochenreview mit Commitments, Follow-ups, Blockern und nächsten Schritten. Verwenden, wenn aus mehreren Arbeitskontexten eine belastbare Review-Sicht entstehen soll, ohne Kalender-, Mail-, Task- oder Projekt-Systeme selbst zu verändern.
userFacing: true
implicitInvocation: true
category: productivity
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - inbox-action-triage
outputs:
  - review-brief.json
  - review-brief.md
lastEvaluated: 2026-08-02
---

# Daily and Weekly Review

## Zweck und Grenze

Erzeuge aus bereits zugänglichen, bestätigten Arbeitsdaten einen kompakten Review-Brief für den **Tageshorizont** oder **Wochenhorizont**. Der Skill priorisiert und verbindet Arbeit; er ist **kein Kalender-, Task-, Mail-, Projekt- oder Notification-Connector** und führt keine Mutationen aus.

Mailbox-Handlungsbedarf soll aus `inbox-action-triage` übernommen werden. Kalender-, Task- und Projektquellen werden von bestehenden Tools/Connectoren geliefert. Dieser Skill beginnt bei geladenen Fakten und endet bei einer priorisierten Review-Sicht.

## Trigger

Verwenden, wenn mindestens eines zutrifft:

- ein Tagesstart/-abschluss soll Commitments und nächste Aktionen verdichten,
- ein Wochenreview soll offene Schleifen, Blocker und Prioritäten sichtbar machen,
- Inbox-Triage, Kalender und Projektstände sollen gemeinsam bewertet werden,
- wartende Vorgänge und Follow-ups dürfen nicht verloren gehen.

Nicht verwenden, wenn der primäre Auftrag bereits die konkrete Durchführung einzelner Kalender-, Task- oder Mail-Aktionen ist.

## Voraussetzungen

Vor der Synthese fixieren:

1. `reviewType`: `daily` oder `weekly`,
2. `asOf` und betrachteten Zeitraum,
3. bestätigte Kalenderereignisse/Commitments,
4. bestätigte Aufgaben mit Status/Frist soweit vorhanden,
5. `inbox-triage`-Artefakte,
6. verfügbare Projektstatus-/Blockerinformationen,
7. bekannte Datenlücken.

Fehlende Quellen nicht als „keine offenen Punkte“ interpretieren.

## Review-Horizonte

### Daily

Fokussiere auf:

- heute überfällige oder dringende Arbeit,
- feste Termine und Commitments,
- wenige realistische Top-Prioritäten,
- Follow-ups, die heute fällig sind,
- Blocker, die den Tag beeinflussen,
- Dinge, die bewusst **nicht** heute erledigt werden.

### Weekly

Fokussiere zusätzlich auf:

- offene Schleifen aus der Vorwoche,
- kommende Fristen und wichtige Termine,
- Projekte ohne klaren nächsten Schritt,
- wartende/delegierte Vorgänge mit Follow-up-Bedarf,
- wiederkehrende Überlastung oder Konflikte zwischen Commitments,
- Prioritäten und bewusste Nicht-Prioritäten für die kommende Woche.

## Ablauf

### 1. Quellen und Aktualität fixieren

Dokumentiere pro Input den Standzeitpunkt und ob die Quelle vollständig genug für den Review ist. Alte Projektstände oder unvollständige Kalenderdaten werden als Einschränkung markiert.

### 2. Verpflichtungen sammeln

Extrahiere nur bestätigte Commitments: Termine, Fristen, zugesagte Aktionen, explizite Tasks und aus der Inbox-Triage abgeleitete pending Actions.

Eine geplante oder vorgeschlagene Aktion ist noch kein abgeschlossenes Commitment.

### 3. Offene Schleifen bilden

Ordne wartende, delegierte, blockierte und unbeantwortete Vorgänge so, dass klar ist:

- wer/was als Nächstes dran ist,
- wann ein Follow-up sinnvoll/fällig ist,
- welche Evidenz/Antwort noch fehlt,
- ob der Vorgang aktiv, wartend oder blockiert ist.

### 4. Priorität ableiten

Priorisiere nach:

- bestätigter Frist/Termin,
- Auswirkung einer Verzögerung,
- Blockierung anderer Arbeit,
- strategischer/Relevanz für bestätigte Ziele,
- realistischer Bearbeitbarkeit im betrachteten Horizont.

Dringlichkeit darf nicht allein aus Absenderstatus, Lautstärke oder subjektiver Nervosität entstehen.

### 5. Konflikte und Kapazität sichtbar machen

Wenn mehrere Commitments zeitlich oder kapazitiv kollidieren, nicht alles zu „Top Priority“ erklären. Markiere den Konflikt und formuliere die Entscheidung, die nötig wäre (verschieben, delegieren, Scope reduzieren, neu priorisieren).

### 6. Review-Brief erstellen

Erzeuge einen kurzen Überblick und getrennte Sektionen für:

- Must-do / overdue,
- feste Commitments,
- Top-Prioritäten,
- waiting/follow-up,
- Blocker/Risiken,
- bewusst nicht jetzt,
- Datenlücken.

Keine externe Aktion als ausgeführt darstellen.

## Ausgabe

`review-brief.json`:

```json
{
  "schemaVersion": 1,
  "reviewType": "daily",
  "asOf": "...",
  "window": {"start": "...", "end": "..."},
  "sourceStatus": [],
  "mustDo": [],
  "commitments": [],
  "priorities": [],
  "waitingFollowUp": [],
  "blockers": [],
  "notNow": [],
  "dataGaps": [],
  "brief": "...",
  "persistence": {
    "allowed": ["minimal task facts", "thread references", "calendar facts", "project blockers", "review priorities"],
    "runOnly": ["credentials", "raw connector payloads", "unnecessary personal message content"]
  }
}
```

`review-brief.md` enthält dieselben Inhalte in kompakter, sofort nutzbarer Form.

## Datenschutz und Persistenz

Persistiere nur minimale Arbeitsfakten, die für Priorisierung und Follow-up nötig sind. Vollständige Mailtexte, private Kalenderdetails ohne Review-Relevanz, Credentials und Connector-Rohdaten bleiben laufzeitgebunden.

Keine sensiblen personenbezogenen Informationen aus Nachrichten oder Terminen in einen dauerhaften Review übernehmen, sofern sie für die Arbeitsentscheidung nicht zwingend erforderlich sind.

## Prüfungen

Vor Übergabe prüfen:

- Tages- und Wochenhorizont sind korrekt getrennt,
- alle Must-do-/Prioritätsaussagen haben eine bestätigte Grundlage,
- Inbox-Aktionen behalten ihren upstream `pending`-/waiting-Kontext,
- fehlende Quellen werden als Datenlücke sichtbar,
- kollidierende Commitments werden nicht durch unrealistische Priorisierung verdeckt,
- keine Kalender-, Task- oder Mail-Aktion wird als ausgeführt dargestellt,
- Follow-ups nennen einen sinnvollen Trigger/Zeitraum, wenn bekannt,
- Review bleibt kurz und entscheidungsorientiert.

## Fehlerbehandlung

Wenn zentrale Quellen fehlen oder veraltet sind, liefere einen partiellen Review mit `dataGaps` statt scheinbarer Vollständigkeit.

Wenn Prioritäten nicht auflösbar kollidieren, benenne den Entscheidungsbedarf. Wenn ein upstream Inbox-Item `needs-context` ist, darf der Review daraus keine definitive Aufgabe oder Frist erfinden.

## Übergaben

Nachgelagerte Verbraucher können sein:

- `meeting-preparation` für heute/wochenrelevante Meeting-Vorbereitung,
- `project-status-brief` für projektbezogene Blocker und nächste Schritte,
- Task-/Kalender-/Mailbox-Adapter für ausdrücklich bestätigte Folgeaktionen.

Der Review-Brief selbst autorisiert keine externe Mutation.

## Qualitätsfälle

### Happy Path

Aktuelle Kalenderdaten, Tasks, Inbox-Triage und Projektstände liegen vollständig vor. Der Review trennt Must-do, Commitments, Top-Prioritäten, Follow-ups und Blocker und hält die Liste realistisch klein.

### Grenzfall

Kalenderdaten sind aktuell, ein Projektstatus aber veraltet und ein Inbox-Item hat `needs-context`. Ergebnis: Datenlücken bleiben sichtbar; aus dem unklaren Item wird keine sichere Frist/Aktion erfunden.

### Fehlerfall

Ein Review erklärt zehn Punkte gleichzeitig zu Top-Prioritäten, markiert vorgeschlagene Inbox-Aktionen als erledigt und behauptet trotz fehlender Projektdaten, es gebe keine Blocker. Stoppe und korrigiere Priorisierung, Aktionsstatus und Datenlücken.

## Abschlusskriterien

Abgeschlossen ist der Skill, wenn der betrachtete Zeitraum, Quellenstand, Commitments, Prioritäten, offene Schleifen, Blocker und Datenlücken nachvollziehbar sind, externe Aktionszustände nicht erfunden wurden und der Review unmittelbar als Tages- oder Wochensteuerung genutzt werden kann.
