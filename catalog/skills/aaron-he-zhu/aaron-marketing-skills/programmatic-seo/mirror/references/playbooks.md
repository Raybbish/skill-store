# Programmatic SEO — Playbooks, Data Tiers, Guardrails

Reference for [programmatic-seo](../SKILL.md). Use the playbook table to map a search pattern to a template, the tier table to judge data defensibility, and the guardrail checklist before publishing.

## The 12 Playbooks

Each row is a proven template × dataset pattern. Playbooks combine — e.g. locations × personas ("agencies for startups in Austin"), curation × locations ("best coworking in San Diego").

| # | Playbook | Search pattern | Value bar (per page) | URL structure |
|---|----------|----------------|----------------------|---------------|
| 1 | **Templates** | "[type] template", "free [type] template" | Actually usable assets, multiple variations, quality of paid options | `/templates/[type]/` |
| 2 | **Curation** | "best [category]", "top [n] [things]" | Real evaluation criteria, dated updates, not pure affiliate ranking | `/best/[category]/` |
| 3 | **Conversions** | "[X] to [Y]", "[amount] [unit] in [unit]" | Accurate real-time data, fast working tool, related conversions | `/convert/[from]-to-[to]/` |
| 4 | **Comparisons** | "[X] vs [Y]", "[X] alternative" | Honest balanced analysis, real feature data, recommendation by use case | `/compare/[x]-vs-[y]/` |
| 5 | **Examples** | "[type] examples", "[category] inspiration" | Real high-quality examples, screenshots/embeds, why-it-works analysis | `/examples/[type]/` |
| 6 | **Locations** | "[service] in [location]" | Actual local data (not city-name swap), local options, location-specific insight | `/[service]/[city]/` |
| 7 | **Personas** | "[product] for [audience/role/industry]" | Genuine persona content, relevant features, segment testimonials | `/for/[persona]/` |
| 8 | **Integrations** | "[product A] [product B] integration", "[A] + [B]" | Real integration detail, setup steps, combination use cases, not vaporware | `/integrations/[product]/` |
| 9 | **Glossary** | "what is [term]", "[term] definition" | Clear accurate definitions, examples, related terms, more depth than a dictionary | `/glossary/[term]/` |
| 10 | **Translations** | same content per language | Quality translation + localization, hreflang, native review | `/[lang]/[page]/` |
| 11 | **Directory** | "[category] tools/software/companies" | Comprehensive coverage, useful filtering, detail per listing, updates | `/directory/[category]/` |
| 12 | **Profiles** | "[person/company name]", "[entity] + [attribute]" | Accurate sourced info, unique aggregation, not a Wikipedia rehash | `/people/[name]/` |

**Match playbook to assets**: proprietary data → directory/profiles/curation; integrations → integrations; design/creative product → templates/examples; multi-segment audience → personas; local presence → locations; tool/utility → conversions; content/expertise → glossary/curation; international upside → translations; competitor set → comparisons.

**Avoid pSEO when** site structure is weak, page differences are superficial (name/city swap only), or the content genuinely needs original expertise or live UGC participation.

## Data Tiers (defensibility)

The strongest pages run on data only your product (or your customers inside it) can produce. Public/scraped lists alone are the weakest base. Prefer Tier 1–2 before reaching for Tier 5.

| Tier | Source | Examples | Risk |
|------|--------|----------|------|
| **1 — Product-generated** | Assets your product creates or renders: templates, exports, generated previews, branded snippets | Gallery rows tied to real CMS fields; unique preview URLs | **Lowest** when each URL shows distinct output |
| **2 — Product-derived** | Telemetry/aggregates you own: cohorts, benchmarks, adoption | "Median time-to-value by industry" from your warehouse | Low if aggregated, anonymized, policy-compliant |
| **3 — UGC / customer** | Reviews, submissions, showcase items, moderated community content | Showcase grid; verified quotes | Medium — needs moderation + consent |
| **4 — Licensed / partner** | Exclusive feeds, co-marketing datasets, allowed partner fields | Partner pricing tiers; licensed stats | Medium — contract scope, attribution, trademark on logos |
| **5 — Public / scraped** | Open web, directories, generic enrichment | Name/address fills; commodity facts | **Highest** — everyone has the same facts; needs editorial layer or a unique tool on top |

**Tier-5 hard check**: if the only source is public/scraped and the template adds no synthesis, calculator, or editorial angle, the page is commodity thin content. Add a unique layer or do not generate the URL set.

## Guardrail Checklist (run before publish)

| Guardrail | Practice |
|-----------|----------|
| **Unique value per page** | Every page has an evidence block with real per-row facts (tables, numbers, attributes), 300+ words of genuine content — not boilerplate with swapped variables |
| **N-gram dedup** | Scan same-category pages for shared sentence tails / value statements; flag any phrase appearing in >30% of pages. Prepare 8–15 semantic variants and cycle them so adjacent pages differ |
| **Index-bloat control** | Selective indexation — noindex low-value pages; segment sitemaps by country/language/division to manage crawl budget; never index pages with no distinct value |
| **Batch launch** | Publish in small measurable batches, not one large dump (large dumps read as spam signals) |
| **Provenance & freshness** | Log the source per field; set freshness rules (e.g. prices 30 days, ratings 90 days) and "as of [date]" labels on volatile facts |
| **AI governance** | Ground generation in row JSON; AI shapes phrasing/FAQ depth/section order, never invents numbers or citations; label generated copy; QA high-traffic URLs before publish |

## Remediating already-homogenized pages

If pages are live and feel interchangeable (shared closing sentences, identical value props), fix before quality signals trigger:

- **P0 — Eliminate**: pure template filler with no info value → rewrite each page independently with page-specific detail.
- **P1 — Rewrite**: correct but formulaic delivery → cycle 8–15 semantic variants so adjacent pages differ.
- **P2 — Reduce density**: normal words that appear too often (e.g. one adjective on 80% of pages) → replace ~30–40% of instances, not all.

Fix P0 first, one category at a time; re-scan after each round; distribute rewrites so sequentially processed pages get different treatments. Prefer functional endings (what bottleneck the entry solves) over evaluative ones ("it's a good choice").
