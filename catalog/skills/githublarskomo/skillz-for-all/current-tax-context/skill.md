---
name: current-tax-context
description: Ermittelt für ein Tax Matter den aktuellen, perioden- und jurisdiktionsbezogenen Steuerrechtskontext aus Primärquellen, Verwaltung, Rechtsprechung und gekennzeichneter Fachinterpretation; Practitioner-Quellen wie JUHN dienen nur als Discovery-/Interpretationslayer und bestätigen keine materielle Steuerposition.
userFacing: true
implicitInvocation: true
category: research-knowledge
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - research-to-evidence-note
  - current-law-context
outputs:
  - tax-authority-evidence.json
  - tax-context.md
  - tax-research-open-questions.json
  - tax-source-freshness.json
lastEvaluated: 2026-08-30
---

# Current Tax Context

## Zweck

Binde jede materielle Tax-Analyse an Jurisdiktion, Steuerart, Veranlagungs-/Leistungszeitraum, Rechtsstand und belastbare Authority.

## Evidence Tiers

- T1 Primary Authority: Gesetze, EU-Recht, BFH/BVerfG/EuGH/FG, BMF, BZSt und zuständige Finanzverwaltung.
- T2 Authoritative Professional Interpretation: führende Kommentare, Fachzeitschriften, wissenschaftliche Literatur, OECD soweit einschlägig.
- T3 Practitioner Knowledge: hochwertige Kanzlei-/Beratungspublikationen wie JUHN, FGS, POELLATH, YPOG oder Big-Four-Tax-Material.
- T4 Discovery/Explanation: YouTube, Podcasts, Social Media und sonstige Erklärformate.

T3/T4 dürfen Hypothesen, Patterns und Recherchepfade erzeugen, aber allein keine Position als `confirmed` markieren.

## Freshness Contract

Jeder zeitabhängige Knowledge Record führt mindestens `publishedAt`, `effectiveFrom`, `effectiveUntil`, `lawAsOf`, `verifiedAt` und optional `supersededBy`.

## Workflow

1. Steuerarten, Perioden und Jurisdiktionen aus `tax-matter.json` bestimmen.
2. Primärquellen und aktuelle Fassungsstände ermitteln.
3. Verwaltungsauffassung und Rechtsprechung getrennt erfassen.
4. Fachinterpretationen als Interpretation kennzeichnen.
5. Practitioner-Content nur zur Strukturierung, Hypothesenbildung und Fallmustererkennung nutzen.
6. Konflikte, Übergangsrecht und offene Fragen sichtbar halten.

## Qualitätsgate

Pass nur, wenn jede zentrale Tax Rule auf Steuerart, Zeitraum, Jurisdiktion, Authority Tier, Rechtsstand und Applicability zurückgeführt werden kann und Sekundär-/Practitioner-Content nicht als Primärrecht erscheint.