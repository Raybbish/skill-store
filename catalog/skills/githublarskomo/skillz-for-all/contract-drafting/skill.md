---
name: contract-drafting
description: Erzeugt aus bestätigten Requirements, Client Strategy, aktuellem Rechtskontext und funktionalem Deal Model einen privaten oder beruflichen Vertragsentwurf, wahlweise auf Basis einer hochgeladenen Vorlage, und dokumentiert Platzhalter, Abweichungen, Specialist Inputs, Rechtsannahmen und offene Punkte. Verwenden für neue Vertragsentwürfe oder template-basiertes Drafting, nicht für primäre Fremdvertragsbewertung.
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
  - contract-draft.md
  - contract-drafting-report.json
  - contract-open-points.md
lastEvaluated: 2026-08-28
---

# Contract Drafting

## Zweck und Grenze

Dieser Skill erzeugt einen nachvollziehbaren Vertragsentwurf aus bestätigten fachlichen Anforderungen, Mandantenstrategie, funktionalem Deal Model und einem aktuellen Rechtsgrundlagen-Handoff. Er unterstützt sowohl freie Neuerstellung als auch **template-basiertes Drafting**.

Eine Vorlage wird nicht als automatisch rechtlich geeignet behandelt. Sie liefert Struktur, Hausstil, Nummerierung und Ausgangsklauseln; der Legal Context, die Clause Coverage und bestätigte Specialist Outputs bestimmen, welche zwingenden oder sachlich notwendigen Anpassungen erforderlich sind.

## Voraussetzung

Vor Drafting müssen vorliegen:

- bestätigte Requirements oder ein ausreichend vollständiger `requirements-handoff`,
- Parteien/Rollen und Vertragsziel,
- wirtschaftliche Eckdaten,
- bestätigte `client-strategy.json` bzw. gewünschte Risikopositionen, soweit materiell,
- aktueller `current-law-context` und optional die Legacy-Projection `contract-legal-context.json`,
- `agreement-deal-model.json` und `agreement-clause-coverage.json`,
- für materielle Specialist Routes die benötigten Fachoutputs oder eine sichtbare Eskalation,
- bei `template-draft` die Vorlage einschließlich relevanter Anlagen.

Fehlende fachliche Entscheidungen → über `contract-workflow` zu `round-based-requirements-grilling`.

## Template Intake

Wenn eine Vorlage hochgeladen wurde:

1. Dokumentstruktur, Überschriften, Nummerierung und definierte Begriffe erfassen.
2. Platzhalter, Optionen, Kommentare und alternative Klauseln identifizieren.
3. Anlagen, Querverweise und Rangfolgen erfassen.
4. House Style und Sprachfassung beibehalten, soweit nicht ausdrücklich anders gewünscht.
5. Jede materielle Abweichung als `templateDeviation` protokollieren.
6. Widersprüchliche oder erkennbar unpassende Template-Klauseln nicht stillschweigend übernehmen.

Bei mehreren Templates nicht automatisch vermischen; zunächst Primary Template und ergänzende Klauselquellen bestimmen.

## Drafting-Reihenfolge

### 1. Deal Model

Konsumiere das kanonische `agreement-deal-model.json` statt ein zweites implizites Vertragsmodell aufzubauen. Verifiziere vor Fließtext mindestens:

- Parteien und Rollen,
- Vertragsgegenstand,
- Leistungen / Deliverables / Abhängigkeiten,
- Vergütung / Preise / Steuern / Währung,
- Termine / Abnahme / Service Levels,
- Laufzeit / Verlängerung / Kündigung / Exit,
- Haftungs- und Gewährleistungsposition,
- IP / Vertraulichkeit / Daten,
- Compliance / Audit / Unterauftragnehmer,
- Rechtswahl / Forum / Form,
- Anlagen und Rangfolge.

Widerspricht ein Drafting-Input dem Deal Model, stoppe die betroffene Klausel und kläre die Quelle des Konflikts.

### 2. Clause Coverage Gate

Nutze `agreement-clause-coverage.json`, um zu bestimmen, welche Klauselthemen für diesen konkreten Vertrag erforderlich, conditional, optional oder nicht einschlägig sind. Vermeide Boilerplate nur der Vollständigkeit halber.

### 3. Specialist Integration Gate

Vor Klauseln mit materiellem Employment-, Corporate-, IP-, Privacy-, Antitrust-, Regulatory-, Vereins-/Sport- oder anderem Spezialrechtsbezug prüfe den Specialist Route Status. Übernimm belastbare Specialist Constraints; erfinde fehlende Fachpositionen nicht.

