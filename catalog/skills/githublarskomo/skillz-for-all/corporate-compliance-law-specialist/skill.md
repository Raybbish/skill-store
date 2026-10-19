---
name: corporate-compliance-law-specialist
description: Analysiert unternehmensbezogene Integrity-/Compliance-Pflichten und Risiken insbesondere Anti-Korruption, Vorteilsgewährung, Interessenkonflikte, Third Parties, Fraud, Sponsoring/Spenden, Geschäftspartner- und Public-Official-Kontakte sowie Organisations-/Aufsichtspflichten; verbindet Rechtsanalyse mit Obligation/Control/Investigation-Systemen ohne deren operative Fachlogik zu duplizieren.
userFacing: true
implicitInvocation: true
category: legal-specialist
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - current-law-context
  - compliance-obligation-register
  - legal-compliance-risk-assessment
  - privilege-and-counsel-routing
outputs:
  - corporate-compliance-law-assessment.json
  - integrity-risk-route-map.json
  - compliance-legal-work-orders.json
lastEvaluated: 2026-08-28
---

# Corporate Compliance Law Specialist

## Zweck

Bestimme die **materielle Legal-/Integrity-Baseline**, aus der Compliance Obligations und Controls abgeleitet werden. Dieser Skill ersetzt weder das Obligation/Control-System noch Investigation Fact-Finding; er entscheidet, welche Rechts-/Integrity-Fragen fachlich geprüft und wie sie geroutet werden.

## Current-Law Gate

Aktuelle deutsche/EU- und bei Auslandsnexus relevante ausländische Quellen über `current-law-context` verifizieren. Straf-/OWi-/Sanktionsnormen, Guidance und Unternehmenspolicy strikt trennen. Ein Code of Conduct ist keine gesetzliche Tatbestandsdefinition, kann aber interne Pflichten/Controls begründen.

## Core Domains

- Bestechung/Bestechlichkeit im geschäftlichen Verkehr,
- Vorteile an/über Amtsträger und public-sector interactions,
- Gifts, Hospitality, Travel, Events und sonstige Benefits,
- Interessenkonflikte und Related-Party-/Procurement-Situationen,
- Third-Party Intermediaries, Distributors, Agents, Consultants und Due Diligence,
- Donations, Sponsoring, Grants und charitable interactions,
- Fraud, falsche Records, Kickbacks, off-book arrangements und Control Circumvention,
- Competition/competitor contact → `competition-antitrust-law-specialist`,
- Trade/Sanctions → `trade-sanctions-export-control-specialist`,
- Whistleblowing/Investigation → bestehende HinSchG-/Investigation-Workflows,
- AML/GwG nur nach tatsächlichem Verpflichteten-/Transaktionstrigger, nicht pauschal für jedes Unternehmen.

## German Supervision / Organizational Gate

Bei potentiellen Unternehmenspflichtverletzungen aktuelle Organisations-/Aufsichtspflichten, Verantwortungszuordnung, Auswahl/Überwachung und erforderliche Kontrollen prüfen. § 130 OWiG ist kein generischer „Compliance-Zertifizierungsparagraph“; seine konkrete Anwendung hängt von verletzter Pflicht, erforderlicher Aufsicht und verhinderbarer/erschwerbarer Zuwiderhandlung ab.

## Benefit / Corruption Gate

Nicht mit einem pauschalen Geldwert arbeiten. Erfasse recipient role, payer/provider, benefit, purpose, business decision linkage, public/private context, procurement/tender context, timing, approvals, transparency, company policy, local law, third parties and evidence. Private commercial bribery and public-official offences getrennt analysieren.

## Third-Party Gate

Risiko aus Leistung, Vergütung, Region, Government Touchpoints, Subagents, Beneficial Ownership, Red Flags, Due Diligence, Contract Controls, Payment Evidence und Ongoing Monitoring ableiten. Ein unterschriebener Anti-Corruption-Clause heilt keine ungeklärten Red Flags.

## Investigation / Remediation Handoff

Verdachtsfälle an `internal-investigation-workflow`; Schutzkanal-/HinSchG-Fragen an `whistleblowing-law-specialist`. Festgestellte Legal Obligations in `compliance-obligation-register`, Controls über Mapping/Assurance. Disziplinar-/Arbeitsfolgen an Employment; Straf-/Behördenrisiko an Counsel/Enforcement.

## Extraterritorial Gate

FCPA, UK Bribery Act oder andere ausländische Regime nur bei belastbarem Jurisdiktions-/Nexus-Trigger anwenden. Konzernzugehörigkeit oder internationales Geschäft allein ersetzt keine aktuelle Scope-Prüfung.

## Qualitätsgate

Pass nur, wenn Rechtsquelle, Verhaltens-/Benefit-Facts, public/private role, Third-Party-/Control-Kontext, Organisationspflicht, Investigation/Employment/Antitrust/Trade-Handoffs und Authority/Counsel Gate getrennt dokumentiert sind.