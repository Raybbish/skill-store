# Iteration 5 -- Scientific/Health Empirical (IF + Cognitive Performance)

## Plan

**Type:** Empirical (Scientific/Health question)
**Backlog item:** #12
**Scope:** Broad (3 sonnet researchers, 2 rounds)

**Goal:** Test the evidence pyramid synthesis template, academic search guidance, and the
new Exa `enableSummary` + `textMaxCharacters: 1` default pattern. Also test whether the
category filter restrictions table prevents 400 errors. Secondary goal: validate that the
architecture continues to work smoothly (6th consecutive run).

**Question:** "Does intermittent fasting improve cognitive performance?"

**Angles:**
- (A) Systematic reviews and meta-analyses (anchor evidence)
- (B) Mechanistic pathways (BDNF, neuroinflammation, ketones, gut-brain axis)
- (C) Real-world protocols, practitioner evidence, and cognitive risks

## Research Summary

**Report:** `~/.claude/research/intermittent-fasting-cognitive-performance/report.md`

Round 1: All 3 researchers completed successfully. Researcher A found the Bamberg & Moreau
2025 meta-analysis (63 studies, 3,484 participants) as the anchor -- acute fasting is
cognitively neutral. Researcher B mapped 5 mechanistic pathways with 13 sources.
Researcher C covered protocols, null results, and disordered eating risks with 11 sources.

Triage identified: (1) CCR vs IF conflict (Researcher A's O'Leary review claimed CCR
superior, but other evidence was more nuanced), (2) population-specificity gap (which
populations benefit most?).

Round 2: Researcher B (fresh perspective) resolved the CCR vs IF conflict -- O'Leary
conflated fasting types; head-to-head trials show no difference when calorie-matched.
Researcher C (continuity) deep-dived population specificity -- metabolically impaired
populations benefit most, age is a moderator, ApoE4 data is missing.

Final report: ~300 lines, 26 footnotes, Scientific/Health evidence pyramid template.

**Key conclusions (calibrated confidence):**
- Acute fasting is cognitively neutral in healthy adults (highly likely, 80-92%)
- Chronic IF evidence is insufficient to claim cognitive benefit (highly likely)
- Metabolically impaired populations benefit most (likely, 63-79%)
- IF ≈ CCR when calorie-matched (likely)
- Mechanistic pathways are plausible but human translation is incomplete (likely)

## Observations

**What worked well:**

- Evidence pyramid template worked excellently.
- Lead-dispatched follow-ups: 6th consecutive success, zero nudging needed.
- Academic source quality was strong (APA, Cell Metabolism, Nature, BMJ Gut, Springer, MDPI).
- Triage cross-referencing caught genuine issues.
- Calibrated confidence language worked naturally.
- All researchers completed on first try.

**Exa parameter compliance:** 32/32 Exa calls fully compliant with summary pattern. Categories
used: `research paper` (frequent), `personal site` (once). No 400 errors. 28 Firecrawl scrape
calls, all with `onlyMainContent: true`.

## Changes Made

**3 changes (implementing backlog #23 -- researcher shutdown feedback reports):**

1. Updated Shutdown section in `references/researcher-prompt.md` with feedback file template.
2. Added Step 2 to Phase 10 (Cleanup) in `SKILL.md` for reading feedback files.
3. Added `scripts/analyze-transcripts.py` for post-hoc JSONL analysis.

**Backlog items resolved:** #12 (Scientific/Health empirical), #23 (shutdown feedback reports).

## Notes for Next Iteration

- Feedback reports implemented but untested. Next run will validate.
- Researcher-prompt.md is 438 lines. Monitor.
- Evidence pyramid validated. No changes needed.
- Exa guidance: 32/32 compliant. No further investment needed.
- Category restrictions untested with restricted categories (tweet, company, people).
