# Reddit

## When to Use

Community opinions, practitioner views, product recommendations, troubleshooting threads,
real-world experience reports. Reddit is often the richest source of practitioner views for
opinion/sentiment and consumer research.

## Discovery

Finding relevant threads before reading them.

**Primary: Firecrawl search** -- `npx firecrawl-cli search "site:reddit.com {query}"`. Google's
Reddit index is very good at matching specific entities and surfacing canonical "which X is
best" threads. Broad `site:reddit.com` with topic keywords works best -- scoping to a specific
subreddit (`site:reddit.com/r/subreddit`) often returns generic results instead.

**Fallback: Exa** -- `web_search_advanced_exa` with `includeDomains: ["reddit.com"]`. Less
precise keyword matching but useful when Firecrawl search is rate-limited or returns thin
results.

## Reading Threads

Once you have thread URLs from discovery:

- **`get_post_comments`** -- primary tool for discussion content. Set `depth` to control comment
  tree depth. Extract the post ID from the URL found via discovery.
- **`get_reddit_post`** -- post content + engagement metrics (upvotes, comment count) by ID or URL.

## Browsing Subreddits

- **`get_top_posts`** with time filter (`week`, `month`, `year`) -- useful for community
  temperature. But top posts are often memes or meta content.
- For substantive threads, Firecrawl search with topic-specific keywords finds better results
  than browsing top posts.

## Gotchas

- **Firecrawl blocks all reddit.com domains.** Firecrawl scrape fails on reddit.com, including
  `old.reddit.com` and the Reddit JSON API (`/top.json`, etc.). Use discovery tools to find
  threads, then Reddit MCP tools to read them.
- **Batch Reddit MCP calls separately.** If any tool call in a parallel batch fails, all sibling
  calls fail too. Keep Reddit MCP calls in their own batch, separate from Exa/Firecrawl calls.
- **Rate limit:** ~10 requests/minute in anonymous mode. Space out Reddit calls if doing many.
- **`get_subreddit_info`** provides subscriber counts and description -- useful for gauging
  community size and relevance before diving in.
