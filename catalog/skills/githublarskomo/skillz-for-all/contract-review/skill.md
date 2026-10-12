---
name: contract-review
description: Bewertet einen hochgeladenen oder als Text bereitgestellten privaten oder beruflichen Vertrag einschließlich Anlagen und AGB gegen bestätigte Requirements, aktuelle Rechtsgrundlagen, funktionales Deal Model, Mandantenstrategie und wirtschaftlich-operative Risiken und erzeugt eine priorisierte Issue-Liste mit Risk- und Negotiation-Handoffs. Verwenden für Vertragsprüfung und Redline-Vorbereitung, nicht für initiales Drafting.
userFacing: true
implicitInvocation: false
discoverability: advanced
category: workflow
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - current-law-context
  - agreement-type-analysis
outputs:
  - contract-review.json
  - contract-review.md
  - contract-issue-list.json
  - contract-risk-input.json
lastEvaluated: 2026-08-28
---

# Contract Review

## Zweck und Grenze

Dieser Skill bewertet einen **vorhandenen Vertrag oder Vertragsset**. Er trennt juristische, wirtschaftliche, operative und redaktionelle Findings und priorisiert sie für Entscheidung und Verhandlung.

Er erzeugt keine definitive Aussage wie „rechtswirksam“ oder „gerichtsfest“, wenn Rechtsgrundlage, Sachverhalt oder Rechtsprechung dies nicht belastbar erlauben. Er ersetzt kein erforderliches qualifiziertes Legal Review.

## Dokumentaufnahme

Akzeptiere insbesondere DOCX, PDF, Text und mehrere zusammengehörige Dokumente. Bei mehreren Dateien:

1. Hauptvertrag bestimmen.
2. Anlagen, SOW, SLA, Preislisten, AGB, DPA, Policies und referenzierte Dokumente zuordnen.
3. Rangfolgeklauseln und Incorporation-by-reference erfassen.
4. Fehlende referenzierte Dokumente als `missingReferencedDocument` markieren.
5. Originale unverändert lassen und für jede Quelle soweit möglich Version/Hash/Dateiname erfassen.

Wenn Inhalte unlesbar oder unvollständig sind, keine Lücken erfinden. Bei Scan-/Parsing-Problemen konkrete Seiten oder Abschnitte als nicht verifizierbar kennzeichnen.

## Voraussetzung

Kanonisch müssen aktueller `current-law-context`, `agreement-deal-model.json`, `agreement-clause-coverage.json` und bestätigtes Mandantenziel vorliegen. Der Legacy-Handoff `contract-legal-context.json` kann zusätzlich über `contract-workflow` erzeugt und referenziert werden.

Außerdem müssen Zweck, Vertragsrolle des Nutzers und wesentliche Must-haves bekannt sein; fehlende fachliche Entscheidungen gehen über `contract-workflow` zu Grilling zurück.

Specialist Routes aus `agreement-specialist-routes.json` werden berücksichtigt. Fehlt ein für die Entscheidung materieller Specialist-Output, wird die Bewertung entsprechend eingeschränkt oder eskaliert statt fachlich improvisiert.

## Five-Lens Review

Führe für materielle Klauseln und den Vertrag als System fünf Perspektiven durch:

1. **Client Counsel:** Schützt die Klausel Mandantenziel, Must-haves und Red Lines?
2. **Counterparty Counsel:** Welche legitimen Interessen, Hebel und wahrscheinlichen Gegenargumente hat die andere Seite?
3. **Litigation / Failure Scenario:** Was passiert bei Leistungsstörung, Streit, Insolvenz, Daten-/IP-Vorfall, Kündigung oder Beweisproblem?
4. **Operational Reality:** Ist die Klausel praktisch ausführbar, messbar und den realen Prozessen/Rollen zuordenbar?
5. **Cross-Clause / System Consistency:** Stimmen Definitionen, Risikoallokation, Anlagen und Klauselinteraktionen zusammen?

Gegenparteiinteressen bleiben Hypothesen, sofern sie nicht belegt sind. Die Gegenperspektive dient der Robustheit, nicht der Aufgabe des Mandantenziels.

## Review-Dimensionen

Prüfe mindestens, soweit einschlägig:

- Parteien, Vertretung, Präambel und Vertragsgegenstand,
- Scope, Deliverables, Abhängigkeiten, Leistungsort, Termine und Change Control,
- Preis, Steuern, Währung, Zahlungsbedingungen und Preisanpassung,
- Abnahme, Gewährleistung, Garantien, Service Levels und Remedies,
- Laufzeit, Verlängerung, Kündigung, Suspendierung und Exit/Transition,
- Haftung, Haftungsdeckel, Ausschlüsse, Freistellungen und Versicherungen,
- Vertraulichkeit und Veröffentlichungsrechte,
- IP, Background/Foreground IP, Nutzungsrechte, Lizenzumfang und Drittanbieterrechte,
- Datenschutz, Datennutzung, Security, Unterauftragnehmer und internationale Transfers,
- Compliance, Audit, Dokumentation und regulatorische Pflichten,
- Exklusivität, Wettbewerbsverbote, Mindestabnahmen und Lock-in,
- Assignment, Change of Control, Subcontracting,
- Force Majeure / Hardship,
- Rechtswahl, Gerichtsstand, Schiedsverfahren und Streitbeilegung,
- Form, Notices, Entire Agreement, Severability und Survival,
- Definitionen, Querverweise, Anlagen, Rangfolge, Widersprüche und offene Platzhalter.

