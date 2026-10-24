---
name: disciplined-diagnosis
description: Diagnostiziert Softwarefehler reproduzierbar und evidenzbasiert, minimiert den Fehlerraum, prüft konkurrierende Hypothesen, implementiert den kleinsten sicheren Fix und belegt ihn mit Regressionstest sowie ursprünglicher Verifikation. Verwenden, wenn CI, Tests, Laufzeitverhalten oder Integrationen fehlschlagen und spekulative Änderungen vermieden werden sollen.
userFacing: true
implicitInvocation: true
category: engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - iterate-software-projects
outputs:
  - diagnosis-report.json
  - verified-fix-evidence.md
  - diagnosis-residual-risk-handoff.json
lastEvaluated: 2026-07-31
---

# Disciplined Diagnosis

## Trigger

Diesen Skill verwenden, wenn ein Softwarefehler, ein fehlgeschlagener Test, ein CI-Problem, ein Laufzeitfehler oder ein intermittierendes Integrationsproblem untersucht und sicher behoben werden soll.

## Voraussetzungen

Erfasse vor Änderungen mindestens:

- Repository- und Branchzustand,
- den fehlgeschlagenen Befehl oder beobachtbaren Ablauf,
- relevante Logs und Fehlermeldungen,
- Umgebung, Versionen und Konfiguration,
- jüngste Änderungen,
- bestehende Sicherheits-, Freigabe- und Migrationsgrenzen.

Sensible Daten werden aus Logs entfernt oder maskiert. Fehlende Zugänge oder nicht ausführbare Prüfungen werden ausdrücklich als unbestätigt markiert.

## Begriffe

Trenne konsequent:

- **Symptom:** beobachtete Fehlwirkung,
- **Reproduktion:** wiederholbarer Ablauf, der das Symptom auslöst,
- **Root Cause:** durch unterscheidende Evidenz bestätigte Ursache,
- **beitragende Bedingung:** verstärkender oder auslösender Kontext,
- **Fix:** kleinste Änderung, die die Ursache adressiert,
- **Verifikation:** Nachweis, dass Regressionstest und ursprünglicher Ablauf nach dem Fix bestehen.

Korrelation, zeitliche Nähe oder ein einzelner grüner Retry sind kein Root-Cause-Nachweis.

## Ablauf

### 1. Ausgangszustand sichern

Dokumentiere Commit, Branch, Arbeitsbaum, Umgebung und fehlgeschlagenen Befehl. Verändere Produktionscode erst, nachdem eine belastbare Reproduktion oder ein begründeter Ersatznachweis vorliegt.

### 2. Reproduktion herstellen und minimieren

Führe den ursprünglichen Fehler kontrolliert erneut aus. Reduziere Eingaben, Komponenten und Abhängigkeiten schrittweise, ohne das Symptom zu verlieren. Bewahre einen vollständigen Reproduktionsbefehl.

Ist der Fehler intermittierend, erfasse mehrere erfolgreiche und fehlgeschlagene Läufe mit identischen Messpunkten. Behaupte keine deterministische Reproduktion.

### 3. Hypothesen bilden und prüfen

Formuliere eine kleine priorisierte Hypothesenliste. Für jede Hypothese:

- erwartete Beobachtung,
- unterscheidende Messung,
- tatsächliches Ergebnis,
- Status `bestätigt`, `widerlegt` oder `offen`.

Instrumentierung muss gezielt, reversibel und frei von Zugangsdaten oder personenbezogenen Inhalten sein.

### 4. Ursache und Bedingungen abgrenzen

Erkläre, welche Evidenz die Root Cause von konkurrierenden Hypothesen unterscheidet. Bleibt die Ursache offen, benenne nur die bestätigten beitragenden Bedingungen und kennzeichne die Unsicherheit.

### 5. Kleinsten sicheren Fix wählen

Ändere nur den engsten betroffenen Pfad. Vermeide:

- breite Dependency-Upgrades,
- fachfremde Refactorings,
- deaktivierte Tests oder Sicherheitsprüfungen,
- TLS-, Proxy- oder Branch-Protection-Umgehungen,
- Blind-Retries bis zu einem zufälligen grünen Lauf.

Dokumentiere Rollback und mögliche Nebenwirkungen.

### 6. Regression und Originalverifikation

Erzeuge einen Regressionstest oder gleichwertigen wiederholbaren Nachweis, der vor dem Fix fehlschlägt und danach besteht, soweit technisch möglich. Führe zusätzlich den ursprünglichen fehlgeschlagenen Befehl oder Ablauf erneut aus.

Bei intermittierenden Fehlern vergleiche eine angemessene Zahl von Vorher-/Nachher-Läufen und berichte Restunsicherheit statt absolute Heilung zu behaupten.

## Prüfungen

Vor Abschluss müssen belegt sein:

- Reproduktion oder ausdrücklich begründeter Ersatznachweis,
- minimierter Fehlerraum,
- Hypothesen mit unterscheidender Evidenz,
- Root-Cause-Behauptung nur bei ausreichendem Nachweis,
- kleinster sicherer Fix,
- Regressionstest oder gleichwertige Verifikation,
- ursprünglicher Ablauf nach dem Fix,
- verbleibendes Risiko und Rollback.

## Fehlerbehandlung

Wenn die Umgebung den Fehler nicht reproduzieren kann:

1. keine vollständige Ursache behaupten,
2. fehlende Evidenz benennen,
3. gezielte Telemetrie oder einen reproduzierbaren Diagnoseauftrag vorbereiten,
4. nur reversible, evidenzbasierte Mitigationen umsetzen,
5. die externe Verifikation bei asynchronem CI oder Dienststatus mit `deferred-external-action-verification` fortsetzen.

## Übergabe

Erzeuge maschinenlesbar:

```json
{
  "symptom": "...",
  "reproduction": {"command": "...", "reliability": "deterministic|intermittent|unconfirmed"},
  "hypotheses": [
    {"id": "H1", "status": "confirmed|rejected|open", "evidence": ["..."]}
  ],
  "rootCause": {"status": "verified|unverified", "statement": "..."},
  "fix": {"scope": "...", "rollback": "..."},
  "verification": {"regression": "...", "originalCommand": "..."},
  "residualRisks": ["..."],
  "nextSkill": "iterate-software-projects|implement-from-issue"
}
```

Übergib bestätigte Fixes an `iterate-software-projects` für die nächste Iteration oder an `implement-from-issue`, sobald dieser Skill verfügbar ist.

## Abschlusskriterien

Abgeschlossen ist die Diagnose, wenn Symptom und Reproduktion dokumentiert, Hypothesen evidenzbasiert bewertet, die Ursache korrekt als verifiziert oder unbestätigt markiert, der kleinste sichere Fix geprüft und Regression, ursprünglicher Ablauf, Restrisiko sowie Rollback berichtet sind.
