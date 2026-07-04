# Scraping Issues

Troubleshooting guide for Firecrawl scrape failures (CLI or MCP). When the default scrape
doesn't work, try these approaches before giving up.

Last verified: 2026-02-28.

## General Troubleshooting

Before consulting per-site workarounds, try these in order:

1. **Retry without `--only-main-content`** (CLI) or with `onlyMainContent: false` (MCP) --
   since `--only-main-content` is the recommended default, this is the first thing to try when
   scrape returns empty or partial results. The detection strips article bodies on some sites
   (Future plc, Blogspot, GDPR-consent-heavy sites).
2. **Try `--wait-for 5000`** (CLI) or `waitFor: 5000` (MCP) -- helps with JS-rendered SPAs
   (though less often than expected).
3. **Check for an API** -- many sites have JSON APIs that return cleaner data than scraping.
4. **Wayback Machine** -- `https://web.archive.org/web/{URL}` for archived/paywalled content.
   Firecrawl follows the redirect to the most recent snapshot automatically. Content
   extraction can be incomplete (some pages render as iframes). Returns 404 if never captured.
5. **Exa as last resort** -- when scraping fails entirely, Exa often has the page text in
   its index. Drop both `enableHighlights` and `textMaxCharacters: 1` to get the complete
   text.

## Main-Content Detection False Positives

These sites return HTTP 200 but Firecrawl's content detection strips the article body. Fix
by omitting `--only-main-content` (CLI) or setting `onlyMainContent: false` (MCP).

### Future plc sites (Pocket-lint, iMore, TechRadar, PC Gamer, etc.)

- **Failure with main-content detection:** Returns 70-500 chars of skip-links, video player
  embeds, or "Submit a Thread" modals. Article body is stripped entirely.
- **Without the flag (CLI) / `onlyMainContent: false` (MCP):** Full article content returned
  (may be large, 60KB+).
- **Note:** Tom's Guide and ZDNET are also Future plc but are policy-blocked (see below).

### Blogspot / Google Blogger blogs

- **Failure with `--only-main-content`:** Returns only the sidebar "Useful Links" section.
  Blog post feed is stripped as non-main content.
- **Without the flag:** Full blog feed with titles, dates, summaries, and links.
- **Affected sites:** Google Workspace Updates blog, and other `*.blogspot.com` / Blogger sites.

### StorageReview

- **Failure with `--only-main-content`:** Returns GDPR consent wall HTML (cookie consent
  modal rendered inline). Article content behind the overlay is stripped.
- **Without the flag:** Full review with benchmark tables, specs, and images.

## Firecrawl Policy-Blocked Sites

These sites are on Firecrawl's infrastructure blocklist. All proxy tiers fail with "we do not
support this site." No scraping workaround exists.

### Tom's Guide, ZDNET (Ziff Davis / Future plc network)

- **Failure:** Hard block before any HTTP request is made.
- **Workaround:** Exa highlights or full text for triage. For deep content, check Wayback
  Machine. No Firecrawl approach works (plain, enhanced all fail identically).

## Paywalled Sites

### Medium

- **Workaround:** `https://freedium-mirror.cfd/{FULL_MEDIUM_URL}` via Firecrawl scrape.
  Returns full article content including images.
- **Note:** The original `freedium.cfd` is dead (DNS failure). The mirror may have intermittent
  uptime. No proxy needed (1 credit).

### Consumer Reports

- **Free tier:** Category overview pages are accessible (`pagePayState: free` in metadata).
  Product names, images, and recent news articles are visible.
- **Paywalled:** Ratings pages load the full page structure but silently replace score numbers
  with "log in or sign up" prompts. No HTTP error, no redirect -- the paywall is invisible
  from a scraping perspective.
- **Workaround:** Note the gap. For product recommendations, use RTINGS (fully open),
  HouseFresh, or AirPurifierFirst as alternatives.

## Discourse Forums

- Append `.json` to any topic URL for clean structured data (full post content).
- Search API: `https://{domain}/search.json?q={query}` returns topic IDs to scrape directly.
- Works well via Firecrawl scrape. Tested on discourse.nixos.org and other Discourse-hosted
  forums.

## Bluesky

- Bluesky content is on the public web (`bsky.app` URLs). Exa can discover posts.
- **Profile pages** (`bsky.app/profile/{handle}`) scrape well without `waitFor` -- they return
  bio, follower counts, and recent posts. No proxy needed (1 credit).
- **Individual post URLs** are unreliable via Firecrawl -- even with `waitFor: 5000`, posts
  often return "Post not found" due to SPA rendering. Use Exa discovery instead.

## API Workarounds

When scraping fails, these API endpoints return clean structured data:

| Use Case           | API Endpoint                                               | Notes                   |
| ------------------ | ---------------------------------------------------------- | ----------------------- |
| npm download stats | `api.npmjs.org/downloads/point/last-week/{pkg}`            | 90 chars, clean JSON    |
| Discourse search   | `https://{domain}/search.json?q={query}`                   | Returns topic IDs       |
| Discourse topic    | Append `.json` to any topic URL                            | Full post content       |
| GitHub file content | `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` | Clean, no UI noise     |
| GitHub repo stats  | `gh api repos/{owner}/{repo}`                              | Stars, forks, last push |
| arxiv full paper   | `arxiv.org/html/{paper-id}` (not `/abs/`)                  | Large for long papers   |
| arxiv metadata     | `export.arxiv.org/api/query?id_list={id}`                  | Structured XML          |

## Sites That Actually Work

These were reported as problematic in researcher feedback but work fine as of 2026-02-28:

| Site              | Status | Notes                                               |
| ----------------- | ------ | --------------------------------------------------- |
| npm package pages | Works  | SSR'd, plain scrape gets full README + metadata     |
| APC/Schneider     | Works  | Redirects to se.com transparently; specs all present |
| llm-stats.com     | Works  | Next.js SSR renders full leaderboard                |
| RTINGS            | Works  | Fully open, no paywall; "Insider" only gates voting |
| rfc-editor.org    | Works  | Returns full RFC (may be very large for long RFCs)  |
