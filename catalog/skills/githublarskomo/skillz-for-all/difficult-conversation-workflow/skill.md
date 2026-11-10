---
name: difficult-conversation-workflow
description: Bereitet schwierige Führungsgespräche evidenzgebunden vor, trennt Fakten von Interpretationen und kombiniert Feedback, Gesprächsstruktur sowie Safety-, HR-, Legal- und Compliance-Gates.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - meeting-preparation
  - leadership-feedback
  - coaching-safety-routing
consumes:
  - meeting-prep.json
  - leadership-feedback-plan.json
  - leadership-reflection.json
outputs:
  - difficult-conversation-plan.json
lastEvaluated: 2026-09-03
---

# Difficult Conversation Workflow

## Zweck

Bereitet ein schwieriges Führungs- oder Mitarbeitergespräch so vor, dass Fakten, Interpretation, Gesprächsziel, Feedback, Fragen, Grenzen und professionelles Routing getrennt bleiben. Der Workflow führt keine Investigation durch und ersetzt weder HR-Prozess noch Rechtsberatung.

## Ablauf

1. Anlass, Gesprächszweck und bestätigte Fakten fixieren.
2. Interpretationen, Annahmen und unbekannte Punkte separat halten.
3. Prüfen, warum das Gespräch notwendig ist und welches legitime Ergebnis angestrebt wird.
4. Relevantes Feedback aus `leadership-feedback` integrieren.
5. Fragen und Kernbotschaften vorbereiten, die Dialog statt Motivattribution ermöglichen.
6. Mögliche Reaktionen als Szenarien, nicht als vorhergesagte Persönlichkeit, formulieren.
7. Grenzen definieren: was ist verhandelbar, was muss entschieden, eskaliert oder professionell geroutet werden?
8. `coaching-safety-routing` anwenden, wenn Harassment, Diskriminierung, Compliance, Investigation, Gesundheit, Krise, formelle Disziplin oder Kündigung berührt sind.
9. Follow-up-Kandidaten vorbereiten, ohne deren spätere Bestätigung vorzutäuschen.

## Output

`difficult-conversation-plan.json` enthält mindestens `schemaVersion`, `conversationPlanId`, `purpose`, `meetingRef`, `facts`, `interpretations`, `unknowns`, `messages`, `questions`, `reactionScenarios`, `boundaries`, `feedbackRefs`, `safetyRoutingRef`, `professionalGate`, `desiredOutcome`, `followUpCandidates`, `status` und `updatedAt`.

## Professional Gate

`professionalGate` enthält mindestens `triggered`, `domains` und `reasons`. Mögliche Domains sind `hr`, `employment-law`, `compliance`, `investigation`, `occupational-health`, `mental-health` und `urgent`.

Wenn der Gate ausgelöst ist, darf der Workflow den professionellen Prozess nicht durch Coaching-Skripte umgehen.

## Regeln

- Fakten und Vorwürfe nicht gleichsetzen; ungeklärte Sachverhalte bleiben ungeklärt.
- Keine Persönlichkeitsdiagnose, Motivzuschreibung oder manipulative Gesprächsführung.
- Keine verdeckten Drohungen oder strategische Demütigung.
- Bei formellen Konsequenzen nicht so formulieren, als seien arbeitsrechtliche Schritte bereits geprüft oder beschlossen.
- Ein schwieriges Gespräch ist keine Investigation; Beweiserhebung und Zeugenbewertung gehören in dafür vorgesehene Prozesse.

## Übergaben

- normales Feedback → `leadership-feedback`;
- bestätigte Commitments → `decision-and-follow-up-tracker`;
- Performance-Fall → `performance-management-workflow`;
- professionelles Gate → geeigneter HR-/Legal-/Compliance-/Health-Spezialist.

## Abschlusskriterien

Gesprächszweck, Fakten, Interpretationen, Fragen, Kernbotschaften, Grenzen, professionelle Gates und gewünschtes Ergebnis sind getrennt; kein ungeklärter Vorwurf wird als Tatsache oder formelle Entscheidung behandelt.