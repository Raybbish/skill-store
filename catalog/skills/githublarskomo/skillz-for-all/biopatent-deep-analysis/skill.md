---
name: biopatent-deep-analysis
description: Analysiert ausgewählte Biotech-/IVD-Patentfamilien technisch-forensisch bis auf Claim-Element-, Sequenz-, Konstrukt-, Epitop-/Bindungs-, Assay- und Re-Engineering-Ebene, trennt beanspruchten Schutzbereich, konkrete Offenbarung und experimentelle Evidenz und erzeugt eine nachvollziehbare technische Rekonstruktion; keine anwaltliche Claim Construction, FTO Opinion oder ungekennzeichnete Erfindung neuer biologischer Sequenzen.
userFacing: true
implicitInvocation: true
category: research-knowledge
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - patent-landscape-analysis
  - research-to-evidence-note
outputs:
  - biopatent-dossier.json
  - biopatent-dossier.md
  - biopatent-claim-structure-map.json
  - biopatent-sequence-map.json
  - biopatent-binding-evidence.json
  - biopatent-reconstruction.md
lastEvaluated: 2026-08-27
---

# Biopatent Deep Analysis

## Zweck

Erzeuge für eine oder mehrere bereits identifizierte, technisch relevante Biopatentfamilien eine tiefgehende, evidenzgebundene Analyse. Der Skill sitzt zwischen `patent-landscape-analysis` und einem ggf. nachgelagerten `freedom-to-operate-assessment`.

Er beantwortet insbesondere:

- Was ist das konkrete biologische/biochemische Funktionsprinzip?
- Welche technischen Merkmale werden tatsächlich beansprucht und welche nur beschrieben?
- Welche Sequenzen, Sequenzvarianten, CDRs, Epitope, Konstrukte, Primer/Probes, Antigene, Enzyme oder anderen biologischen Reagenzien sind offenbart?
- Welche Bindungs-, Affinitäts-, Kinetik-, Spezifitäts- und Kreuzreaktivitätsdaten sind experimentell belegt?
- Welche Assayarchitektur, Reaktionslogik, Signalbildung und Sample-/Matrixbedingungen werden verwendet?
- Welche konkrete Ausführungsform lässt sich aus der Offenbarung technisch rekonstruieren?
- Welche Merkmale sind breit beansprucht, welche eng an Sequenzen, Schwellenwerte, Kombinationen oder Verfahrensschritte gebunden?
- Welche technischen Design-space- und Re-Engineering-Hypothesen ergeben sich, ohne daraus eine Rechtsfreigabe abzuleiten?

## Grenze

Der Skill liefert **keine anwaltliche Claim Construction**, keine Patentability-, Validity-, Enforceability- oder FTO-Opinion und kein abschließendes Infringement-Urteil.

`Re-Engineering` bedeutet hier zunächst **Rekonstruktion öffentlich offenbarter technischer Ausführungsformen** und Analyse des offenbarten Design Space. Neue biologische Sequenzen, neue Bindermoleküle oder neue operative Wet-Lab-Optimierungen werden nicht automatisch erfunden. Wenn der Nutzer darüber hinaus neues Biological Design verlangt, ist dies als separater Schritt zu behandeln und anwendbare Sicherheits- und Fachgrenzen gelten weiterhin.

## Trigger

Verwenden bei:

- Deep Dive in konkrete Antikörper-, Biomarker-, Diagnostik-, Assay-, Protein-, Nukleinsäure-, Enzym-, Zell-/Rezeptor- oder Plattformpatente,
- Fragen nach exakten Funktionsprinzipien und technischen Ausführungsformen,
- Analyse von SEQ ID NOs, CDRs, VH/VL, Epitopen, Mutationen, Varianten, Primer-/Probe-Sets oder Konstrukten,
- Analyse von KD, ka, kd, EC50, IC50, Signal-/Cutoff-Daten, Kreuzreaktivität oder Spezifität,
- Rekonstruktion eines patentierten Assays oder Reagenzkonzepts aus öffentlicher Offenbarung,
- Vorbereitung eines technisch belastbaren Inputs für FTO, Technology Due Diligence oder interne R&D-Strategie.

Nicht als Ersatz für eine breite Patentsuche verwenden. Wenn relevante Familien noch nicht belastbar identifiziert sind, zuerst `patent-landscape-analysis` ausführen.

## Voraussetzungen

Vor Beginn fixieren:

