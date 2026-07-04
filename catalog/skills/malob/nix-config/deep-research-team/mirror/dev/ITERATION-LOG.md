# Deep Research Skill -- Self-Improvement Log

## Protocol

This file drives an iterative improvement loop for the `deep-research-team` skill. Each
iteration follows this cycle:

1. **Choose** -- Read this log. Review the backlog. Pick either a meta-research topic
   (theoretical improvement) or an empirical test (run the skill, observe friction).
2. **Research** -- Invoke `/deep-research-team` with the chosen question, or conduct
   targeted meta-research using web search.
3. **Observe** -- After research completes, analyze what happened. Record observations.
4. **Improve** -- Make targeted edits to skill files based on observations. Document changes.
5. **Checkpoint** -- Brief user check-in: what happened, what changed, what's next.
6. **Update** -- Refresh the backlog, set Current State for the next iteration.

**Resuming:** If context was compacted or a new session started, read this file from the top.
The Current State section tells you exactly where to pick up.

**File organization:** This log file contains only compact summaries (5-8 lines each) in the
Completed Iterations section. Full detail lives in `iterations/iteration-{NN}.md`. Workflow:

1. When starting an iteration, create `iterations/iteration-{NN}.md` and write detail there
2. As the iteration progresses, update the detail file (observations, changes, transcript analysis)
3. When the iteration is complete, add a compact summary to the Completed Iterations section below
4. Update Current State to point to the next iteration

Never put full iteration detail in this file — it would grow too large for quick context loading.

## Current State

- **Iteration:** 14 (ready to start)
- **Phase:** choose next backlog item
- **Next action:** Implement backlog #16 (dedicated verifier agents) -- design is clear,
  ready for engineering. Also a good candidate for empirical validation in the same iteration.
- **Round counts updated** (post-Iteration 13): Focused 1-2, Broad 2-3, Comprehensive 3-4.
  Early stopping language added. Hard scope-gated phase transitions removed in favor of
  convergence-based decisions.
