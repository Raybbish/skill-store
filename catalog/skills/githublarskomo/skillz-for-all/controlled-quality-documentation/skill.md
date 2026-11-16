---
name: controlled-quality-documentation
description: Prüft und entwirft kontrollierte QMS-Dokument- und Record-Lifecycles mit Change Impact, Approval Evidence, Effective/Superseded State und Traceability, ohne eine feste Nummerierung oder DMS-Implementierung vorzuschreiben.
userFacing: true
implicitInvocation: true
category: regulated-engineering
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires: 
  - regulated-product-context
  - two-axis-compliance-review
outputs: 
  - document-control-assessment.json
  - change-impact-assessment.json
  - controlled-document-plan.md
lastEvaluated: 2026-08-04
---

# controlled-quality-documentation

## Zweck

Schließt die Dokumentationslücke zwischen QMS-Regeln und Engineering-Artefakten, ohne ein zweites Dokumentensystem zu bauen.

## Trigger

Verwenden für SOP-/WI-/Form-/Spec-/Technical-Documentation-Lifecycle, Change Control, Approval/Review, Training Impact, Record Retention oder elektronische Records/Signatures.

## Gemeinsame Regulated-Engineering-Regeln

- Aussagen mit regulatorischer Wirkung trennen `regulation/law`, `standard`, `guidance`, `organizational-policy` und `interpretation`.
- Zeitabhängige regulatorische Fakten benötigen `asOf` und eine nachvollziehbare Source-Referenz; fehlt sie, bleibt der Punkt `unknown`.
- Volltexte urheberrechtlich geschützter Standards werden nicht reproduziert. Verwende zugängliche autoritative Quellen und organisationslizenzierte Normtexte nur als Evidenz.
- Fehlende Evidenz ist kein positiver Compliance-Nachweis.
- Bei High-Impact-Klassifikation, Zulassung, Zertifizierung, Freigabe oder Legal Interpretation wird die erforderliche menschliche/behördliche Autorität nicht simuliert.

## Fachregeln

- Dokumenttypen, Nummerierung, Approval Matrix und Reviewfrequenzen sind organisationsdefiniert, sofern keine anwendbare regulatorische Quelle etwas Spezifischeres verlangt.
- Lifecycle trennt mindestens draft, review, approved, effective, superseded und obsolete/retained, soweit organisationsseitig verwendet.
- Ein Change Impact prüft mindestens Training, Validation, Regulatory, Risk, Supplier, Software/System, Related Documents und Records.
- Approved oder effective darf nur behauptet werden, wenn die erforderliche externe/organisatorische Evidenz vorliegt.
- Obsolete/superseded Inhalte werden am Point of Use gegen unbeabsichtigte Verwendung kontrolliert und gemäß Retention-Regeln erhalten.
- Elektronische Records/Signatures werden nur bei tatsächlicher Anwendbarkeit gegen aktuelle Part-11-/Annex-11-/lokale Anforderungen geprüft.

## Workflow

1. Dokument-/Record-Typ, Scope und geltende Policy/Regulatory Criteria fixieren.
2. Lifecycle, Rollen, Review/Approval und Distribution/Access aufnehmen.
3. Change Impact und abhängige Artefakte bestimmen.
4. Evidenz für Approval, Effective Date, Training/Validation und Supersession prüfen.
5. Traceability und offene Compliance-/Migration-Gaps ausgeben.

## Wayfinder-kompatible Übergabe

Wenn der nächste sichere Schritt durch Unsicherheit blockiert ist, gib eine begrenzte Übergabe mit diesen Feldern aus: `facts, assumptions, hypotheses, unknowns, blockers, decisions, investigations, risks`. Investigations müssen eine einzelne Frage, benötigte Evidenz, Stop Condition und Nicht-Ziele enthalten.

## Compliance Traceability

Verknüpfe relevante Ergebnisse mit `compliance-traceability-v1` als `obligation -> product-requirement -> risk/rationale -> implementation/control -> verification -> evidence -> status`. Quellenbezogene regulatorische Claims folgen `regulatory-source-evidence-v1`.

## Grenzen

- Keine feste Dokumentnummerierung erfinden.
- Kein DMS/eQMS implementieren.
- Keine E-Signature-Compliance aus bloßem Vorhandensein einer elektronischen Signatur ableiten.

## Qualitätsgate

Pass nur, wenn Facts/Interpretations getrennt, Freshness sichtbar, zentrale Claims rückverfolgbar, Unknowns nicht positiv umgedeutet, Cross-Skill-Grenzen respektiert und die nächste Aktion ohne versteckte Regulatory-Annahme ausführbar ist.
