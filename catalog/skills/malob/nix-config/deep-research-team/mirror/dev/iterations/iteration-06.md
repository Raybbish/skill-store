# Iteration 6 -- Emerging/Frontier Empirical (LLM Reasoning)

## Plan

**Type:** Empirical (Emerging/Frontier question)
**Backlog item:** #9
**Scope:** Comprehensive (4 opus researchers, 3 rounds incl. verification)

**Goal:** Test the last major untested synthesis template (Emerging/Frontier with instability
warnings, date-sensitive source evaluation). First run with shutdown feedback reports
(implemented in Iteration 5 but untested). Exercise Exa categories beyond `research paper`
(`news`, `personal site`, `tweet`), testing the category restriction table.

**Question:** "What are the current approaches to LLM reasoning?"

**Angles:**

- (A) Foundational paradigms: CoT, ToT, GoT, and their successors
- (B) Training-time reasoning: PRM, RL, GRPO, RLVR, reasoning-focused training
- (C) Inference-time compute scaling: search, verification, test-time compute allocation
- (D) Emerging approaches: neurosymbolic, multi-agent, tool-augmented, latent reasoning

## Research Summary

**Report:** `~/.claude/research/llm-reasoning-approaches/report.md`

**Round 1:** All 4 opus researchers completed successfully. Strong convergence on RLVR as
dominant paradigm shift (A, B, C). Latent reasoning identified as frontier by A and D
independently. B provided deep GRPO/RLVR coverage. C mapped inference-time compute scaling
with strong evidence. D covered neurosymbolic, multi-agent, tool-augmented, latent, and
world model approaches. Total: ~60 sources across researchers.

**Triage identified:** (1) PRM vs ORM conflict (B says PRMs disappoint at scale; C says PRMs
outperform), (2) all 4 researchers noted heavy academic bias -- practitioner/deployment
perspectives missing, (3) competitive landscape gap.

**Round 2:** Researcher A (fresh perspective) resolved PRM conflict -- both correct in different
regimes (inference-time verification: PRM wins; large-scale RL training: ORM preferred).
Researcher D (gap-fill) surveyed practitioner perspectives and competitive landscape using
diverse Exa categories (news, personal site, tweet).

**Round 3 (Verification):** Researcher B verified CoT faithfulness claims -- 2.3% True Thinking
Score CONTESTED (single model/dataset, not replicated; direction supported but specific number
misleading), <20% verbalization SUPPORTED WITH NUANCE (multiple independent confirmations;
METR argues manageable for safety monitoring).

**Final report:** ~400 lines, 55 footnotes. Emerging/Frontier template with instability warnings.

## Observations

**What worked well:**

- **Emerging/Frontier template worked excellently.** The "Current State (as of date)" +
  "Trajectory" + "Instability Warning" structure produced a report that acknowledges the
  rapidly evolving nature of the field while still providing definitive findings.
- **Lead-dispatched follow-ups:** 7th consecutive success, zero nudging needed.
- **Cross-agent verification added genuine value.** The CoT faithfulness verification produced
  a nuanced CONTESTED verdict that materially improved the report -- the 2.3% number was
  tempered to a directional finding.
- **PRM conflict resolution was clean.** Researcher A (fresh perspective) found the resolution
  along the inference vs training axis with 13 independent sources.
- **All researchers completed on first try.** No stalls, no nudging, no retries.
- **Category restriction table worked.** `tweet` category used successfully (no 400 errors).
  Researcher D correctly omitted restricted params for tweet queries.

**Exa parameter compliance (verified via `scripts/analyze-transcripts.py`):**

- **49/49 Exa calls (100%) fully compliant.** `enableSummary: true` + `textMaxCharacters: 1`,
  zero `contextMaxCharacters` violations. 7th session with perfect compliance (cumulative
  81/81 across Iterations 5-6).
- **Categories exercised:** `research paper` (8), `news` (2), `personal site` (2), `tweet` (1).
  First run using `news`, `personal site`, and `tweet` categories. No 400 errors.
- **Firecrawl:** 22 scrape calls, all `firecrawl_scrape`. No map or other tools used.
- **Rich parameter usage:** `startPublishedDate` widely used, `numResults` varied (5-10),
  `includeDomains` used once (metr.org).

**Shutdown feedback reports (first test -- backlog #23 validated):**

All 4 researchers wrote feedback files. Key findings from feedback:

- **arxiv scraping noise:** 3 of 4 researchers independently flagged that Firecrawl scraping
  of arxiv abstract pages returns mostly navigation boilerplate. All recommended using
  `arxiv.org/html/` or relying on Exa summaries for triage.
- **Tweet category thinness:** Researcher D noted tweet summaries were 1-2 sentences with
  limited context. The category works but provides lower signal density.
- **Duplicate self-referential messages:** 3 of 4 researchers reported receiving their own
  task assignment messages echoed back. Cosmetic but confusing. Likely a platform bug.
- **Verification verdict granularity:** Researcher B noted the SUPPORTED/CONTESTED/UNCHANGED
  trichotomy doesn't cover partial support. Iteration 2 verifiers also used "SUPPORTED WITH
  NUANCE."
- **Conflict resolution length:** Researcher A noted ~120-line target is too short for
  conflict resolution tasks that need comparison tables.
- **Positive:** All researchers praised the `enableSummary` + `textMaxCharacters: 1` pattern
  for efficient triage.

**Feedback reports vs transcript analysis comparison:**

Both mechanisms add unique value. Transcripts provide exact parameter compliance (definitive).
Feedback reports provide qualitative insights not visible in transcripts: arxiv scraping issue,
duplicate message bug, tweet category thinness, verification verdict suggestions. **Keep both.**

## Changes Made

**No skill file changes this iteration.** The Emerging/Frontier template, feedback reports,
and category restriction table all validated successfully. Two quick changes identified for
next iteration (backlog #26 arxiv guidance, #27 verification verdict expansion) but not
blocking.

**Backlog items resolved:** #9 (Emerging/Frontier empirical), #23 validated (feedback reports
work as designed).

## Notes for Next Iteration

- **All 7 synthesis templates now tested.** Factual, Scientific/Health, Consumer, Technical,
  Opinion/Sentiment (untested), Contested, and Emerging/Frontier. Only Opinion/Sentiment
  remains untested, but it's the least complex template. The skill is mature for synthesis.
- **Exa compliance is thorough.** 81/81 across 2 measured iterations. No further monitoring
  investment needed -- the guidance works reliably.
- **Feedback reports validated and useful.** They surfaced 4 actionable findings this iteration.
  Worth keeping as standard practice.
- **Quick wins available:** Backlog #26 (arxiv guidance) and #27 (verification verdict
  expansion) are small, targeted changes that can be done without a full research run.
- **Recommended next:** Backlog #25 (audit against Anthropic agent teams docs) is a quick
  meta task that doesn't require running the skill. Good for a shorter iteration.
