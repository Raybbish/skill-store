---
name: contract-workflow
description: Orchestriert private und berufliche Vertragsarbeit als kompatiblen user-facing Einstieg von Requirements-Grilling und Rechtsgrundlagenprüfung über Deal-Modell, Review oder Drafting, Risiko, Verhandlung/Redlines bis Final-Check und anwaltlicher Eskalation. Verwenden, wenn ein Vertrag geprüft, erstellt, aus einer Vorlage erzeugt oder als Vertragsprozess strukturiert werden soll.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - round-based-requirements-grilling
  - contract-matter-workflow
  - contract-legal-context
  - project-second-brain
outputs:
  - contract-case.json
  - contract-plan.md
  - contract-handoff.json
lastEvaluated: 2026-08-28
---

# Contract Workflow

## Zweck und Grenze

Dieser Skill ist der user-facing Einstiegspunkt für **private und berufliche Verträge**. Er koordiniert fachliche Klärung, aktuelle Rechtsgrundlagen, Dokumentprüfung oder Drafting und den nachgelagerten Abschlussprozess, ohne die juristische Fachlogik der Specialist Skills zu duplizieren.

Deutschland ist der Default-Kontext, **nicht automatisch das anwendbare Recht**. Internationale Parteien, Leistungsorte, Verbraucherbezug, Arbeitsverhältnisse, Immobilien, IP-/Lizenzthemen, Datenschutz, regulierte Branchen oder eine Rechtswahlklausel können andere oder zusätzliche Rechtsgrundlagen auslösen.

Der Skill ersetzt keine verbindliche anwaltliche Einzelfallberatung und darf insbesondere bei materiellen Haftungs-, Arbeits-, Gesellschafts-, Immobilien-, Finanzierungs-, IP-, Kartell-, Datenschutz- oder ausländischen Rechtsfragen keine nicht verifizierte Rechtssicherheit behaupten.

## Kompatibilitätsrolle

`contract-matter-workflow` ist ab Version 0.2 die kanonische Vertrags-State-Machine. Dieser Skill behält bewusst die etablierten Nutzertrigger und Legacy-Outputs und projiziert den kanonischen Matter State auf:

- `contract-case.json`,
- `contract-plan.md`,
- `contract-handoff.json`.

Bestehende Aufrufer brechen dadurch nicht. Neue Fachlogik wird im kanonischen Matter-Workflow oder in Specialists ergänzt, nicht im Compatibility Layer dupliziert.

## Trigger

Typische Trigger:

- „Prüfe diesen Vertrag.“
- „Bewerte die Risiken in diesem NDA / Kaufvertrag / Dienstleistungsvertrag / Arbeitsvertrag.“
- „Erstelle mir einen Vertrag.“
- „Nutze diese Vertragsvorlage und passe sie an meinen Fall an.“
- „Welche Punkte muss ich vor Unterschrift noch klären?“
- „Erzeuge aus dem Grilling einen Vertragsentwurf.“

## Eingang

Mindestens eines der folgenden Elemente ist vorhanden oder wird durch Grilling erhoben:

- Vertragsziel und gewünschtes Ergebnis,
- Parteien und Rollen,
- privater oder beruflicher Kontext,
- vorhandener Vertrag / Vertragsset als Datei oder Text,
- Vorlage / Muster als Datei oder Text,
- bestehende Verhandlungspositionen,
- relevante Länder, Leistungsorte und Rechtswahl,
- materielle wirtschaftliche oder operative Anforderungen.

Originaldokumente werden nicht stillschweigend überschrieben. Bei mehreren Dateien wird zunächst ein `documentSet` mit Hauptvertrag, Anlagen, AGB, SOW, DPA, Preislisten und sonstigen referenzierten Dokumenten aufgebaut.

## Ablauf

### 1. Intent Gate

Bestimme `mode` als:

- `review` – vorhandenen Vertrag bewerten,
- `draft` – neuen Vertrag erzeugen,
- `template-draft` – vorhandene Vorlage parametrisieren und anpassen,
- `revise` – bereits bewerteten oder erzeugten Entwurf überarbeiten,
- `redline` – neue Gegenfassung gegen den letzten verifizierten Stand prüfen,
- `negotiate` – materielle Positionen und Trades steuern,
- `final-check` – Final Gate ohne neue Fachentscheidungen.

### 2. Requirement Sufficiency Gate

Prüfe, ob Ziel, Rollen, Muss-Punkte, wirtschaftliche Eckdaten, gewünschte Risikoposition, Laufzeit/Exit und wesentliche operative Randbedingungen ausreichend klar sind.

Fehlende **fachliche Entscheidungen** → `round-based-requirements-grilling`.

Vertragsspezifische Grilling-Themen umfassen mindestens: Zweck, Parteien/Rollen, Leistung/Gegenleistung, Termine, Abnahme, Vergütung, Laufzeit/Kündigung, Haftungsziel, Vertraulichkeit, IP/Nutzungsrechte, Daten, Unterauftragnehmer, Change Control, Versicherungen/Sicherheiten, Streitbeilegung, Rechtswahl/Gerichtsstand und gewünschte Verhandlungsposition. Nicht einschlägige Themen werden übersprungen.

### 3. Legal Context Gate

