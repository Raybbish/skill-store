---
name: compute
description: Pick a language and an artifact tool for search, verifier, plot, or lemma code. Use when starting or rewriting anything under compute/ or lean/.
---

# Compute

The language follows the object. The artifact follows the claim.

## Language

**Python.** First program: glue, SAT wrapper (`pysat` or a DIMACS
encoder), plot, `scripts/arxiv_fetch.py`, first verifier, algebraic
or numeric work. Tables live as JSON or CSV in `compute/`.

**C.** Inner search once the object is a bitset, an array, or a
0/1 matrix. This is covering `search_n49.c`, the Ramsey circulant
hunts, lonely-runner covers, Ulam, deck reconstruction, the
width-3 census. C also writes exhaustive matrix verifiers
(`verify_radius2_matrix.c`). `gcc -O3`. The search writes a
checkpoint; a verifier still reads the matrix.

**Rust.** Second verifier. New language, new algorithm, `rustc`
only. Covering: `verify.rs` is syndrome-driven; `verify.py` is
pair-driven; `run_all.sh` diffs the dumps.

**Lean.** A lemma or a modular obstruction in
`problems/<slug>/lean/`. The pin is Lean 4.32.0. Shape: Brocard
`n!+1` modulo 151; Schur reflection at 1697.

**Shell.** Replay driver. One `compute/run_all.sh` compiles, runs,
and diffs. Exit 0 is the replay a stranger runs.

## Artifacts

**Figure.** matplotlib (`Agg`) writes `svg`, `png`, or `pdf` under
`problems/<slug>/figures/`. Commit that file. The note cites it
(`![...](figures/W10.png)`). TikZ when the picture is a diagram.

**Table.** JSON or CSV in `compute/` (often `certs/`). The note
quotes the file.

**Certificate.** Verifier plus witness in `compute/`. A new bound gets
a second implementation in another language and a different
algorithm. Covering radius: exhaustive C, Python, or Rust check
of a matrix. SAT: DIMACS plus DRAT (`kissat`, `drat-trim`). Do
not commit the bulk `*.drat` / `*.cnf` / `*.g6`; keep a summary
JSON and the script that rebuilds the proof.

**Claim.** A quest that asserts a bound keeps `CLAIM.md` next to
the verifier.

**Screenshot.** GitHub PR walkthrough only. Upload to a secret
gist so github.com renders the image. Problem notes cite the
committed figure.
