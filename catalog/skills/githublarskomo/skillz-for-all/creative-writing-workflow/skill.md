---
name: creative-writing-workflow
description: Orchestriert Creative Writing nach vorgelagertem Grilling von Ziel, Publikum, Autor-Modus und Format über Craft-Analyse und den passenden Science-Storytelling- oder Fiction-Series-Pfad bis zur optionalen EPUB3-Ausgabe für TTS-Reader wie ElevenReader. Verwenden als Haupteinstieg für populärwissenschaftliche Langform und Science-/Fantasy-Fiction; Fachlogik der Worker, Evidence Claims, Story Bible und EPUB-Rendering nicht duplizieren.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.5.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - round-based-requirements-grilling
  - thought-to-concept-flow
  - mentor-text-craft-analysis
  - science-storytelling-workflow
  - fiction-series-writing-workflow
  - creative-writing-epub-delivery
  - project-second-brain
consumes:
  - requirements-handoff.json
outputs:
  - creative-writing-run.json
  - creative-writing-handoff.json
lastEvaluated: 2026-09-22
---

# Creative Writing Workflow

## Zweck

Ein gemeinsamer Einstieg in zwei unterschiedliche Wahrheitsmodelle:

- **Science Storytelling:** Evidenz muss erhalten bleiben.
- **Fiction Series:** Canon und Knowledge States müssen konsistent bleiben.

Der Orchestrator routet und dokumentiert; er übernimmt nicht die Fachlogik der Worker.

## Harte Vorbedingung: Grilling

Vor einem substantiellen Lauf `round-based-requirements-grilling` verwenden beziehungsweise einen bestätigten Handoff wiederverwenden.

Mindestens klären:

- Mission `science|fiction`;
- Zielpublikum;
- gewünschte Wirkung;
- Sprache;
- Umfang/Format;
- Autor-Modus `coach|coauthor|writer|editor`;
- vorhandenes Material;
- gewünschte Ausgabe;
- bei EPUB: TTS-/ElevenReader-Ziel und gewünschte Voice-Charakteristik;
- Erfolgskriterien und Nicht-Ziele.

Bereits geklärte Entscheidungen nicht erneut abfragen.

## Optionaler Idea Capture

Wenn das Projekt aus längerfristig gesammelten Gedanken entsteht, `thought-to-concept-flow` nutzen. Rohideen bleiben dort zunächst Ideen; eine Übernahme in Science Claims oder Fiction Canon erfolgt nur durch den zuständigen Domain-Pfad.

## Craft Context

`mentor-text-craft-analysis` verwenden, wenn Referenzwerke oder gezielte Handwerksfragen vorliegen. Das Craft Model bleibt abstrakt und darf keine Autorenstimme kopieren.

## Routing

### Science

`science-storytelling-workflow`:

```text
evidence
 -> audience/explanation model
 -> narrative draft
 -> workshop
 -> creative revision
 -> scientific fidelity recheck
 -> science-story.md
```

### Fiction

`fiction-series-writing-workflow`:

```text
world + ensemble + voice + series architecture
 -> story bible + reveal/sequel controls
 -> chapter contract
 -> draft
 -> workshop
 -> revision
 -> continuity + voice collision
 -> act gates
 -> isolated reader reality freeze
 -> full-manuscript system gates
 -> optional adversarial award gate
 -> targeted revision + regression
 -> publication freeze
 -> fiction-manuscript.md
```

## Project Second Brain

Bei langfristigen Projekten wesentliche Zustandsänderungen ab dem Grilling über `project-second-brain` dokumentieren.

Science Evidence bzw. Fiction Story Bible bleiben kanonische Fachartefakte und werden nicht in Project Memory dupliziert.

## EPUB Delivery

Wenn EPUB/TTS gewünscht ist, nach dem jeweiligen Domain Gate `creative-writing-epub-delivery` ausführen.

Der Creative-Writing-Orchestrator **besitzt das EPUB nicht**. Er verweist in `creative-writing-run.json` auf das vom Delivery-Skill erzeugte, in Drive persistierte `creative-writing.epub` und dessen beobachteten Drive-Link.

## Drive Storage and Delivery Gate

Alle erzeugten Nicht-Code-Artefakte folgen `docs/DRIVE-STORAGE-AND-DELIVERY-CONTRACT.md`: lokal/Sandbox nur Build-Zwischenstand; finale Datei in den owning Child-Brain-Drive-Root oder ersatzweise tenantweiten `Deliveries`-Root schreiben; Write read-back-verifizieren; Projektartefakt registrieren; dem Nutzer den beobachteten Drive-Link ausgeben. Ohne erfolgreichen Drive-Write bleibt die Delivery `pending|blocked` und ist nicht final.

Longform-Manuskripte, EPUBs und sonstige erzeugte Nicht-Code-Delivery-Artefakte werden im owning Project Brain Drive gespeichert. Ohne Project Brain nutzt der Delivery-Skill den tenantweiten `Deliveries`-Root.
## Run Manifest

```json
{
  "schemaVersion": 1,
  "grillingHandoffRef": "...",
  "mission": "science|fiction",
  "authorMode": "coach|coauthor|writer|editor",
  "domainRunRef": "...",
  "projectMemory": null,
  "deliveryRequested": true,
  "deliveryRunRef": "...",
  "deliveryDriveLinks": [],
  "status": "pass|review|fail",
  "nextAction": "..."
}
```

## Qualitätsgate

- **Grilling vor Produktion.**
- **Science Claims und Fiction Canon haben getrennte Eigentümer.**
- Kein One-shot-Langformdraft als Default bei ungeklärter Architektur.
- Autor-Modus wird respektiert.
- Kein finaler EPUB-Handoff vor Domain-, Listener- und EPUB-Gates.
- Project Second Brain und Story Bible nicht vermischen.
- Bei Longform-Fiction Reader-Reality-Evidence vor Architektur-/Intent-Reconciliation einfrieren.
- Figurenstimme bei Ensemble-Fiction als Charakterarchitektur behandeln; Cross-Character-Collisions nicht erst beim finalen Line Polish suchen.
- Materielle Revisionen nach Funktionswirkung klassifizieren; betroffene alte Gates invalidieren oder gezielt regressionsprüfen.
- Protect-/Strength-Constraints überleben jeden größeren Revisionsloop.
- Alternative Science-/Fiction-Routen werden im Manifest explizit, nicht als statische Doppelpflicht behandelt.

## Abschluss

Abgeschlossen, wenn der Auftrag über den richtigen Domain-Pfad geführt, die relevanten Gates bestanden, der Projektzustand nachvollziehbar dokumentiert und bei gewünschter Audio-/Reader-Ausgabe ein geprüfter Delivery-Handoff erzeugt wurde.
