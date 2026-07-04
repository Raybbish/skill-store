# Iteration 9 -- Opinion/Sentiment + Mixed Model Config (Empirical)

## Plan

**Type:** Empirical (Opinion/Sentiment question)
**Backlog items:** #7 (mixed model config), last untested synthesis template
**Scope:** Comprehensive (4 sonnet researchers, 2 rounds -- model override from opus to sonnet)

**Goal:** Combine two tests in a single empirical run: (1) Validate Sonnet researchers for
Comprehensive scope (backlog #7), replacing the Opus default. Anthropic's own research system
uses Opus lead + Sonnet subagents. (2) Test the Opinion/Sentiment synthesis template, the last
of 7 templates never used in a real run.

**Question:** "What do developers actually think about Nix and NixOS in 2026?"

**Angles:**

- (A) Community sentiment: overall vibe, praise vs frustration, how feelings have shifted
- (B) Pain points and barriers: learning curve, documentation, Nix language, flakes controversy
- (C) Enterprise/professional adoption: companies using Nix, CI/CD patterns, onboarding stories
- (D) Governance and community health: foundation drama, forks (Lix, Aux, Tvix), SC elections

## Research Summary

**Report:** `~/.claude/research/developer-opinions-nix-nixos-2026/report.md`

**Round 1:** All 4 Sonnet researchers completed successfully. Strong convergence on the
paradox theme: fastest community growth ever (30% YoY) alongside deepest fragmentation ever
(governance crisis, three forks). Researcher A surfaced the sentiment spectrum from "Nix
changed my life" to "I quit after 6 months." Researcher B documented the learning curve and
documentation as top pain points across all sources. Researcher C found enterprise adoption
concentrated in devshells-only patterns with wrapper tools. Researcher D provided deep coverage
of the 2024-2025 governance crisis and its aftermath. Total: ~50+ sources across researchers.

**Triage identified:** (1) Gap: moderate/ambivalent voices underrepresented (survivorship bias
in online discussions), (2) DetSys conflict of interest not fully explored (company behind
flakes also behind commercial products), (3) wrapper tools ecosystem deserved deeper
comparison, (4) Steering Committee election results and their impact not covered.

**Round 2:** Researcher A (gap-fill) found moderate voices -- "Nix purgatory" users stuck
between love and frustration, plus successful teams who don't post online. Researcher B
(deep-dive) investigated DetSys conflict with nuance -- found community resentment but also
genuine engineering contributions. Researcher C (deep-dive) did comprehensive wrapper tools
comparison with GitHub stars, feature matrices, and community adoption data. Researcher D
(gap-fill) covered SC election results and post-crisis governance trajectory.

**Round 3 skipped:** No single-source high-impact claims remaining. All major conflicts
resolved by Round 2. Remaining uncertainties about magnitude, not direction.

**Final report:** ~370 lines, 50 footnotes, 60+ sources. Opinion/Sentiment template with
5-segment distribution of views and representativeness assessment.

## Observations

**What worked well:**

- **Opinion/Sentiment template validated with adaptation.** The 3-segment default structure
  (Majority/Minority/Outlier) was adapted to 5 segments to capture the nuanced reality:
  Passionate Core (~15-20%), Pragmatic Middle (~30-35%), Frustrated Dropouts (~20-25%),
  Nix Purgatory (~15-20%), and Broader Dev Population (~10-15%). The template's
  Representativeness Assessment section added genuine value.
- **Sonnet researchers produced Comprehensive-quality output.** All 4 researchers completed
  both rounds, followed all methodology guidance, wrote structured findings and feedback
  reports. No evidence of quality degradation vs Opus researchers in Iterations 2 and 6.
- **Lead-dispatched follow-ups:** 8th consecutive success, zero nudging needed.
- **All researchers completed on first try.** No stalls, no nudging, no retries.
- **Feedback reports written by all 4 researchers.** Continued validation of this mechanism.
- **Verification skip was correct.** Round 2 resolved all major gaps and conflicts. No
  single-source claims would have changed the report's conclusions.

**Permission friction observed:**

- **curl commands required user approval.** Researchers used `curl` for Reddit JSON API and
  GitHub API endpoints, triggering ~8-10 permission prompts during the run. This is the first
  time permission friction was significant enough for the user to raise it post-run.
- **Root cause:** The researcher-prompt.md Reddit section recommends curl for Reddit JSON API
  (since Exa doesn't index Reddit and Firecrawl blocks it). GitHub API was also accessed via
  curl for stars/forks data.

**Researcher feedback highlights:**

- Researcher A: Exa with enableSummary + textMaxCharacters:1 excellent for rapid triage.
  Category gotchas (tweet, company) useful to know upfront.
- Researcher B: Firecrawl scraping of HN threads returned full comment trees in markdown --
  very useful for community sentiment capture.
- Researcher C: Reddit JSON API `restrict_sr=on` was essential -- without it, global results
  instead of subreddit-specific. Exa didn't index GitHub issue bodies well. Recommended
  GitHub search API patterns in methodology.
- Researcher D: Strong coverage of Discourse-based forums (NixOS Discourse) via direct
  Firecrawl scraping. Exa worked well for blog posts and personal sites.

## Changes Made

3 changes to `references/researcher-prompt.md`:

1. **Reddit section updated** -- Added `restrict_sr=on` requirement with example URL pattern,
   guidance to prefer `/top/` and `/hot/` over `/search/` for sentiment research (browsing
   reveals organic discussions), note that curl requires user permission approval each time.

2. **GitHub data guidance added** -- New section before "Medium paywalled articles": Exa
   `get_code_context_exa` as primary tool for GitHub content discovery, Firecrawl for deep
   extraction of specific pages, `gh api` for quantitative data (stars, forks, issues) since
   it's already permitted. Explicit "do not use curl for GitHub API endpoints."

3. **Discourse JSON search API added** -- New section after GitHub: Firecrawl scrape of
   `/search.json?q=...` as fallback when Exa can't find specific forum topics. Returns
   structured results with topic IDs for follow-up scraping.

**Backlog items resolved:** #7 (mixed model config -- Sonnet validated for Comprehensive).

## Notes for Next Iteration

- **All 7 synthesis templates now tested.** The skill is mature for research operations.
  Opinion/Sentiment required the most template adaptation (5 segments vs 3) but the framework
  accommodated this well.
- **Sonnet validated as viable Comprehensive override, Opus kept as default.** One successful
  run (Opinion/Sentiment) doesn't prove Sonnet handles the hardest Comprehensive questions.
  SKILL.md notes Sonnet as an available override when cost matters.
- **Reddit MCP is the top engineering priority.** The curl permission friction this iteration
  is the strongest signal yet. Backlog #8 has full context on options.
- **Permission setup (#5) remains important** for shareability. Inheritance is confirmed but
  specific Bash permissions (curl, sleep) still cause friction.
