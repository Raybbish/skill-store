---
name: agent-handoff
description: Erzeugt einen kompakten, verifizierbaren Übergabestand für neue Sitzungen oder Agenten. Verwenden, wenn Ziel, Repositoryzustand, Entscheidungen, Evidenz, Restrisiken, blockierte Punkte und genau die nächste ausführbare Aktion ohne Informationsverlust oder doppelte Arbeit weitergegeben werden müssen.
userFacing: true
implicitInvocation: true
category: engineering
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - iterate-software-projects
outputs:
  - agent-handoff.json
  - agent-handoff.md
lastEvaluated: 2026-09-02
---

# Agent Handoff

## Trigger

Diesen Skill verwenden, wenn eine laufende oder abgeschlossene Arbeit an eine neue Sitzung, einen anderen Agenten oder eine andere Person übergeben werden soll und der Folgeschritt ohne erneute Bestandsaufnahme sicher fortgesetzt werden muss.

## Voraussetzungen

Erfasse vor der Übergabe mindestens:

- bestätigtes Ziel und aktuellen Scope,
- Repository, Branch, Head-Commit und Arbeitsbaumstatus,
- zugehörige Issues, Pull Requests und externe Läufe,
- akzeptierte Entscheidungen und ausdrücklich verworfene Alternativen,
- abgeschlossene Änderungen und bereits ausgeführte Befehle,
- Verifikationsevidenz mit Status und Zeitpunkt,
- offene Risiken, Blocker und unbestätigte Annahmen,
- genau eine nächste ausführbare Aktion.

Wenn ein Project Second Brain aktiv ist, zusätzlich `docs/project-memory/state.json`, `INDEX.md` und den letzten relevanten Event lesen und den `projectMemory`-Verweis übernehmen. Zugangsdaten, personenbezogene Inhalte, vollständige Logs und unnötige Repositoryinhalte werden nicht in die Übergabe kopiert.

## Grundsätze

Trenne konsequent:

- **bestätigte Fakten:** direkt durch Repository, Toolausgabe, Test oder freigegebene Entscheidung belegt,
- **Annahmen:** plausible, aber noch nicht verifizierte Aussagen,
- **offene Prüfungen:** externe oder zeitabhängige Zustände ohne Abschlussnachweis,
- **abgeschlossene Arbeit:** bereits erledigte Schritte, die nicht wiederholt werden dürfen,
- **nächste Aktion:** kleinster ausführbarer Schritt, der den Workflow fortsetzt.

Eine Übergabe ist kein Ort für neue Produkt- oder Architekturentscheidungen. Bei aktivem Project Memory ist sie außerdem keine zweite Projektchronik: sie verweist auf den persistenten Zustand und enthält nur den für die Fortsetzung notwendigen Ausschnitt.

## Ablauf

### 1. Ziel und Grenzen fixieren

Formuliere das bestätigte Ziel in einem Satz. Ergänze In-Scope, Nicht-Ziele und das erwartete Abschlusskriterium. Widersprüchliche oder unbestätigte Ziele werden als offen markiert, nicht stillschweigend aufgelöst.

### 2. Repositoryzustand sichern

Dokumentiere Repository, Branch, unveränderlichen Head-SHA, Basisbranch, Arbeitsbaumstatus sowie relevante Datei- und Pfadangaben. Ist der Head-SHA unbekannt oder veraltet, darf die Übergabe keine schreibende Folgeaktion freigeben.

### 3. Project Memory verifizieren

Wenn `docs/project-memory/state.json` vorhanden oder ein `projectMemory`-Verweis übergeben wurde:

1. prüfen, dass Root, State und `latestEvent` erreichbar und zum Projekt passend sind,
2. den letzten Event gegen Repository-/Delivery-Evidenz auf Freshness prüfen,
3. fehlende wesentliche Zustandsänderungen vor dem Handoff über `project-second-brain` dokumentieren,
4. nur den Verweis und den handoff-relevanten Ausschnitt in die Übergabe übernehmen.

Keinen neuen parallelen Projekt-Memory-Baum anlegen.

### 4. Entscheidungen und erledigte Arbeit erfassen

Liste nur Entscheidungen auf, die belegt oder ausdrücklich bestätigt sind. Erfasse anschließend abgeschlossene Schritte, zugehörige Commits, Befehle und Resultate. Kennzeichne Versuche, die fehlgeschlagen oder verworfen wurden, damit sie nicht blind wiederholt werden.

### 5. Evidenz und Freshness bewerten

Jeder Verifikationspunkt enthält Quelle, Ergebnis, Zeitpunkt und Freshness-Status:

- `fresh`: Zustand ist für die nächste Aktion noch belastbar,
- `stale`: Zustand muss vor Verwendung erneut geprüft werden,
- `pending`: asynchrone Prüfung läuft noch,
- `unverified`: kein ausreichender Nachweis vorhanden.