→ `contract-legal-context` als vertragsbezogene Compatibility-Projection des allgemeinen `current-law-context`.

Kein Review und kein Drafting darf eine materielle Rechtsaussage nur aus einem vermuteten „deutschen Standardvertrag“ ableiten. Der Legal-Context-Handoff muss anwendbares bzw. potenziell anwendbares Recht, Vertragsart, Parteirollen, zwingende Normen, Formanforderungen, Spezialrecht, internationale Konfliktregeln und offene Rechtsfragen ausweisen.

Danach erzeugt `agreement-type-analysis` im `contract-matter-workflow` das funktionale Deal Model, Clause Coverage und die erforderlichen Specialist Routes.

### 4A. Review Path

Bei `review` → über `contract-matter-workflow` zu `contract-review`.

Danach werden Findings in drei Arbeitsklassen überführt:

- `must-fix` – rechtlich, wirtschaftlich oder operativ nicht akzeptabel bzw. wesentlich ungeklärt,
- `negotiate` – materielle, aber verhandelbare Risikoverteilung,
- `accept-or-monitor` – vertretbar, sofern die dokumentierten Annahmen stimmen.

### 4B. Drafting Path

Bei `draft` oder `template-draft` → über `contract-matter-workflow` zu `contract-drafting`.

Eine vom Nutzer gelieferte Vorlage hat strukturell Vorrang, sofern sie nicht gegen bestätigte Requirements, zwingendes Recht oder ausdrückliche Nutzerentscheidungen verstößt. Abweichungen von der Vorlage werden transparent protokolliert.

### 5. Negotiation / Revision Loop

Für jede materielle Klausel werden `ideal`, Zielposition, akzeptabler Fallback, rote Linie, Concession Value und Begründung über `legal-negotiation-strategy` festgehalten. Gegenangebote oder Redlines werden mit `legal-redline-review-loop` als Delta zum letzten verifizierten Stand bewertet; bereits geklärte Punkte werden nicht erneut geöffnet, sofern neue Informationen sie nicht verändern. Regressions werden ausdrücklich wieder geöffnet.

### 6. Final Contract Gate

Vor Freigabe prüfen:

- Parteien, Vertretungsmacht und Bezeichnungen,
- Definitionen, Querverweise, Anlagen und Rangfolge,
- Leistung, Preise, Steuern und Zahlungsmechanik,
- Laufzeit, Verlängerung, Kündigung und Exit,
- Haftung, Freistellung, Gewährleistung und Versicherungen,
- IP, Vertraulichkeit, Datenschutz und Unterauftragnehmer,
- Rechtswahl, Gerichtsstand/Schiedsverfahren,
- Form- und Unterschriftserfordernisse,
- offene Platzhalter und widersprüchliche Klauseln,
- erforderliche Zustimmungen, Anlagen oder externe Reviews.

Zusätzlich muss der kanonische Matter State das `legal-matter-final-gate` bestehen, bevor `ready` oder `ready-with-accepted-risk` ausgegeben wird.

### 7. Escalation Gate

`qualified-counsel-review-required` ist auszugeben, wenn eine verlässliche Bewertung ohne qualifizierte Rechtsberatung nicht vertretbar ist. Typische Auslöser:

- ungeklärtes oder fremdes anwendbares Recht,
- hohe oder atypische Haftung / Freistellung,
- Kündigung oder Gestaltung von Arbeitsverhältnissen,
- Gesellschafts-, M&A-, Beteiligungs- oder Finanzierungsverträge,
- Grundstücks-/Immobiliengeschäfte oder notarielle Form,
- wesentliche IP-Lizenzen, Exklusivität oder Kartellrisiken,
- regulatorisch kritische Qualitäts-/Compliance-Verträge,
- komplexe Datenschutz- oder internationale Datentransfers,
- erhebliche wirtschaftliche Bedeutung bei unsicherer Rechtsprechung.

## Outputs

`contract-case.json`, `contract-plan.md` und `contract-handoff.json` bleiben kompatible Views auf `contract-matter-status.json`, `contract-matter-plan.md` und `contract-matter-handoff.json`.

Der Legacy-Handoff enthält weiterhin Dokumentversionen/Hashes, Legal-Context-Version, Entscheidungen, offene Punkte und Risikoflags. Kanonischer Prozesszustand, Issue-Lineage und Negotiation State liegen im neuen Contract-Matter-Stack.

## Prüfungen

Pass nur wenn:

- fehlende fachliche Entscheidungen zu Grilling geroutet werden,
- Rechtsgrundlagen vor Review/Drafting geprüft werden,
- hochgeladene Originale unverändert bleiben,
- Review und Drafting nicht vermischt werden,
- Versionen und offene Punkte nachvollziehbar bleiben,
- ausländisches oder Spezialrecht nicht aus deutschem Allgemeinwissen erfunden wird,
- ein Final-Gate vor „unterschriftsreif“ erfolgt,
- notwendige anwaltliche Eskalation sichtbar bleibt.

## Abschluss

Der Skill ist abgeschlossen, wenn der Vertragsfall entweder mit nachvollziehbarer Bewertung bzw. Entwurf, dokumentierten Entscheidungen und Final-Status bereitsteht oder mit konkret begründeter Eskalation an qualifizierte Rechtsberatung übergeben wurde.