---
name: current-law-context
description: Ermittelt für einen Legal Matter den aktuellen, jurisdiktions- und zeitbezogenen Rechts- und Regelwerkskontext aus autoritativen Quellen und trennt Gesetz, Rechtsprechung, Behördenmaterial, Verbands-/Satzungsrecht, Vertragsregeln und Interpretation. Verwenden vor materiellen Rechtsaussagen oder Specialist Assessments.
userFacing: true
implicitInvocation: true
category: research-knowledge
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - research-to-evidence-note
outputs:
  - legal-jurisdiction-map.json
  - legal-authority-evidence.json
  - legal-context.md
  - legal-research-open-questions.json
lastEvaluated: 2026-08-28
---

# Current Law Context

## Zweck

Stelle sicher, dass materielle Rechtsaussagen auf dem richtigen Rechtsraum, dem richtigen Stichtag und einer nachvollziehbaren Autoritätskette beruhen.

## Source Hierarchy

Bevorzuge je nach Frage:

1. amtliche Gesetzes-/Verordnungsfassungen und offizielle Register,
2. veröffentlichte Rechtsprechung und amtliche Behörden-/Gerichtsquellen,
3. offizielle Behördenleitlinien und regulatorische Guidance,
4. wirksam einschlägige Satzungen, Ordnungen und Verbandsregelwerke,
5. Vertragstext und wirksam einbezogene Regelwerke,
6. Sekundärquellen nur zur Einordnung und zum Auffinden primärer Autorität.

## Kernregeln

- Jede zeitabhängige Aussage benötigt `asOf` und Source Reference.
- Trenne `law`, `case-law`, `regulation`, `authority-guidance`, `association-rule`, `contract`, `organizational-policy` und `interpretation`.
- Private Satzungs- oder Verbandsregeln sind nicht mit staatlichem Recht gleichzusetzen. Ihre Bindungswirkung hängt u. a. von Mitgliedschaft, Satzung, wirksamer Einbeziehung, Lizenz-/Vertragsbindung und Verfahrensregeln ab.
- Bei ausländischem Recht, ungeklärter Rechtsprechung oder fehlender Primärquelle keine scheinpräzise Aussage erzeugen; als `openQuestion` markieren und ggf. externen Counsel routen.
- Quellenkonflikte, Übergangsregeln und Fassungsstände bleiben sichtbar.

## Workflow

1. Jurisdiktionshypothesen aus `legal-matter.json` prüfen.
2. Rechtsgebiete und mögliche Norm-/Regelwerksschichten bestimmen.
3. Autoritative aktuelle Quellen beschaffen und als Evidence Notes normalisieren.
4. Anwendbarkeit, Fassungsstand und Bindungsvoraussetzungen je Quelle dokumentieren.
5. Widersprüche und offene Forschungsfragen erfassen.
6. `legal-jurisdiction-map.json`, `legal-authority-evidence.json`, `legal-context.md` und Open Questions ausgeben.

## Minimaler Authority Record

```json
{
  "authorityType": "law|case-law|regulation|authority-guidance|association-rule|contract|policy",
  "title": "...",
  "jurisdiction": "...",
  "issuer": "...",
  "asOf": "YYYY-MM-DD",
  "sourceRef": "...",
  "applicability": "confirmed|conditional|unknown",
  "bindingBasis": "...",
  "notes": []
}
```

## Qualitätsgate

Pass nur, wenn jede zentrale Rechtsaussage auf Jurisdiktion, Stichtag, Autorität, Anwendbarkeit und bei privaten Regelwerken auf eine plausible Bindungsgrundlage zurückgeführt werden kann.