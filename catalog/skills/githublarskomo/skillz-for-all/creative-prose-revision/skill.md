---
name: creative-prose-revision
description: Überarbeitet kreative Prosa in getrennten Developmental-, Scene- und Line-Pässen auf Grundlage eines priorisierten Workshop-Reviews und schützt dabei bestätigte Stärken, Perspektive, Figurenfunktion, literarische Eigenart und bei Serienprojekten Canon-Anker. Verwenden nach creative-writing-workshop; nicht als Ersatz für wissenschaftliche Fidelity- oder Story-Bible-Continuity-Prüfung.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - creative-writing-workshop
consumes:
  - creative-workshop-review.json
outputs:
  - final-creative-text
  - creative-revision-report.json
lastEvaluated: 2026-09-06
---

# Creative Prose Revision

## Zweck

Revision ist kein einzelner Polish-Pass. Der Skill arbeitet von groß nach klein und verändert erst dann Satzoberfläche, wenn Architektur und Szene tragen.

## Vorbedingung

Ein aktuelles `creative-workshop-review.json` muss vorliegen. Bei `gateStatus=rethink` zuerst zur betroffenen Architektur zurückkehren.

## Drei Pässe

### 1. Developmental Pass

Prüfe und revidiere nur autorisierte Punkte zu:

- Gesamtstruktur;
- Plot-/Erklärlogik;
- POV-Architektur;
- Figurenfunktion und Arc;
- Stakes;
- Informationsreihenfolge;
- Kapitelposition.

### 2. Scene Pass

Für jede betroffene Szene:

- Eintrittszustand;
- Ziel;
- Hindernis/Konflikt;
- Entscheidung oder Veränderung;
- Informationsgewinn/-verlust;
- Subtext;
- Austrittszustand.

### 3. Line Pass

Erst danach:

- Rhythmus;
- Präzision;
- Bilder;
- Dialog;
- Wiederholung;
- Satzbau;
- unnötige Metasprache.

## Schutzregeln

- **Developmental vor Scene vor Line.**
- Strength-Preservation-Einträge aus dem Workshop sind harte Prüfanker.
- Keine stilistische Glättung nur zur Gleichförmigkeit.
- Keine neuen Fakten in Science Writing.
- Keine Änderung publizierten Canons ohne autorisierten Continuity-/Retcon-Prozess.
- Author Voice nur aus bestätigtem Profil oder expliziten Präferenzen ableiten.

## Output

`creative-revision-report.json` dokumentiert:

- angewandte Workshop-Findings;
- geänderte Ebenen;
- geschützte Stärken;
- nicht umgesetzte Empfehlungen mit Begründung;
- erforderliche nachgelagerte Fidelity-/Continuity-Rechecks.

## Abschluss

Abgeschlossen, wenn alle autorisierten Findings adressiert oder begründet zurückgestellt sind, Strength Preservation erhalten ist und die revidierte Fassung für den zuständigen Domain-Gate bereitsteht.
