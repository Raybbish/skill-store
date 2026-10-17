---
name: compliance-obligation-register
description: Baut für einen konkreten Unternehmens-, Prozess- oder Produktkontext ein quellenbelegtes Register bindender und nichtbindender Compliance-Anforderungen mit Triggern, Verantwortlichen, Fristen und Evidenzbedarf. Verwenden als Ausgangspunkt für Compliance-Systeme, Audits und Control Mapping.
userFacing: true
implicitInvocation: true
category: legal-specialist
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - current-law-context
outputs:
  - compliance-obligation-register.json
  - compliance-obligation-source-note.md
  - compliance-obligation-gaps.json
lastEvaluated: 2026-08-28
---

# Compliance Obligation Register

## Zweck

Übersetze aktuelle Rechts-, Vertrags-, Lizenz-, Behörden- und wirksam bindende private Regelwerke in atomare, nachverfolgbare Pflichten. Ein Register ist keine Gesetzessammlung: jede Zeile muss erklären, **wer aufgrund welcher Bindungsgrundlage was wann tun oder unterlassen muss und welche Evidenz das belegt**.

## Authority und Binding Gate

Jede Quelle erhält genau einen Typ, z. B. `binding-law`, `binding-regulation`, `binding-contract`, `binding-license-permit`, `binding-order`, `private-rule-binding`, `voluntary-standard-policy` oder `guidance`.

- `current-law-context` verifiziert Fassung, Jurisdiktion, Inkrafttreten und Anwendbarkeit.
- Guidance, Standards, Policies oder Verbandsregeln werden nicht allein wegen fachlicher Bedeutung als Gesetz behandelt.
- Private Regeln benötigen eine konkrete Bindungsgrundlage, etwa Vertrag, Satzung, Mitgliedschaft, Lizenz oder wirksame Incorporation.
- Bei superseded, noch nicht wirksamen oder ungeklärten Quellen wird der Status sichtbar gehalten.

## Workflow

1. Scope nach Rechtsträger, Rolle, Jurisdiktion, Standort, Prozess, Produkt/Dienstleistung und Zeitraum festlegen.
2. Aktuelle Primärquellen und erforderliche Specialist Sources ermitteln.
3. Quellen in atomare Pflichten zerlegen; keine Sammelpflichten mit mehreren unabhängigen Triggern erzeugen.
4. Trigger, Frist/Frequenz, Pflichtadressat, Owner, Ausnahmen und Sanktion/Risikokontext erfassen.
5. Für jede Pflicht ein prüfbares `controlObjective` und erwartete Evidenz definieren, ohne bereits Compliance zu behaupten.
6. Konflikte, Doppelungen, ungeklärte Normkonkurrenzen und Capability Gaps markieren.
7. Änderungen über `effectiveFrom`, `effectiveTo`, `supersedes` und `checkedAt` versionieren.

## Datenmodell

Jede materielle Pflicht enthält mindestens:

```json
{
  "obligationId": "OBL-...",
  "authorityRef": "...",
  "authorityType": "binding-law|binding-regulation|binding-contract|binding-license-permit|binding-order|private-rule-binding|voluntary-standard-policy|guidance",
  "bindingStatus": "binding|conditional|non-binding|uncertain",
  "jurisdiction": "...",
  "subject": "...",
  "trigger": "...",
  "duty": "...",
  "deadlineOrFrequency": "...",
  "effectiveFrom": "...",
  "effectiveTo": null,
  "owner": "...",
  "controlObjective": "...",
  "requiredEvidence": [],
  "exceptions": [],
  "sourceRefs": [],
  "checkedAt": "...",
  "confidence": "high|medium|low"
}
```

## Existing Assets First

Regulatory-/QMS-/PMS-/Complaint-/CAPA-/Audit-Skills bleiben Owner ihrer Fachpflichten. Dieser Skill kann ihre verifizierten Requirements aufnehmen, erfindet aber keine zweite MDR/IVDR/FDA/ISO-Auslegung.

## Qualitätsgate

Pass nur, wenn jede Pflicht eine verifizierte Authority, konkrete Bindungsgrundlage, Scope/Trigger, Owner, Frist/Frequenz und Evidenzanforderung besitzt und Guidance bzw. freiwillige Standards nicht als zwingendes Recht ausgegeben werden.