Clause Coverage aus `agreement-clause-coverage.json` steuert, welche Themen `required`, `conditional`, `optional` oder `not-applicable` sind. Fehlende Pflichtmodule werden als `missing-term` bewertet.

## Klauselbewertung

Jedes materielle Finding erhält:

- `issueId`, `location`, `clauseTopic`,
- `findingType`: `legal | commercial | operational | drafting | missing-term | cross-document-conflict`,
- `riskLevel`: `critical | high | medium | low | note`,
- `userImpact`,
- `legalBasis` nur soweit verifiziert,
- `whyItMatters`,
- `recommendedAction`: `must-fix | negotiate | accept-or-monitor | verify-facts | counsel-review`,
- `preferredPosition`, `fallbackPosition`, `redLine` soweit ableitbar,
- `proposedChange` als präzise Änderungsanweisung oder Klauselvorschlag,
- `confidence` und `openFacts`,
- `specialistRefs` und `clientStrategyRefs`, soweit materiell.

Risiko wird nicht allein aus „ungewöhnlicher“ Formulierung abgeleitet. Berücksichtige Wahrscheinlichkeit, Schadenshöhe, Kontrollierbarkeit, Reversibilität, operative Eintrittswahrscheinlichkeit und Verhandlungskontext.

## Cross-Clause Review

Nach Einzelklauseln zwingend einen zweiten Pass durchführen auf:

- widersprüchliche Definitionen,
- Haftung versus Freistellung versus Versicherung,
- Laufzeit versus Kündigung versus Preisbindung,
- IP versus Vertraulichkeit versus Datennutzung,
- Leistungspflichten versus SLA/Abnahme/Remedies,
- Hauptvertrag versus Anlagen/AGB,
- Rechtswahl versus Gerichtsstand/Arbitration,
- Rangfolgen und Survival.

## AGB-/Formularvertrag-Gate

Wenn vorformulierte Bedingungen vorliegen, markiere die AGB-Relevanz aus dem Legal Context. Unterscheide B2C und B2B; behandle Individualabreden und tatsächlich ausgehandelte Klauseln gesondert. Keine pauschale Gleichsetzung von B2B mit „AGB-Kontrolle irrelevant“.

## Risk Handoff

Erzeuge zusätzlich `contract-risk-input.json` als normalisierten Input für `legal-compliance-risk-assessment`. Der Handoff enthält nur materielle Contract Risks, Evidenz-/Confidence-Status, Exposure-Hypothesen, mögliche Mitigations und erforderliche Authority; der Review setzt kein Residual Risk eigenständig auf `accepted`.

## Ausgabe

`contract-review.json` enthält Summary, Dokumentset, Legal-Context-/Authority-Version, Deal-Model-Version, Gesamtrisiko, Findings, Cross-Clause-Findings, Missing Documents, Material Unknowns, Specialist References und Escalations.

`contract-review.md` enthält:

1. Executive Summary,
2. Top-Risiken,
3. Klausel-für-Klausel-Bewertung,
4. fehlende oder schwache Regelungen,
5. Five-Lens-Systembefund,
6. Verhandlungsplan,
7. Final-Gate-Status.

`contract-issue-list.json` ist die kompakte, sortierbare Arbeitsliste für Revision/Verhandlung.

## Prüfungen

Pass nur wenn das gesamte relevante Dokumentset berücksichtigt wurde; Findings konkrete Fundstellen besitzen; Recht, Wirtschaft und Operations getrennt werden; B2C/B2B und AGB-Kontext korrekt geroutet sind; keine unlesbaren Passagen erfunden werden; Cross-Clause-Konflikte geprüft werden; Top-Risiken priorisiert und konkrete nächste Aktionen angegeben werden; Material Unknowns und Counsel-Eskalationen sichtbar bleiben.

Zusätzlich müssen Deal Model und Clause Coverage konsistent verwendet, materielle Specialist Gaps sichtbar und die fünf Review-Perspektiven für High/Critical Issues berücksichtigt sein.

## Abschluss

Der Skill endet mit einer nachvollziehbaren, priorisierten Vertragsbewertung, die direkt in Risk Assessment, Verhandlung, Revision oder qualifiziertes Legal Review übergeben werden kann.