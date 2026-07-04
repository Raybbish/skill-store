# Iteration 10 -- Reddit MCP Server Integration (Engineering)

## Plan

**Type:** Engineering (no research run)
**Backlog item:** #8 (Reddit MCP server integration)

**Goal:** Eliminate the last curl dependency in researcher workflows by integrating a Reddit
MCP server via 1MCP, and updating the researcher methodology to use native MCP tools instead
of curl for Reddit content access.

**Background:** Iteration 9 confirmed significant permission friction (~8-10 curl prompts per
run) from Reddit JSON API access. Prior research (`~/.claude/research/reddit-access-for-claude-code/report.md`)
identified `jordanburke/reddit-mcp-server` as the top option. Fresh evaluation confirmed:
- Still actively maintained (v1.2.1 published ~10 days ago, 108 commits, 4 contributors)
- 9 read tools + 6 write tools, including `search_reddit` (critical for researchers)
- Anonymous mode: zero credentials, ~10 rpm, zero setup
- `npx reddit-mcp-server` -- no install needed, 1MCP compatible via stdio
- Runner-up (Hawstein/mcp-server-reddit) is stale -- no commits in 10 months, no search tool
- New entrants (liuyang1520, karanb192) too immature (0 stars, requires auth/local install)

Legal context unchanged: Reddit v. Anthropic lawsuit makes this fraught, but low-volume
personal use risk is low. Anonymous mode doesn't even use API credentials.

## Changes Made

### 1. Added Reddit MCP server to 1MCP config

**File:** `configs/claude/1mcp.json`

Added `reddit` server entry with `npx reddit-mcp-server` and explicit `REDDIT_AUTH_MODE: "anonymous"`.
Placed alphabetically before the `gws` entry. Server will be available via 1MCP as
`mcp__1mcp__reddit_1mcp_{tool_name}`.

### 2. Updated researcher methodology -- Setup section

**File:** `~/.claude/skills/deep-research-team/references/researcher-prompt.md`

Added `ToolSearch: "+reddit"` to the tool loading instructions in the Setup section.

### 3. Updated researcher methodology -- Available Tools section

**File:** same

Added **Reddit** tool block documenting 4 content extraction tools (one-line descriptions,
params left to MCP schemas): `get_top_posts`, `get_post_comments`, `get_reddit_post`,
`get_subreddit_info`. Deliberately excluded `search_reddit` -- Google's Reddit index (via
Firecrawl search) is far superior to Reddit's native search.

Added to "When to use which": Firecrawl search for Reddit discovery (`site:reddit.com`),
Reddit MCP tools for content extraction.

### 4. Replaced curl-based Reddit access with MCP tools

**File:** same, "Accessing Restricted Content > Reddit content" section

Completely rewrote the Reddit content section. Removed all curl-based guidance. Replaced with
two-layer pattern: Firecrawl search (`site:reddit.com {query}`) for discovery, Reddit MCP
tools for content extraction. Preserved the key insight that `get_top_posts` is preferred over
search for sentiment research.

## Impact

- **Permission friction:** Eliminates ~8-10 curl permission prompts per research run that
  accesses Reddit. Reddit access now uses native MCP tools that require no special permissions.
- **Researcher experience:** Researchers use the same tool pattern (ToolSearch -> MCP call)
  for Reddit as they do for Exa and Firecrawl. No more shelling out to curl.
- **Coverage:** All previously curl-accessible Reddit features are covered by MCP tools, plus
  additional features (engagement analysis, subreddit stats, trending subreddits).
- **curl dependency:** With GitHub curl eliminated in Iteration 9 and Reddit curl eliminated
  here, researchers should have zero curl dependencies in normal workflows. The only remaining
  curl use cases are the Bluesky public API and rate-limit retry sleeps (which use Bash `sleep`,
  not curl).

## Backlog Resolution

**#8 resolved.** Reddit MCP server integrated via 1MCP with anonymous mode. Researcher
methodology updated to use native MCP tools. curl-based Reddit access guidance removed.
