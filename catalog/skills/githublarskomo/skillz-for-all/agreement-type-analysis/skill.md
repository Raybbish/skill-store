---
name: agreement-type-analysis
description: Zerlegt einen Vertragsfall nach seiner tatsächlichen Deal-Funktion in Vertragstypen, Leistungs-/Rechteflüsse, erforderliche Klauselmodule und Legal-Specialist-Routen, statt sich auf die Dokumentüberschrift zu verlassen. Verwenden vor Contract Review oder Drafting, besonders bei hybriden NDA-, MTA-, DTA/DUA-, Lizenz-, R&D-, Studien-, Supply-, Quality-, Distribution-, SaaS-, Employment- oder M&A-Verträgen.
userFacing: true
implicitInvocation: false
discoverability: advanced
category: analysis
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - current-law-context
  - legal-client-strategy
outputs:
  - agreement-deal-model.json
  - agreement-clause-coverage.json
  - agreement-specialist-routes.json
lastEvaluated: 2026-08-28
---

# Agreement Type Analysis

## Zweck

Bestimme **was der Deal tatsächlich tut**, bevor Review oder Drafting aus einer Vertragsbezeichnung oder Vorlage abgeleitet werden. Ein Dokument kann mehrere Vertragstypen und Rechtsgebiets-Overlays gleichzeitig enthalten.

## Substance-over-Label Gate

Verlasse dich nicht auf Titel wie `NDA`, `MTA`, `License` oder `Supply Agreement`. Rekonstruiere stattdessen:

- Parteien und Rollen,
- Leistungs-, Geld-, Material-, Daten- und Rechteflüsse,
- Eigentums-/Nutzungsrechtsübergänge,
- Kontroll- und Entscheidungsrechte,
- Laufzeit, Exit und Nachwirkungen,
- regulatorische oder institutionelle Funktionen.

Wenn Titel und Deal-Substanz auseinanderfallen, ist die Substanz für Clause Coverage und Specialist Routing maßgeblich.

## Functional Profiles

Erkenne soweit einschlägig mindestens:

- NDA / Confidentiality,
- MTA / Material Transfer,
- DTA / DUA / Data Transfer or Data Use,
- DPA / Processing,
- IP License / Technology License,
- R&D / Collaboration / Co-Development,
- Clinical or Performance Study,
- Supply / Purchase,
- Manufacturing / OEM / Contract Manufacturing,
- Quality Agreement,
- Distribution / Agency / Reseller,
- SaaS / Cloud / Software Service,
- Employment / Contractor,
- Corporate / Investment / M&A.

Hybride Deals behalten mehrere Profile mit getrennten Triggern; sie werden nicht künstlich auf einen einzigen Vertragstyp reduziert.

## Deal Model

`agreement-deal-model.json` enthält mindestens:

```json
{
  "matterId": "LM-...",
  "functionalProfiles": [],
  "partiesAndRoles": [],
  "performanceFlows": [],
  "paymentFlows": [],
  "materialFlows": [],
  "dataFlows": [],
  "rightsFlows": [],
  "controlRights": [],
  "termExitSurvival": [],
  "assumptions": [],
  "unknowns": []
}
```

## Clause Coverage

Ordne Klauselthemen als `required|conditional|optional|not-applicable` ein und begründe die Einstufung. Behandle insbesondere Scope, Payment, Delivery/Acceptance, Quality, Warranty, Liability, Indemnity, Insurance, Confidentiality, IP, Data/Privacy, Security, Compliance, Audit, Subcontracting, Publications, Change Control, Termination/Exit, Governing Law, Forum, Form und Attachments.

Boilerplate wird nicht allein deshalb aufgenommen, weil es in einer Vorlage üblich ist.

## Specialist Routing

Erzeuge nur fachlich notwendige Routen. Beispiele:

- Material + Human Samples → Regulatory/Study/Privacy abhängig von Zweck und Datenbezug.
- IP transfer/license → IP/Licensing sowie bei FTO-Fragen bestehende Patent-/FTO-Skills.
- Personal data → Privacy/Data.
- Employment functionality → Employment/Labor.
- Corporate control/equity → Corporate/M&A.
- Competition-sensitive exclusivity/market allocation → Antitrust.
- Regulated product quality obligations → vorhandene Regulatory/QMS-Skills.
- Vereins-/Sportbezug → German Association/Sports Law und ggf. DRV Rowing Overlay.

## Qualitätsgate

Pass nur, wenn Deal-Substanz, Functional Profiles, Clause Coverage und Specialist Routes miteinander konsistent sind und kein Titel oder Template die tatsächlichen Rechte-/Leistungsflüsse verdeckt.