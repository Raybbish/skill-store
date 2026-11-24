---
name: new-problem
description: Mint a new problems/<slug>/ folder with the standard files and README rows. Use when starting an attack on a problem that has no folder yet.
---

# New problem

1. Pick a kebab-case slug and run `scripts/new-problem.sh <slug>`
   (do not hand-create the folder). The script copies
   `refs/problem-template/` and fills the slug and date.

2. Fill `PROBLEM.md`: header (slug, list ref, solver, status, area,
   sources, started date), the statement, and what would count as a
   new bound, and what does not count (see
   `problems/chowla-cosine/PROBLEM.md` and the writing skill).

3. Add a README Problems-table row (folder link, honest status).
   Add a "Which model ran what" ledger row when you actually run.

Then, in the minted folder:

- `ATTACK.md` is dated and chronological; append, never reorder.
  False starts stay in.
- `WALKTHROUGH.md` follows the beats in
  `refs/walkthrough-style.md`. Empty sections are fine until the
  quest is done; do not clean the path.
- `RESEARCH.md` lists only URLs actually opened. Fetch the record
  with the literature skill (`python3 scripts/arxiv_fetch.py <id>`,
  optional `--research problems/<slug>/RESEARCH.md`).
- `compute/` needs a replay entry point (`run_all.sh` or a single
  verify script) alongside the certificate.
- Lean lemmas live in the problem folder; `lean-toolchain` pins
  4.32.0. Add `lean/` only if there is a lemma.

Before claiming a bound, follow AGENTS.md How to work.