1. Zielpatentfamilie(n) und relevante Member/Publikationen,
2. Analyseziel und Entscheidungskontext,
3. Zieljurisdiktionen, wenn Claim Scope oder spätere FTO-Nutzung relevant ist,
4. `asOf`,
5. verfügbare Claim-Texte, Beschreibung, Beispiele, Figuren, Tabellen und Sequence Listings,
6. bekannte Literatur-, Produkt- oder Regulatory-Quellen für Cross-Validation.

Fehlende Dokumentbestandteile werden als Evidence Gap ausgewiesen. Kein Rekonstruktionsdetail darf durch Halluzination ergänzt werden.

## Evidenzmodell

Jede technische Aussage muss einem Evidenztyp zugeordnet werden:

- `CLAIMED`: Merkmal ist Bestandteil eines Anspruchs oder Anspruchsbereichs.
- `DISCLOSED_GENERAL`: Merkmal wird allgemein in Beschreibung/Definitionen offenbart.
- `DISCLOSED_EMBODIMENT`: konkrete Ausführungsform oder Kombination wird beschrieben.
- `EXPERIMENTALLY_DEMONSTRATED`: durch Beispiel, Tabelle, Figur oder Messdaten belegt.
- `SEQUENCE_LISTING`: direkt aus SEQ ID / ST.25-/ST.26-Listing extrahiert.
- `EXTERNAL_CORROBORATION`: aus externer Primärquelle bestätigt.
- `INFERRED`: technisch plausible Ableitung, nicht ausdrücklich offenbart.
- `UNKNOWN`: nicht ausreichend belegbar.

`CLAIMED` darf nicht automatisch als experimentell realisiert behandelt werden. `DISCLOSED_GENERAL` darf nicht automatisch als bevorzugtes Embodiment gelten. `INFERRED` muss sichtbar bleiben.

## Workflow

### 1. Family- und Dokumentbaseline einfrieren

Übernimm aus `patent-landscape-analysis` mindestens `familyId`, Priorität, relevante Claim-Scope-Branches, Members und Statuskontext. Wähle pro Analyseziel die tatsächlich relevanten Patent-/Application-Member aus.

Dokumentiere pro verwendeter Quelle:

- Publication/Application/Patent Number,
- Jurisdiktion,
- Dokumenttyp und Claim-Version,
- Datum/Version,
- Quelle,
- verfügbare Bestandteile: claims, description, examples, figures, tables, sequence listing, prosecution material.

### 2. Technisches Funktionsprinzip rekonstruieren

Zerlege die Erfindung in eine kausale technische Kette:

`Input/Sample -> Biological Recognition/Reaction -> Molecular Interaction -> Assay/Process Transformation -> Detection/Readout -> Decision/Output`.

Für jede Stufe erfasse:

- Inputs und Voraussetzungen,
- biologisches Target/Substrat,
- Reagenz/Konstrukt,
- Interaktion oder Reaktion,
- physikalisch-chemischen Mechanismus,
- Signalentstehung,
- Signalverarbeitung/Thresholding,
- Output und Intended Technical Effect,
- Evidenztyp und Source References.

Erzeuge zusätzlich eine `mechanismConfidence` und offene mechanistische Fragen.

### 3. Claims atomisieren und Schutzstruktur abbilden

Zerlege relevante Independent Claims in atomare technische Elemente. Dependent Claims werden als zusätzliche Einschränkungen oder Varianten verknüpft.

Pro Claim-Element erfasse:

- `elementId`, Claim und Jurisdiktion,
- semantisch normalisiertes technisches Merkmal,
- Kategorie: target, sequence, binder, epitope, sample, reagent, assay-format, detection, threshold, computation, workflow-step, manufacturing, composition oder andere,
- zwingend/optional im konkreten Claim,
- Parameter/Ranges/Alternativen,
- definierte Begriffe aus der Beschreibung,
- Support in Beschreibung/Beispielen,
- relevante Sequence IDs oder Figuren,
- bekannte Prosecution-/Interpretationsfragen.

Schutzbereich wird als **technische Claim-Struktur** dargestellt, nicht als rechtlich verbindliche Auslegung.

Kennzeichne insbesondere:

- genus vs species,
- funktionale vs strukturelle Definition,
- offene Formulierungen und Markush-Gruppen,
- Sequenzidentitäts-/Homologiegrenzen,
- CDR-/Framework-/Isotyp-Beschränkungen,
- Epitope oder Competition-Binding-Definitionen,
- numerische Ranges, Cutoffs und Toleranzen,
- kombinatorische Merkmale,
- method-, kit-, composition- und use-claim Unterschiede.

