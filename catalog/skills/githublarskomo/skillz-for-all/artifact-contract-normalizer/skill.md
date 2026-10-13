---
name: artifact-contract-normalizer
description: Analysiert und normalisiert Skill-Artefaktverträge für eindeutige Producer-Ownership, explizite consumes-Beziehungen, Orchestrator-vs-Worker-Grenzen und sichere Compatibility-Referenzen. Verwenden intern bei Architekturrefactorings und Output-Ambiguitäten; keine Consumer- oder Producer-Beziehungen ohne Vertragsbeleg erfinden.
userFacing: false
implicitInvocation: true
discoverability: internal
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - skill-portfolio-audit
outputs:
  - artifact-contract-normalization.json
lastEvaluated: 2026-09-22
---

# Artifact Contract Normalizer

## Trigger

Intern verwenden, wenn mehrere Skills dasselbe Output-Artefakt deklarieren, Producer/Consumer-Grenzen unklar sind, ein Orchestrator Worker-Artefakte erneut besitzt oder eine Lifecycle-Migration Output-Ownership verschiebt.

## Voraussetzungen

- betroffene `SKILL.md`-Frontmatter und normative Übergaben;
- `docs/skill-dependency-graph.json` und Capability Index;
- bekannte `requires`- und soweit vorhanden `consumes`-Verträge;
- Kontext, welcher Skill fachlich erzeugt, welcher nur orchestriert und welcher lediglich referenziert.

## Ablauf

1. **Artefakt inventarisieren.** Alle deklarierenden Producer, potenziellen Consumer und relevante Dependency-Kanten erfassen.
2. **Producer bestimmen.** Den Skill identifizieren, der das Artefakt tatsächlich erzeugt und dessen fachliche/formatbezogene Verantwortung besitzt.
3. **Orchestrator bereinigen.** Orchestratoren behalten Run-/Bundle-/Manifest-Artefakte; Worker-Dateien werden referenziert statt erneut als Output deklariert.
4. **Storage von Ownership trennen.** Für Skillz for All bleibt genau ein fachlicher Producer Eigentümer des Artefakts, während die persistierte Nicht-Code-Instanz gemäß `docs/DRIVE-STORAGE-AND-DELIVERY-CONTRACT.md` in Drive liegt. Drive-Persistenz erzeugt keinen zweiten Producer.
5. **Consumer explizieren.** Wo ein downstream Skill ein bestimmtes Artefakt wirklich liest, `consumes` bevorzugen. `requires` allein darf nicht als Beweis für jede mögliche Output-Nutzung missverstanden werden.
6. **Compatibility behandeln.** Deprecated Facades dürfen Replacement-Artefakte referenzieren, deklarieren aber eigene Compatibility-Manifeste statt denselben kanonischen Output.
7. **Terminal Outputs erkennen.** Berichte, Exporte und andere Endprodukte ohne harte Consumer nicht automatisch als Orphans klassifizieren.
8. **Delta planen.** Frontmatter-, Body-, Evaluation- und Regressionstest-Änderungen mit erwarteter Ambiguity-Auswirkung dokumentieren.

## Prüfungen

- Hat jedes kanonische Artefakt genau einen tatsächlichen Producer?
- Stimmen Output-Deklaration und normative Verantwortung überein?
- Referenzieren Orchestratoren Worker-Artefakte statt Ownership zu duplizieren?
- Sind explizite `consumes`-Kanten evidenzbasiert?
- Bleiben terminale Outputs ohne Consumer zulässig?
- Erzeugt eine Compatibility-Fassade kein zweites kanonisches Artefakt?
- Ist die persistierte Nicht-Code-Instanz über einen verifizierten Drive-Locator referenziert, ohne Producer-Ownership zu duplizieren?

## Fehlerbehandlung

- **Producer nicht entscheidbar:** Ambiguität offen lassen und fachliche Ownership klären; keinen zufälligen Producer wählen.
- **Consumer nur vermutet:** keine `consumes`-Kante erfinden.
- **Orchestrator braucht eigenes Audit-Artefakt:** Run/Bundle/Manifest als separaten Output definieren.
- **Compatibility erfordert alte Dateibezeichnung:** Replacement-Datei referenzieren und Mapping im Compatibility-Manifest dokumentieren, nicht doppelt produzieren.
- **Unconsumed Output:** erst Zweck prüfen; Terminalität ist kein Defekt.

## Übergabe

`artifact-contract-normalization.json` enthält Artifact, Current Producers, Canonical Producer, Consumer Evidence, Output/Consumes Deltas, Compatibility Handling, Regression Gates und erwartete Ambiguity-Änderung.

## Abschlusskriterien

Der Normalizer ist abgeschlossen, wenn Producer-Ownership und Consumer-Evidenz getrennt dokumentiert sind, geplante Deltas keine erfundenen Kanten enthalten und nach der Migration genau ein kanonischer Producer pro normalisiertem Artefakt verbleibt.
