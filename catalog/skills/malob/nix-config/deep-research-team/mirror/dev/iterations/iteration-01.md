# Iteration 1 -- Compound Technical+Consumer (Empirical)

## Plan

**Type:** Empirical test (compound question)

**Question:** "What are the leading open-source LLM inference engines, and which is best
suited for a small team deploying a 70B parameter model on consumer GPUs?"

**What this tests:**

- Phase 0: Question type classification (should detect Technical + Consumer compound)
- Phase 1: Compound decomposition and presentation to user
- Phase 2: Scope calibration (compound should escalate to Broad)
- Phase 3: Team setup, output directory creation, task creation
- Phase 4-6: Multi-round investigation with follow-up
- Phase 8: Mixed synthesis (Technical comparison + Consumer recommendation)
- Phase 9: File persistence (state.md, researcher findings, report.md)

**Rationale:** First-ever empirical run of the v2 skill. A compound question exercises the
most distinctive new features. The topic is genuinely useful and has enough complexity to
stress-test the system without being so niche that sources are sparse.

## Research Summary

Ran Broad-scope research (3 researchers, 2 rounds) on "What are the leading open-source LLM
inference engines, and which is best suited for a small team deploying a 70B parameter model
on consumer GPUs?" Full report at `~/.claude/research/llm-inference-engines-70b-consumer-gpu/report.md`.

**Round 1:** 3 researchers investigated landscape (A), benchmarks (B), practical deployment (C).
Strong convergence on vLLM for multi-GPU, llama.cpp/Ollama for single-GPU. Good source diversity
(25+ sources across researchers).

**Round 2:** 2 targeted follow-ups -- SGLang vs vLLM comparison (B) and ExLlamaV3 viability (A).
Resolved conflicting throughput claims and assessed ExLlamaV3 maturity.

**Outcome:** Comprehensive report with Technical comparison matrix + Consumer ranked recommendations.
25 cited sources. Report quality is genuinely useful.

## Observations

**What worked well:**

1. **Phase 0 classification worked correctly.** Identified compound (Technical + Consumer), chose
   Broad scope. No friction.

2. **Researcher independence produced good diversity.** Each researcher found unique sources with
   minimal overlap. Cross-referencing in triage revealed genuine convergence (not echo chamber).

3. **Round 2 follow-ups were well-targeted.** The SGLang vs vLLM task resolved a real conflict
   from Round 1 (3.1x claim traced to non-independent benchmarks). ExLlamaV3 assessment filled
   a genuine gap.

4. **Source quality was generally high.** Researchers followed type-aware source evaluation --
   prioritized official docs, controlled benchmarks, and practitioner reports over marketing.

5. **File persistence worked.** state.md, researcher findings, and report.md all written correctly.

**What was clunky or problematic:**

1. **Researchers didn't self-claim follow-up tasks.** The skill says researchers should check
   TaskList after completing their initial task and self-claim available work. In practice, all
   3 researchers went idle after Round 1 and had to be explicitly nudged with SendMessage to
   pick up Round 2 tasks. Researcher B went idle even after being sent a direct message about
   Task #7 and needed a second nudge. **This is the biggest friction point.**

2. **Compound decomposition wasn't presented in the exact template format.** The skill says to
   present "> This breaks down into {N} sub-questions: ..." but I presented it slightly
   differently. Minor -- the user understood fine.

3. **No researcher findings files from Round 1.** The skill says researchers should write to
   `{output_dir}/researcher-{letter}-findings.md`. Only Researcher B wrote a findings file for
   Round 2 (SGLang). Researchers A, B, C did NOT persist their Round 1 findings to disk. The
   findings were only delivered via SendMessage. **This breaks the resume capability** -- if the
   session crashed after Round 1, only state.md would exist, not the underlying findings.

4. **Researcher C was underutilized in Round 2.** With only 2 follow-up tasks and 3 researchers,
   Researcher C sat idle. The skill doesn't give clear guidance on whether to shut down unused
   researchers early or find work for them.

5. **Team task list vs iteration loop task list collision.** The research team uses TaskCreate
   for research angles, but the iteration loop also uses TaskCreate for tracking iteration
   progress. These two task lists coexisted in the same session (team tasks #1-8, iteration
   tasks #1-5 in a different context). This worked but could be confusing in a resumed session.

6. **The skill doesn't specify the lead's name for researchers to message.** Researchers need
   to read the team config to find the lead's name. The researcher-prompt.md says "The lead's
   name is typically the team creator. Check the team config if unsure." This is indirect --
   could be explicit in the spawn prompt.

7. **Synthesis was a single monolithic write.** At ~250 lines, the report was written in one
   Write call. For longer reports, this could fail or be hard to review. The skill doesn't
   address progressive synthesis or draft-then-refine.

**Surprising or noteworthy:**

- Researchers found genuinely useful, current sources (Jan-Feb 2026 content). Exa semantic
  search worked well for this technical topic.
- The compound question naturally produced a well-structured report (Part 1: Technical
  Comparison, Part 2: Consumer Recommendation). The type-aware templates mapped cleanly.
- Total research time was reasonable for a Broad scope run (~10-15 minutes wall clock).

## Changes Made

**1. Restructured researcher reporting flow** (`references/researcher-prompt.md`)

- Replaced the old "Reporting Findings" + "Task Management" sections with a clear 3-step
  sequence: (1) persist to disk, (2) SendMessage to lead, (3) mark complete + TaskList.
- Moved file persistence from buried rule #9 to Step 1 of the main reporting flow.
- Added explicit filenames for follow-up tasks: `researcher-{letter}-findings-{task-id}.md`.

**2. Added emphatic task self-claim section** (`references/researcher-prompt.md`)

- New "Task Self-Claim (IMPORTANT)" section with explicit instructions to always check
  TaskList after completing each task and immediately claim available work.
- Added "Do NOT go idle if there are available tasks" instruction.

**3. Updated Critical Rules** (`references/researcher-prompt.md`)

- Replaced rules #6-9 with two focused rules: "Persist, THEN report, THEN check for work"
  and "ALWAYS self-claim available tasks". Removed redundant rule about SendMessage (now
  covered in main flow).

**4. Added lead name to spawn prompt template** (`SKILL.md`)

- Added `Lead name: team-lead` line to the researcher spawn prompt so researchers don't
  need to look up the team config to know who to message.
- Added `IMPORTANT: After completing each task, ALWAYS check TaskList...` reminder at the
  end of the spawn prompt for reinforcement.

**5. Added settings.json permission** (`configs/claude/settings.json`)

- Added `Bash(mkdir -p ~/.claude/research/*)` to avoid permission prompts during research
  output directory creation.

## Notes for Next Iteration

- The self-claim fix is the most important change but also the hardest to verify -- it depends
  on researcher agent behavior, which may not fully follow instructions regardless of emphasis.
  Iteration 2 should test whether the changes actually reduce the nudging problem.
- Compound synthesis quality was good -- the two-part structure (Technical + Consumer) mapped
  naturally. No changes needed to synthesis templates yet.
- The Contested question test (backlog #2) would exercise completely different skill features
  (steelmanning, cross-agent verification, Comprehensive scope). Good candidate for Iteration 2.
- New backlog idea: investigate whether spawn prompt length affects researcher behavior.
  The prompt is already ~15 lines; adding more "IMPORTANT" reminders has diminishing returns.
