---
name: conversation-to-spec
description: Verdichtet bestätigten Gesprächs-, Grilling-, Wayfinding- und Repository-Kontext zu einer umsetzbaren, prüfbaren Spezifikation, ohne bereits beantwortete Fragen erneut zu stellen. Verwenden, wenn aus ausreichend geklärten Entscheidungen und technischer Evidenz eine normative SPEC.md und eine belastbare Übergabe an Engineering entstehen soll.
userFacing: true
implicitInvocation: true
category: engineering
version: 0.3.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - project-second-brain
outputs:
  - SPEC.md
  - decision register
  - consistency report
lastEvaluated: 2026-09-02
---

# Conversation to Spec

Erzeuge aus bestätigtem Kontext eine vollständige normative Spezifikation. Dieser Skill führt kein neues Requirements-Interview und keine breite technische Exploration durch, solange vorhandene Quellen die Entscheidungen und technische Tragfähigkeit bereits tragen.

## Routing und Abgrenzung

`conversation-to-spec` besitzt innerhalb der Kette aus Grilling, Wayfinder und Issue-Zerlegung die Verantwortung für die **normative `SPEC.md`**. Seine Kernfrage lautet: **Was ist auf Basis der bestätigten Entscheidungen und belastbaren Evidenz verbindlich umzusetzen?**

Eintritt ist zulässig, wenn fachliche Entscheidungen ausreichend geklärt und technische Grundlagen ausreichend verstanden sind, um Anforderungen, Invarianten, Schnittstellen, Risiken und Akzeptanzkriterien ohne Spekulation festzuschreiben.

Bei Lücken gilt:

- Fehlende fachliche Präferenz-, Scope- oder Produktentscheidung → an `round-based-requirements-grilling` routen.
- Fehlende technische Evidenz, unbekannte Abhängigkeit, Migrations- oder Architekturtragfähigkeit → an `large-work-wayfinder` routen.
- Reversible, risikoarme Detailwahl hinter stabiler Schnittstelle → als explizite Annahme dokumentieren und SPEC fortführen.
- Eine freigegebene und konsistente SPEC → an `spec-to-vertical-issues` übergeben.

Dieser Skill erzeugt **keinen ausführbaren Issue-Backlog**. Eine grobe Umsetzungsreihenfolge in der SPEC beschreibt nur Sequenzierungsprinzipien, Abhängigkeiten und Release-Gates; die konkrete Zerlegung in vertikale Issues gehört ausschließlich zu `spec-to-vertical-issues`.

Wenn Wayfinder-Evidenz eine bereits normative Architektur-, Sicherheits-, Daten- oder Migrationsannahme verändert, muss `conversation-to-spec` die betroffene SPEC aktualisieren und die erneute Freigabe herstellen, bevor Issue-Zerlegung oder Implementierung fortgesetzt werden.

## Eingaben

Nutze in dieser Reihenfolge:

1. vorhandenes `docs/project-memory/state.json` und den letzten relevanten Project-Memory-Event, sofern der Projekt-Memory-Root bereits initialisiert ist,
2. ausdrücklich bestätigte Nutzerentscheidungen, freigegebene Grilling-Reports und `requirements-handoff.json`,
3. Wayfinder-Evidenz wie `wayfinding-brief.md`, `investigation-backlog.json` und `dependency-graph.json`,
4. vorhandene `SPEC.md`, `README.md`, Architektur- und Agent-Dokumente,
5. ADRs, Aufgabenlisten, Issues und bestehende Implementierung,
6. begründete Annahmen nur für nicht entscheidungskritische Lücken.

Kennzeichne Widersprüche und Unsicherheiten. Überschreibe keine bestätigte Festlegung durch eine spätere bloße Vermutung. Der Project-Memory-State ist eine Navigations- und Kontinuitätsprojektion; die verlinkten kanonischen Artefakte bleiben die fachliche Quelle.

## Kernregeln

