---
name: candidate-role-fit-assessment
description: Bewertet eine konkrete Person evidenzbasiert gegen eine freigegebene Role Architecture und Scorecard, trennt belegte Fakten, plausible Inferenz und Unbekanntes und erzeugt gezielte Verifikations- und Interviewfragen. Verwenden für Führungs-, Experten- und Schlüsselrollen, ohne aus öffentlicher Sichtbarkeit oder Lebenslauf-Proxys unbelegte Eignung abzuleiten.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.3.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - role-architecture
consumes:
  - role-architecture.json
  - role-scorecard.json
outputs:
  - candidate-role-fit.json
  - candidate-role-fit.md
  - candidate-interview-question-set.md
lastEvaluated: 2026-08-20
---

# Candidate Role Fit Assessment

## Trigger

Verwenden, wenn eine konkrete Person evidenzbasiert gegen eine normativ definierte und freigegebene Rolle bewertet werden soll. Der Skill beantwortet: **Wie gut belegt die verfügbare Evidenz, dass diese Person zur Rolle passt, und was muss noch verifiziert werden?**

Normative Bewertungsbasis sind `role-architecture.json` und `role-scorecard.json`, nicht öffentliche Ausschreibung oder Search Brief. Der Skill trifft keine finale Einstellungsentscheidung und erfindet keine fehlenden Kandidateninformationen.

## Voraussetzungen

Erforderlich sind:

- `role-architecture.json` mit `status=approved`,
- `role-scorecard.json` mit `status=approved`,
- exakt übereinstimmende `roleArchitectureId` und `roleArchitectureVersion`,
- eine **vor Sichtung dieses Kandidaten** freigegebene `scoringModelVersion`,
- rollenbezogene Kandidatenevidenz mit nachvollziehbarer Herkunft.

Fehlt eines dieser Gates, wird die Bewertung blockiert. `public-job-posting.md`, `job-description.md`, `executive-search-brief.md` oder eine frühere Kandidatenbewertung können die normative Basis nicht ersetzen.

## Ablauf

### Evidenzklassen

Jede Aussage zum Kandidaten erhält genau eine Klasse:

- `verified`: unmittelbar durch belastbare Quelle belegt,
- `supported-inference`: nachvollziehbare, aber nicht direkt belegte Schlussfolgerung,
- `unknown`: relevante Information fehlt,
- `contradicted`: verfügbare Evidenz spricht gegen die Behauptung.

Öffentlich zugängliche Recherche kann über `research-to-evidence-note` zugeliefert werden. Primärquellen und direkte Arbeitsnachweise sind höher zu gewichten als Biografietexte, PR, Rankings oder bloße Titelähnlichkeit.

### Bewertungslogik

Für jede Scorecard-Dimension dokumentiere Dimension und Gewicht, relevante Evidenz mit Quelle, Evidenzklasse, beobachtete Stärke oder Lücke, Confidence und offene Verifikationsfrage.

Ein numerischer Fit-Score ist nur zulässig, wenn Gewichte und Scoringregeln vor Kandidatensichtung festgelegt und freigegeben wurden. **`unknown` ist nicht automatisch negativ** und darf nicht als Null-Eignung codiert werden. Knockout-Kriterien stammen ausschließlich aus der freigegebenen Role Architecture.

Gewichte, Dimensionen, Mindestniveaus oder Knockouts dürfen während oder nach Sichtung eines Kandidaten nicht verändert werden, um dessen Fit zu verbessern oder zu verschlechtern. Eine echte Rollenänderung wird unabhängig vom Kandidaten in `role-architecture` begründet und versioniert; anschließend werden alle Kandidaten gegen dieselbe neue Version neu bewertet.

### Fairness und Datenschutz

Nicht verwenden oder inferieren: geschützte persönliche Merkmale, Gesundheit, Religion, politische Einstellung, sexuelle Orientierung, Familienplanung oder andere sachfremde private Informationen. **Alter, Foto, Name oder Herkunft** dürfen nicht als Leistungsproxy dienen. Verwende nur rollenbezogene Evidenz mit nachvollziehbarer Relevanz.