### 4. Sequence Listing vollständig erschließen

Sequence Listings sind bevorzugt aus der originären maschinenlesbaren Quelle zu extrahieren. Für neuere Anmeldungen ST.26 XML berücksichtigen; für ältere Anmeldungen können ST.25-Listings maßgeblich sein.

Für jede relevante Sequenz erfasse mindestens:

- `seqId`, Typ DNA/RNA/Protein,
- Länge,
- normalisierte Sequenz,
- Quelle und Listing-Standard,
- Beschreibung/Feature Annotation,
- patentinterne Bezeichnung,
- referenzierte Claims/Examples/Figures,
- biologische Rolle,
- relationierte Sequenzen.

Berechne bei technischer Verarbeitung eine stabile Sequenz-Checksumme, damit identische Sequenzen über unterschiedliche SEQ IDs oder Familienmember erkannt werden können.

### 5. Sequenz- und Konstruktbeziehungen ableiten

Für Proteine/Antikörper/Binder, soweit relevant:

- VH/VL bzw. Domänenstruktur,
- CDR1/2/3 nach im Patent verwendeter oder explizit dokumentierter Nummerierung,
- Frameworks,
- Signal-/Leader-Sequenzen,
- Fc/Isotyp,
- Linker/Tags/Fusionspartner,
- Punktmutationen/Deletionen/Insertionen,
- Wildtyp-/Referenzbezug,
- identische/nahe Varianten,
- Claim-relevante Identitätsschwellen.

Für Nukleinsäuren, soweit relevant:

- Targetregion und Orientierung,
- Primer-/Probe-Paare,
- Amplicon-/Hybridisierungsbezug,
- Modifikationen/Labels,
- Spacer/Linker,
- degenerierte Positionen,
- Variantengruppen,
- Claim-relevante Identitäts-/Mismatch-Regeln.

Unterschiede zwischen Sequenzen werden als explizite Delta-Map dokumentiert; keine bloße Behauptung „ähnlich“.

### 6. Epitop- und Bindungsarchitektur analysieren

Falls Binder/Antikörper/Rezeptoren betroffen sind, erfasse getrennt:

- direkt sequenzdefiniertes Epitop,
- linear vs conformational,
- Domain-/Residue-Mapping,
- Competition-/Blocking-Gruppen,
- Pairing von Capture/Detection Binder,
- Sandwich-Kompatibilität,
- Species-/Isoform-/PTM-Spezifität,
- Cross-Reactivity und Interferenzen,
- funktionale Binding-Definitionen in Claims.

Eine Competition-Binding-Definition wird nicht automatisch in ein exaktes Residue-Epitop umgedeutet.

### 7. Bindungs- und Performance-Daten normalisieren

Extrahiere alle entscheidungsrelevanten quantitativen Daten mit Messkontext:

- KD,
- ka/kon,
- kd/koff,
- EC50/IC50,
- LOD/LOQ falls assayrelevant,
- Recovery, Precision, Specificity, Sensitivity,
- Cross-Reactivity,
- Signal-/Background-Ratio,
- Cutoffs/Thresholds,
- weitere biomolekulare oder analytische Kennzahlen.

Pro Wert zwingend dokumentieren:

- exakter Parameter,
- Wert und Einheit,
- Molekül-/Reagenz-ID,
- Messmethode/Plattform,
- Immobilisierung/Assayformat soweit bekannt,
- Temperatur/Puffer/pH soweit berichtet,
- Sample/Matrix,
- Experiment/Example/Figure/Table,
- `evidenceType`,
- `measurementContextCompleteness`.

Werte aus unterschiedlichen Methoden dürfen nicht ohne Kontext als direkt vergleichbar gerankt werden.

### 8. Assay-, Kit- und Prozessarchitektur rekonstruieren

Erzeuge für diagnostische/biochemische Systeme eine strukturierte Stückliste und Ablaufbeschreibung:

- biologische Reagenzien,
- Capture-/Detection-Reagenzien,
- Standards/Kalibratoren/Kontrollen,
- Labels/Substrate,
- Oberflächen/Particles/Carriers,
- Sample Type und Vorbehandlung,
- Inkubations-/Reaktionsschritte,
- Wasch-/Trennschritte,
- Detection Principle,
- Auswertealgorithmus/Threshold,
- wesentliche Konzentrationen/Zeiten/Temperaturen nur soweit öffentlich konkret offenbart,
- Abhängigkeiten zwischen Komponenten.

