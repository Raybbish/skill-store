---
description: "Raccoglie file markdown sparsi nel progetto dentro raw/, pronti per l'ingest. Esclude la wiki stessa, raw/, CLAUDE.md, .git, node_modules, e dotfile. Default — copia (non sposta). Mostra i candidati e chiede conferma prima di toccare i file."
disable-model-invocation: true
argument-hint: "[--move] [--include-readme] [path]"
---

# Collect — raccolta fonti markdown sparse

Trovi i file markdown sparsi nel progetto e li raccogli in `raw/` per l'ingest successivo.

## Argomenti

`$ARGUMENTS` può contenere, in qualunque ordine:
- `--move` — sposta invece di copiare. Default: copia.
- `--include-readme` — include i `README.md` (di default esclusi perché tipicamente meta del progetto).
- Un path di scansione (es. `./docs` o `~/notes/product-x`). Default: directory corrente (`.`).

## Pre-flight

1. Verifica che la wiki sia bootstrappata: `./raw/` e `./wiki/` devono esistere. Altrimenti **fermati** e suggerisci `/software-wiki:bootstrap`.
2. Parsifica `$ARGUMENTS` in: `OPERATION` (cp/mv), `INCLUDE_README` (true/false), `SCAN_ROOT` (path).

## Trova i candidati

Costruisci e **mostra** all'utente il comando `find` prima di eseguirlo. Esclusioni obbligatorie:

```bash
find "$SCAN_ROOT" \
  -type d \( \
    -path "$SCAN_ROOT/wiki" -o \
    -path "$SCAN_ROOT/raw" -o \
    -name ".git" -o \
    -name "node_modules" -o \
    -name ".obsidian" -o \
    -name "dist" -o \
    -name "build" -o \
    -name ".next" -o \
    -name ".cache" -o \
    -name ".venv" -o \
    -name "__pycache__" \
  \) -prune -o \
  -type f -name "*.md" \
  ! -name "CLAUDE.md" \
  ! -path "*/.*" \
  -print
```

Aggiungi `! -name "README.md"` se `INCLUDE_README` è false.

**Mai** scendere dentro `wiki/`, `raw/`, `.git/`, `node_modules/`. Mai toccare `CLAUDE.md`. Sono regole inviolabili.

## Mostra e conferma

Presenta all'utente:
- Il comando `find` esatto che eseguirai.
- La lista dei candidati con path completo e dimensione (`du -h`).
- Conteggio totale e dimensione aggregata.
- L'operazione che farai (cp/mv) e la destinazione (`./raw/`).

**Aspetta conferma esplicita prima di toccare qualsiasi file.**

Se la lista è vuota, dillo e fermati.

## Esecuzione

Per ogni file confermato:

1. Genera uno **slug** kebab-case dal nome originale (es. `Q3 Architecture Review.md` → `q3-architecture-review.md`).
2. Se `./raw/<slug>` esiste già, appendi un suffisso numerico (`-2`, `-3`, ...).
3. Esegui `cp` o `mv` verso `./raw/<slug>`.
4. Crea un sidecar `./raw/<slug>.source.json` con metadati:
   ```json
   {
     "original_path": "...",
     "original_name": "...",
     "operation": "copy" | "move",
     "collected_on": "YYYY-MM-DD"
   }
   ```
   Questo serve a `/software-wiki:ingest` per popolare correttamente il frontmatter `original_path` della pagina `sources/`.

## Logging

Append a `wiki/log.md`:

```
## [YYYY-MM-DD] decision | collect | <N> file raccolti
- Source root: <SCAN_ROOT>
- Operazione: copy|move
- Destinazione: ./raw/
- File: <lista slug>
```

## Riepilogo

Mostra all'utente:
- Quanti file sono stati raccolti.
- I slug generati.
- Suggerimento per il passo successivo: `/software-wiki:ingest <slug>` per processare una fonte alla volta.

## Note di sicurezza

- Mai eseguire `mv` senza che l'utente abbia visto la lista e confermato.
- Mai espandere il path di scan oltre quello richiesto (no `..` automatici, no glob magici).
- Se uno dei candidati è un symlink, segnalalo separatamente e chiedi se procedere o saltarlo.
- In caso di errore durante l'esecuzione (permessi, disco pieno), interrompi e riepiloga cosa è stato fatto e cosa no.
