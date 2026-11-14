---
name: author-voice-profiler
description: Extrahiert aus authentischen deutschen oder englischen Referenztexten ein beobachtbares, genrebezogenes Author-Voice-Profil für spätere Textüberarbeitung, ohne psychologische Eigenschaften zu erfinden oder Rohkorpora unnötig zu persistieren. Verwenden, wenn ein Rewriter reproduzierbar näher an einer bestätigten persönlichen Schreibweise arbeiten soll.
userFacing: true
implicitInvocation: false
category: communication-memory
version: 0.1.0
status: candidate
owners:
  - White Label Maintainer
requires: []
outputs:
  - author-voice-profile.json
  - author-voice-profile.md
lastEvaluated: 2026-08-20
---

# Author Voice Profiler

## Zweck

Erzeuge aus vom Nutzer als authentisch bestätigten Texten ein **beobachtbares Stilprofil**. Das Profil beschreibt Schreibverhalten, nicht Persönlichkeit, Herkunft, Bildung oder andere sensible Eigenschaften.

## Eingaben

- Referenztexte mit bestätigter Autorschaft
- Sprache `de|en`
- Genre `report|memo|general`
- optional Zielgruppe und Englischvariante

Bei gemischten Genres oder Sprachen getrennte Profile erzeugen. Ein universelles Profil nur dann ableiten, wenn ein Merkmal über mehrere Teilprofile stabil ist.

## Workflow

1. **Korpus validieren:** Nur authentische, ausreichend umfangreiche Referenzen verwenden; LLM-überarbeitete Texte nicht still als Ground Truth behandeln.
2. **Merkmale extrahieren:** Satzlängenverteilung, Variation, Absatzlänge, Aktiv/Passiv, Satzanfänge, Konnektoren, Hedging, Nominalisierung, Terminologiewiederholung, Listen, Überschriften und Interpunktion erfassen.
3. **Stabile von zufälligen Merkmalen trennen:** Einzelne auffällige Sätze nicht zu Regeln hochstufen.
4. **Präferenzen integrieren:** Explizit bestätigte Regeln schlagen bloße Korpusheuristiken.
5. **Profil abstrahieren:** Keine langen Originalpassagen speichern; Beispiele nur kurz und synthetisch, wenn nötig.
6. **Confidence vergeben:** Merkmale als `high|medium|low` nach Evidenzmenge und Konsistenz kennzeichnen.

## Output-Vertrag

```json
{
  "schemaVersion": 1,
  "language": "de",
  "genre": "report",
  "audience": "expert",
  "features": [
    {"id": "sentence-rhythm", "preference": "variable", "confidence": "high", "basis": "corpus+explicit"}
  ],
  "hardRules": [],
  "softPreferences": [],
  "avoid": [],
  "provenance": {"rawCorpusPersisted": false, "sources": []}
}
```

## Schutzregeln

- **Explizite Präferenz schlägt Korpusheuristik.**
- Keine psychologischen oder demografischen Schlüsse.
- Keine Rohtexte in öffentliche Skill-Assets übernehmen.
- Fachterminologie nicht als Stilvarianz umdeuten.
- Bei kleinem Korpus Unsicherheit sichtbar lassen.

## Übergabe

`precision-language-rewriter` kann das Profil im Modus `author` verwenden. Dauerhafte, nicht-sensitive Präferenzen können nach den Regeln von `communication-memory-governance` abstrahiert übernommen werden.

## Abschluss

Abgeschlossen, wenn Sprache und Genre getrennt, stabile Merkmale mit Confidence dokumentiert, explizite Präferenzen vorrangig behandelt und keine unnötigen Rohtexte persistiert wurden.
