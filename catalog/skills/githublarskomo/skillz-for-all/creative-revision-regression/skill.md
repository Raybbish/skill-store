---
name: creative-revision-regression
description: Klassifiziert die Auswirkung materieller Creative-Writing-Revisionen, entscheidet welche früheren Gates dadurch ungültig werden und prüft gezielte Fixes gegen Protect-Constraints und Kollateralschäden. Verwenden nach strukturellen, Reader-, Voice- oder Award-getriebenen Revisionen; kleine Line-Fixes sollen keine unnötigen Voll-Reruns auslösen.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - creative-prose-revision
consumes:
  - creative-revision-report.json
  - final-creative-text
outputs:
  - revision-impact-classification.json
  - gate-invalidation-map.json
  - creative-revision-regression.json
lastEvaluated: 2026-09-10
---

# Creative Revision Regression

## Zweck

Eine Revision ist erst abgeschlossen, wenn zwei Fragen getrennt beantwortet sind:

1. Hat die Änderung das beabsichtigte Problem verbessert?
2. Welche bereits bestandenen Funktionen oder Gates könnte sie ungültig gemacht haben?

Der Skill verhindert beide Extreme:

- nach jeder kleinen Änderung alles vollständig neu prüfen;
- alte PASS-Entscheidungen trotz materiell verändertem Manuskript blind weiterverwenden.

## Eingaben

Mindestens:

- Baseline-Version;
- Candidate-Version;
- Revisionsreport oder explizite Delta-Beschreibung;
- ursprüngliche Findings;
- vorhandene Gate-Status;
- Protect List / Strength Preservation, falls vorhanden.

## Revision Impact Classification

### R0 — Surface

Beispiele:

- Tippfehler;
- Interpunktion;
- eindeutig bedeutungsgleiche Mikroformulierungen.

Folge:

- keine strukturellen Gates invalidieren;
- nur lokale Qualitätsprüfung.

### R1 — Local Craft

Beispiele:

- lokale Dialog-/Rhythmuskorrektur;
- Entfernung eines Echos;
- kleinere Satz-/Absatzkompression;
- Fix gegen ein bekanntes Finding ohne Ereignis-/Wissensänderung.

Folge:

- targeted regression auf Finding + Protect;
- kein Full Reader Rerun, sofern Leserkausalität unverändert bleibt.

### R2 — Multi-Scene Presentation

Beispiele:

- mehrere Szenen umformuliert;
- Exposition/Reihenfolge verändert;
- Voice- oder Pacing-Pass über mehrere Kapitel;
- gleichbleibende Ereignisse, aber spürbar geänderte Präsentation.

Folge:

- betroffene Act-/Voice-/Reveal-/Reader-Teilbereiche neu prüfen;
- gezielter Reread;
- Protect Regression.

### R3 — Narrative Meaning

Beispiele:

- Motivation;
- Beziehung;
- POV;
- Reveal-Stärke/-Zeitpunkt;
- Charakterentscheidung;
- Ursache/Wirkung;
- Setup/Payoff

wurde materiell verändert.

Folge:

- betroffene Continuity-/Reveal-/Arc-/Reader-Gates invalidieren;
- Full Reader Reality Gate neu, wenn die Kernrekonstruktion berührt ist;
- ggf. Award-Gate neu.

### R4 — Architecture

Beispiele:

- Plot-Grundkausalität;
- World Rule;
- Series Architecture;
- Ende;
- tragender Arc;
- veröffentlichungsrelevanter Canon

wurde geändert.

Folge:

- Architektur-/Continuity-Auswirkungen zuerst neu modellieren;
- downstream Act-/Full-Manuscript-/Reader-/Award-Gates als invalid markieren;
- keine Publication-Freeze-Freigabe aus alten Passes übernehmen.

## Gate Invalidation Map

Für jedes vorhandene Gate:

- gateId;
- priorStatus;
- affectedByDelta;
- reason;
- invalidationLevel `none|targeted-reread|required-rerun|fully-invalid`;
- requiredEvidenceToRestore;
- restoredStatus.

Wichtig: Ein Gate wird nicht wegen Dateiversionsänderung invalidiert, sondern wegen **Funktionsänderung**.

## Regression

Vergleiche Baseline und Candidate gegen:

- ursprüngliches Finding;
- root cause;
- reader effect;
- Protect/Strength Preservation;
- Continuity/Reveal/Knowledge Constraints;
- neue Probleme.

Ergebnis pro Finding:

- `resolved`;
- `improved`;
- `unchanged`;
- `worse`;
- `newProblemIntroduced`.

Zusätzlich `collateralDamage[]`.

## Smallest Sufficient Intervention

Bevor ein breiter Rewrite akzeptiert wird, prüfen:

- Kann die Ursache mit weniger Szenenänderung behoben werden?
- Muss ein Ereignis geändert werden oder nur Erklärung/Platzierung?
- Kann Redundanz entfernt werden, ohne Evidenz zu entfernen?
- Kann Voice differenziert werden, ohne House Style oder Character Function zu verlieren?

Revisionen sollen nicht größer sein als nötig, nur weil ein Diagnosemodell viel erklären kann.

## Protect Constraints

Protect-/Strength-Einträge sind verbindliche Regression-Anker.

Typische Protect-Klassen:

- Character Agency;
- wirksame Ambiguität;
- emotionale Kosten;
- funktionierende Gegenargumente;
- einzigartige Bilder/Rhythmen;
- epistemische Begrenzung;
- Welt-/Canon-Regeln;
- nicht-triumphale oder absichtlich offene Schlüsse.

Ein Finding gilt nicht als geschlossen, wenn seine Reparatur eine gleich- oder höherwertige Protect-Funktion wesentlich beschädigt.

## Stop-Regel

Standardmäßig blockierend:

- Critical/Major Domain Findings;
- ungültige Reader Isolation;
- undisponierte S3/S4, falls ein entsprechendes adversariales Gate aktiviert ist;
- Regression mit neuem gleich- oder höherwertigem Problem.

Nicht automatisch blockierend:

- Minor/S1;
- dokumentierte Design Trade-offs;
- akzeptierte S2-Watchpoints;
- Audio-/Taste-Watchpoints ohne zentrale Verständlichkeitswirkung.

Bewusste Nicht-Änderung dokumentiert:

- cost;
- benefit;
- protectedElements;
- reopenCondition.

## Output Contract

### revision-impact-classification.json

Enthält:

- impactClass `R0|R1|R2|R3|R4`;
- changedUnits;
- changedFunctions;
- unchangedFunctions;
- rationale.

### gate-invalidation-map.json

Enthält prior status und erforderlichen Wiederherstellungsnachweis aller betroffenen Gates.

### creative-revision-regression.json

Enthält:

- baseline;
- candidate;
- findings;
- protectRegression;
- collateralDamage;
- restoredGates;
- residualWatchpoints;
- regressionStatus `pass|pass-with-watchpoints|fail`.

## Qualitätsregeln

- **Delta nach Funktion, nicht nur nach Textmenge klassifizieren.**
- **Protect vor Optimierung.**
- Kein Full Rerun ohne funktionalen Grund.
- Kein alter PASS bei materiell veränderter Kernfunktion.
- Root Cause muss verbessert sein; reine Symptomentfernung reicht nicht.
- Regression prüft auch neue Probleme.
- Publication Freeze verwendet nur aktuell gültige Gates.

## Abschluss

Abgeschlossen, wenn Revisionswirkung klassifiziert, betroffene alte Gates korrekt invalidiert oder bestätigt und der Candidate ohne unakzeptablen Kollateralschaden gegen die ursprünglichen Findings regressionsgeprüft wurde.
