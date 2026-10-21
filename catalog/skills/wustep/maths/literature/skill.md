---
name: literature
description: Establish the published record before attacking a problem. Use at the start of any session on a problems/<slug>/ folder, and again before comparing your number against anyone else's.
---

# Literature

arXiv is the record. Everything else is a lead.

1. Read `PROBLEM.md`, then fetch the papers it cites with
   `python3 scripts/arxiv_fetch.py <id>` (add `--research
   problems/<slug>/RESEARCH.md` when appending a stub). Open the
   arXiv abs page, then the HTML or PDF, and read the actual
   theorem. Check the version: v2 and v3 can change the exponent
   (Bedert 2509.05260 went from `n^{1/7}` to `n^{1/5-o(1)}`).
2. Replay before trusting. If the attack depends on a claimed
   number, recompute it from the paper's own pieces (a lemma
   table, a small script in `compute/`). A number you have not
   replayed is a lead, not a baseline.
3. Forum numbers (MSE, MathOverflow, Reddit, AlphaXiv) are leads,
   not citations. Chase the lead to a paper; if there is no
   paper, say so instead of citing the forum.
4. OEIS: `python3 scripts/oeis_lookup.py` with an A-number or
   terms; cite the A-number and state exactly what matched.
5. Log as you go in `RESEARCH.md`: a dated list of URLs you
   actually opened, one line each on what the source states — and
   what it does not state ("no explicit numerical c"). Failed
   lookups go in the log too; see
   `problems/chowla-cosine/RESEARCH.md` for the shape.

Never cite a URL you did not open this session.
