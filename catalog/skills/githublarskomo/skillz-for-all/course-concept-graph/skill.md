---
name: course-concept-graph
description: Baut aus einem evidenzgebundenen Multi-Source-Learning-Modell einen gerichteten Begriffs- und Voraussetzungsgrafen für Kursaufbau, Modulgrenzen und Lernreihenfolge. Verwenden vor automatischer Learning-Path-Planung; nicht zur inhaltlichen Erfindung fehlender Voraussetzungen.
userFacing: false
implicitInvocation: true
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - multi-source-learning-synthesis
outputs:
  - course-concept-graph.json
lastEvaluated: 2026-08-28
---

# Course Concept Graph

## Ziel

Aus einem konsolidierten `multi-source-learning-model.json` wird ein gerichteter Lernabhängigkeitsgraph erzeugt. Er trennt fachliche Abhängigkeit von bloßer Video-Reihenfolge.

## Knoten

Jeder Knoten enthält mindestens:

- `conceptId`;
- kanonischen Begriff / Kompetenz;
- Lernzielbezug;
- Scope/Qualifier;
- Evidenzstatus und Source-IDs;
- Schwierigkeit als qualitative Klasse `foundation | intermediate | advanced`;
- erforderliche Vorbegriffe;
- optionale Anwendungskompetenzen;
- Konflikt-/Unsicherheitsstatus.

## Kanten

Zulässige Kanten:

- `prerequisite-of` — fachlich erforderlich;
- `helps-before` — didaktisch sinnvoll, aber nicht zwingend;
- `part-of` — hierarchische Zerlegung;
- `variant-of` — alternative Methode/Variante;
- `contrasts-with` — bewusster Vergleich;
- `applies-to` — Konzept -> Anwendung.

`prerequisite-of` darf nur gesetzt werden, wenn die Abhängigkeit fachlich oder aus der Lernlogik begründbar ist. Video A vor Video B ist kein Beleg für eine Voraussetzung.

## Graphregeln

- Zyklen in zwingenden `prerequisite-of`-Kanten sind unzulässig und müssen aufgelöst werden.
- Konfligierende Claims werden nicht als feste Voraussetzungen verwendet, solange der Konflikt materiell offen ist.
- Single-Source-Details dürfen Module ergänzen, aber nicht ohne Begründung den gesamten Lernpfad dominieren.
- Grundlagen sollen vor Spezialvarianten liegen, sofern keine explizite Zielgruppenannahme dagegen spricht.
- Bereits vorausgesetztes Vorwissen der Zielgruppe darf als `assumed-prerequisite` markiert werden, muss aber sichtbar bleiben.

## Modul-Kandidaten

Der Skill darf zusammenhängende Cluster als Modul-Kandidaten markieren. Clusterbildung orientiert sich an:

1. gemeinsamem Lernziel;
2. enger begrifflicher Kopplung;
3. ähnlichem Schwierigkeitsniveau;
4. sinnvoller kognitiver Last;
5. klarer Ein-/Ausgangskompetenz.

Nicht nach Videoanzahl oder Creator gruppieren.

## Output

`course-concept-graph.json` enthält:

- `nodes[]`;
- `edges[]`;
- `assumedPrerequisites[]`;
- `moduleCandidates[]`;
- `entryConcepts[]`;
- `terminalCompetencies[]`;
- `unresolvedDependencyQuestions[]`;
- Graph-Validierungsstatus.

## Qualitätsfälle

**Happy Path:** Grundlagen -> Mechanismus -> Varianten -> Anwendung ergeben einen azyklischen, nachvollziehbaren Lernpfad.

**Edge Case:** qPCR erweitert klassische PCR, ist aber nicht Bestandteil jedes PCR-Grundkurses -> als fortgeschrittene Variante modellieren.

**Failure Case:** Playlist-Reihenfolge wird unverändert als Voraussetzungskette übernommen -> stoppen und fachliche Abhängigkeiten neu bestimmen.
