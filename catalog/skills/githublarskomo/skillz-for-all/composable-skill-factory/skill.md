---
name: composable-skill-factory
description: Entwirft, prüft und veröffentlicht kleine, komponierbare Agent-Skills mit progressiver Offenlegung, deterministischen Hilfswerkzeugen, klaren Triggern und überprüfbaren Abschlusskriterien. Verwenden, wenn aus einem wiederholbaren Workflow ein neuer Skill werden soll oder ein bestehender Skill zu groß, unklar, fragil oder schwer kombinierbar ist.
userFacing: true
implicitInvocation: false
category: skill-system
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires: []
outputs:
  - skills/<skill-name>/SKILL.md
  - evaluation evidence
  - pull request
lastEvaluated: 2026-07-31
---

# Composable Skill Factory

Erzeuge Skills als kleine, klar begrenzte Werkzeuge. Ein Skill soll eine wiederkehrende Fähigkeit zuverlässig ausführen, nicht einen vollständigen Produktprozess monopolisieren.

## Leitprinzipien

- **Klein und komponierbar:** Ein Skill besitzt eine primäre Aufgabe und kann andere Skills aufrufen oder Ergebnisse an sie übergeben.
- **Anleitung für Entscheidungen, Code für Determinismus:** Nutze `SKILL.md` für Urteilsregeln und Workflows; nutze Skripte für reproduzierbare Transformationen, Validierungen und Dateiarbeit.
- **Progressive Offenlegung:** Die `description` entscheidet über das Laden. `SKILL.md` enthält den ausführbaren Kern. Umfangreiche Erläuterungen, Beispiele und Datenformate liegen in `references/`.
- **Repo-Kontext statt Annahmen:** Projektabhängige Pfade, Tracker, Labels, Dokumentationsorte und Befehle werden aus einer lokalen Konfiguration gelesen oder vor Verwendung ermittelt.
- **Nachweis statt Behauptung:** Ein Skill ist erst fertig, wenn sein Ergebnis geprüft wurde.
- **Portabel und lizenzsauber:** Produkt-, Anbieter- und Agent-spezifische Details bleiben Adapter oder Beispiele. Fremde Inhalte werden nur mit geklärter Lizenz übernommen.

## Wann ein Skill gerechtfertigt ist

Lege einen neuen Skill nur an, wenn alle folgenden Aussagen zutreffen:

1. Der Ablauf wird voraussichtlich wiederholt.
2. Sein Trigger lässt sich in einem präzisen Satz beschreiben.
3. Er besitzt ein eindeutiges Ergebnis oder einen klaren Zustandsübergang.
4. Die Qualitätsprüfung kann explizit beschrieben werden.
5. Der Ablauf ist nicht bloß eine projektspezifische Checkliste.
6. Es existiert kein vorhandener Skill, der durch eine kleine Erweiterung dasselbe Ziel besser erfüllt.

Wenn mehrere unabhängige Ergebnisse entstehen, zerlege den Kandidaten in mehrere Skills und definiere ihre Übergaben.

## Zielstruktur

```text
skills/<skill-name>/
  SKILL.md                 # Trigger, Grenzen, Kernworkflow, Abschluss
  references/              # ausführliche Regeln, Formate, Beispiele
  scripts/                 # deterministische Hilfsprogramme
  assets/                  # Vorlagen oder statische Ressourcen
  tests/                   # Fixtures und ausführbare Prüfungen, falls sinnvoll
```

Erzeuge nur Verzeichnisse, die tatsächlich Inhalte besitzen.

## Entwurfsprozess

### 1. Workflow beobachten

Rekonstruiere den tatsächlich verwendeten Ablauf:

- Auslöser und Nutzerziel,
- notwendiger Kontext,
- Entscheidungen und Verzweigungen,
- eingesetzte Werkzeuge,
- erzeugte Artefakte oder Zustandsänderungen,
- Fehlerbilder und Wiederanlauf,
- Nachweise für Erfolg.

Unterscheide zwischen bewährtem Verhalten und noch ungetesteten Vorschlägen.

### 2. Skill-Grenze schneiden

Formuliere genau einen Satz:

> Dieser Skill verwandelt **Eingang/Zustand A** unter **Bedingungen B** in **Ergebnis/Zustand C** und endet nach **Prüfung D**.

Kann dieser Satz nicht ohne „und außerdem“ formuliert werden, ist der Skill wahrscheinlich zu breit.

Definiere anschließend:

- was der Skill ausdrücklich nicht übernimmt,
- welche anderen Skills vor- oder nachgelagert sind,
- welches Übergabeformat verwendet wird.

### 3. Beschreibung als Router schreiben

Die YAML-`description` ist der wichtigste Routing-Text. Sie muss enthalten:

- die Fähigkeit,
- konkrete Trigger oder typische Nutzerformulierungen,
- eine Abgrenzung zu nahen Skills, sofern Verwechslung wahrscheinlich ist.