Unterscheide `required-by-claim`, `preferred`, `example-only` und `optional`.

### 9. Re-Engineering / technische Rekonstruktion erstellen

Erzeuge eine `reconstructionBaseline`, die ausschließlich auf öffentlich belegten Informationen basiert.

Sie enthält:

- minimal technisch notwendige Komponenten für die konkret analysierte Ausführungsform,
- bekannte Sequenzen/Konstrukte,
- bekannte Interaktionspaare,
- bekannte Assay-/Prozessparameter,
- bekannte Performance-/Binding-Eigenschaften,
- fehlende kritische Parameter,
- technische Abhängigkeiten,
- Confidence pro Baustein.

Klassifiziere Rekonstruierbarkeit:

- `HIGH`: wesentliche biologische Reagenzien, Sequenzen und Prozesslogik konkret offenbart,
- `MEDIUM`: Kernprinzip rekonstruierbar, aber mehrere kritische Parameter fehlen,
- `LOW`: nur generische oder funktionale Offenbarung; zentrale konkrete Ausführungsdetails fehlen.

**Keine stillschweigende Vervollständigung fehlender Rezepturen, Sequenzen oder optimierter Laborbedingungen.**

### 10. Design Space und technische Umgehungshypothesen ableiten

Aus Claim-Elementen und Embodiment-Details darf ein technischer Design Space abgeleitet werden. Trenne:

- `claim-critical` Merkmale,
- `performance-critical` Merkmale,
- `example-specific` Merkmale,
- `apparently-interchangeable` Merkmale,
- `unknown`.

Formuliere mögliche technische Änderungsrichtungen als Hypothesen, z. B. anderes Target-Epitop, anderer Binder, anderes Assayformat, andere Detektionschemie oder anderer Workflow-Schritt, **ohne** zu behaupten, dass dies patentfrei ist.

Wenn eine konkrete Produktkonfiguration geprüft werden soll, route anschließend zu `freedom-to-operate-assessment`.

### 11. Prosecution und Family Drift prüfen

Bei entscheidungsrelevanten Familien analysiere, soweit verfügbar:

- Änderungen Independent Claims zwischen Publikation und Grant,
- relevante Amendments,
- aufgegebene/gestrichene Anspruchsrichtungen,
- Continuation-/Divisional-Drift,
- Disclaimer oder hinzugekommene Limitationen,
- Unterschiede zwischen US/EP/CN/JP oder anderen Zieljurisdiktionen.

Prosecution History wird als Evidenz für offene Interpretationsfragen dokumentiert, nicht als eigenständige verbindliche Claim Construction.

### 12. Externe technische Cross-Validation

Vergleiche Patentoffenbarung mit Primärquellen, soweit verfügbar:

- Publikationen der Erfinder/Anmelder,
- strukturelle Datenbanken,
- UniProt/GenBank/INSDC,
- Produkt-/Regulatory-Dokumente,
- Konferenzdaten oder andere Primärevidenz.

Externe Quellen dürfen Patentoffenbarung ergänzen, aber nicht unmarkiert in das Patent hineininterpretiert werden.

### 13. Synthese und Confidence

Bewerte getrennt:

- `claimStructureConfidence`,
- `sequenceExtractionConfidence`,
- `mechanismConfidence`,
- `bindingEvidenceConfidence`,
- `reconstructionConfidence`,
- `legalStatusConfidence`.

Jede Confidence benötigt Begründung und wichtigste Evidence Gaps.

## Output-Verträge

### `biopatent-dossier.json`

Enthält mindestens:

```json
{
  "scope": {},
  "asOf": "YYYY-MM-DD",
  "families": [],
  "documents": [],
  "mechanism": {},
  "claimStructureSummary": {},
  "sequenceSummary": {},
  "bindingSummary": {},
  "assayOrProcessArchitecture": {},
  "reconstructionSummary": {},
  "designSpace": [],
  "prosecutionQuestions": [],
  "externalCorroboration": [],
  "confidence": {},
  "evidenceGaps": [],
  "nextActions": []
}
```

### `biopatent-claim-structure-map.json`

Enthält Patent Member, Jurisdiktion, Claim-Version, Independent/Dependent Claims, atomare Claim-Elemente, Definitionen, strukturelle/funktionale Einschränkungen, Sequence-/Epitope-/Range-Bezüge, Source References und offene Interpretationsfragen.

