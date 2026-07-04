# Iteration 2 -- Contested Question (Empirical)

## Plan

**Type:** Empirical test (Contested question)

**Question:** "Should AI model weights be open-sourced?"

**What this tests:**

- Phase 0: Contested classification (should trigger Comprehensive scope)
- Phase 1: Research plan presentation (Contested template with angles)
- Phase 2: Comprehensive calibration (4 researchers, 2-3 rounds, opus model)
- Phase 7: Cross-agent verification (unique to Comprehensive)
- Phase 8: Contested synthesis template (steelmanning, no verdict)
- **Iteration 1 fixes:** researcher self-claim, file persistence, lead name in spawn prompt

**Also validates:**

- Context compaction resilience (we're at ~60% context, likely to compact mid-run)
- Whether emphasizing self-claim in researcher-prompt.md reduces nudging

## Research Summary

Ran Comprehensive-scope research (4 researchers, 3 rounds) on "Should AI model weights be
open-sourced?" Full report at `~/.claude/research/ai-model-weights-open-source/report.md`.

**Round 1:** 4 opus researchers investigated: (A) pro-openness arguments, (B) anti-openness
arguments, (C) regulatory/governance landscape, (D) empirical evidence. Strong convergence on
key structural points (irreversibility, safeguard removability, safety research enablement).
60+ sources across researchers.

**Round 2:** 2 targeted follow-ups -- graduated release proposals (A) and RAND CBRN contradiction
(D). Resolved the RAND 2024 vs 2025 discrepancy (different models, different methodologies,
both partially right). Found rich graduated release literature (Solaiman gradient, structured
access, Carnegie consensus, MOF, RSPs).

**Round 3 (Verification):** 2 cross-agent verifications --

- SentinelOne 7.5% claim (verified by B): SUPPORTED WITH NUANCE. Lower bound on a subset,
  corroborated by 2 independent studies (Censys solo, Cisco Talos).
- Greenblatt ~100K fatalities estimate (verified by C): CONTESTED. Independent models produce
  ~10K-60K range, but direction agreed and uncertainty intervals overlap.

**Outcome:** 37-footnote Contested synthesis report with steelmanned positions, points of
agreement, key disagreements (factual and values-based), evidence quality assessment. No verdict
rendered. Report quality is genuinely useful for someone trying to understand the debate.

## Observations

**What worked well:**

1. **Phase 0 classification worked correctly.** Identified Contested type, selected Comprehensive
   scope (4 researchers, opus model, 2-3 rounds + verification). No friction.

2. **File persistence fix from Iteration 1 worked perfectly.** All 4 researchers wrote findings
   to disk in Round 1: `researcher-a-findings.md`, `researcher-b-findings.md`,
   `researcher-C-findings.md`, `researcher-D-findings.md`. Round 2 follow-ups also persisted:
   `researcher-a-findings-9.md`, `researcher-D-findings-10.md`. Verifications persisted:
   `researcher-b-findings-12.md`, `researcher-C-findings-11.md`. **This is a clear win from
   Iteration 1 changes.**

3. **Cross-agent verification added genuine value.** The Greenblatt CBRN verification (CONTESTED)
   surfaced 4 independent quantitative models (GovAI/Righetti, GovAI/Williams, Jones, RAND Delphi)
   that put the estimate in context. The SentinelOne verification (SUPPORTED WITH NUANCE) traced
   the claim to its primary source and found Reuters had oversimplified. Both verdicts materially
   improved the final report.

4. **Researcher quality was excellent at opus level.** Source diversity, depth of analysis, and
   critical evaluation were noticeably stronger than the sonnet researchers in Iteration 1.
   Researchers proactively labeled institutional biases, distinguished methodology types, and
   cross-referenced within their own findings.

5. **Contested synthesis template worked well.** The steelmanned positions format naturally
   organized the findings. Separating factual disagreements from values disagreements was
   particularly effective. The "Evidence Quality by Position" section forced honest assessment
   of both sides' weaknesses.

6. **Lead name in spawn prompt worked.** Researchers messaged "team-lead" directly without
   needing to look up the team config. No friction observed.

7. **Context compaction survived.** The session compacted mid-run (between Round 1 triage and
   Round 2 dispatch). The ITERATION-LOG.md and state.md files were sufficient to resume
   coherently. The compacted context summary preserved key details about researcher findings
   and verification assignments.

**What was clunky or problematic:**

1. **Self-claim fix still did not work reliably.** Despite the emphatic "Task Self-Claim
   (IMPORTANT)" section and the spawn prompt reminder, researchers still went idle after
   completing their Round 1 tasks without checking TaskList. The lead had to explicitly create
   follow-up tasks and (in the pre-compaction portion) likely nudge researchers to claim them.
   After compaction, the lead dispatched Round 2 and Round 3 tasks by sending direct messages
   to specific researchers rather than relying on self-claim. **This is now a confirmed pattern
   across 2 iterations: researchers do not reliably self-claim tasks regardless of how
   emphatically the instructions say to do so.**

2. **Inconsistent filename casing.** Researchers wrote `researcher-a-findings.md` (lowercase)
   and `researcher-C-findings.md` (uppercase). The researcher-prompt.md says
   `researcher-{letter}-findings.md` without specifying case. The spawn prompt uses uppercase
   letters (A, B, C, D) while the template uses lowercase `{letter}`. This inconsistency is
   cosmetic but could cause issues for scripts or resume logic that expect consistent naming.

3. **Researcher C required double shutdown request.** The first shutdown_request was sent but
   C didn't respond until a second was sent. This may be a timing issue (C was still processing)
   rather than a systematic problem. Researchers A, B, D all shut down on first request.

4. **Round 2 researcher allocation was suboptimal.** With 2 follow-up tasks and 4 researchers,
   B and C sat idle during Round 2. Then in Round 3, B and C were assigned verification tasks.
   The skill doesn't provide guidance on whether to assign Round 2 tasks to the SAME researchers
   who covered related Round 1 angles (continuity) or DIFFERENT researchers (fresh perspective).
   For follow-ups, continuity seems better; for verification, fresh perspective is required.

5. **No guidance on when to stop adding rounds.** The skill says "2-3 rounds" for Comprehensive
   but doesn't specify criteria for choosing 2 vs 3. In practice, verification (Round 3) added
   clear value for the two high-impact single-source claims. But the decision was ad hoc.

**Surprising or noteworthy:**

- Opus researchers found genuinely high-quality, current sources including January-February 2026
  content. The contested topic prompted researchers to find primary sources rather than relying
  on secondary reporting.
- The RAND CBRN contradiction investigation was the most valuable follow-up: it found a THIRD
  RAND study (Delphi panel) and a FOURTH (benchmarking study) that helped reconcile the apparent
  contradiction. This would have been missed without targeted follow-up.
- Report length (~350 lines, 37 footnotes) is longer than ideal. The Contested template naturally
  produces longer output because steelmanning both sides requires more space. The skill doesn't
  address length targets for different question types.

## Changes Made

**1. Replaced self-claim with lead-dispatched follow-ups** (`SKILL.md` Phase 6, `researcher-prompt.md`)

- The biggest architectural change. After 2 iterations confirming researchers don't self-claim
  regardless of instruction emphasis, switched to a model where the lead creates tasks AND
  explicitly messages each researcher to assign them.
- SKILL.md Phase 6: Added "Assignment strategy" section with guidance on who gets follow-ups
  (continuity for deep-dives, fresh perspective for conflicts).
- SKILL.md Phase 7: Added same lead-dispatched pattern for verification tasks.
- researcher-prompt.md: Replaced emphatic "Task Self-Claim (IMPORTANT)" section with brief
  "Between Tasks" section. Now says: check TaskList once, claim if available, otherwise go
  idle and wait for lead to message you.
- researcher-prompt.md: Updated Critical Rules to remove self-claim rule.

**2. Normalized filename casing to lowercase** (`SKILL.md`, `researcher-prompt.md`)

- Spawn prompt now says `(use LOWERCASE in filenames: researcher-{lowercase letter})`
- researcher-prompt.md Step 1: Added "(always use **lowercase** for the letter)"
- researcher-prompt.md Critical Rules: Added rule #7 "Use lowercase filenames"

**3. Added round stopping criteria** (`SKILL.md` Phase 7)

- Added explicit "When to run Round 3" and "When to skip Round 3" criteria to Phase 7.
- Run verification when: high-impact single-source claims, unresolved factual conflicts,
  or specialized/niche topic claims.
- Skip verification when: no single-source high-impact claims remain, conflicts resolved by
  Round 2, remaining uncertainties are about magnitude not direction.

**4. Added Round 2 assignment guidance** (`SKILL.md` Phase 6)

- Deep-dives/gap-fills: assign to researcher with related Round 1 angle (continuity)
- Conflict resolution: assign to researcher who did NOT cover either side (fresh perspective)
- Idle researchers: wait for verification or shut down early

## Notes for Next Iteration

- The lead-dispatched model is the most important change to validate in Iteration 3. It
  accepts the reality that researchers don't self-claim and makes the lead's role explicit.
  This should eliminate the "nudging" friction entirely.
- Iteration 2 demonstrated that Comprehensive scope with opus researchers produces excellent
  quality. The main question is whether the cost (4 opus researchers x 3 rounds) is justified
  for less complex questions.
- The Contested synthesis template is naturally verbose (~350 lines, 37 footnotes). Consider
  adding length targets per question type in a future iteration.
- Good candidate for Iteration 3: Emerging/Frontier test (backlog #3) would exercise
  instability warnings, date-sensitive source evaluation, and the Emerging synthesis template.
  It would also test the lead-dispatched model with a different question type.
- Backlog item #8 (spawn prompt length) can be removed -- the self-claim problem was resolved
  by changing the architecture rather than tweaking prompt emphasis.