CI, Deployments, Reviews, Mergefähigkeit, Dienststatus und externe Integrationen gelten als volatil. Ihre Übergabe benötigt einen Prüfzeitpunkt, eine Watch-Bedingung und bei schreibenden Aktionen einen erwarteten Head-SHA.

### 6. Risiken und Blocker trennen

Ein **Risiko** erlaubt Fortsetzung mit dokumentierter Vorsicht. Ein **Blocker** verhindert die nächste Aktion bis zu einer klar benannten Auflösung. Annahmen dürfen weder als Risiken noch als Fakten getarnt werden.

### 7. Genau eine nächste Aktion bestimmen

Definiere einen konkreten Befehl, Toolaufruf oder Review-Schritt mit Vorbedingungen und erwarteter Evidenz. Mehrere unabhängige nächste Schritte werden priorisiert; nur der erste wird als ausführbar markiert.

### 8. Übergabe prüfen

Verifiziere vor Abschluss:

- Head-SHA und Branch sind vorhanden,
- Fakten, Annahmen und offene Prüfungen sind getrennt,
- erledigte Arbeit und Nicht-Wiederholen-Hinweise sind enthalten,
- volatile Zustände besitzen Freshness und Prüfregel,
- bei aktivem Project Memory stimmen Root, State und letzter Event mit dem Handoff überein,
- genau eine nächste Aktion ist ausführbar,
- keine Geheimnisse oder unnötigen Logs enthalten sind.

## Externe oder ausstehende Zustände

Bei laufender CI oder ausstehendem Deployment:

1. lokale Arbeit als abgeschlossen oder unvollständig kennzeichnen,
2. externen Status als `pending` erfassen,
3. unveränderlichen Head-SHA sichern,
4. Watch-Bedingung und Abbruchkriterium dokumentieren,
5. an `deferred-external-action-verification` übergeben,
6. keine Erfolgsaussage vor verifiziertem Abschluss treffen.

Bei aktivem Project Memory muss der pending Zustand als offene Schleife sichtbar bleiben; wiederholte unveränderte Polls erzeugen keinen neuen Event.

## Fehlerbehandlung

Lehne die Übergabe ab und rekonstruiere sie, wenn sie nur eine vage Zusammenfassung enthält, Commit- oder Branchzustand fehlt, Annahmen mit Fakten vermischt werden, bereits erledigte Arbeit erneut beauftragt wird, mehrere konkurrierende nächste Aktionen offenbleiben, externer Erfolg ohne Evidenz behauptet wird oder ein vorhandener Project-Memory-Zustand ignoriert beziehungsweise durch eine parallele Chronik ersetzt wird.

Fehlt entscheidende Evidenz, übergib an `disciplined-diagnosis` oder `iterate-software-projects`. Ist ein klar begrenztes Issue als Nächstes umzusetzen, verwende `test-driven-vertical-slice`.

## Übergabeformat

```json
{
  "goal": "...",
  "scope": {"in": ["..."], "out": ["..."], "doneWhen": "..."},
  "repository": {
    "name": "owner/repo",
    "baseBranch": "main",
    "branch": "...",
    "headSha": "...",
    "workingTree": "clean|dirty|unknown"
  },
  "projectMemory": {
    "root": "docs/project-memory/INDEX.md",
    "state": "docs/project-memory/state.json",
    "latestEvent": "docs/project-memory/events/EVT-....md"
  },
  "references": {"issues": ["#..."], "pullRequests": ["#..."], "externalRuns": ["..."]},
  "facts": [{"statement": "...", "evidence": "..."}],
  "assumptions": [{"statement": "...", "verification": "..."}],
  "decisions": [{"decision": "...", "evidence": "..."}],
  "completed": [{"action": "...", "commit": "...", "evidence": "..."}],
  "doNotRepeat": ["..."],
  "verification": [{"check": "...", "status": "passed|failed|pending|unverified", "checkedAt": "...", "freshness": "fresh|stale|pending|unverified"}],
  "risks": ["..."],
  "blockers": ["..."],
  "nextAction": {"action": "...", "preconditions": ["..."], "expectedEvidence": "..."},
  "nextSkill": "iterate-software-projects|disciplined-diagnosis|test-driven-vertical-slice|deferred-external-action-verification"
}
```

`projectMemory` ist optional, wenn für den Kontext kein Project Second Brain existiert. Für Projekte, die ab Grilling unter diesem Contract laufen, ist der Verweis verpflichtend.

Der menschlich lesbare Brief fasst Ziel, Repositoryzustand, bestätigte Entscheidungen, erledigte Arbeit, offene Risiken und die nächste Aktion kompakt zusammen, ohne die maschinenlesbaren Details oder die persistente Projektdokumentation zu ersetzen.

## Abschlusskriterien

Die Übergabe ist abgeschlossen, wenn ein neuer Agent ohne erneute Vollanalyse den verifizierten Zustand versteht, nichts bereits Erledigtes wiederholt, volatile externe Zustände korrekt nachprüft, bei aktivem Project Memory den persistenten Projektgraphen korrekt fortsetzt und genau die nächste sichere Aktion ausführen kann.