- Stelle keine Frage erneut, deren Antwort in den Quellen eindeutig vorliegt.
- Trenne Anforderungen, Entscheidungen, Annahmen und offene Punkte.
- Formuliere beobachtbares Verhalten und prüfbare Akzeptanzkriterien.
- Bewahre Domänensprache, Invarianten und Architekturgrenzen des Ziel-Repositories.
- Erfinde keine APIs, Rollen, Datenfelder oder Betriebszusagen ohne fachliche Grundlage.
- Halte das MVP ohne unvalidierte KI sicher nutzbar; dokumentiere KI-/ML-Vorbereitung separat.
- Verweise auf ADR-pflichtige Entscheidungen, statt sie unbemerkt in der Spezifikation zu treffen.
- Route echte fachliche Unsicherheit zu Grilling und echte technische Unsicherheit zu Wayfinder, statt beide innerhalb der SPEC zu kaschieren.
- Nutze Project Memory zur Rückverfolgbarkeit, aber dupliziere keine normative SPEC oder Decision Records in Event-Notizen.

## Workflow

### 1. Quellen inventarisieren

Erfasse je Quelle:

- Status: bestätigt, bindend, informativ oder veraltet,
- behandelte Themen,
- relevante Entscheidungen,
- technische Evidenz,
- erkennbare Widersprüche,
- offenen Geltungsbereich.

Bei Repository-Arbeit zuerst `docs/project-memory/state.json` und den letzten relevanten Event lesen, sofern vorhanden; danach `docs/agents/CONFIG.md`, `CONTEXT.md` und `DECISIONS.md`, sofern vorhanden.

### 2. Entscheidungsregister bilden

Konsolidiere jede Festlegung als:

- stabile ID,
- Thema,
- Entscheidung,
- Quelle,
- Status,
- betroffene Anforderungen und Risiken.

Bei Konflikten gilt nicht automatisch die jüngste Quelle. Bevorzuge ausdrücklich freigegebene, fachlich höherrangige oder durch Tests belegte Festlegungen.

### 3. Lücken klassifizieren und routen

Ordne fehlende Angaben ein:

- **fachlich blockierend:** benötigt Nutzer-/Stakeholderentscheidung → Grilling,
- **technisch blockierend:** benötigt Untersuchung oder Evidenz → Wayfinder,
- **ADR-pflichtig:** verändert Architektur oder Invarianten; bei fehlender Evidenz Wayfinder, bei fehlender Autorisierung Entscheidung blockieren,
- **später entscheidbar:** kann mit einer stabilen Schnittstelle vertagt werden,
- **sicher annehmbar:** besitzt eine risikoarme Standardannahme.

Erstelle keine künstlichen Blocker. Nutze sichere Annahmen mit klarer Kennzeichnung.

### 4. Spezifikation erzeugen

Eine Software-Spezifikation enthält mindestens:

1. Zweck, Zielbild und Nicht-Ziele,
2. Nutzer, Rollen und zentrale Abläufe,
3. funktionale Anforderungen mit IDs,
4. Domänenmodell und Invarianten,
5. Zustände, Fehlerfälle und Wiederaufnahme,
6. Datenmodell, Datenschutz und Aufbewahrung,
7. Autorisierung, Audit und Sicherheitsgrenzen,
8. Schnittstellen und Integrationen,
9. Offline-, Synchronisations- und Konfliktverhalten, falls relevant,
10. Qualitätsanforderungen und Observability,
11. KI-/ML-Architektur und Datenstrategie, falls Software betroffen ist,
12. Migration, Deployment und Betrieb,
13. Akzeptanzkriterien und Release-Gates,
14. Risiken, Annahmen und offene Entscheidungen,
15. Sequenzierungsprinzipien und Abhängigkeiten für spätere vertikale Umsetzung.

Nicht relevante Abschnitte werden kurz als nicht anwendbar begründet statt still ausgelassen.

### 5. Rückverfolgbarkeit prüfen

Jede Muss-Anforderung benötigt mindestens eine Quelle oder eine ausdrücklich markierte Annahme. Jedes Akzeptanzkriterium muss auf eine Anforderung verweisen. Offene Punkte dürfen nicht als bereits entschiedene Anforderungen erscheinen.

