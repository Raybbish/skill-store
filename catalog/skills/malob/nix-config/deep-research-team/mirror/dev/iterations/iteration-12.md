# Iteration 12 -- Firecrawl Scrapability Testing

**Type:** Engineering (no research team)
**Goal:** Empirically test all documented workaround URLs in researcher-prompt.md with actual
Firecrawl scrape calls. Remove or caveat workarounds that don't work.

## Test Results

### 1. archive.ph

**URL tested:** `https://archive.ph/newest/https://www.nytimes.com/2025/03/10/technology/ai-agents-future.html`
**Params tried:** `proxy: "stealth"`, `proxy: "enhanced"`, `waitFor: 5000`
**Result:** BROKEN. reCAPTCHA challenge page (status 429) on all attempts. Cloudflare protection
blocks Firecrawl completely. Costs 5 credits per attempt (stealth/enhanced proxy).
**Conclusion:** Remove as recommended workaround for Firecrawl-based research.

### 2. Wayback Machine

**URLs tested:**
- `web.archive.org/web/https://www.wsj.com/...` (shortcut format) -- 404, "not archived"
- `web.archive.org/web/2024/https://www.nytimes.com/...` (year only) -- 404, "not archived"
- `web.archive.org/web/2024*/https://arstechnica.com/...` (wildcard) -- returns calendar page
- `web.archive.org/web/20240515120000/https://en.wikipedia.org/wiki/GPT-4` (exact timestamp) -- **SUCCESS**, full content (149K chars, had to be saved to file)
- `web.archive.org/web/https://en.wikipedia.org/wiki/GPT-4` (shortcut, known-archived page) -- **SUCCESS**, 173K chars, status 200. Firecrawl followed redirect to `/web/20260203171033/...` (most recent snapshot). Wayback toolbar at top but full article content follows.
- `web.archive.org/web/2/https://en.wikipedia.org/wiki/GPT-4` ("/2/" trick) -- **SUCCESS**, same result as shortcut format.

**Result:** WORKS with simple shortcut format `/web/{URL}`. Initial tests with WSJ/NYTimes
shortcut URLs returned 404 because those pages weren't archived, not because the format was
wrong. Retesting with a known-archived page (Wikipedia GPT-4) confirmed the shortcut redirects
to the most recent snapshot. Wayback Machine toolbar is prepended to extracted content but full
page follows. 1 credit.
**Conclusion:** Simplify guidance -- just use `/web/{URL}`. No need for exact timestamps.
**Lesson:** Test URL format correctness against pages known to be archived.

### 3. xcancel.com (Twitter/X)

**URLs tested:**
- `xcancel.com/sama/status/1895533845455577446` (without proxy) -- anti-bot challenge (503)
- `xcancel.com/sama/status/1895533845455577446` (stealth + waitFor) -- "Tweet not found" (404)
- `xcancel.com/elikiowa/status/1880305905189106091` (stealth + waitFor) -- "Tweet not found" (404)
- `xcancel.com/sama/status/1890816782836904000` (stealth + waitFor, verified valid ID) -- **SUCCESS**
- `xcancel.com/OpenAI/status/1790070592011288831` (stealth + waitFor) -- "Tweet not found" (404)

**Result:** WORKS but requires `proxy: "stealth"` + `waitFor: 5000` (5 credits). Initial tests
with invalid tweet IDs gave misleading "Tweet not found" (404) results. Retests with verified
valid tweet IDs confirmed: without proxy, anti-bot challenge blocks (503); with stealth +
waitFor, full content returned (tweet text, replies, engagement metrics). Confirmed on both
cached and fresh (`maxAge: 0`) URLs to rule out caching artifacts.
**Conclusion:** Keep with updated guidance: requires stealth proxy + waitFor, costs 5 credits.
**Lesson:** Always verify test inputs before concluding a service is broken.

### 4. freedium.cfd (Medium)

**URL tested:** `https://freedium.cfd/https://towardsdatascience.com/rag-vs-fine-tuning-...`
**Result:** DEAD. DNS resolution failure -- domain no longer resolves.
**Conclusion:** Replace with freedium-mirror.cfd.

### 5. freedium-mirror.cfd (Medium -- replacement)

**URL tested:** `https://freedium-mirror.cfd/https://towardsdatascience.com/rag-vs-fine-tuning-which-is-the-best-tool-to-boost-your-llm-application-94654b1eaba7`
**Result:** SUCCESS. Full article content extracted (status 200, 1 credit, basic proxy).
Complete Medium article with formatting, images, author info, tags. No paywall.
**Conclusion:** Document as the working Medium paywall bypass.

### 6. Bluesky

**URLs tested:**
- `public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=nix+nixos&limit=5` (raw API) -- 403 Forbidden
- `bsky.app/profile/jay.bsky.team/post/3lihkfohpkk2t` (individual post, no waitFor) -- "Post not found" (SPA not rendered)
- `bsky.app/profile/bsky.app` (profile page, waitFor: 5000) -- **SUCCESS**, massive content (full profile + dozens of recent posts)
- `bsky.app/profile/atprotocol.dev` (profile page, waitFor: 5000) -- **SUCCESS**, 94K chars

**Result:** WORKS but `bsky.app` is a JavaScript SPA -- `waitFor: 5000` is required for content
to render. Without it, individual post pages return "Post not found". Profile pages with waitFor
return extensive content including all recent posts. No proxy needed (1 credit). The raw API
endpoint was unnecessary in the first place.
**Conclusion:** Remove API-specific guidance. Document that bsky.app needs `waitFor: 5000` (SPA).

### 7. firecrawl_search site:reddit.com

**Query tested:** `site:reddit.com best mechanical keyboard programming 2025`
**Result:** SUCCESS. Returned 5 Reddit results with full URLs containing post IDs
(e.g., `reddit.com/r/keyboards/comments/{postId}/...`). Post IDs extractable for Reddit MCP
tools. Already validated in Iteration 11; re-confirmed here.
**Conclusion:** Keep as documented.

## Changes Made

**researcher-prompt.md "Accessing Restricted Content" section:**

1. **Paywalled articles:** Demoted archive.ph (CAPTCHA-blocked), promoted Wayback Machine to
   primary with exact-timestamp URL format requirement
2. **Twitter/X:** Added `proxy: "stealth"` + `waitFor: 5000` requirement for xcancel.com
   (5 credits). Previous guidance didn't mention these were needed.
3. **Medium:** Replaced freedium.cfd with freedium-mirror.cfd, removed archive.ph fallback
4. **Bluesky:** Removed raw API endpoint. Documented that bsky.app is a JavaScript SPA
   requiring `waitFor: 5000` for Firecrawl scrape. No proxy needed (1 credit).
5. **Reddit/GitHub/Discourse/LinkedIn:** Unchanged (not retested, already validated)

## Credit Cost Summary

Total Firecrawl credits used: ~38
- archive.ph: 10 (2 attempts x 5 credits stealth/enhanced)
- Wayback Machine: 4 (4 attempts x 1 credit basic)
- xcancel.com: 16 (1 basic + 3 stealth attempts)
- freedium.cfd: 0 (DNS failure, no credit charged)
- freedium-mirror.cfd: 1 (basic proxy)
- Bluesky: 8 (API 5 auto-stealth + 3 bsky.app scrapes x 1 basic)
- firecrawl_search: ~0 (search credits separate)