### `biopatent-sequence-map.json`

Enthält jede relevante SEQ ID, normalisierte Sequenz, Typ, Länge, Checksumme, Annotation, Rolle, Claims/Examples/Figures, Konstruktbeziehungen, CDR-/Domain-/Mutation-/Primer-/Probe-Mapping sowie Sequenz-Deltas.

### `biopatent-binding-evidence.json`

Enthält quantitative und qualitative Binding-/Performance-Daten mit Messkontext, Einheit, Methode, Reagenz-/Sequence-Bezug, Source Reference, Evidenztyp und Vergleichbarkeitswarnungen.

### `biopatent-reconstruction.md`

Menschenlesbare Rekonstruktion des Funktionsprinzips und der konkret offenbarten Ausführungsform mit Stückliste, Sequenz-/Konstruktbezug, Interaktionslogik, Assay-/Prozessschritten, bekannten Parametern, fehlenden kritischen Angaben, Rekonstruierbarkeit und Design-space-Hypothesen.

### `biopatent-dossier.md`

Executive Technical Summary mit:

1. Erfindungskern,
2. wichtigste Familien-/Claim-Scope-Branches,
3. Funktionsprinzip,
4. Claim-Struktur,
5. relevante Sequenzen/Konstrukte,
6. Epitop-/Binding-Eigenschaften,
7. experimentelle Evidenz,
8. Rekonstruktion,
9. Schutzbereichstreiber und technische Design-space-Hypothesen,
10. Evidence Gaps,
11. Confidence,
12. empfohlene nächste Schritte.

## Routing

- breite Familienfindung und Search Saturation -> `patent-landscape-analysis`
- Quellenqualität/Evidenzsynthese -> `research-to-evidence-note`
- konkrete Produkt-/Prozesskonfiguration gegen konkrete Claims -> `freedom-to-operate-assessment`
- Technologie-/Transaktionsbewertung -> `technology-due-diligence`
- verbindliche Claim Construction, Validity, Enforceability oder FTO -> qualifizierter Patent Counsel

## Memory Path

Persistenzwürdig sind generische Extraktionsschemata, Sequenznormalisierung, Evidenztypen, Bindungsdaten-Schema, Claim-Atomisierung und Rekonstruktionslogik. Konkrete aktuelle Legal-Status-Daten, vertrauliche Produktmerkmale, nicht veröffentlichte Sequenzen oder Counsel-Einschätzungen bleiben projektgebunden/run-only.

## Qualitätsgate

Pass nur wenn:

- Landscape/Familienkontext nachvollziehbar ist,
- Claim, allgemeine Offenbarung, konkrete Ausführungsform und experimentelle Evidenz getrennt bleiben,
- relevante Claims atomisiert sind,
- relevante Sequence Listings systematisch ausgewertet sind oder ihr Fehlen als Gap dokumentiert ist,
- Sequenz-/Konstruktbeziehungen explizit statt nur narrativ beschrieben sind,
- Binding-/Performance-Daten immer Messkontext und Quelle enthalten,
- Rekonstruktion nur belegte Informationen verwendet und fehlende kritische Parameter sichtbar lässt,
- Competition Binding nicht automatisch als exaktes Residue-Epitop ausgegeben wird,
- Family-Level-Relevanz nicht als einheitlicher Claim Scope behandelt wird,
- Design-space-Hypothesen nicht als Patentfreiheit dargestellt werden,
- keine anwaltliche Opinion simuliert wird.

## Fehlerbehandlung

Wenn Sequence Listing, Claim-Version, Examples, Figures oder Prosecution History fehlen, liefere eine partielle Analyse mit klarer Gap-Liste. Wenn quantitative Daten ohne Messkontext berichtet werden, übernehme den Wert nur mit entsprechender Vergleichbarkeitswarnung. Wenn zwei Dokumente oder Familienmember widersprüchliche technische Angaben enthalten, führe beide Varianten mit Source Reference und Confidence statt sie stillschweigend zu harmonisieren.

## Abschlusskriterien

Abgeschlossen ist der Skill, wenn relevante Family-/Member-Baseline fixiert, Funktionsprinzip kausal rekonstruiert, relevante Claims atomisiert, Sequenzen/Konstrukte und Binding-/Performance-Daten evidenzgebunden erfasst, eine nachvollziehbare Reconstruction Baseline erstellt, Design Space und Evidence Gaps sichtbar und alle rechtlichen Grenzen sauber markiert sind.