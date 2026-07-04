# People and Companies

## When to Use

Finding people (professionals, researchers, founders), researching companies or organizations,
professional profiles, entity discovery with metadata (headcount, location, funding).

## People Search

**Primary tool:** Exa `category: "people"` -- surfaces LinkedIn profiles and professional bios.

**Restrictions (severe):**

- No date filters (`startPublishedDate`, `endPublishedDate`)
- No `includeText` / `excludeText`
- No `excludeDomains`
- `includeDomains` accepts **LinkedIn only**

**Workaround:** Put all filtering terms directly in the query string. Include job title,
location, industry, or organization name for better targeting.

**LinkedIn access:** Exa `people` with `includeDomains: ["linkedin.com"]` is the only reliable
path. Direct LinkedIn page scraping is unreliable -- treat as effectively inaccessible.

**Full LinkedIn profile text:** Drop the default search pattern (`enableHighlights` and
`textMaxCharacters: 1`) to get the complete profile from Exa's index -- full work history
with descriptions, education, skills, and structured entity data. This is the same "Exa full
text as scraping fallback" pattern used for other inaccessible sites.

## Company Search

**Primary tool:** Exa `category: "company"` -- returns company homepages with metadata
(headcount, location, funding stage).

**Restrictions:**

- No date filters
- No `includeText` / `excludeText`
- No `includeDomains` / `excludeDomains` (silently ignored -- no error, but filter not applied)

**Workaround:** Put sector, size, geography, and other filtering terms in the query string.

## Multi-Category Strategy

Specialized categories are best for initial discovery, but each has blind spots. Broaden after
the initial pass:

1. **Start with specialized category** -- `people` or `company` for targeted discovery
2. **`personal site`** -- blogs, portfolios, personal pages (full parameter support)
3. **`news`** -- press mentions, announcements, interviews
4. **No category** -- full web search for anything the specialized categories miss

Use `additionalQueries` for phrasing variations (e.g., different job titles, company name
variations).

**Deep-diving a specific person or company:** Drop the category and use `livecrawl: "fallback"`
for broader results. Example: searching `"Dario Amodei Anthropic CEO background"` with no
category + `livecrawl: "fallback"` surfaces general web pages, interviews, and analysis that
the specialized categories miss.

## Gotchas

- **`company` + `includeDomains`** silently ignores the domain filter. Results come from any
  domain regardless of what you specify. No error thrown.
- **People search returns profiles, not content.** For someone's actual writing or opinions,
  search without a category and target their name + topic.
- **LinkedIn is the only scrapeable professional network.** Other professional platforms
  (AngelList, Crunchbase) may work via `npx firecrawl-cli scrape` for individual pages but have no
  specialized Exa category.
