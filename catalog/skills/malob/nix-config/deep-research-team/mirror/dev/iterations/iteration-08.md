# Iteration 8 -- Scope Calibration Refinement (Meta)

## Plan

**Type:** Meta-analysis (internal data synthesis)
**Backlog item:** #6
**Scope:** No research run -- analyze 7 empirical data points + Anthropic's scaling rules to
refine scope calibration guidance.

**Goal:** Determine whether the type-to-scope defaults need adjustment, add escalation and
de-escalation signals, and add empirical output expectations. Also subsumes backlog #8 (report
length targets).

## Analysis

**Data compiled from 7 runs:**

| Iter | Type               | Scope         | Rounds Used | Sources | Lines | Round 2 Value         | Assessment     |
| ---- | ------------------ | ------------- | ----------- | ------- | ----- | --------------------- | -------------- |
| 1    | Technical+Consumer | Broad         | 2           | 25      | ~250  | Useful                | Right-sized    |
| 2    | Contested          | Comprehensive | 3           | 60+     | ~350  | Useful                | Right-sized    |
| 3    | Consumer           | Broad         | 2           | 25      | ~200  | Useful-not-essential  | Slight overfit |
| 4    | Technical (meta)   | Broad         | 2           | 24      | ~280  | Useful                | Right-sized    |
| 5    | Scientific/Health  | Broad         | 2           | 26      | ~300  | Useful                | Right-sized    |
| 6    | Emerging/Frontier  | Comprehensive | 3           | 55      | ~400  | Useful (conflict+gap) | Right-sized    |
| 9    | Opinion/Sentiment  | Comprehensive | 2           | 60+     | ~370  | Useful (all 4 gaps)   | Right-sized    |

**Key findings:**

1. **Current defaults are correct 6/6 times.** Consumer was the only case with slack (Round 2
   useful-not-essential). All other scopes were right-sized.

2. **Consumer is the only type with de-escalation evidence.** When the product category is
   narrow, well-reviewed, and expert consensus is clear, Focused could suffice. Iteration 3
   (keyboards) is the data point.

3. **Comprehensive verification (Round 3) added value both times tested.** Iteration 2:
   SUPPORTED WITH NUANCE + CONTESTED verdicts. Iteration 6: CONTESTED + SUPPORTED WITH NUANCE.
   Both materially improved the final report.

4. **Focused scope has never been tested.** Only Factual defaults to it, and no Factual question
   has been run. Output expectations for Focused are projected from Round 1 subsets of Broad
   runs.

5. **Anthropic comparison:** Their simple (1 agent, 3-10 calls) maps to "don't use this skill."
   Their comparisons (2-4 agents) map to our Focused/Broad. Their complex (10+ agents) exceeds
   our maximum. Our system is well-sized for the middle range.

6. **Report length is scope-driven, not type-driven.** The variation across types within Broad
   (200-300 lines) is smaller than the variation across scopes. So output expectations belong on
   the scope tier, not the question type.

## Changes Made

1. **Scope modifiers added to `references/question-types.md`** -- Per-type de-escalation and
   escalation signals, with the Consumer de-escalation backed by Iteration 3 evidence. Also
   added "do not use this skill" criteria for simple queries.

2. **Empirical output expectations added to `references/question-types.md`** -- Table of
   report length and source count ranges per scope tier, based on 7 runs. Focused estimates
   projected. Explicitly noted these are descriptive ranges, not targets.

3. **SKILL.md Phase 2 updated** -- Now references scope modifiers from question-types.md
   instead of inlining ad-hoc adjustment criteria.

**Backlog items resolved:** #6 (scope calibration), #8 (report length targets).

## Notes for Next Iteration

- **Focused scope remains untested.** A Factual question run would validate the Focused tier
  and the projected output expectations, but it's low priority since the skill explicitly says
  "don't use for simple factual lookups."
- **The main remaining empirical gap is Opinion/Sentiment** -- the last untested synthesis
  template. A good candidate for the next empirical run.
- **Mixed model config (#7) is the highest-value empirical test** -- combining it with an
  Opinion/Sentiment question would test two things at once.
