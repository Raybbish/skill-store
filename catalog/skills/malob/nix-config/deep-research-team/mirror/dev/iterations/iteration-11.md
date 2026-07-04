# Iteration 11 -- Reddit MCP Empirical Validation

## Type

Empirical (Focused scope run to validate Iteration 10 engineering changes)

## Question

"What is the best community-favorite content about the TV show Dark -- videos, write-ups,
essays, analyses, explainers, fan theories?"

## Config

- **Scope:** Focused (2 researchers, 1 round)
- **Question type:** Consumer/Recommendation
- **Model:** Sonnet researchers
- **Report:** `~/.claude/research/dark-tv-show-community-content/report.md`

## Validation Goals & Results

| Goal                                          | Result | Notes                                                                                       |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Researchers load Reddit tools via ToolSearch   | Pass   | Both loaded successfully                                                                    |
| Firecrawl search with site:reddit.com works   | Pass   | Both used it. B called it "the single most valuable technique"                              |
| get_top_posts extracts Reddit content          | Pass   | Both used. Returns memes/appreciation at top; insufficient alone for substantive threads     |
| get_post_comments extracts thread discussions  | Pass   | A used on 4 threads, B on 2. Specific upvote counts, ratios, user quotes extracted          |
| get_reddit_post works for specific posts       | Pass   | B used on 7 posts with engagement metrics                                                   |
| get_subreddit_info works                       | Pass   | B used to get 213K member count                                                             |
| search_reddit works                            | Pass   | A used 2 queries                                                                            |
| Zero curl usage for Reddit                     | Pass   | No permission prompts observed                                                              |
| Useful findings produced                       | Pass   | 24-source report with specific engagement data, 5 categories of content                     |

**Overall: 9/9 validation goals passed. Reddit MCP integration works end-to-end.**

## Tool Usage Summary

### Researcher A

- **Exa:** enableSummary, textMaxCharacters, numResults (standard pattern)
- **Firecrawl:** firecrawl_search for Reddit discovery
- **Reddit MCP:** search_reddit (2), get_top_posts (1), get_post_comments (4)
- **Issues:** `site:reddit.com/r/DarK` in Firecrawl search was too specific, returned generic
  results. Broader `site:reddit.com` worked better.

### Researcher B

- **Exa:** enableSummary, textMaxCharacters, numResults, excludeDomains, category (personal site)
- **Firecrawl:** firecrawl_scrape (4 URLs), firecrawl_search for Reddit discovery
- **Reddit MCP:** get_top_posts (1), get_post_comments (2), get_reddit_post (7), get_subreddit_info (1)
- **Issues:** Medium paywall blocked full markdown extraction (summary format worked). Top posts
  from r/DarK were overwhelmingly memes -- needed Firecrawl search for substantive threads.

## Key Observations

### Two-layer Reddit pattern validated

The Firecrawl search (discovery) + Reddit MCP (extraction) pattern works well. Both researchers
used it independently and both endorsed it in feedback.

### get_top_posts is necessary but insufficient

For topic-specific threads, `get_top_posts` returns the most popular posts overall (which for
entertainment subreddits are memes and appreciation posts, not analytical content). The Firecrawl
search layer is essential for finding substantive threads on specific topics.

### Firecrawl search scoping

Researcher A found that `site:reddit.com/r/DarK` (subreddit-scoped) returned generic video
essay threads instead of r/DarK-specific content. The broader `site:reddit.com` with topic
keywords in the query worked better. This is worth noting in the methodology.

### Researcher complementarity

Good angle separation produced minimal overlap. Both independently found the mmmmmmmmichaelscott
FAQ and The_Wattsatron easter eggs post (confirming canonical status via independent discovery).
A focused on video/audio content; B focused on written/academic content.

### Exa category filter usage

Researcher B used `category: "personal site"` to filter to independent blog essays, which
effectively surfaced philosophical analyses while filtering out corporate listicle content.
Good technique for this question type.

## Changes Made

### 1. Note Firecrawl search scoping in researcher-prompt.md

Add note that `site:reddit.com` (broad) works better than `site:reddit.com/r/subreddit`
(subreddit-scoped) in Firecrawl search queries.

### 2. Note get_top_posts limitation in researcher-prompt.md

Clarify that `get_top_posts` returns the most popular posts overall (often memes/meta for
entertainment subreddits), not necessarily the most substantive analytical content. Recommend
using Firecrawl search for finding topic-specific substantive threads.

## Transcript Analysis

Script: `analyze-transcripts.py --session 5213f595-f4b6-4140-b7e0-5d2908d822d7`

**Exa compliance: 10/10 (100%)**
- All calls used `enableSummary: true` + `textMaxCharacters: 1`
- Zero `contextMaxCharacters` violations

**All MCP calls (42 total across both researchers):**
- Reddit: 22 (get_reddit_post: 9, get_post_comments: 7, search_reddit: 3, get_top_posts: 2, get_subreddit_info: 1)
- Exa: 10 (web_search_advanced_exa: 10)
- Firecrawl: 10 (firecrawl_search: 6, firecrawl_scrape: 4)

**Notable patterns:**
- Researcher B used `excludeDomains: ["reddit.com"]` on Exa to avoid duplicate Reddit results
- Researcher B used `category: "personal site"` for blog essay discovery (2 calls)
- Reddit was the most-used MCP server — appropriate for a community-content question

## Post-Iteration Housekeeping

Changes made in the same session after the main iteration writeup:

### 3. Generalize analyze-transcripts.py to track all MCP tools

Replaced hardcoded Exa/Firecrawl parsing with generic MCP tool detection via
`re.compile(r"(?:mcp__1mcp__)?(\w+?)_1mcp_(\w+)")`. All 1MCP tools now captured and grouped
by server. Custom formatters for Exa (with compliance checking), Firecrawl, and Reddit.
Aggregate report shows per-server totals and per-endpoint breakdown.

### 4. Fix --project-dir to accept filesystem paths

`--project-dir` now accepts regular filesystem paths (e.g., `/Users/malo/.config/nix-config`)
in addition to `~/.claude/projects/{slug}` paths. Slug algorithm: `re.sub(r"[^a-zA-Z0-9]", "-", path)`.

### 5. Simplify researcher feedback template

Removed the "Search Tools" section (redundant now that the transcript script extracts all MCP
tool usage automatically). Reframed template as qualitative reflection: What Worked, Issues,
Suggestions. Added framing note so researchers understand the purpose.

## Backlog Changes

- No items resolved (validation run, not feature addition)

**Cumulative changes including housekeeping: 30 + 3 = 33.**
