---
name: writing
description: Draft or edit user-facing markdown in this repo. Use when writing or revising README, PROBLEM.md status, explainers, notes, or GitHub pull request titles and bodies.
---

# Writing

README, PROBLEM.md status, explainers, notes, and GitHub PR titles
and bodies. ATTACK.md stays chronological. Walkthroughs stay
`refs/walkthrough-style.md`.

Method from Terence Tao: On writing, Write professionally, Write in
your own voice, Use good notation, Don't overoptimise, Organise the
paper, Motivate the paper. Copy the method. Do not imitate the
manner.

## Result first

State the result accurately first. Use the introduction to sell the
key points without overclaiming.

Punch line early. Technical details later. Factor into lemmas. A toy
or special case before the general statement is fine.

Theorem, then what it generalizes, then the obstruction, then the
argument. A motivating near-example before the proof.
If the precise statements are slightly technical, say so and do not
reproduce them.

Label heuristics (remark, footnote, "roughly speaking"). Keep the
formal claim clean.
Honest status: what is elementary, what needed a computer, what AI
did.

## English

Write English, not a string of symbols. Informal remarks are welcome
if labeled as such.

Own voice. Paraphrase the literature; cite it. Do not parrot another
author's sentences. Past self is a good audience.

Do not over-optimise or over-compress. Brevity that strips examples,
remarks, and English makes the note harder, not simpler.
Do not be cleverer than the result. Strike out the sentence you are
most proud of if it is just style.

## Notation

Define a symbol the first time it appears. Global notation early,
local notation where used. Introduce a name only if it is used about
three times or is central. Reinforce as "the vector space V", not
just "V". Stay compatible with the paper you cite. No cute names.

## Record

Credit, provenance, precedence. Compare with the published record.
A new bound is a verified finite improvement of a published record.
Write the inequality.
An incomplete search (holes, SAT UNKNOWN, timeout) is not a lower
bound. Write the leftover fact.
Do not invent jargon. Use the language of the paper.

README and the explainers never say dent or residue; those are
agent terms. ATTACK.md, WALKTHROUGH.md, PROBLEM.md status lines,
and AGENTS.md may use them.

## Before / after

README covering paragraph, same numbers.

Before: The November 2025 table (Davydov–Marcugini–Pambianco,
arXiv:2511.02542, Table 5.1) had $\ell_2(10,2)\le 51$. This is a
construction, an upper bound, not a conjecture. Sphere covering
still only gives $\ge 45$, and an $n=49$ search left 7 holes, so
50 is not shown optimal.

After: The November 2025 table (Davydov–Marcugini–Pambianco,
arXiv:2511.02542, Table 5.1) had $\ell_2(10,2)\le 51$. Status:
construction; sphere covering $\ge 45$; $n=49$ still 7 holes.

## Pull requests

The title is the change. The body says what changed and how to
replay or check. No "this PR aims to." No chatbot close.
