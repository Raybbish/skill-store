# Academic Search

## When to Use

Literature reviews, evidence gathering, prior art research, finding methodology details,
systematic exploration of a research field or topic.

## Tools and Approach

**Primary tool:** Exa `category: "research paper"` -- surfaces arXiv papers, conference
proceedings, and journal articles for research-oriented queries.

**Key parameters:**

- `includeDomains` for specific venues: `arxiv.org`, `openreview.net`, `nature.com`,
  `semanticscholar.org`, `pubmed.ncbi.nlm.nih.gov`
- `startPublishedDate` / `endPublishedDate` for temporal scope (e.g., last 2 years for
  state-of-the-art, broader for foundational work)
- `highlightsQuery` for targeted extraction of methodology, findings, or specific aspects
- `additionalQueries` for phrasing variations (different technical terms for the same concept)

The default search pattern (`enableHighlights: true`, `textMaxCharacters: 1`) works well for
triage -- highlights extract abstracts and key passages effectively.

The undocumented `pdf` category also works -- returns papers from arxiv, researchgate, icml,
aclanthology, and similar sources. Useful as an alternative when `research paper` misses
relevant results.

## Academic Domains

Useful values for `includeDomains`:

- `arxiv.org` -- preprints (CS, physics, math, biology, economics)
- `openreview.net` -- peer review and conference papers (ICLR, NeurIPS)
- `semanticscholar.org` -- 214M papers across all disciplines
- `pubmed.ncbi.nlm.nih.gov` -- medical/biomedical literature
- `biorxiv.org` -- biology preprints
- `nature.com`, `science.org` -- high-impact journals

## Free APIs

These return clean structured data via Firecrawl scrape or `curl` (no auth needed):

- **Semantic Scholar:** `https://api.semanticscholar.org/graph/v1/paper/search?query={query}`
- **OpenAlex:** `https://api.openalex.org/works?search={query}`
- **arXiv:** `http://export.arxiv.org/api/query?search_query=all:{query}`

For structured metadata (citation counts, authors, abstracts), these APIs are more reliable
than scraping paper pages.

## Firecrawl CLI Academic Search

`npx firecrawl-cli search --categories research "{query}"` provides Google Scholar-like
academic search. Returns results from arxiv, nature.com, and similar sources.

```bash
npx firecrawl-cli search --categories research "transformer attention mechanisms" --scrape --limit 5
npx firecrawl-cli search --categories research "RLHF alignment" --tbs qdr:y  # past year
```

The `--categories research` flag is CLI-only (not available via MCP). See
`firecrawl-tips.md` for more CLI commands.

## Gotchas

- **arxiv `/abs/` pages** return abstract + metadata mixed with navigation chrome. Better to
  scrape `arxiv.org/html/{paper-id}` for the full paper or use Exa highlights for triage.
  See `firecrawl-tips.md` for details.
- **Paywalled journals** (Nature, Science, Elsevier) may return only abstracts. Check for
  preprint versions on arxiv or author pages. The Wayback Machine sometimes has cached copies.
