---
description: "Ingestisce una fonte da raw/ nella wiki seguendo il workflow definito in CLAUDE.md o nella skill software-wiki conventions. Workflow interattivo — discute i takeaway con l'utente prima di scrivere, aggiorna feature/component pages, marca contraddizioni, logga."
disable-model-invocation: true
argument-hint: "<source-slug-o-filename>"
---

# Ingest di una fonte

Processi una fonte presente in `./raw/` e la integri nella wiki secondo il workflow definito in `./CLAUDE.md` (o, se assente, nella skill `software-wiki:conventions`).

## Pre-flight

1. **Identifica il source file** da `$ARGUMENTS`:
   - Se è un nome esatto presente in `./raw/`, usa quello.
   - Se è uno slug parziale, fai `ls ./raw/ | grep -i $ARGUMENTS` e mostra match. Se più di uno, chiedi all'utente di disambiguare.
   - Se nessun match, segnala e fermati. Suggerisci `/software-wiki:collect` se l'utente non ha ancora raccolto fonti.

2. **Verifica che la wiki sia bootstrappata**: `./CLAUDE.md`, `./wiki/index.md`, `./wiki/log.md` devono esistere. Altrimenti suggerisci `/software-wiki:bootstrap`.

3. **Carica la fonte di verità per il workflow**:
   - Se `./CLAUDE.md` esiste → leggilo, è autoritativo per QUESTA wiki (può avere personalizzazioni).
   - Altrimenti → carica lo schema dalla skill `software-wiki:conventions`.

4. **Carica lo stato corrente della wiki**: leggi `wiki/index.md` per orientarti su cosa esiste già. Identifica le feature/component/concept esistenti che la fonte potrebbe toccare.

## Workflow di ingest

Segui i passi del workflow di ingest dello schema. In sintesi (ma il `CLAUDE.md` del progetto vince in caso di dettagli divergenti):

### 1. Lettura

Leggi il source file. Se grande (> 5000 righe / contiene allegati binari / è un PDF), riepiloga la struttura prima di procedere e chiedi se l'utente vuole focus su parti specifiche.

### 2. Discussione dei takeaway — STEP CRITICO

**Non scrivere niente prima di questo step.**

Estrai 3-6 takeaway dalla fonte e mostrali all'utente:
- Cosa è veramente nuovo rispetto a quello che già c'è in wiki?
- Quali feature/component/concept tocca?
- Ci sono contraddizioni con quello che `index.md` indica come stato attuale?
- Ci sono decisioni architetturali che meriterebbero un ADR?

**Aspetta che l'utente confermi o ridiriga prima di procedere.** Chiedi cosa enfatizzare se non è ovvio.

### 3. Pagina sorgente

Crea `wiki/sources/<slug>.md`:
- Frontmatter: `type: source`, `kind` (article/spec/transcript/release-notes/...), `ingested_on: YYYY-MM-DD`, `original_path` (leggi dal sidecar `.source.json` se presente, altrimenti `raw/<slug>`).
- Body: riassunto in prosa, citazioni testuali brevi tra virgolette quando servono per precisione, lista delle pagine wiki che vengono toccate da questa ingest.

### 4. Aggiornamento delle pagine

Aggiorna in ordine, e per ogni pagina toccata aggiorna `last_updated` e aggiungi/aggiorna `sources`:

a. **Feature page(s)** in `wiki/features/` — sia vista utente sia vista tecnica se la fonte tocca entrambe. Se una feature non esiste ancora ed è giustificata, creala.

b. **Component / API / data-model page(s)** in `wiki/tech/` — solo se la fonte introduce dettagli tecnici nuovi. Linka dalla feature page.

c. **User task / concept / troubleshooting page(s)** in `wiki/user/` — se la fonte aggiunge passi operativi o concetti nuovi. Linka dalla feature page.

d. **Concept / glossary** se introduce terminologia nuova.

e. **Nuovo ADR** in `wiki/decisions/NNNN-titolo.md` se la fonte documenta una scelta architetturale. **Non modificare ADR esistenti**: se cambia una decisione precedente, scrivi un nuovo ADR con `status: accepted` e `supersedes: NNNN-vecchio-titolo`.

### 5. Contraddizioni — REGOLA INVIOLABILE

Se la fonte contraddice contenuto esistente:
- **NON sovrascrivere** il vecchio.
- Aggiungi un blocco nella pagina interessata:
  ```
  > ⚠️ **Contraddizione non risolta**
  > - Versione precedente (fonte: [[sources/...]], data X): ...
  > - Versione nuova (fonte: [[sources/<slug>]], data Y): ...
  > Da chiarire: <domanda specifica>.
  ```
- Aggiungi la domanda alla sezione `## Domande aperte` della pagina.
- Logga la contraddizione esplicitamente nel `log.md` (vedi step 7).

### 6. Index

Se sono state create pagine nuove, aggiungi una riga in `wiki/index.md` nella sezione corretta. Una riga = link + riassunto in una frase + status se rilevante.

### 7. Log

Append a `wiki/log.md`:

```
## [YYYY-MM-DD] ingest | <source-slug>
- Toccate: [[features/...]], [[tech/components/...]], ...
- Nuove pagine: [[...]] (se ce ne sono)
- Contraddizioni: <descrizione breve, oppure "nessuna">
- Note: <cosa è stato deciso di enfatizzare, decisioni di scope>
```

### 8. Riepilogo all'utente

Mostra:
- Lista pagine create/aggiornate (path + cosa è cambiato in una riga).
- Eventuali contraddizioni marcate.
- Eventuali domande aperte aggiunte.
- Suggerimento per il prossimo step: ingest di un'altra fonte, query, lint, o stop e commit.

## Vincoli

- Se la singola fonte tocca più di ~20 pagine, **fermati prima di scrivere** e proponi di spezzarla logicamente in più ingest.
- Mai modificare i file in `./raw/`.
- Mai modificare ADR esistenti (vedi regola 4e).
- Mai saltare lo step 2 (discussione takeaway). È il punto in cui l'utente forma il giudizio editoriale; saltarlo trasforma l'ingest in una traduzione meccanica e perde il valore della curatela.
