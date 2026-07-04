# Personal Sites and Blogs

## When to Use

Independent opinions, practitioner experiences, technical blog posts, tutorials, lessons-learned
content, portfolio sites. Use when you want individual perspectives rather than corporate content
(news), community consensus (Reddit), or academic rigor (research papers).

Complements Reddit well: Reddit gives you community discussion and quick takes; personal sites
give you longer-form, more considered individual perspectives on the same topics.

## Search

**Primary tool:** Exa `category: "personal site"`.

**Full parameter support:** Unlike most specialized categories (`tweet`, `people`, `company`),
`personal site` supports all parameters -- date filters, `includeText`/`excludeText`, domain
filters, `additionalQueries`, `livecrawl`, and `subpages`. This makes it one of the most
flexible categories for targeted search.

**Query tips:**

- Natural language works well: "experienced developer thoughts on switching from React to Svelte"
- Include the domain or expertise level you want: "senior engineer", "founder", "researcher"
- Date filters are useful for recent takes on evolving topics (frameworks, AI tools, etc.)
- `additionalQueries` for phrasing variations (e.g., "lessons learned" vs "things I wish I knew"
  vs "mistakes I made")

## Domain Filtering

Use `includeDomains` or `excludeDomains` when you have a specific reason:

- **Include specific platforms:** `includeDomains: ["substack.com"]` for newsletter-style writing
- **Exclude when results are noisy:** if a particular platform is dominating results with
  low-quality content for your query, exclude it and try again
- **Self-hosted blogs:** no built-in filter for this, but excluding major platforms
  (medium.com, substack.com, dev.to) narrows to people running their own domains

Don't exclude platforms by default -- Medium, Substack, and dev.to host plenty of high-quality
practitioner writing.

## Exploring Portfolio Sites

The `subpages` and `subpageTarget` parameters let you explore a site after finding it:

- `subpages: 3` returns up to 3 subpages from each result
- `subpageTarget: ["projects", "writing"]` targets specific sections

Useful when you find a relevant person and want to see more of their work beyond the landing
page.

## Gotchas

- **`includeText`/`excludeText` single-item arrays only.** Multi-item arrays cause 400 errors.
  Put additional filtering terms in the query string instead.
- **Overlaps with no-category search.** If `personal site` results are thin, try the same query
  without a category -- the broader search may surface blog posts that Exa didn't classify as
  personal sites.
