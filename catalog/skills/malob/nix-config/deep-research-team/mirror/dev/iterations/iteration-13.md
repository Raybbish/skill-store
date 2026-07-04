# Iteration 13 -- Information Cascade Detection (Backlog #7)

## Type: Research Run (Empirical) + Engineering

## Question

"How do journalists, fact-checkers, and researchers detect information cascades -- cases where many
sources all trace back to one original, creating an illusion of independent corroboration?"

## Configuration

- **Question type:** Technical
- **Scope:** Broad (3 sonnet researchers, 2 rounds)
- **Research angles:**
  1. Journalism/fact-checking practitioner methods (Researcher A)
  2. Academic citation cascade analysis (Researcher B)
  3. Computational misinformation cascade detection at scale (Researcher C)

## Report

`~/.claude/research/information-cascade-detection/report.md`
~180 lines, 37 footnotes, ~50+ sources across researchers.

## Key Research Findings

**Three converging research traditions** all address cascade detection but have developed largely
independently:

1. **Journalism/fact-checking:** "Trace to source" methodology. First Draft's provenance pillar,
   GIJN's "don't rely on other media" rule, IFCN two-source minimum. No org publishes an explicit
   cascade detection checklist -- it's tacit professional knowledge. The ivermectin/Rolling Stone
   case is the paradigmatic cascade case study.

2. **Academic bibliometrics:** Greenberg 2009 (BMJ) is foundational -- identified citation bias,
   amplification, and invention across 242 papers. Woozle effect quantified by Letrud & Hernes
   2019 (76% of citing articles affirm debunked myths). Citogenesis (Wikipedia circular loops)
   well-documented. Chen et al. 2025 confirmed "telephone effect" computationally at 13M-pair
   scale.

3. **Computational social science:** Vosoughi et al. 2018 (Science) foundational -- false news 6x
   faster, distinct cascade topology. CrowdTangle shutdown (Aug 2024) left major monitoring gap.
   DisTrack and temporal graph approaches (TIDE-MARK) are current state-of-art. AI amplifies
   cascades via knowledge collapse and epistemic destabilization.

**Practitioner heuristics (Round 2):** Specific red flags distilled: identical phrasing/errors
propagated, tight temporal clustering, all sources citing same original, lack of local detail,
same stock photos. Source TYPE diversity (documents + people + data) matters more than source
COUNT. Intelligence analysis (Heuer ACH, ICD 203) has the most rigorous frameworks for source
independence evaluation.

**Observable signals (Round 2):** Content+structure+style similarity distinguishes cascade from
independent reporting (Bar et al. 2012). Temporal clustering is a primary signal -- one-quarter
of news stories reproduced within 4 minutes (Cage et al. 2025). Network topology differs
systematically (broadcast/star = cascade, bushy/multi-origin = independent).

## Dogfooding Observations

**What worked well:**
- All three Round 1 angles produced highly complementary material with minimal overlap
- Lead-dispatched follow-ups worked perfectly (8th consecutive success)
- Round 2 targeted the right gaps -- practitioner heuristics and observable signals filled the
  key gaps from Round 1
- Researcher B had no Round 2 task (academic angle was thoroughly covered in Round 1) -- idle
  researcher management worked correctly

**What went less well:**
- Researcher A did not write a feedback file before shutdown (2 of 3 wrote feedback)
- Researchers B and C both flagged Firecrawl returning oversized results for long academic
  articles (662KB for BMJ paper), with JSON format making partial reads difficult

**Feedback themes (from B and C):**
- Exa summaries were excellent for academic paper triage -- often sufficient without deep scraping
- Firecrawl PDF parser failed on one conference paper (MCP error)
- Suggestion: structured JSON extraction with targeted schema would be more token-efficient than
  full markdown for long academic papers
- Intelligence analysis angle (Heuer ACH, OSINT corroboration vs replication) was an
  underexplored rich connection

## Changes

### 1. Added "Cascade Check" section to researcher-prompt.md (lines ~250-290)

New section between Stopping Criteria and Handling Insufficient Evidence. Contains:
- 5-step cascade check procedure (trace citation chain, check copied phrasing, assess source
  type diversity, apply "how do they know?" test, watch for wire service cascades)
- Red flag list (temporal clustering, no local detail, single-origin collapse, same source type)
- Instruction to downgrade confidence and flag in CROSS-SOURCE ANALYSIS when detected

### 2. Added cascade check reference to Step 3 (Reflect)

Added seventh reflection question: "Cascade check (see below): Are my 'multiple sources'
actually independent?" -- points researchers to the new section.

## Backlog Updates

- **#7 (Information cascade detection):** RESOLVED. Research complete, heuristics engineered
  into researcher reflection step.
- **#13 (researcher-prompt.md length):** File now ~541 lines (up from ~497). Added ~44 lines.
  No evidence of instruction-following degradation across 12 prior iterations, but worth
  monitoring. Next empirical run should verify researchers find and follow the cascade check.
- **New observation:** Firecrawl returns oversized results for long academic HTML pages.
  Researchers suggest structured JSON extraction with schema. Not adding to backlog -- the Exa
  summary pattern is the recommended workaround and researchers are already following it.

## Post-Iteration Changes

Discussion after the research run led to two design changes applied to SKILL.md:

### 1. Flexible round counts (SKILL.md)

Replaced rigid per-scope round counts with ranges and convergence-based stopping:

| Scope         | Old | New |
| ------------- | --- | --- |
| Focused       | 1   | 1-2 |
| Broad         | 2   | 2-3 |
| Comprehensive | 2-3 | 3-4 |

Added early stopping language: rounds are heuristics, not targets. Stop when citation
convergence is reached. Removed hard phase-skip rules (e.g., "For Focused scope: skip to
Phase 8") and replaced with convergence checks at each triage point. Any scope can exit
early if findings have converged, and any scope can run additional rounds if gaps persist
within its budget.

### 2. Verification architecture rethink (Backlog #16 promoted)

Identified that the current verification model (reusing angle researchers in Round 3,
Comprehensive only) has two problems:

1. **Angle researchers are specialists** -- pulling them off their angle to do cross-cutting
   verification wastes their accumulated context and expertise.
2. **Verification doesn't need a round** -- it's a parallel task, not a sequential phase.

Promoted backlog #16 (dedicated verifier agents) to High Priority with full design:
- Spawn lightweight, single-purpose verifier agents on-demand after any round
- Verifiers run in parallel with angle researchers continuing their work
- Lead assigns specific claims to verify based on triage
- Available at any scope, not just Comprehensive
- Implementation deferred to a future iteration
