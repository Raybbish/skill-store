---
description: Convenzioni e schema della wiki di prodotto software (struttura raw/wiki, feature page come ponte utente↔tecnico, frontmatter, workflow di ingest/query/lint, anti-pattern). Carica questa skill ogni volta che l'utente sta costruendo, mantenendo o interrogando una wiki di documentazione software che combina guida utente e doc tecnica, ingestendo fonti come spec, RFC, release notes, transcript di meeting, o customer call. Usala anche quando l'utente menziona feature page, ADR, knowledge base markdown di prodotto, o sta semplicemente lavorando in modo strutturato sulla doc di un software senza usare esplicitamente la parola "wiki".
---

# Software Wiki — Convenzioni

Lo schema completo (struttura, frontmatter, workflow ingest/query/lint, convenzioni, anti-pattern) vive in `assets/CLAUDE.md`. **Leggilo per primo.** È sia la tua guida operativa, sia il file che viene copiato nella radice del progetto durante il bootstrap.

## Modalità

**Manutenzione di una wiki esistente** — esiste un `CLAUDE.md` alla radice del progetto. **Quel file è la fonte di verità**, non `assets/CLAUDE.md` di questo plugin: può contenere personalizzazioni rispetto al default. Leggilo per primo, poi segui i suoi workflow.

**Bootstrap di una wiki nuova** — non c'è ancora `CLAUDE.md` alla radice. Suggerisci all'utente di invocare `/software-wiki:bootstrap` per setup guidato.

## Comandi correlati nel plugin

- `/software-wiki:bootstrap` — crea struttura `raw/` + `wiki/` + `CLAUDE.md` in un progetto nuovo
- `/software-wiki:collect [--move] [--include-readme] [path]` — raccoglie file markdown sparsi in `raw/`
- `/software-wiki:ingest <source>` — ingestisce una fonte da `raw/` seguendo il workflow

## Promemoria delle regole più dimenticate

- **Leggi `index.md` per primo** prima di rispondere a una query.
- **Discuti i takeaway con l'utente prima di scrivere** durante un ingest.
- **Le contraddizioni si marcano, non si sovrascrivono.**
- **Le feature sono il ponte**: una sola pagina canonica per feature, mai duplicare contenuto fra `user/` e `tech/`.
- **Gli ADR sono immutabili**: per cambiare una decisione, scrivi un nuovo ADR che `supersedes` il vecchio.
