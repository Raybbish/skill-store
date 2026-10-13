---
name: competition-antitrust-law-specialist
description: Analysiert deutsches/EU-Kartellrecht für Vereinbarungen, Wettbewerberkontakte, Vertrieb, Exklusivität, IP-Lizenzen, Marktbeherrschung, Informationsaustausch und Transaktionen einschließlich Merger-Control-Routing. Verwenden für GWB-/Art.-101/102-AEUV-Fragen; Marktdefinition, Freistellung, Filing und Behördenrisiko aktuell und evidenzbasiert prüfen.
userFacing: true
implicitInvocation: true
category: legal-specialist
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - current-law-context
  - legal-client-strategy
  - privilege-and-counsel-routing
outputs:
  - competition-law-assessment.json
  - antitrust-risk-gates.json
  - merger-control-route-map.json
lastEvaluated: 2026-08-28
---

# Competition / Antitrust Law Specialist

## Zweck

Bewerte Wettbewerbsbeschränkungen und Marktverhalten aus tatsächlichem Verhalten, Parteienrollen, Markt-/Wettbewerbskontext und Jurisdiktion. Vertragsbezeichnungen wie „strategic partnership“, „exclusive“, „recommended price“ oder „license“ bestimmen die kartellrechtliche Einordnung nicht.

## Current-Law Gate

Aktuelles GWB, Art. 101/102 AEUV, einschlägige EU-Verordnungen/Leitlinien und Behörden-/Gerichtspraxis über `current-law-context` verifizieren. Block Exemptions und Schwellenwerte niemals aus statischem Gedächtnis anwenden.

## Analysefelder

1. Parteien und Wettbewerbsverhältnis: horizontal, vertikal, dual distribution, potential competition, buyer/supplier, association/JV.
2. Verhalten/Vereinbarung: Zweck, Wirkung, Informationsaustausch, Preis-/Gebiets-/Kundenrestriktionen, Exklusivität, Non-Compete, MFN, Bundling/Tying, Boycott, standardization, joint purchasing/R&D.
3. Markt-/Effektkontext: relevante Produkte/Regionen, Marktpositionen, Alternativen, Entry Barriers und betroffene Handelsströme; keine Scheingenauigkeit bei Marktanteilen.
4. Art. 101/GWB: restriction by object/effect, mögliche Freistellung/Exemption und nicht freigestellte Kernbeschränkungen aktuell prüfen.
5. Art. 102/GWB §§ 18–20: Dominanz/relative Marktmacht und mögliche Missbrauchstatbestände getrennt prüfen.
6. Trade Associations/Meetings: Agenda, Teilnehmer, sensible Daten, Zukunftspreise/-mengen, Kundenzuordnung und clean-team/aggregation safeguards.
7. IP/Technology Transfer: `ip-licensing-law-specialist` für Rights/License Structure; kartellrechtliche Restrictions hier analysieren.
8. Transactions: nationale/EU/sonstige Merger-Control-Routen, Standstill/Gun Jumping, filing/closing conditions und information exchange getrennt prüfen.

## Competitor Contact Gate

Bei Wettbewerberkontakten Preis-, Kosten-, Mengen-, Kapazitäts-, Kunden-, Pipeline-, Strategie- und andere kommerziell sensible Informationen als High-Risk-Input behandeln. Zulässigkeit nicht aus NDA oder Meeting-Zweck ableiten. Bei akuter/hoher Sanktionsexposition Counsel Gate.

## Merger-Control Gate

Kein „no filing required“ ohne aktuellen Jurisdiktions-, Transaction-Control-, Umsatz-/sonstigen Trigger- und ggf. Verweisungs-/Sonderregel-Check. Signing, filing clearance und closing authority getrennt halten.

## Privilege / Investigation Gate

Bei Dawn Raid, Behördenanfrage, Leniency, Kartellverdacht oder interner Untersuchung `privilege-and-counsel-routing` und `internal-investigation-workflow` früh aktivieren. EU-kartellrechtlichen Schutz interner In-house-Kommunikation nicht pauschal annehmen.

## Qualitätsgate

Pass nur, wenn Parteienrollen, Verhalten, Markt-/Effektannahmen, EU/deutsche Rechtsbasis, mögliche Exemption, Sanktion-/Enforcement-Risiko, Merger-Control- und Counsel-Gates getrennt und mit `asOf` dokumentiert sind.