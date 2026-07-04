# Firecrawl Tips

Deep-dive reference for Firecrawl CLI. For everyday usage, see `SKILL.md`.

Run `npx firecrawl-cli <command> --help` to see all available options for a command. The
common flags are documented below; `--help` covers the rest.

## Commands

Firecrawl CLI is primarily for **fetching content** from known or discovered URLs. For
search/discovery, Exa is the primary tool (see `SKILL.md`). Firecrawl search complements
Exa for keyword matching, site-scoped queries, and content-type filtering.

For fetching, escalate as needed: **scrape** (have a URL) -> **map + scrape** (large site,
need to find the right page) -> **crawl** (need many pages) -> **browser** (interactive).

## search

Google-powered keyword search. Complements Exa's semantic search for cases where keyword
matching, site-scoping, or content-type filtering (`--categories`, `--tbs`) works better.
The `--scrape` flag fetches full page content for each result.

```bash
npx firecrawl-cli search "your query" --scrape --limit 5
npx firecrawl-cli search "your query" --categories research      # academic sources
npx firecrawl-cli search "your query" --sources news --tbs qdr:w  # news, past week
npx firecrawl-cli search "site:docs.example.com auth API"        # site-scoped
```

Key flags:

- `--scrape` -- fetch full content for each result
- `--limit <n>` -- number of results (default 5)
- `--categories <github|research|pdf>` -- `research` gives Google Scholar-like results
  (not available via MCP server)
- `--tbs <qdr:h|d|w|m|y>` -- time filter (hour/day/week/month/year)
- `--sources <web|news|images>` -- source type

Supports Google operators in the query string (`site:`, `intitle:`, etc.).

## scrape

Extract content from one or more URLs. Multiple URLs are scraped concurrently.

```bash
npx firecrawl-cli scrape "https://example.com/page" --only-main-content
npx firecrawl-cli scrape "https://example.com/page" --wait-for 3000
npx firecrawl-cli scrape "https://url1" "https://url2" "https://url3" --only-main-content
```

Key flags:

- `--only-main-content` -- strip nav, sidebars, footers. **Always use by default** to save
  tokens. If results come back empty or partial, retry without the flag -- it's too aggressive
  on some sites (see `scraping-issues.md` for known false positives).
- `--wait-for <ms>` -- wait for JS rendering
- `--include-tags <selector>` / `--exclude-tags <selector>` -- CSS selector targeting
- `--format <markdown|links|html|screenshot>` -- output format (default: markdown)

Always quote URLs -- shell interprets `?` and `&` as special characters.

## map

Discover URLs on a site. Use `--search` to filter by keyword.

```bash
npx firecrawl-cli map "https://docs.example.com" --search "authentication"
npx firecrawl-cli map "https://example.com" --limit 100
```

Useful when you need a specific subpage on a large site, or when scrape returns empty
(SPA routing issues).

## crawl

Bulk-extract from a site section. Set a low `--limit` (5-10) to avoid runaway crawls and
credit burn.

```bash
npx firecrawl-cli crawl "https://docs.example.com" --include-paths /api --limit 10 --wait
```

Key flags: `--include-paths`, `--exclude-paths`, `--max-depth <n>`, `--limit <n>`, `--wait`

**Usually better:** `map --search` to find the specific page you need, then `scrape` it.
More controlled, fewer wasted credits.

## download

Convenience command: map + scrape in one step. Saves pages as local files.

```bash
npx firecrawl-cli download "https://docs.example.com" --include-paths /api --limit 20 -y
```

The `-y` flag skips the confirmation prompt. Useful for bulk documentation extraction.

## browser

Cloud Chromium for interactive pages. Last-resort escalation when scrape fails due to
content behind clicks, forms, or pagination. Not limited by SAFE_MODE (unlike MCP server).

```bash
npx firecrawl-cli browser "open https://example.com"
npx firecrawl-cli browser "snapshot -i"     # see interactive elements with @ref IDs
npx firecrawl-cli browser "click @e5"       # interact by ref
npx firecrawl-cli browser "scrape"          # extract content
npx firecrawl-cli browser close
```

Run `npx firecrawl-cli browser --help` for the full command set (fill, type, eval, scroll,
screenshot, sessions, profiles).

## arxiv Extraction

Firecrawl scraping of `arxiv.org/abs/` pages returns abstract + metadata mixed with
navigation chrome. Better approaches:

- **Triage:** Exa highlights with the default search pattern capture the abstract well
- **Full paper:** Scrape the HTML version at `arxiv.org/html/{paper-id}` (not `/abs/`)
- **Structured metadata:** The arxiv API at
  `http://export.arxiv.org/api/query?id_list={id}` returns clean XML
- Only scrape `/abs/` if just the abstract is needed and Exa highlights are insufficient

## PDF Scraping

Firecrawl auto-detects PDF URLs and extracts text without any special parameters -- just
scrape the URL normally. Output is clean markdown with headings, tables, LaTeX math, figure
captions, and references. Credits scale 1:1 with pages extracted.

For large documents, the API supports a `parsers` parameter to limit pages
(`parsers: [{"type": "pdf", "maxPages": 10}]`), but this is only available via the MCP
tool, not CLI flags. Without limits, Firecrawl processes the entire PDF, which can flood
context and burn credits on long documents.

PDF Parser v2 (Feb 2025) uses a fast Rust-based extractor with automatic OCR fallback for
scanned documents. No configuration needed.

## MCP Server

The Firecrawl MCP tools (`firecrawl_scrape`, `firecrawl_search`, `firecrawl_map`, etc.)
remain available as fallbacks. Main differences from CLI:

- **SAFE_MODE** limits browser actions to `wait`, `screenshot`, `scroll`, `scrape`
- **No `--categories`** on search (academic search not available)
- **No `--tbs`** on search (time filtering not available)
- **`firecrawl_extract`** -- structured data extraction from multiple URLs with a schema.
  Expensive (20-50 credits) and unreliable on thin pages; prefer scrape for single URLs.

Use MCP tools when CLI is unavailable or when you need `firecrawl_extract`.
