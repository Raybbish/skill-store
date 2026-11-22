---
name: character-voice-fingerprint
description: Modelliert und prüft unterscheidbare Figurenstimmen aus Herkunft, sozialem Kontext, Beruf, Beziehung, Status und Stresszustand, ohne karikierenden Dialekt zu erzeugen. Verwenden für Ensemble-Fiction vor und während des Draftings sowie für Voice-Collision-Audits, Blind Attribution und Speaker-Swap-Tests.
userFacing: true
implicitInvocation: true
category: workflow
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires:
  - ensemble-character-architecture
consumes:
  - character-ensemble.json
  - fiction-manuscript.md
outputs:
  - character-voice-fingerprint.json
  - voice-collision-register.json
  - character-voice-audit.json
lastEvaluated: 2026-09-10
---

# Character Voice Fingerprint

## Zweck

Behandle Figurenstimme als Teil der Charakterarchitektur und nicht als spätes Oberflächen-Lektorat.

Ziel ist nicht, jeder Figur eine auffällige Sprechmarotte zu geben. Ziel ist, dass Ausdruck aus Biografie, sozialer Position, Tätigkeit, Beziehung und momentaner Belastung hervorgeht und auch in längeren Ensemble-Dialogen unterscheidbar bleibt.

## Voice-Modell pro Figur

Mindestens soweit relevant:

- Syntax und bevorzugte Satzkomplexität;
- typische Satzlänge und Rhythmus;
- Wortschatzfelder;
- bevorzugte Metaphernquellen;
- Grad von Direktheit/Indirektheit;
- Höflichkeit, Status- und Anredeverhalten;
- Gesprächsstrategie: fragen, definieren, beschwichtigen, dominieren, ausweichen, erzählen, testen;
- Umgang mit Unsicherheit;
- Humor-/Ironiemuster;
- emotionale Explizitheit;
- vermiedene Wörter/Themen;
- berufs- oder milieugeprägte Präzision;
- Stress-Transformation;
- Intimitäts-Transformation;
- Macht-/Status-Transformation;
- typische nonverbale Ergänzungen, soweit textlich relevant;
- bekannte Collision Risks mit anderen Figuren.

## Herkunft ohne Karikatur

Geographische, nationale, soziale oder familiäre Herkunft darf Syntax, Register, Referenzen, Höflichkeit, Rhythmus und Metaphern prägen.

Standardmäßig verboten:

- phonetisch ausgeschriebener Akzent als Hauptmittel;
- stereotype Dialektmarker;
- ethnische oder soziale Karikatur;
- künstliche Grammatikfehler nur zur Markierung von Fremdheit.

Dialekt oder regionale Sprache nur bei bewusster Autorentscheidung und konsistenter, respektvoller Ausführung.

## Baseline vor Drafting

Für tragende Figuren Voice Fingerprints möglichst **vor** längeren Dialogkapiteln anlegen.

Der Draft Contract kann referenzieren:

- aktive Fingerprint-Version;
- Status/Beziehung der Gesprächspartner;
- Stresszustand;
- erlaubte Abweichung vom Baseline-Register.

Voice ist dynamisch: Eine Figur darf sich unter Stress, Machtverlust, Intimität oder Entwicklung verändern, solange die Veränderung aus dem Zustand erklärbar ist.

## Voice Collision Register

Erfasse wiederkehrende Cross-Character-Kollisionen:

- identische Kurzphrasen;
- gleiche Negations-/Korrekturformeln;
- gleiche rhetorische Frageformen;
- gleiche Metapherndomäne;
- identischer trockener Humor;
- gleiche Pausen-/Fragmentstruktur;
- narrator-like explanatory cadence in mehreren Figuren.

Ein einzelnes gemeinsames Wort ist kein Fehler. Relevant ist ein Muster, das Blind Attribution oder psychologische Differenzierung schwächt.

## Pflichtchecks

### Speaker-Swap-Test

Tausche gedanklich Sprecher zweier Dialogzeilen.

Wenn die Zeile ohne Bedeutungs-/Status-/Stimmverlust problemlos austauschbar ist, prüfe auf generische Formulierung.

### Blind Attribution Test

Entferne Namen/Tags aus repräsentativen Dialogpassagen.

Frage, ob Sprecher anhand von:

- Syntax;
- Prioritäten;
- Metaphern;
- Statusverhalten;
- Wissenszugang;
- Gesprächsstrategie

plausibel unterscheidbar bleiben.

Nicht jede einzelne Zeile muss eindeutig sein; tragende Cluster schon.

### Kurzphrasen-Kollisionsscan

Suche auffällige wiederkehrende Ein-/Zweiwort-Reaktionen und Korrekturmarker über mehrere Figuren.

### Metaphern-Domain-Check

Prüfe, ob Figuren bevorzugt aus unterschiedlichen Erfahrungsräumen denken und sprechen, sofern Biografie das erwarten lässt.

### Status-/Anrede-Check

Prüfe Veränderungen zwischen:

- Vorgesetzten/Untergebenen;
- Fremden/Vertrauten;
- Öffentlichkeit/Privatheit;
- Sicherheit/Bedrohung.

### Narrator-Contamination-Check

Prüfe, ob mehrere Figuren dieselbe abstrakte Erklärsprache des Erzählers übernehmen, obwohl ihre Denk- und Erfahrungsmodelle auseinanderliegen sollten.

## Gate

Finding-Klassen:

- `critical`: zentrale Figuren über längere Strecken sprachlich/funktional ununterscheidbar und dadurch Arc/Agency beschädigt;
- `major`: wiederkehrende Collision über mehrere Szenen/Kapitel;
- `minor`: lokaler Echo-/Catchphrase-/Rhythmusbefund;
- `intentional-shared-register`: bewusst gemeinsame Institutions-/Gruppensprache mit dokumentierter Begründung.

Bei Major/Critical Finding keine Act-Härtung ohne Revision oder bewusste Disposition.

## Schutzregeln

- Keine globale Stilglättung nur zur Maximierung von Differenz.
- Gemeinsamer House Style darf bestehen bleiben.
- Charaktereigene trockene Kürze, Humor oder Fachsprache nicht entfernen, nur weil andere Figuren ebenfalls knapp sprechen.
- Differenzierung erfolgt aus Figur und Situation, nicht aus künstlichen Ticks.
- Voice-Revision darf Canon, Wissen, Reveal oder Beziehung nicht verändern, sofern dies nicht separat autorisiert ist.

## Output Contract

`character-voice-fingerprint.json` enthält stabile Voice-Profile pro Figur und Zustandsvarianten.

`voice-collision-register.json` enthält:

- pattern;
- affectedCharacters;
- locations;
- severity;
- likelyRootCause;
- proposedDifferentiation;
- status.

`character-voice-audit.json` dokumentiert ausgeführte Tests, Findings, geschützte Voice-Stärken und Gate-Status.

## Abschluss

Abgeschlossen, wenn die tragenden Figuren über strukturierte Voice-Profile verfügen und relevante Mehrfigurenpassagen keinen offenen Major/Critical Collision-Befund besitzen.