Vermeide allgemeine Beschreibungen wie „hilft bei Projekten“ oder „macht Entwicklung besser“.

### 4. Kernworkflow schreiben

`SKILL.md` enthält nur Informationen, die während fast jeder Ausführung benötigt werden:

1. Zweck und Grenzen,
2. Voraussetzungen,
3. geordneter Ablauf,
4. Entscheidungspunkte,
5. Sicherheits- und Qualitätsregeln,
6. Fehlerbehandlung und Wiederaufnahme,
7. überprüfbare Abschlusskriterien.

Lagere selten benötigte Details in `references/` aus und verlinke sie an der Stelle, an der sie gebraucht werden.

### 5. Deterministische Teile extrahieren

Erzeuge ein Skript, wenn eine Operation:

- bei gleicher Eingabe dasselbe Ergebnis liefern soll,
- Formatierung, Hashing, Validierung, Parsing oder Dateierzeugung betrifft,
- durch freie Textausführung unnötig fehleranfällig wäre,
- mit Fixtures automatisch getestet werden kann.

Skripte müssen:

- sichere Standardwerte verwenden,
- verständliche Fehlercodes und Meldungen liefern,
- keine Secrets protokollieren,
- destruktive Aktionen standardmäßig verweigern,
- `--help` oder eine dokumentierte Aufrufsform besitzen.

### 6. Komposition definieren

Dokumentiere für jede Übergabe:

- Eingangsformat,
- Ausgangsformat,
- Vorbedingungen,
- Eigentümer des nächsten Schritts,
- Verhalten bei Teilresultaten.

Bevorzuge stabile Markdown-, JSON- oder Repository-Artefakte gegenüber implizitem Gesprächszustand.

Ein Orchestrator darf Fach-Skills koordinieren, aber deren Fachlogik nicht duplizieren.

### 7. Evaluation entwerfen

Prüfe mindestens drei Fälle:

- **Happy Path:** typischer vollständiger Ablauf,
- **Grenzfall:** unvollständige, widersprüchliche oder ungewöhnliche Eingabe,
- **Fehlerfall:** fehlende Berechtigung, Tool-Ausfall oder nicht verifizierbares Ergebnis.

Bewerte:

- Wurde der Skill beim richtigen Trigger gewählt?
- Wurde er bei einem ähnlichen, aber unpassenden Trigger nicht gewählt?
- Ist das Ergebnis reproduzierbar und überprüfbar?
- Bleiben Sicherheitsgrenzen erhalten?
- Kann ein anderer Skill das Ergebnis ohne mündliche Zusatzinformation übernehmen?

### 8. Veröffentlichen

Vor dem Commit:

1. YAML-Frontmatter und Namen validieren.
2. Links und referenzierte Pfade prüfen.
3. Secret-, PII- und Lizenzprüfung durchführen.
4. README-Katalog ergänzen.
5. Änderungen in einem fokussierten Branch veröffentlichen.
6. Diff und erzeugte Dateien erneut lesen.
7. Einen Pull Request mit Zweck, Testnachweisen und offenen Grenzen erstellen.

## Überarbeitung bestehender Skills

Teile einen Skill auf, wenn mindestens eines zutrifft:

- mehrere unabhängige Trigger,
- mehrere Ergebnisse mit getrennten Abschlusskriterien,
- häufiges Laden großer Abschnitte, die selten benötigt werden,
- umfangreiche projektspezifische Sonderfälle,
- wiederholte Duplikation von Logik anderer Skills,
- deterministische Aufgaben werden nur als natürliche Sprache beschrieben.

Bewahre bei einer Aufteilung die bisherigen Trigger durch einen kleinen Migrations- oder Orchestrator-Skill, wenn bestehende Workflows sonst brechen würden.

## Sicherheits- und Lizenzprüfung

Veröffentliche nicht:

- Tokens, Passwörter, private Schlüssel oder reale Zugangslinks,
- personenbezogene oder vertrauliche Projektinhalte,
- destructive Befehle ohne Bestätigung und Schutzbedingungen,
- fremde Skill-Texte ohne kompatible Lizenz und Herkunftsnachweis,
- agentenspezifische Metadaten als kanonische Quelle, wenn ein portabler Standard möglich ist.

Übernimm aus fremden Repositories bevorzugt Prinzipien und eigene Formulierungen. Halte direkte Ableitungen und Lizenzen nachvollziehbar fest.

## Abschluss

Die Aufgabe ist abgeschlossen, wenn:

- Skill-Grenze, Trigger und Nicht-Ziele eindeutig sind,
- Anleitung und deterministische Werkzeuge sinnvoll getrennt sind,
- Übergaben zu anderen Skills dokumentiert sind,
- Happy Path, Grenzfall und Fehlerfall geprüft wurden,
- README und portable Ressourcen aktualisiert sind,
- Sicherheits- und Lizenzprüfung bestanden sind,
- Branch oder Pull Request mit verifizierbarem Änderungsstand existiert.
