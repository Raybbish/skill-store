---
name: architecture-deepening-review
description: Prüft bestehende Softwarearchitekturen evidenzbasiert auf flache Modulgrenzen, unbeabsichtigte Kopplung, duplizierte Domänenregeln und Infrastrukturleckage und empfiehlt höchstens einen kleinen, hochwirksamen Vertiefungsschritt. Verwenden, wenn Architekturqualität verbessert werden soll, ohne einen spekulativen Rewrite oder stilgetriebene Schichten einzuführen.
userFacing: true
implicitInvocation: true
category: engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - disciplined-diagnosis
  - iterate-software-projects
outputs:
  - architecture-review.json
  - architecture-review.md
  - next-step-handoff.json
lastEvaluated: 2026-08-01
---

# Architecture Deepening Review

## Trigger

Diesen Skill verwenden, wenn ein bestehendes Repository auf belastbare Architekturprobleme geprüft und ein begrenzter Vertiefungsschritt abgeleitet werden soll.

## Voraussetzungen

Erfasse Repository- und Branchzustand, relevante Module und Abhängigkeiten, Domänenbegriffe und Invarianten, jüngste Änderungen, bekannte Architekturentscheidungen sowie Sicherheits-, Migrations-, Kompatibilitäts- und Liefergrenzen.

## Ablauf

### 1. Beobachtungen sammeln

Untersuche konkrete Abhängigkeitskanten, Änderungsverläufe, duplizierte Regeln, direkte Infrastrukturzugriffe und wiederkehrende Fehler. Ordnernamen oder Dateilayout allein sind keine ausreichende Evidenz.

### 2. Befunde trennen

Trenne beobachtete Symptome, überprüfbare Evidenz, Architekturhypothesen, bestätigte Befunde und offene Unsicherheit. Ein Befund ist nur bestätigt, wenn die Evidenz ihn von plausiblen Alternativerklärungen unterscheidet.

### 3. Grenzen bewerten

Prüfe insbesondere überladene Application Services, domänenfremde Abhängigkeiten, duplizierte Invarianten, instabile Schnittstellen, zyklische oder breit gestreute Kopplung und Infrastrukturleckage in Domänenlogik. Kleine, bewusst einfache Systeme dürfen flach bleiben, wenn tiefere Schichten keinen belegten Nutzen bringen.

### 4. Einen Vertiefungsschritt wählen

Empfehle höchstens einen ausführbaren Schritt mit erwarteter Wirkung, enger Änderungsspanne, betroffenen Invarianten, Risiken, Rollback und Abnahmeevidenz. Bevorzuge eine begrenzte Extraktion oder Schnittstellenstabilisierung vor Frameworkwechseln oder Repository-Rewrites.

### 5. Verifizieren

Prüfe, ob die Empfehlung Verhalten, Kompatibilität, Migrationen, Sicherheit und Lieferfähigkeit bewahrt. Markiere alle nicht verifizierten Annahmen ausdrücklich.

## Prüfungen

Vor Abschluss müssen Evidenz und Hypothesen getrennt, Alternativerklärungen bewertet, höchstens ein nächster Schritt ausführbar markiert und Nutzen, Scope, Risiko, Rollback sowie Verifikation dokumentiert sein.

## Fehlerbehandlung

Lehne Reviews ab, die allein aus Dateilayout, persönlichem Architekturstil oder Frameworkpräferenz einen Rewrite ableiten. Bei fehlender Evidenz dokumentiere die Beobachtung und empfehle keine Strukturänderung.

## Übergabe

```json
{
  "repositoryState": {"branch": "...", "commit": "..."},
  "observations": [{"id": "O1", "evidence": ["..."]}],
  "hypotheses": [{"id": "H1", "status": "confirmed|rejected|open", "evidence": ["..."]}],
  "findings": [{"id": "F1", "status": "verified|unverified", "impact": "..."}],
  "recommendation": {
    "executable": true,
    "scope": ["..."],
    "expectedBenefit": "...",
    "risks": ["..."],
    "rollback": "...",
    "verification": ["..."]
  },
  "nextSkill": "spec-to-vertical-issues|test-driven-vertical-slice|disciplined-diagnosis|iterate-software-projects"
}
```

## Abschlusskriterien

Der Review ist abgeschlossen, wenn die Architekturbeurteilung auf konkreter Evidenz beruht, keine unbelegten Domänengrenzen behauptet werden und höchstens ein kleiner, überprüfbarer Vertiefungsschritt empfohlen wird.
