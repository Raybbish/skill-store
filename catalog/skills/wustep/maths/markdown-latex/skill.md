---
name: markdown-latex
description: GitHub GFM vs KaTeX rules for math in markdown. Use when editing README or other GitHub-rendered markdown that contains math.
---

# Markdown + LaTeX

github.com GFM treats `_` as emphasis *across a paragraph*
before math runs. The Next/KaTeX site does not have this bug.

Two `$..._...$` formulas in the same paragraph eat the
underscores: `$\mathrm{QM}_2^2$` + `$\ell_2$` becomes `QM2^2` /
`ell2`; `$p(H_{18})$` + `$p(H_{20})$` becomes `p(H{18})`.

Do not wrap math in backticks (GitHub then shows raw `$...$`).
Do not write `\_` (KaTeX on the site shows a literal underscore).

Fix: at most one `_` per paragraph, or put the cluster in one
`$$ ... $$` display.
