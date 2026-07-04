# Iteration 3 -- Consumer Comparison (Empirical)

## Plan

**Type:** Empirical test (Consumer question, non-AI domain)

**Question:** "Best mechanical keyboard for programming in 2026?"

**What this tests:**

- Phase 0: Consumer classification (should trigger Broad scope by default)
- Phase 1: Brief clarification (Consumer type, simple question)
- Phase 2: Broad calibration (3 researchers, 2 rounds, sonnet model)
- Phase 8: Consumer synthesis template (ranked recommendations)
- **Iteration 2 fix:** lead-dispatched follow-ups (the biggest change to validate)
- **Domain shift:** non-AI topic tests whether Exa search and researcher methodology work
  outside our comfort zone

**Also validates:**

- Expert testing lab prioritization in source evaluation (Consumer type hierarchy)
- Whether sonnet researchers (cheaper) produce adequate quality for a simpler topic
- Whether Broad scope is sufficient for a Consumer question (or if it needs less)

## Research Summary

Ran Broad-scope research (3 sonnet researchers, 2 rounds) on "Best mechanical keyboard for
programming in 2026?" Full report at `~/.claude/research/best-mech-keyboard-programming-2026/report.md`.

**Round 1:** 3 researchers investigated: (A) expert reviews/testing, (B) community
recommendations, (C) features/specs analysis. Strong convergence on Keychron dominance at
every price tier. 30+ sources across researchers.

**Round 2:** 2 targeted follow-ups using lead-dispatched model:

- Split/ergonomic deep-dive (C, continuity): Consolidated Voyager vs Glove80 vs Defy vs Go60.
  Discovered MoErgo Go60 as significant new entrant. Alice layout as middle ground.
- Blind spot check (A, fresh perspective): Mac-specific picks (NuPhy Air75 V2 top for Mac),
  office noise reality (no mechanical keyboard is truly quiet), Leopold as overlooked quality.

**Outcome:** Consumer-template report with ranked recommendations (Top Pick: Q5 Max, Runner-Up:
V5 Max, Budget: C3 Pro, Best Mac: NuPhy Air75 V2, Best Ergonomic: Glove80, Best Gentle
Upgrade: Keychron Q8 Max Alice, Best Quiet: HHKB Type-S). 25 cited sources. Report is
genuinely useful as a buying guide.

## Observations

**What worked well:**

1. **Lead-dispatched follow-ups worked perfectly on the first try.** This is the most important
   validation from this iteration. The lead created 2 Round 2 tasks, then sent direct
   SendMessage to researcher-c (split deep-dive, continuity) and researcher-a (blind spots,
   fresh perspective). Both researchers claimed their tasks and began immediately with zero
   nudging. Researcher-b was correctly left idle (2 tasks < 3 researchers). **The Iteration 2
   architectural change eliminated the self-claim problem completely.**

2. **Lowercase filename normalization worked.** All 5 findings files used correct lowercase
   naming: `researcher-a-findings.md`, `researcher-b-findings.md`, `researcher-c-findings.md`
   (Round 1), `researcher-c-findings-7.md`, `researcher-a-findings-8.md` (Round 2). The
   Iteration 2 fix (explicit lowercase instructions in spawn prompt + researcher-prompt.md)
   resolved the inconsistency.

3. **Consumer synthesis template produced a well-structured report.** The ranked recommendations
   format (Top Pick, Runner-Up, Budget, Best for X) naturally organized the findings into
   actionable buying advice. Each pick has evidence from multiple sources and clear reasoning.

4. **Non-AI domain worked fine.** Exa semantic search handled keyboard/hardware topics well.
   Researchers found high-quality sources including RTINGS lab testing (278 keyboards), Wirecutter,
   Reviewed.com, WIRED, plus community sources (Reddit 381K opinion analysis, HN, Devtalk).
   No domain-specific search issues.

5. **Sonnet researcher quality was adequate for Consumer scope.** Findings were well-structured,
   sources properly evaluated, and cross-source analysis was competent. The quality difference
   from opus (Iteration 2) was noticeable but acceptable: sonnet researchers were less likely
   to proactively label biases or trace claims to primary sources, but the overall research
   was solid.

