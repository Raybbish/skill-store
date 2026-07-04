# Iteration 4 -- Search Tool Audit + Access Workarounds (Meta-Research)

## Plan

**Type:** Meta-research (run through the team skill, not manual)
**Backlog item:** #4
**Scope:** Broad (3 sonnet researchers, 2 rounds)

**Goal:** Audit the full Exa and Firecrawl tool sets for underused features, research
academic search options and paywall workarounds, then update `researcher-prompt.md` with
improved guidance.

## Research Summary

**Report:** `~/.claude/research/web-research-tool-effectiveness/report.md`

Round 1 angles: (A) Exa/Firecrawl advanced features, (B) content access workarounds,
(C) academic search strategies. Round 2 follow-ups: (A) optimal Exa+Firecrawl workflow
decision tree, (B) blind spot check (OpenAlex, Firecrawl limitations, additional APIs).
Researcher C shut down early (no follow-up needed). 24+ sources, 5 findings per researcher.

**Critical finding:** Both Exa and Firecrawl MCP tools expose only a subset of their full
API capabilities. **Resolved post-iteration:** Switched Exa from npm package to hosted HTTP
endpoint (`mcp.exa.ai/mcp`) with `web_search_advanced_exa` and `people_search_exa` enabled.
This exposed all missing parameters (category, includeDomains/excludeDomains, date filtering,
highlights/summary). Firecrawl search was then removed from the researcher prompt as
redundant -- Exa advanced covers domain targeting, date filtering, and category filtering
natively, reducing researcher cognitive load from 5 tools to 4.

## Observations

**What worked well:**

- First meta-research iteration run through the team skill -- worked as well as empirical
  runs. The compound Technical framing with 3 angles mapped naturally to the 4 sub-questions.
- Lead-dispatched follow-ups: zero nudging needed (4th consecutive success).
- Researchers independently discovered the same critical insight (Exa MCP limitations) from
  different angles -- genuine cross-validation.
- Researcher A did empirical testing in Round 2 (actually ran comparative Exa vs Firecrawl
  queries), adding real evidence beyond documentation review.
- Early shutdown of Researcher C was clean and efficient.
- Researcher B found significant blind spots in Round 2 (OpenAlex, Bluesky API, Firecrawl
  Cloudflare issues, underused Firecrawl formats) -- the follow-up was genuinely valuable.

**Process observations:**

- Meta-research through the team skill is viable and arguably better than manual research --
  the multi-angle approach and forced cross-referencing catch things manual research would miss.
- The decision to frame "search tool audit" as a Technical compound question worked well.
  Could serve as a template for future meta-research iterations.

**No problems found.** The skill ran smoothly across all phases.

## Changes Made

**5 changes to `researcher-prompt.md`:**

1. **Expanded "Available Tools" section** -- Added Firecrawl search to the tool list, added
   a "When to use which" decision guide distinguishing Exa (semantic discovery) from Firecrawl
   search (precision targeting with operators) from Firecrawl scrape (content extraction).

2. **Added "Firecrawl Search Operators" section** -- Table of Google-style operators (site:,
   exact match, exclusion, intitle:, inurl:, tbs date filtering with examples). Includes
   caveat about tbs filtering by index date vs publication date.

3. **Added "Academic Search" section** -- Three-step workflow (Exa for broad discovery ->
   Firecrawl search with site: for domain targeting -> Firecrawl scrape for full content).
   Lists useful academic domain targets. Lists free academic APIs (Semantic Scholar, OpenAlex,
   arXiv) with URL patterns.

4. **Expanded "Content Extraction" section** -- Added advanced scrape features: summary format
   for triage, links format for citation chains, JSON extraction with schema, includeTags/
   excludeTags, waitFor for SPAs, proxy options, PDF parsing, maxAge caching. Added "if scrape
   returns empty" workflow.

5. **Added "Accessing Restricted Content" section** -- Complete workaround guide: archive.ph
   for paywalls (with URL patterns), xcancel.com for Twitter/X, Reddit .json endpoint,
   Freedium for Medium, Bluesky public API, LinkedIn limitations. Each with exact URL patterns.

**1 additional change:** 6. **Updated Setup section** -- Added `ToolSearch: "+firecrawl search"`
to load Firecrawl search tool alongside scrape.

**Post-checkpoint fix:** Prettier mangled `>` characters in source evaluation priority chains
(e.g., `documentation > code examples > blog posts`) into markdown blockquotes. Replaced all
`>` separators with ", then" phrasing across all 6 type-specific entries for prettier safety.

**Post-iteration infrastructure change (backlog #18 resolved):**
Switched Exa MCP from npm package (`exa-mcp-server`) to hosted HTTP endpoint
(`mcp.exa.ai/mcp`) with `web_search_advanced_exa` and `people_search_exa` enabled. This
exposed all parameters identified as missing during Iteration 4 research. Firecrawl search
was then removed from the researcher prompt entirely -- Exa advanced covers domain targeting,
date filtering, and category filtering natively. Net effect: researchers now have 4 tools
instead of 5, simpler decision-making, and more powerful search capabilities.

**Post-iteration bug discovery (contextMaxCharacters suppresses summaries/highlights):**
Investigated why `enableHighlights` and `enableSummary` produced no visible output through
the Exa MCP endpoint. Read the npm package source and found two bugs in the response
formatter: (1) When `contextMaxCharacters` is set, the API returns a `context` field that
the formatter uses exclusively, dropping per-result data including summaries and highlights.
(2) The `ExaSearchResult` type doesn't include `highlights` at all -- they're requested from
the API but silently dropped. **Fix:** Use `textMaxCharacters: 1` + `enableSummary: true`.
Do NOT set `contextMaxCharacters`.

**Post-iteration tool simplification:**
Reduced Exa tools from 5 to 2: `web_search_advanced_exa` + `get_code_context_exa`.

**Post-iteration category guidance:**
Added category restriction table and usage hints from Exa skills repo.

## Notes for Next Iteration

- Researcher-prompt.md is ~420 lines. Monitor for issues.
- Default Exa search pattern (`enableSummary: true` + `textMaxCharacters: 1`) untested
  in empirical run. First test will reveal whether researchers follow the guidance.
- Category filter restrictions documented but untested.
- Academic search strategies documented but untested in Scientific/Health run.