### 4. Draft

Formuliere eindeutig, intern konsistent und operationalisierbar. Definierte Begriffe nur verwenden, wenn sie definiert sind; messbare Pflichten möglichst mit Verantwortlichem, Frist, Trigger und Rechtsfolge formulieren.

### 5. Risk Alignment

Prüfe jede materielle Risikoklausel gegen die bestätigte Nutzerposition und `client-strategy.json`. Erfinde keine aggressiven Haftungs-, Freistellungs-, Exklusivitäts- oder IP-Regelungen, wenn diese nicht aus Requirements, Client Strategy, Template, Specialist Output oder Legal Context ableitbar sind.

### 6. Placeholder Discipline

Unbekannte Fakten werden als sichtbare Platzhalter markiert, z. B. `[● Betrag]`, `[● Datum]`, `[● Gerichtsstand]`. Keine plausibel klingenden Firmendaten, Beträge, Registernummern, Fristen oder Ansprechpartner erfinden.

### 7. Cross-Clause Consistency Pass

Prüfe insbesondere:

- Definitionen und Querverweise,
- Leistung ↔ Abnahme ↔ Gewährleistung ↔ Remedies,
- Laufzeit ↔ Kündigung ↔ Exit ↔ Survival,
- Haftung ↔ Freistellung ↔ Versicherung,
- IP ↔ Vertraulichkeit ↔ Datennutzung,
- Preise ↔ Change Control ↔ Indexierung,
- Hauptvertrag ↔ Anlagen ↔ Rangfolge,
- Rechtswahl ↔ Gerichtsstand/Arbitration.

### 8. Legal/Form Final Gate

Verifiziere anhand des Legal Context:

- zwingende Klauseln bzw. unzulässige Abweichungen,
- Verbraucher-/AGB-Besonderheiten,
- Spezialrecht,
- erforderliche Form und Signatur,
- notwendige Anlagen, Belehrungen, Zustimmungen oder separate Verträge.

Dieser Drafting-Gate ersetzt nicht das matter-weite `legal-matter-final-gate` vor einer Ready-Aussage.

## Sprach- und Stilregel

Vertragssprache ist standardmäßig die Sprache der bestätigten Vorlage oder Nutzeranforderung. Juristische Präzision hat Vorrang vor unnötig komplizierter Sprache. Keine archaischen Formulierungen nur zur Erzeugung eines „juristischen Tons“.

Bei zweisprachigen Verträgen muss klar geregelt sein, welche Sprachfassung maßgeblich ist; Übersetzungen dürfen nicht stillschweigend als identisch behandelt werden.

## Ausgabe

`contract-draft.md` ist der vollständige Vertragsentwurf mit sichtbaren offenen Platzhaltern.

`contract-drafting-report.json` enthält mindestens:

- `schemaVersion`, `asOf`, `draftVersion`, `sourceTemplate`, `templateHash` soweit verfügbar,
- `legalContextVersion`, `requirementsVersion`, `clientStrategyVersion`, `dealModelVersion`,
- `specialistRefs`,
- `templateDeviations`, `insertedClauses`, `removedClauses`,
- `materialAssumptions`, `openPoints`, `formRequirements`, `counselEscalations`.

`contract-open-points.md` enthält nur Punkte, die vor Freigabe beantwortet, verhandelt oder extern geprüft werden müssen.

Auf Wunsch kann der Entwurf in ein editierbares Dokumentformat überführt werden; die kanonische inhaltliche Version und der Abweichungsreport bleiben getrennt nachvollziehbar.

## Prüfungen

Pass nur wenn Requirements und Legal Context vorliegen; eine Nutzer-Vorlage strukturell respektiert und Abweichungen protokolliert werden; keine unbekannten Fakten erfunden werden; Klauselabdeckung fallbezogen statt boilerplate-getrieben erfolgt; Cross-Clause-Konsistenz geprüft wird; Form- und Spezialrechtsfragen sichtbar sind; alle offenen Platzhalter vor „final“ aufgelistet werden.

Zusätzlich müssen Deal Model, Clause Coverage, Client Strategy und materielle Specialist Constraints nachvollziehbar in den Draft eingeflossen sein.

## Abschluss

Der Skill endet mit einem versionierten Vertragsentwurf, einem nachvollziehbaren Drafting-/Template-Delta und einer expliziten Open-Points-Liste für Verhandlung, Finalisierung oder qualifiziertes Legal Review.