6. **All 3 researchers shut down cleanly on first request.** No double-shutdown needed (unlike
   Iteration 2 where researcher-c required two attempts). This may have been a timing
   improvement or just variance.

7. **Assignment guidance worked as designed.** Split deep-dive went to researcher-c (who covered
   splits in Round 1 -- continuity). Blind spot check went to researcher-a (who covered expert
   reviews -- fresh perspective on what was missed). The guidance in Phase 6 made assignment
   decisions easy and justified.

**What was clunky or problematic:**

1. **Round 1 had no gaps requiring urgent follow-up.** The Broad scope consumer question
   produced such strong convergence in Round 1 (Keychron dominance was overwhelming) that
   Round 2 follow-ups were useful but not essential. The split/ergonomic deep-dive and blind
   spot check added genuine value (Go60 discovery, Mac-specific picks, noise reality check),
   but the core recommendations would have been the same without them. **This suggests Focused
   scope (1 round) might be sufficient for straightforward Consumer questions.**

2. **Researcher A idle-looped before claiming task.** After receiving the follow-up assignment
   via SendMessage, Researcher A sent 2 idle notifications before starting work. The task was
   eventually claimed and completed successfully, so this is cosmetic, but the idle chatter is
   noisy in the notification stream.

3. **Report length was ~200 lines, 25 footnotes.** More manageable than the Contested report
   (~350 lines, 37 footnotes) but still substantial. The Consumer template's multiple "Best
   for X" categories naturally expand the report. No length target exists in the skill.

4. **Phase 1 clarification was completely skipped.** The skill says "Brief clarification only
   if genuinely ambiguous" for Consumer questions. The question was clear enough to skip
   entirely, which is correct behavior, but it means the user had no opportunity to specify
   constraints (budget range, layout preference, Mac vs Windows, etc.) that could have focused
   the research. For Consumer questions, a quick "Any constraints?" might be valuable even
   when the question seems clear.

**Surprising or noteworthy:**

- The dharm.is analysis of 381K Reddit opinions (found by researcher-b) was an unexpectedly
  rich quantitative source for a Consumer topic. It revealed the enthusiast vs practical
  programmer preference gap that informed the report's framing.
- The MoErgo Go60 (found by researcher-c in Round 2) was genuinely new information -- launched
  late 2025, only one detailed review exists. This is exactly the kind of find that makes
  Round 2 follow-ups worthwhile even when Round 1 converges.
- Total wall-clock time was ~15 minutes for the full Broad scope run, similar to Iteration 1.

## Changes Made

**No skill file changes this iteration.** The Iteration 2 changes (lead-dispatched follow-ups,
lowercase filenames, round stopping criteria, assignment guidance) all validated successfully.
The observations suggest potential improvements but none urgent enough to change now:

- Scope calibration for simple Consumer questions (Focused might suffice) -- worth investigating
  as a meta-research topic rather than a code change
- Consumer-specific Phase 1 constraint gathering -- minor UX improvement, not blocking
- Idle notification noise -- cosmetic, not actionable in the skill

## Notes for Next Iteration

- **Lead-dispatched model is confirmed working across 2 question types.** The self-claim
  problem is solved. No further changes needed to this architecture.
- **All Iteration 2 changes validated.** Lowercase filenames, assignment guidance, and round
  stopping criteria all worked as designed. The skill is now stable for these features.
- **Good candidate for Iteration 4:** Meta-research on scope calibration. Three iterations
  have now produced data on scope appropriateness: Iteration 1 (Broad for compound Technical +
  Consumer, felt right), Iteration 2 (Comprehensive for Contested, felt right but expensive),
  Iteration 3 (Broad for Consumer, Round 2 was useful but not essential). Could the skill
  provide better guidance on when Focused is sufficient vs when Broad is needed?
- **Alternative candidate:** Emerging/Frontier test (backlog #3) to exercise the last untested
  synthesis template. Or information cascade detection (backlog #4) as the first meta-research
  iteration.
- **The skill is approaching diminishing returns for empirical testing.** Three successful runs
  across 3 question types (compound Technical+Consumer, Contested, Consumer) with improving
  results each iteration. The remaining untested templates (Scientific/Health, Emerging/Frontier,
  Opinion/Sentiment, Factual) follow the same architecture. Meta-research may yield higher
  marginal value than additional empirical runs.
