---
name: creative-writing-epub-delivery
description: Liefert final freigegebene Science-Storytelling- oder Fiction-Manuskripte als ElevenReader-orientiertes EPUB3 aus, nachdem ein narrativer Hörbuchnutzer-Review bestanden wurde, und erzeugt genrespezifische Voice Guidance. Verwendet den generischen EPUB3-Renderer content-neutral; tatsächliche ElevenReader-Import- und Voice-Performance werden ohne realen Plattformtest nicht behauptet.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.2.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - narrative-audiobook-listener-review
  - epub3-publication-renderer
  - artifact-production-contract
  - artifact-contract-audit
consumes:
  - narrative-listener-review.json
  - epub3-validation.json
outputs:
  - creative-writing.epub
  - creative-epub-delivery.json
  - creative-voice-guidance.md
lastEvaluated: 2026-09-22
---

# Creative Writing EPUB Delivery

## Zweck

Publikations-/Audiobook-Delivery für kreative Langformtexte. Der Skill verändert keine wissenschaftlichen Claims, keinen Fiction-Canon und keine literarische Stimme.

## Eingänge

Ein final freigegebener Manuskript-Ref, typischerweise:

- `science-story.md`; oder
- `fiction-manuscript.md`.

Der alternative Manuskript-Ref wird im Run Manifest festgehalten und deshalb nicht als statisches `consumes` modelliert.

## Ablauf

### 1. Manuskriptstatus prüfen

Science: Fidelity Gate muss bestanden sein.  
Fiction: Workshop/Revision und Continuity Gate müssen bestanden sein.

### 2. Narratives Hörbuch-Gate

`narrative-audiobook-listener-review` ausführen.

Nur `gateStatus=pass` erlaubt finale Auslieferung.

Science-Texte dürfen weiterhin fachlich dicht sein; Fiction darf nicht in Tutorial-Sprache geglättet werden.

### 3. Voice Guidance

`creative-voice-guidance.md` erzeugen:

- Sprache/Variante;
- gewünschte Erzählerrolle;
- Alter/Stimmcharakter nur als Voice-Design-Merkmal;
- Tempo;
- Artikulation;
- emotionale Bandbreite;
- Umgang mit Dialog;
- Aussprachehinweise für zentrale Eigennamen/Fachbegriffe;
- unerwünschte Eigenschaften.

Eine aktuell verfügbare ElevenReader-Stimme nur empfehlen, wenn ihre Verfügbarkeit im konkreten Lauf belastbar verifiziert ist. Andernfalls Voice-Design-Prompt liefern.

### 3.5 Author identity\n\nVor dem Rendering die Autorenidentität explizit festlegen. Falls eine owner-spezifische Pseudonym-Konvention existiert, muss das gewählte Pseudonym diese erfüllen und projektweit stabil bleiben. Für den Repository-Owner gilt [`docs/CREATIVE-AUTHOR-IDENTITY-CONVENTION.md`](../../docs/CREATIVE-AUTHOR-IDENTITY-CONVENTION.md).\n\nDas ausgewählte Pseudonym wird mindestens als EPUB-`dc:creator` gesetzt und in nachgelagerten Audiobook-/Publishing-Metadaten unverändert wiederverwendet. Eine Änderung des Pseudonyms erfolgt nur nach expliziter Nutzerentscheidung.\n\n### 4. EPUB3 rendern

`epub3-publication-renderer` ausführen.

Nach `structuralStatus=pass` darf das validierte Paket content-neutral als `creative-writing.epub` ausgeliefert werden.

### 5. ElevenReader Compatibility Status

`creative-epub-delivery.json` unterscheidet:

- `structural-pass`: EPUB3-Struktur intern validiert;
- `import-pass`: tatsächlicher ElevenReader-Import in diesem Lauf praktisch bestätigt;
- `voice-smoke-pass`: zusätzlich ein realer Hörtest der gewählten Stimme bestätigt;
- `not-tested`.

**Nie structural-pass als import-pass ausgeben.**

## Artifact Production Contract Gate

Bei substantieller Neuerstellung oder materieller Überarbeitung zuerst den gemeinsamen `artifact-production-contract` aus angemessenem Grilling erzeugen bzw. einen gültigen gefrorenen Vertrag wiederverwenden. Dieser Workflow führt den gefrorenen Vertrag aus und darf INVARIANT-Festlegungen nicht neu interpretieren. Vor Release prüft `artifact-contract-audit` die exakt auszuliefernde Revision. Ein Audit-PASS ist Voraussetzung für den anschließenden Drive-Delivery-Gate; reine deterministische Konvertierungen dürfen den bestehenden Vertrag erben.

## Drive Storage and Delivery Gate

Alle erzeugten Nicht-Code-Artefakte folgen `docs/DOCUMENT-ARTIFACT-DELIVERY-CONTRACT.md`: lokal/Sandbox nur Build-Zwischenstand; finale Datei in den owning Child-Brain-Drive-Root oder ersatzweise tenantweiten `Deliveries`-Root schreiben; Write read-back-verifizieren; Projektartefakt registrieren; dem Nutzer den beobachteten Drive-Link ausgeben. Ohne erfolgreichen Drive-Write bleibt die Delivery `pending|blocked` und ist nicht final.

Das gilt für EPUB, Delivery-Manifest und Voice Guidance. Ein `structural-pass` ohne Drive-Write ist noch keine abgeschlossene Auslieferung.
## Qualitätsgate

- **Listener Gate vor EPUB Release.**
- Keine Prosaänderung im Renderer.
- Science Fidelity/ Fiction Continuity müssen upstream bestanden sein.
- EPUB structural status muss `pass` sein.
- Eigennamen-/Fachwort-Aussprache-Risiken werden in Voice Guidance sichtbar gemacht.\n- Autorenidentität/Pseudonym ist vor Release explizit gesetzt; aktive owner-spezifische Namenskonventionen sind erfüllt.
- Aktuelle Voice-Verfügbarkeit nicht raten.
- Reale Plattformtests nur behaupten, wenn sie tatsächlich durchgeführt wurden.

## Run Manifest

```json
{
  "schemaVersion": 1,
  "manuscriptRef": "...",
  "manuscriptType": "science|fiction",\n  "authorName": "...",
  "listenerGateStatus": "pass",
  "epubValidationRef": "epub3-validation.json",
  "epubStructuralStatus": "pass",
  "elevenReaderCompatibility": "structural-pass|import-pass|voice-smoke-pass|not-tested",
  "voiceGuidanceRef": "creative-voice-guidance.md",
  "driveFileId": "observed-drive-file-id|null",
  "driveUrl": "observed-drive-url|null",
  "storageStatus": "verified|pending|blocked",
  "status": "pass|review|fail"
}
```

## Abschluss

Abgeschlossen, wenn Listener Gate und EPUB-Struktur bestanden sind, `creative-writing.epub` und Voice Guidance als verifizierte Drive-Objekte vorliegen und der ElevenReader-Status exakt die tatsächlich geprüfte Ebene beschreibt.
