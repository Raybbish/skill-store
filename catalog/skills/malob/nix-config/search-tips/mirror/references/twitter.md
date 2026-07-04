# Twitter / X

## When to Use

Social sentiment, developer opinions, expert threads, trending topics, public reactions to
announcements. Twitter is informal and context-dependent -- useful for gauging community
temperature, not for authoritative claims.

## Tools and Approach

**Primary tool:** Exa `category: "tweet"`. This is the only reliable access path -- x.com is
behind auth walls and cannot be scraped by Firecrawl or any other tool.

**Key parameters:**

- Date filters work normally (`startPublishedDate`, `endPublishedDate`)
- `livecrawl: "preferred"` for recent tweets (within hours/days)
- `additionalQueries` for phrasing variations (e.g., different hashtags, @handles)
- Consider omitting `enableHighlights` and `textMaxCharacters` -- highlights may not extract
  well from short tweet text. Raw tweet content is usually small enough to return in full.

## Restrictions

The `tweet` category rejects these parameters with 500 errors:

- `includeText` / `excludeText`
- `includeDomains` / `excludeDomains`
- `moderation`

**Workaround:** Put all filtering keywords directly in the query string. Use @handles and
#hashtags for targeting. For example, instead of `includeText: ["open source"]`, use
`query: "launching announcing new open source release"`.

## Gotchas

- **No profile/follower data.** Exa returns tweet content only. Treat profile-level data
  (follower counts, bios) as inaccessible and note the gap.
- **Tweets are informal.** Context-dependent, sarcastic, abbreviated. Weight accordingly --
  a single tweet is an anecdote, not evidence. Look for convergence across many tweets.
- **No scraping fallback.** If Exa tweet search doesn't surface what you need, the content
  is effectively inaccessible. Note the gap rather than guessing.
