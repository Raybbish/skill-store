---
name: central-skill-repository-curation
description: Konsolidiert wiederverwendbare Arbeitsabläufe als persönliche Skills, pflegt deren portable Fassungen im zentralen Repository White Label Maintainer/skillz und synchronisiert beide Bestände sicher. Verwenden, wenn der Nutzer Skills lernen, zentral speichern, installieren, inventarisieren, abgleichen oder ausdrücklich in beide Richtungen synchronisieren lassen möchte.
userFacing: true
implicitInvocation: false
category: skill-system
version: 1.0.0
status: stable
owners:
  - White Label Maintainer
requires:
  - composable-skill-factory
outputs:
  - updated skill repository
  - synchronization manifest
lastEvaluated: 2026-07-31
---

# Zentrale Skill-Pflege

Pflege `White Label Maintainer/skillz` als portablen, versionierten Katalog der persönlichen Skills des Nutzers. Behandle installierte persönliche Skills als zweite Projektion desselben Bestands.

## Grenzen

- Synchronisiere nur persönliche Skills des Nutzers.
- Kopiere keine System-, OpenAI- oder Plugin-Skills.
- Veröffentliche keinen fremden Code ohne geklärte Lizenz.
- Speichere keine Tokens, Schlüssel, Zugangsdaten, personenbezogenen Daten oder vertraulichen Projektinhalte.
- Führe keine Löschung, Deinstallation oder Umbenennung automatisch auf der anderen Seite aus.
- Ändere diesen Skill oder andere Skills nur bei ausdrücklichem Auftrag.

## Identität und Struktur

Ordne Skills ausschließlich über `name` im YAML-Frontmatter zu. Interne Installations-IDs sind keine fachlichen Namen.

Verwende im zentralen Repository:

```text
skills/
  <skill-name>/
    SKILL.md
    references/
    scripts/
    assets/
```

Synchronisiere nur vorhandene portable Ressourcen. Erzeuge keine leeren Verzeichnisse.

Behandle produktseitig generierte Dateien wie `agents/openai.yaml` als lokale UI-Metadaten. Erzeuge sie bei der Installation passend, aber verwende sie nicht als kanonischen portablen Inhalt.

## Skill-Kandidaten konsolidieren

Prüfe vor dem Anlegen eines Skills:

1. Ist der Ablauf wiederholbar?
2. Ist er außerhalb eines einzelnen Vorfalls nützlich?
3. Besitzt er klare Trigger und Abschlusskriterien?
4. Existiert bereits ein Skill mit demselben Ziel?
5. Ist der Ablauf praktisch erprobt oder belastbar begründet?

Aktualisiere bei Überschneidung bevorzugt den vorhandenen Skill. Übernimm aus Projektkontexten nur allgemein gültige Regeln; kennzeichne projektspezifische Angaben als Beispiele.

## Bidirektional synchronisieren

### 1. Inventarisieren

Lies auf beiden Seiten:

- Skill-Name und Beschreibung,
- alle portablen Dateien,
- SHA-256-Hash jeder Datei nach Normalisierung auf UTF-8, LF-Zeilenenden und genau einen abschließenden Zeilenumbruch,
- letzten gemeinsamen Stand aus `.skill-sync.json`, sofern vorhanden.

Prüfe Repository und Schreibberechtigung mit einer harmlosen Leseoperation, bevor externe Änderungen beginnen.

### 2. Klassifizieren

Ordne jeden Skill einem Zustand zu:

| Zustand | Aktion |
|---|---|
| nur zentral vorhanden | lokal installieren und validieren |
| nur lokal vorhanden | nach Sicherheitsprüfung zentral veröffentlichen und katalogisieren |
| auf beiden Seiten identisch | nichts ändern |
| nur eine Seite seit dem gemeinsamen Stand geändert | neuere Änderung auf die andere Seite übertragen |
| beide Seiten geändert | nicht überschreiben; Diff und Entscheidung anfordern |
| gemeinsamer Stand unbekannt und Inhalte verschieden | als Konflikt behandeln |

Die bloße Abwesenheit eines Skills ist kein Löschauftrag.

### 3. Zentral veröffentlichen

Speichere portable Dateien unter `skills/<name>/`. Aktualisiere den README-Katalog mit Link, Zweck und Herkunft. Verwende einen logisch zusammenhängenden Commit und verifiziere anschließend die veröffentlichten Pfade und Inhalte.

### 4. Lokal installieren

Prüfe Inhalt, Trigger und Sicherheitsgrenzen. Erzeuge passende UI-Metadaten, validiere den Skill im persönlichen Skill-Verzeichnis und speichere jeden importierten Skill einzeln. Behaupte die Installation erst nach erfolgreicher Verifikation.

### 5. Manifest aktualisieren

Schreibe `.skill-sync.json` erst nach erfolgreichem Abgleich beider Seiten. Speichere darin nur:

- Schema-Version,
- Synchronisationszeitpunkt,
- Skill-Namen,
- portable Pfade,
- SHA-256-Hashes.

Speichere keine Inhalte, Zugangsdaten oder internen Installations-IDs im Manifest.

## Konflikte behandeln

Bei abweichenden Fassungen:

1. gemeinsamen Stand bestimmen,
2. beide Diffs getrennt auswerten,
3. widerspruchsfreie Ergänzungen zusammenführen,
4. fachliche oder sicherheitsrelevante Konflikte sichtbar machen,
5. vor dem Überschreiben eine Entscheidung des Nutzers einholen,
6. danach erneut validieren und beide Seiten verifizieren.

Bevorzuge niemals allein aufgrund eines jüngeren Zeitstempels eine fachlich schlechtere Fassung.

## Sicherheitsprüfung

Suche vor jeder Veröffentlichung mindestens nach:

- Token-, Passwort- und Secret-Mustern,
- privaten Schlüsseln und Zertifikaten,
- realen lokalen Zugangspfaden,
- personenbezogenen oder vertraulichen Angaben,
- destruktiven Befehlen ohne Schutzbedingungen,
- fremden Inhalten ohne erkennbare Wiederverwendungsrechte.

Stoppe bei einem Treffer und kläre oder bereinige ihn.

## Abschluss

Der Abgleich ist abgeschlossen, wenn:

- alle persönlichen Skills klassifiziert wurden,
- konfliktfreie Änderungen auf beiden Seiten vorhanden sind,
- importierte Skills gültig und installiert sind,
- README und Manifest den verifizierten Bestand abbilden,
- keine nicht autorisierte Löschung erfolgte,
- verbleibende Konflikte mit einem konkreten nächsten Schritt berichtet sind.
