# Exa Tips

Deep-dive reference for Exa search parameters. For everyday usage, see `SKILL.md`.

## Category Restrictions

Some categories reject certain parameters with 400/500 errors. Others silently ignore them
(no error, but filter not applied).

| Category           | Unsupported parameters                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `tweet`            | `includeText`, `excludeText`, `includeDomains`, `excludeDomains`, `moderation` (causes 500)     |
| `company`          | All date filters, `includeText`, `excludeText`, `includeDomains`, `excludeDomains`              |
| `people`           | All date filters, `includeText`, `excludeText`, `excludeDomains`. `includeDomains` LinkedIn only |
| `financial report` | `excludeText` (causes 400). `includeText` works (single-item only)                              |
| `research paper`   | Full support                                                                                    |
| `personal site`    | Full support                                                                                    |
| `news`             | Full support                                                                                    |
| `pdf`              | Undocumented category -- available in MCP, returns academic papers (arxiv, researchgate, etc.)   |
| `github`           | Undocumented category -- available in MCP, returns GitHub repos                                 |

**`company` + `includeDomains`** silently ignores the domain filter (returns results from any
domain). No error thrown.

## includeText / excludeText Limits

- Only accept **single-item arrays** (one string each)
- Each string must be **5 words or fewer**
- Multi-item arrays or strings longer than 5 words cause 400 errors
- Put additional filtering terms in the `query` string instead

## additionalQueries

`additionalQueries: ["variation 1", "variation 2"]` bundles query variations in a single call.
Same cost as a single query. Works with `auto` mode (our MCP tool exposes `auto`/`fast`/`neural`).

- **Broad topics** (e.g., "LLM hallucination mitigation"): genuine diversity gain, surfaces
  results the primary query misses. Worth using.
- **Niche/specific topics** (e.g., "Nix flakes best practices"): results largely converge.
  May surface a few extra sources but core results stay the same.

Worth trying for research tasks where comprehensive coverage of a broad topic matters. Less
useful for targeted lookups. Can substitute for manual query reformulation on broad topics.

## Highlights (Default Search Pattern)

`enableHighlights: true` + `textMaxCharacters: 1` is the recommended default for Exa search.
Highlights are extracted server-side before text truncation, so you get actual quoted passages
from the page without the full-text context flood.

- `highlightsPerUrl` -- control how many highlight blocks per result
- `highlightsNumSentences` -- control sentences per highlight
- `highlightsQuery` -- focus highlights on a specific aspect of the page
- Without `textMaxCharacters: 1`, you get full text (7K-32K chars) alongside highlights --
  best to pair them.

## Summaries

`enableSummary: true` + `textMaxCharacters: 1` generates AI summaries per result. These are
concise but **can hallucinate** -- they sometimes fabricate details not present on the page.
Highlights are preferred because they return actual page text. Summaries exist as an option
but there's rarely a reason to use them over highlights.