- **Verification architecture rethink in progress** (backlog #16, promoted to high priority):
  Replace reuse of angle researchers for verification with dedicated on-demand verifier agents.
  Removes scope restriction (all scopes can verify), preserves angle researcher context, and
  allows verification to run in parallel with ongoing investigation.
- **Cascade detection heuristics added** (Iteration 13). researcher-prompt.md at ~541 lines.

## Completed Iterations

Full details in `iterations/iteration-{NN}.md`. Summaries here for context.

### Iteration 1 -- Compound Technical+Consumer (Empirical)

**Question:** "Leading open-source LLM inference engines for 70B on consumer GPUs?"
**Scope:** Broad (3 sonnet researchers, 2 rounds)
**Report:** `~/.claude/research/llm-inference-engines-70b-consumer-gpu/report.md`
**Key findings:** vLLM for multi-GPU, llama.cpp/Ollama for single-GPU. 25 sources.
**Problems found:** Researchers didn't self-claim follow-up tasks (biggest friction),
didn't persist Round 1 findings to disk, lead name not in spawn prompt.
**Changes (5):** Restructured reporting flow, added self-claim instructions, updated
critical rules, added lead name to spawn prompt, added mkdir permission.

### Iteration 2 -- Contested Question (Empirical)

**Question:** "Should AI model weights be open-sourced?"
**Scope:** Comprehensive (4 opus researchers, 3 rounds incl. verification)
**Report:** `~/.claude/research/ai-model-weights-open-source/report.md`
**Key findings:** 37-footnote steelmanned debate, 60+ sources. Cross-agent verification
added genuine value (one claim SUPPORTED WITH NUANCE, one CONTESTED).
**Problems found:** Self-claim fix from Iteration 1 still didn't work (confirmed pattern),
inconsistent filename casing, no round stopping criteria, no assignment guidance.
**Changes (4):** Replaced self-claim with lead-dispatched follow-ups (biggest architectural
change), normalized filenames to lowercase, added round stopping criteria, added Round 2
assignment guidance (continuity vs fresh perspective).

### Iteration 3 -- Consumer Comparison (Empirical)

**Question:** "Best mechanical keyboard for programming in 2026?"
**Scope:** Broad (3 sonnet researchers, 2 rounds)
**Report:** `~/.claude/research/best-mech-keyboard-programming-2026/report.md`
**Key findings:** Keychron dominance at every price tier. 25 sources. Top Pick: Q5 Max.
**Validated:** Lead-dispatched follow-ups worked perfectly (zero nudging), lowercase filenames
worked, assignment guidance worked, non-AI domain worked fine with Exa.
**Problems found:** Round 2 was useful-not-essential (suggests Focused might suffice for
simple Consumer), Phase 1 skipped constraint gathering, idle notification noise.
**Changes:** None needed -- all Iteration 2 changes validated successfully.

**Cumulative skill improvements across 3 iterations:** 9 changes total. Architecture now
stable: lead-dispatched follow-ups, file persistence, lowercase filenames, round stopping
criteria, assignment guidance all working. Self-claim problem fully resolved.

### Iteration 4 -- Search Tool Audit + Access Workarounds (Meta-Research)

**Question:** "What are the most effective web research tool combinations for deep research?"
**Scope:** Broad (3 sonnet researchers, 2 rounds)
**Report:** `~/.claude/research/web-research-tool-effectiveness/report.md`
**Key findings:** Exa and Firecrawl MCP tools expose only a subset of their full API
capabilities. Switched Exa to hosted endpoint, added academic search strategies, content
access workarounds, and Firecrawl advanced features to researcher prompt.
**Validated:** Lead-dispatched follow-ups (5th consecutive success), meta-research through
the team skill is viable and effective.
**Problems found:** None during run. Post-iteration discovered `contextMaxCharacters` bug
suppressing Exa summaries/highlights.
**Changes (6 to researcher-prompt.md + major post-iteration infrastructure):** Expanded
Available Tools, added Firecrawl Search Operators, Academic Search, Content Extraction
advanced features, Accessing Restricted Content sections. Post-iteration: switched Exa MCP
to hosted endpoint, reduced tools from 5 to 2, added `enableSummary` + `textMaxCharacters: 1`
default pattern, added category restriction table. Resolved backlog #18.

**Cumulative skill improvements across 4 iterations:** 15 changes. Major post-iteration
infrastructure overhaul to Exa tooling.

### Iteration 5 -- Scientific/Health Empirical (IF + Cognitive Performance)

**Question:** "Does intermittent fasting improve cognitive performance?"
**Scope:** Broad (3 sonnet researchers, 2 rounds)
**Report:** `~/.claude/research/intermittent-fasting-cognitive-performance/report.md`
**Key findings:** Acute fasting is cognitively neutral (meta-analysis of 63 studies). 26
footnotes. Evidence pyramid template validated. Calibrated confidence language worked well.
**Validated:** Exa summary pattern (32/32 compliant), lead-dispatched follow-ups (6th success),
academic source quality strong.
**Changes (3):** Implemented shutdown feedback reports (researcher-prompt.md + SKILL.md Phase 10),
added `scripts/analyze-transcripts.py` for JSONL analysis. Resolved backlog #12, #23.

**Cumulative skill improvements across 5 iterations:** 18 changes. All synthesis templates
validated except Emerging/Frontier and Opinion/Sentiment.

### Iteration 6 -- Emerging/Frontier Empirical (LLM Reasoning)

**Question:** "What are the current approaches to LLM reasoning?"
**Scope:** Comprehensive (4 opus researchers, 3 rounds incl. verification)
**Report:** `~/.claude/research/llm-reasoning-approaches/report.md`
**Key findings:** ~400 lines, 55 footnotes. RLVR as dominant paradigm shift. PRM vs ORM conflict
resolved (both correct in different regimes). CoT faithfulness 2.3% CONTESTED (single study),
<20% verbalization SUPPORTED WITH NUANCE.
**Validated:** Emerging/Frontier template, shutdown feedback reports (all 4 wrote files), category
restriction table (tweet, news, personal site all worked), Exa compliance 49/49 (100%).
**Changes (0):** No skill file changes. Identified backlog #26 (arxiv guidance) and #27
(verification verdict expansion) for quick implementation.

**Cumulative skill improvements across 6 iterations:** 18 changes. Only Opinion/Sentiment
template remains untested.

### Iteration 7 -- Agent Teams Docs Audit (Meta)

**Scope:** No research run -- audit skill against official Anthropic documentation.
**Key findings:** Architecture fully validated against Anthropic's docs and their own research
system. Hub-and-spoke, lead-dispatched, filesystem output, verification pattern all confirmed.
Permission inheritance confirmed (teammates inherit lead's settings). Anthropic uses Opus lead +
Sonnet subagents with 90.2% improvement over single-agent.
**Changes (2):** arxiv scraping guidance (#26), SUPPORTED WITH NUANCE verdict (#27).

### Iteration 8 -- Scope Calibration Refinement (Meta)

**Scope:** No research run -- analyze 7 empirical data points.
**Key findings:** Current defaults correct 6/6 times. Consumer is only type with de-escalation
evidence. Report length is scope-driven, not type-driven.
**Changes (3):** Scope modifiers and empirical output expectations added to question-types.md,
SKILL.md Phase 2 updated.

**Cumulative skill improvements across 8 iterations:** 21 changes (counting Iteration 7's 2).

### Iteration 9 -- Opinion/Sentiment + Mixed Model Config (Empirical)

**Question:** "What do developers actually think about Nix and NixOS in 2026?"
**Scope:** Comprehensive (4 sonnet researchers, 2 rounds -- no Round 3 verification needed)
**Report:** `~/.claude/research/developer-opinions-nix-nixos-2026/report.md`
**Key findings:** ~370 lines, 50 footnotes, 60+ sources. Developer opinion defined by paradox:
fastest community growth ever (30% YoY) alongside deepest fragmentation ever (governance crisis,
three forks). Pragmatic "devshells only" is the dominant successful adoption pattern. Wrapper
tools (Devbox 11K stars, devenv 6K, Flox 3.7K) work for 80% case, break at edges.
**Tested:** Opinion/Sentiment template (last untested), Sonnet researchers in Comprehensive scope
(backlog #7). Both validated successfully.
**Changes (3):** Updated researcher-prompt.md Reddit section (restrict_sr=on, prefer /top/ over
/search/, note curl permission cost), added GitHub data guidance (Exa code context + gh api,
no curl), added Discourse JSON search API fallback.
**Backlog items resolved:** #7 (mixed model config -- Sonnet validated for Comprehensive).

**Cumulative skill improvements across 9 iterations:** 24 changes. All 7 synthesis templates
tested. Sonnet validated as viable Comprehensive override (Opus kept as default).

### Iteration 10 -- Reddit MCP Server Integration (Engineering)

**Scope:** No research run -- engineering integration.
**Key findings:** Fresh evaluation confirmed jordanburke/reddit-mcp-server as best option
(v1.2.1, actively maintained, 9 read tools + search, anonymous mode). Hawstein/mcp-server-reddit
stale (no commits in 10 months, no search). New entrants too immature.
**Changes (4):** Added reddit-mcp-server to 1MCP config (anonymous mode), added Reddit
ToolSearch to researcher setup, added Reddit tool block to Available Tools section,
replaced curl-based Reddit access with MCP tool guidance in researcher-prompt.md.
**Backlog items resolved:** #8 (Reddit MCP server integration).

**Cumulative skill improvements across 10 iterations:** 28 changes. Zero curl dependencies
in researcher workflows (Reddit MCP + GitHub gh api).

### Iteration 11 -- Reddit MCP Empirical Validation

**Question:** "What is the best community-favorite content about the TV show Dark?"
**Scope:** Focused (2 sonnet researchers, 1 round)
**Report:** `~/.claude/research/dark-tv-show-community-content/report.md`
**Key findings:** 24-source report across 5 content categories (video essays, podcasts, Reddit
mega-threads, visual companion tools, philosophical/academic writing). OneTake and Think Story
top YouTube; r/DarK mega-threads are canonical community references; academic philosophy papers
exist from Springer and Blackwell series.
**Validated:** Reddit MCP integration end-to-end (9/9 goals passed). Both researchers loaded
Reddit tools via ToolSearch, used Firecrawl search for discovery + Reddit MCP for extraction,
zero curl usage, zero permission prompts from Reddit.
**Problems found:** `firecrawl_search` with subreddit-scoped `site:reddit.com/r/DarK` returned
generic results (broad `site:reddit.com` worked better). `get_top_posts` returns memes/meta for
entertainment subreddits, insufficient alone for substantive threads.
**Changes (2):** Updated researcher-prompt.md Reddit section: added Firecrawl search scoping
note (broad > subreddit-specific), clarified get_top_posts limitation for entertainment subs.

**Cumulative skill improvements across 11 iterations:** 33 changes (30 from iteration + 3
post-iteration housekeeping: generalized transcript script, filesystem path support, simplified
feedback template). Reddit MCP fully validated.

### Iteration 12 -- Firecrawl Scrapability Testing (Engineering)

**Scope:** No research run -- empirical testing of all documented content workaround URLs.
**Key findings:** archive.ph CAPTCHA-blocked (429) even with stealth/enhanced proxy.
freedium.cfd DNS dead (replaced by freedium-mirror.cfd, works great). Bluesky bsky.app is a
JavaScript SPA requiring `waitFor: 5000` (no proxy, 1 credit); raw API unnecessary.
xcancel.com works but needs `proxy: "stealth"` + `waitFor: 5000` (5 credits). Wayback Machine
shortcut `/web/{URL}` works -- Firecrawl follows redirect to latest snapshot (initial 404s were
unarchived pages, not format errors). Lessons: validate test inputs (xcancel), test against
known-good data (Wayback Machine).
**Changes (5 to researcher-prompt.md):** Demoted archive.ph, simplified Wayback Machine to
shortcut format, added xcancel proxy requirements, replaced freedium.cfd with
freedium-mirror.cfd, documented Bluesky SPA waitFor requirement.
**Backlog items resolved:** #12 (Firecrawl scrapability testing).

**Cumulative skill improvements across 12 iterations:** 38 changes. All content access
workarounds empirically validated. Researchers will no longer waste calls on dead endpoints.

### Iteration 13 -- Information Cascade Detection (Empirical + Engineering)

**Question:** "How do journalists, fact-checkers, and researchers detect information cascades?"
**Scope:** Broad (3 sonnet researchers, 2 rounds)
**Report:** `~/.claude/research/information-cascade-detection/report.md`
**Key findings:** Three converging research traditions (journalism, bibliometrics, computational
social science) all address cascade detection independently. Greenberg 2009 foundational for
citation distortion taxonomy. Woozle effect quantified (76% affirm debunked myths). Practitioner
heuristics are tacit knowledge -- no org publishes explicit cascade checklist. Intelligence
analysis (Heuer ACH, ICD 203) has most rigorous source independence frameworks. Composite
signals (temporal clustering, textual overlap, network topology, metadata) most reliable.
**Validated:** Lead-dispatched follow-ups (8th success), idle researcher management (B had no
Round 2 task), all operational patterns stable.
**Changes (2):** Added 5-step "Cascade Check" section to researcher-prompt.md with red flags
and procedure. Added cascade check reference to Step 3 (Reflect) questions.
**Backlog items resolved:** #7 (information cascade detection).

**Cumulative skill improvements across 13 iterations:** 40 changes. Researchers now have
explicit cascade detection heuristics in the reflection step. researcher-prompt.md at ~541 lines.

## Backlog

Prioritized list of things to investigate or test. Re-prioritized each iteration.

### High Priority

16. **[Engineering] Dedicated verifier agents** -- Restructure verification from reusing angle
    researchers to spawning lightweight, single-purpose verifier agents on-demand. Current
    approach wastes angle researchers' accumulated context and blocks investigation flow.

    **New design:** Angle researchers (A, B, C) own their angles for the full session and
    maintain context continuity. When the lead's triage identifies a high-impact single-source
    claim at any point, it spawns a dedicated verifier (sonnet, small context, focused task).
    The verifier receives only the claim + source URL, searches for independent evidence,
    reports a verdict (SUPPORTED / SUPPORTED WITH NUANCE / CONTESTED / UNCHANGED), and shuts
    down. Verifiers run in parallel with ongoing angle work -- no separate phase or round needed.

    **What this fixes:** (1) Removes the Comprehensive-only scope restriction -- any scope can
    verify because it's just a lightweight parallel agent. (2) Preserves angle researcher
    expertise -- they stay on their domain instead of context-switching to verify unrelated
    claims. (3) Eliminates the Phase 7 bottleneck -- verification no longer requires a
    dedicated round. (4) Cleaner separation of concerns -- investigation vs verification are
    different tasks that benefit from different agent configurations.

    **Implementation:** Refactor Phase 7 out of the sequential phase structure. Add verification
    dispatch logic to Phase 5 triage (and any subsequent triage). Update Effort Calibration
    table to show verification as available to all scopes. Update researcher spawn prompts
    (verifiers need a different, simpler prompt than angle researchers). Test empirically.

17. **[Research] Confidence assessment methodology** -- The current triage confidence levels
    (HIGH/MEDIUM/LOW) are based primarily on independent source count. Source count is a crude
    proxy -- a single well-designed RCT can warrant more confidence than five blog posts citing
    each other. Source *quality* matters but is hard to assess systematically. Worth a meta-research
    run to explore: How do intelligence analysts, systematic reviewers, and epistemologists think
    about evidence quality? What frameworks exist beyond source counting? (Heuer's ACH and ICD 203
    from iteration 13 are starting points.) Goal: replace or augment the current source-count
    heuristic with something that accounts for source quality, methodology strength, and
    independence more holistically.

5. **[Engineering] Permission setup / onboarding flow** -- Audit all permissions needed for
   the skill to run without prompts (mkdir, Write to research dir, researcher Bash calls for
   sleep/retry/curl). Build a setup check at skill invocation that verifies permissions exist
   and offers to add them. Permission inheritance now confirmed (Iteration 7 audit): teammates
   inherit the lead's permission settings. Iteration 9 confirmed curl is the biggest permission
   friction source. Key for making the skill shareable beyond Malo. Not a research task -- pure
   engineering.

6. ~~**[Meta] Scope calibration guidance**~~ -- **Resolved (Iteration 8).** Added scope modifiers
   (de-escalation/escalation signals per type) and empirical output expectations to
   `references/question-types.md`. All 7 defaults validated. Consumer is the only type with
   observed de-escalation opportunity. Phase 2 updated to reference modifiers.

7. ~~**[Empirical] Mixed model config for Comprehensive**~~ -- **Resolved (Iteration 9).** Tested
   Opus lead + 4 Sonnet researchers on Comprehensive scope (Opinion/Sentiment question). Sonnet
   validated as viable -- researchers completed both rounds, followed methodology, wrote structured
   findings and feedback. However, Opus kept as Comprehensive default: one successful run on a
   less demanding question type doesn't prove Sonnet handles the hardest Comprehensive questions
   (e.g., contested scientific topics with complex verification). SKILL.md notes Sonnet as an
   available override when cost matters.

8. ~~**[Engineering] Reddit MCP server integration**~~ -- **Resolved (Iteration 10).** Integrated
   `jordanburke/reddit-mcp-server` via 1MCP with anonymous mode (~10 rpm). Researcher methodology
   updated to use native MCP tools (`search_reddit`, `get_top_posts`, `get_post_comments`, etc.)
   instead of curl. Eliminates ~8-10 permission prompts per research run. Zero curl dependencies
   remain in researcher workflows. Can upgrade to app-only auth (60 rpm) later if rate limits
   become an issue -- requires Reddit API application approval.

### Medium Priority

7. ~~**[Meta] Information cascade detection**~~ -- **Resolved (Iteration 13).** Researched across
   three traditions (journalism, bibliometrics, computational social science). Distilled findings
   into a 5-step "Cascade Check" section in researcher-prompt.md with red flags and procedure.
   Researchers now check source independence during Step 3 (Reflect).

8. ~~**[Meta] Report length targets per question type**~~ -- **Resolved (Iteration 8).** Added
   empirical output expectations table to `references/question-types.md` (Focused ~150-200
   lines/10-15 sources, Broad ~200-300/20-30, Comprehensive ~350-400+/40-60). Presented as
   descriptive ranges, not targets.

9. **[Meta] Optimal angle decomposition** -- Research strategies for generating maximally
   complementary research angles. Could improve Phase 1 planning.

10. **[Meta] Source diversity vs quality tradeoffs** -- When should researchers prefer
    breadth over authority? Could refine stopping criteria.

11. **[Engineering] Exa `deep` search type via MCP** -- Exa's API supports `type: "deep"`
    which does automatic query expansion + parallel search + re-ranking ($0.015/search). This
    would replace the manual "generate 3-5 query variations" pattern with a single call +
    `additionalQueries`. Currently blocked: the hosted MCP endpoint (`mcp.exa.ai`) only
    exposes auto/fast/neural in the type enum. Monitor for when Exa adds deep to MCP.

12. ~~**[Engineering] Firecrawl scrapability testing**~~ -- **Resolved (Iteration 12).** Tested
    all 7 documented workarounds with actual Firecrawl calls. 2 broken (archive.ph CAPTCHA,
    freedium.cfd DNS dead), 1 replaced (freedium-mirror.cfd works), 1 simplified (Wayback
    Machine shortcut `/web/{URL}` works -- initial 404s were unarchived pages), 2 updated
    with required params (xcancel.com needs stealth proxy, Bluesky bsky.app needs waitFor
    for SPA). Docs updated to prevent researchers from wasting calls on dead endpoints.

13. **[Meta] Researcher-prompt.md length monitoring** -- File is ~438 lines. Researchers
    successfully followed all guidance in Iteration 6 (100% Exa compliance, feedback reports
    written). No evidence of instruction-following degradation. Continue monitoring but
    deprioritized -- no splitting needed yet.

14. **[Meta/Engineering] Exa vs dedicated academic search** -- Iteration 6 confirmed strong
    academic search via `category: "research paper"` for CS/ML (arxiv, NeurIPS, ICLR, ACL,
    ICML sources found). Iterations 5+6 together show the current setup works well for both
    biomedical and CS domains. Deprioritized unless a specific academic search failure occurs.

15. **[Engineering] Skill setup / environment bootstrapping** -- Investigate using skill
    `!` bang patterns or a setup phase to automatically verify/dump environment state at skill
    invocation. Related to backlog #5 (permission setup) but broader.

### Lower Priority

13. **[Meta] Self-reflection patterns in multi-agent research** -- How does extended
    thinking interact with the investigation loop?

14. **[Meta] Synthesis quality patterns** -- What makes a good research synthesis? Compare
    our output against professional research reports.

15. **[Meta] Consumer Phase 1 constraint gathering** -- Should Consumer questions always get
    a quick "Any constraints?" even when the question seems clear? Minor UX improvement.

16. **[Speculative] Researcher compaction robustness** -- Whether researchers need explicit
    compaction handling. Assessment: low risk. 6 iterations without compaction issues.
