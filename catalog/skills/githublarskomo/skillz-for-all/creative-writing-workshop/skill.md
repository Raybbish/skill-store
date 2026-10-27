---
name: creative-writing-workshop
description: Prüft kreative Prosa als strukturierte Schreibwerkstatt mit Cold Read, Craft-Diagnose, Stärken-Schutz, Ursachenpriorisierung und konkretem Revisionsplan. Verwenden für Fiction und narrative Science Writing, wenn ein Entwurf zuerst verstanden und diagnostiziert werden soll, bevor er überarbeitet wird; nicht als Faktenreview oder automatisches Umschreiben.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires: []
outputs:
  - creative-workshop-review.json
  - creative-workshop-review.md
lastEvaluated: 2026-09-06
---

# Creative Writing Workshop

## Zweck

Simuliere eine anspruchsvolle universitäre Schreibwerkstatt. Der Skill diagnostiziert **vor** jeder Revision, damit ungewöhnliche, aber wirksame Entscheidungen nicht automatisch geglättet werden.

## Review-Modi

- `fiction-general`;
- `series-fiction`;
- `lay-reader-science`;
- `scene-focus`;
- `chapter-focus`.

## Ablauf

### 1. Cold Read

Ohne Reparaturvorschläge zuerst festhalten:

- Was habe ich verstanden?
- Was wollte ich als Nächstes wissen?
- Wo änderte sich meine Aufmerksamkeit?
- Wo verlor ich Orientierung?
- Welche Figur-/Sachfrage trug den Abschnitt?

### 2. Craft-Diagnose

Prüfe soweit relevant:

- Figur und Motivation;
- POV/narrative Distanz;
- Szene und Veränderung;
- Struktur;
- Dialog und Subtext;
- Informationsfluss/Exposition;
- Tempo;
- Weltintegration;
- Ton/Stimme;
- bei Science Writing: rekonstruierbares Verständnis des Laien.

### 3. Strength Preservation

Explizit markieren, was bei einer Revision **nicht verloren gehen darf**.

### 4. Ursache vor Symptom

Findings nach Ursache priorisieren. Ein langweiliger Dialog kann beispielsweise Symptom eines fehlenden Szenenziels sein.

### 5. Revisionsplan

Nur 3–7 priorisierte Eingriffe für den nächsten Pass formulieren. Keine Komplettumschreibung im Workshop.

## Gate

`gateStatus`:

- `pass`: keine strukturell relevanten offenen Findings;
- `revise`: konkrete Revision erforderlich;
- `rethink`: Architektur-/POV-/Figurenproblem erfordert vorgelagerten Schritt.

## Qualitätsregeln

- **Diagnose vor Revision.**
- Kein Gefälligkeits-PASS.
- Eigenwilligkeit nicht mit Fehler verwechseln.
- Stärken explizit schützen.
- Findings müssen auf konkrete Leserwirkung oder Craft-Funktion zurückgeführt werden.
- Fakten- oder Canon-Wahrheit gehören in die zuständigen Evidence-/Continuity-Skills.

## Abschluss

Abgeschlossen, wenn Cold Read, priorisierte Craft-Findings, Strength Preservation und ein ausführbarer Revisionsplan vorliegen.
