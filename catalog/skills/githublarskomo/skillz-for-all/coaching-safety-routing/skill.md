---
name: coaching-safety-routing
description: Trennt legitime Coaching-Unterstützung von Situationen, die HR-, Legal-/Compliance-, arbeitsmedizinische, psychologische oder akute professionelle Unterstützung benötigen. Verwenden bei Warnsignalen oder formellen Personal-/Compliance-Sachverhalten; nicht diagnostizieren, therapieren oder rechtliche Freigaben simulieren.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires: []
consumes: []
outputs:
  - coaching-safety-routing.json
lastEvaluated: 2026-09-03
---

# Coaching Safety Routing

## Zweck

Schütze die Grenze zwischen Coaching und Themen, die eine andere professionelle Ebene benötigen. Ziel ist Routing, nicht Diagnose oder Fallentscheidung.

## Routing-Stufen

- `coaching-support`: normales Coaching ist angemessen.
- `monitor`: Coaching kann fortgesetzt werden, Warnsignale oder Unsicherheit bleiben sichtbar.
- `professional-support`: HR, Employment Law, Compliance, Occupational Health oder Mental-Health-Professional sollte einbezogen werden.
- `urgent`: unmittelbare Gefahr oder akute Krisensituation; normales Coaching tritt zurück.

## Typische Trigger

- akute Selbst-/Fremdgefährdung, schwere Desorientierung oder akute Krise;
- anhaltende erhebliche psychische Belastung oder deutlicher Funktionsverlust;
- Mobbing, Harassment, Diskriminierung oder Whistleblowing;
- formelle Disziplinarmaßnahmen, Abmahnung, Kündigung oder vergleichbare Employment-Matters;
- Compliance-Vorwurf, Investigation, Interessenkonflikt oder möglicher Rechtsstreit;
- Situationen, in denen Coaching offensichtlich als Ersatz für professionelle Hilfe benutzt werden soll.

## Ablauf

1. Bekannte Fakten, Selbstaussagen und Unsicherheiten trennen.
2. Akute Gefahr zuerst prüfen; bei `urgent` normale Coaching-Optimierung verlassen.
3. Performance-/Leadership-Thema von Health-, HR-, Legal- und Compliance-Thema trennen.
4. Routing-Stufe bestimmen und nur die kleinste notwendige Begründung persistieren.
5. Geeignete Route benennen: `leadership-coaching`, `hr`, `employment-law`, `compliance`, `occupational-health`, `mental-health-professional`, `emergency`.
6. Keine Diagnose, Therapie, Rechtsberatung oder formelle HR-Entscheidung vortäuschen.
7. Privatsphäre minimieren; sensible Drittinformationen nur soweit für Routing notwendig festhalten.

## Output

`coaching-safety-routing.json` enthält mindestens `schemaVersion`, `routingLevel`, `concernSummary`, `observedSignals`, `uncertainties`, `routes`, `coachingBoundary`, `privacyMinimization` und `safetyFlags`.

## Übergaben

- normales Leadership-Thema → `leadership-coaching-workflow`;
- deutsches formelles Employment-/Labor-Thema → `german-employment-labor-law-specialist`;
- Compliance-/Investigation-Sachverhalt → passender Compliance-/Investigation-Workflow;
- psychische Belastung oder akute Krise → geeignete professionelle Versorgung, bei unmittelbarer Gefahr lokale Notfallhilfe.

## Abschlusskriterien

Der Skill endet, wenn die passende Routing-Ebene sichtbar ist, Coaching-Grenzen klar sind, keine Diagnose oder formelle Entscheidung vorgetäuscht wird und Safety normale Optimierung überstimmen kann.