### 6. Konsistenzprüfung

Prüfe mindestens:

- Rollen gegen Berechtigungen,
- Zustandsübergänge gegen Fehler- und Wiederaufnahmefälle,
- Datenfelder gegen Datenschutz und Export/Löschung,
- Offline-Verhalten gegen Idempotenz und Konfliktregeln,
- Architektur gegen Repository-Invarianten,
- Release-Gates gegen die beschriebenen Tests,
- KI-Funktionen gegen Fallback, Ground Truth, Evaluation und Governance,
- offene Punkte gegen das korrekte Routingziel.

### 7. Ausgabe und Übergabe

Liefere:

- die vollständige `SPEC.md`,
- ein kurzes Entscheidungsregister,
- einen Konsistenzbericht,
- offene Blocker mit Routingziel,
- Sequenzierungsprinzipien für die spätere vertikale Zerlegung.

Nach ausdrücklicher Freigabe geht die SPEC an `spec-to-vertical-issues`. Speichere oder veröffentliche die Spezifikation nur im ausdrücklich bestimmten Produkt-Repository. Der Grilling- oder Skill-Katalog ist kein Ablageort für projektspezifische Spezifikationen.

### 8. Project Memory fortschreiben

Vor der Übergabe an `spec-to-vertical-issues` beziehungsweise vor einem Rücksprung zu Grilling oder Wayfinder `project-second-brain` aktualisieren.

Der Event mit `stage: specification` verlinkt mindestens:

- verwendete Grilling-/Wayfinding-Quellen,
- aktuelle `SPEC.md` mit Commit- oder unveränderlicher Referenz,
- Entscheidungsregister und relevante `decision-record`-Artefakte,
- Konsistenzbericht,
- Freigabestatus der SPEC,
- verbleibende Blocker und Routingziel,
- genau die nächste Aktion.

Bei einer späteren SPEC-Änderung den alten Event nicht überschreiben. Einen neuen Event erzeugen, der die vorherige Spezifikationsfassung und den Änderungsgrund verlinkt.

## Qualitätsfälle

### Happy Path

Mehrere freigegebene Grilling-Reports, Wayfinder-Evidenz und Repository-Dokumente sind konsistent. Ergebnis ist eine vollständige Spezifikation ohne erneutes Interview oder technische Re-Exploration; der Spezifikationsstand ist im Project Second Brain mit seinen Quellen verankert.

### Grenzfall

Eine Detailfrage ist offen, aber durch eine austauschbare Schnittstelle vertagbar. Die Spezifikation dokumentiert Annahme, Grenze und späteren Entscheidungspunkt, ohne unnötig zu Grilling oder Wayfinder zurückzuspringen.

### Fehlerfall

Eine bindende fachliche Entscheidung fehlt oder technische Evidenz reicht für eine normative Aussage nicht aus. Stoppe nur die betroffene Festlegung, route sie zu Grilling beziehungsweise Wayfinder und liefere den übrigen konsistenten Teil weiter. Der Project-Memory-Event dokumentiert den Blocker, ohne ihn als abgeschlossene Entscheidung darzustellen.

## Abschlusskriterien

Der Skill ist abgeschlossen, wenn:

- alle relevanten Quellen klassifiziert wurden,
- bestätigte Entscheidungen und technische Evidenz rückverfolgbar enthalten sind,
- keine bereits beantwortete Frage erneut gestellt wurde,
- Anforderungen und Akzeptanzkriterien prüfbar sind,
- Annahmen und offene Punkte sichtbar getrennt sind,
- Architektur- und Sicherheitsinvarianten konsistent bleiben,
- jeder Blocker das korrekte Routingziel besitzt,
- die SPEC freigabefähig ist und nach Freigabe eindeutig an `spec-to-vertical-issues` übergeben werden kann,
- der aktuelle Spezifikationszustand mit Quellen, Entscheidungen und nächster Aktion im Project Second Brain verankert ist.
