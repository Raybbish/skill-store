---
name: digital-ai-cyber-law-specialist
description: Analysiert Digital-, AI-, Daten- und Cyber-Rechtsfragen für Deutschland/EU einschließlich AI Act, Data Act, NIS2/BSIG, digitale Datenschutzschnittstellen, Cybersecurity-Vertrags- und Produktpflichten und routet technische, Privacy-, Regulatory- und ISMS-Fragen an vorhandene Specialists statt deren Fachlogik zu duplizieren.
userFacing: true
implicitInvocation: true
category: legal-specialist
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - current-law-context
  - privacy-data-law-specialist
  - legal-compliance-risk-assessment
  - privilege-and-counsel-routing
outputs:
  - digital-ai-cyber-law-assessment.json
  - digital-regime-applicability-map.json
  - digital-legal-work-orders.json
lastEvaluated: 2026-08-28
---

# Digital AI Cyber Law Specialist

## Zweck

Ordne digitale Vorhaben und Incidents den **richtigen Rechtsregimen, Rollen und Pflichten** zu. Der Skill ist Legal Router und Rechtsanalyse-Layer; technische Cybersecurity-Bewertung, Datenschutz-Fachanalyse, Medical-Device-Regulatory und ISMS-Control-Design bleiben bei den vorhandenen Specialists.

## Current-Law Gate

Für jedes Matter `asOf`, Jurisdiktion, Normfassung, Anwendungsbeginn, Übergangsvorschrift und Rollenbezug verifizieren. AI Act, Data Act, BSIG/NIS2, TDDDG, CRA und weitere Digitalrechtsakte sind zeitabhängig. Nie aus einem Gesetzestitel allein auf aktuelle Anwendbarkeit schließen.

## Regime Map

Prüfe je nach Fakten insbesondere:

- EU AI Act: System/Use Case, verbotene Praktiken, high-risk trigger, GPAI/Provider-/Deployer-/Importer-/Distributor-Rolle, Transparenz, Human Oversight, Governance und Übergangs-/Anwendungsdaten,
- EU Data Act: connected product/related service, data holder/user/data recipient, Datenzugang/-bereitstellung, B2B-Vertragsklauseln, Cloud/Data-Processing Switching und einschlägige Stichtage,
- NIS2/BSIG: Entity Scope, Einrichtungskategorie, Registrierungs-/Melde-/Risikomanagement- und Leitungsanforderungen sowie zuständige Stelle,
- Cyber Resilience Act und sektorspezifische Produkt-Cybersecurity nur bei Produkt-/Rollen-Trigger,
- GDPR/BDSG/TDDDG → `privacy-data-law-specialist`,
- Medical Device/IVD Cybersecurity → vorhandene `medical-device-cybersecurity-lifecycle`, Regulatory-, Risk- und QMS-Skills,
- ISMS/Control Effectiveness → vorhandene `medical-device-isms-governance`, `iso27001-isms-audit` oder generische Compliance-Control-Skills,
- Verträge/SaaS/Cloud/Data Sharing → Contract Matter Stack plus ggf. Privacy, IP, Competition und Trade.

## AI Role / Risk Gate

Nicht jedes AI-System ist high-risk. Dokumentiere mindestens intended use, affected persons, decision context, sector, Annex/Use-Case trigger, provider/deployer chain, model/system distinction, human decision authority and safeguards. Employment-, education-, essential-service-, law-enforcement- oder regulated-product use cases nur nach aktuellem Tatbestandscheck klassifizieren.

Eine interne AI-Nutzung ist weder automatisch low-risk noch automatisch high-risk. Ein technisches Modelllabel ersetzt die rechtliche Rollen- und Use-Case-Analyse nicht.

## Data Act Gate

Trenne Produkt-/Service-Designpflichten, User/Data-Holder-Rechte, B2B Data Sharing, öffentliche Stellen, Vertragsfairness und Data-Processing-Service Switching. Anwendungsdaten je Kapitel/Artikel verifizieren; ältere Verträge und Produkte nicht pauschal nach denselben Regeln behandeln.

## NIS2 / BSIG Gate

Bestimme zuerst Entity, Tätigkeit, Größe, Ausnahme/Sonderregel, Einrichtungskategorie und nationale Zuständigkeit. Erst danach Registrierungs-, Risiko-, Leitungs-, Incident- und Supply-Chain-Pflichten ableiten. Ein ISO-27001-Zertifikat beweist nicht automatisch gesetzliche NIS2/BSIG-Compliance.

## Cyber Incident Legal Gate

Bei Incident oder Verdacht sofort trennen:

1. technische Containment/Forensics,
2. Evidence Preservation,
3. Datenschutz-Breach Assessment,
4. NIS2/BSIG oder sektorspezifische Meldepflicht,
5. Vertrags-/Kundenpflichten,
6. Product Safety/Regulatory Reporting,
7. Law Enforcement/Counsel/Privilege,
8. Kommunikation und Decision Authority.

Ein Incident darf nicht als „nur IT“ geschlossen werden, solange rechtliche Reportability/Notification nicht geprüft ist.

## Product / Regulated Overlay

Bei Software/AI in IVD/Medical Devices keine Parallel-Regulatory-Entscheidung treffen. Route Classification, change impact, cybersecurity lifecycle, PMS/Vigilance, CAPA und Field Action an vorhandene Regulatory/QMS/Risk Specialists. Der Digital-Law-Skill analysiert zusätzliche horizontale Rechtsregime und Konflikte.

## Contract / Procurement Gate

Bei AI-, Cloud-, SaaS-, Cyber- oder Data-Deals mindestens Rollen, data rights, training/use rights, confidentiality, security commitments, incident notification, subcontractors, audit/evidence rights, service continuity, switching/exit, IP, liability, regulatory cooperation und change-of-law Auswirkungen an den Contract Stack übergeben.

## Authority / Counsel Gate

Behördenmeldungen, streitige regulatorische Klassifikation, erhebliche Bußgeld-/Haftungsrisiken, grenzüberschreitende Konflikte, komplexe AI-Act-/NIS2-Scope-Fragen oder Incident-/Enforcement-Matters mit Privilege-Bedarf an zuständige interne Authority bzw. External Counsel routen. Vorbereitende Analyse und Evidence Packaging laufen weiter.

## Qualitätsgate

Pass nur, wenn aktuelle Normfassung/Stichtag, Rolle, Use Case/Entity Scope, technische vs. rechtliche Ownership, Privacy/Regulatory/ISMS-Handoffs, Reportability, Authority und offene Unsicherheiten getrennt dokumentiert sind.