### Interview- und Verifikationsplan

`candidate-interview-question-set.md` konzentriert sich auf die **größten entscheidungsrelevanten Evidenzlücken**. Fragen sollen konkrete Situationen, Entscheidungen, Handlungen, Ergebnisse und Lernschleifen erschließen statt allgemeine Selbsteinschätzungen.

Bevorzugte Struktur:

- behauptete Capability,
- vorhandene Evidenz,
- verbleibende Unsicherheit,
- Verifikationsfrage,
- erwartete starke Evidenz,
- Red Flag oder Gegenbeleg.

### Ergebnis

`candidate-role-fit.json` enthält mindestens:

- `schemaVersion: 1`,
- `roleArchitectureId`,
- `roleArchitectureVersion`,
- `scoringModelVersion`,
- `assessmentStatus: current | stale`,
- `candidateEvidenceScope`,
- `dimensionAssessments`,
- `verifiedStrengths`,
- `evidenceGaps`,
- `contradictions`,
- `knockoutStatus`,
- `overallConfidence`,
- `recommendedVerification`,
- `limitations`.

`candidate-role-fit.md` ist die lesbare, quellenbezogene Fassung. **Formuliere keine Gewissheit**, die über die Evidenz hinausgeht.

## Prüfungen

Prüfe vor Abschluss:

- Jede relevante Scorecard-Dimension wurde gegen Evidenz bewertet.
- Evidenzklassen sind explizit und nicht vermischt.
- `unknown` wurde nicht als fehlende Eignung umgedeutet.
- Architektur-, Scorecard- und Scoring-Versionen stimmen exakt.
- Die Scorecard wurde vor Kandidatensichtung eingefroren.
- Interviewfragen adressieren die entscheidungsrelevanten Evidenzlücken.
- Geschützte oder sachfremde Merkmale fließen nicht in Fit oder Rangfolge ein.

## Fehlerbehandlung

Fehlt normative Freigabe oder besteht ein Versionsmismatch, Bewertung blockieren. Zeigt die Kandidatenbewertung, dass das Rollenmodell selbst unklar, widersprüchlich oder auf ungeeigneten Proxys basiert, nicht den Kandidaten passend rechnen: zurück zu `role-architecture`; falls dahinter eine echte Stakeholder-Entscheidung fehlt, weiter zu `role-requirements-grilling`.

### Verbotene Übergänge

- Kein Assessment ohne freigegebene Role Architecture und passende Scorecard.
- Keine Bewertung ausschließlich gegen `public-job-posting.md`, `job-description.md` oder `executive-search-brief.md`.
- Keine direkte Übernahme von Kandidatenevidenz in neue Rollenanforderungen oder Scorecard-Gewichte.
- Kein Vergleich verschiedener Kandidaten auf unterschiedlichen Role-Architecture- oder Scoring-Versionen, wenn das Ergebnis als gemeinsame Rangfolge interpretiert werden soll.

Wird eine neue Role-Architecture- oder Scorecard-Version freigegeben, wird die bisherige Bewertung `stale`. Sie bleibt nachvollziehbar, darf aber nicht als aktuelle Fit-Bewertung oder Vergleichsbasis dienen und **muss gegen die neue normative Version erneut bewertet werden**.

## Übergabe

Übergebe `candidate-role-fit.json`, `candidate-role-fit.md` und `candidate-interview-question-set.md` mit eindeutiger Referenz auf Role-Architecture- und Scoring-Version. Offene Punkte werden als Verifikationsbedarf, nicht als implizite Negativbewertung, weitergegeben.

## Abschlusskriterien

Abgeschlossen ist der Skill, wenn jede relevante Fit-Aussage evidenzklassifiziert, Lücken explizit, normative Versionen festgehalten und die nächsten Verifikationsfragen auf die entscheidungsrelevanten Unsicherheiten fokussiert sind.