# Site-Type Patterns

Starting points for hierarchy depth, key sections, and URL taxonomy by site type. Pick the closest match in Step 2, state it, and adapt.

## Site Type → Depth, Sections, URL Pattern

| Site Type | Typical Depth | Key Sections | URL Pattern |
|-----------|---------------|--------------|-------------|
| SaaS marketing | 2–3 levels | Home, Features, Pricing, Blog, Docs | `/features/{name}`, `/blog/{slug}` |
| Content/blog | 2–3 levels | Home, Blog, Categories, About | `/blog/{slug}`, `/blog/category/{slug}` |
| E-commerce | 3–4 levels | Home, Categories, Products, Cart | `/{category}/{subcategory}/{product}` |
| Documentation | 3–4 levels | Home, Guides, API Reference | `/docs/{section}/{page}` |
| Hybrid SaaS+content | 3–4 levels | Home, Product, Blog, Resources, Docs | `/product/{feature}`, `/blog/{slug}` |
| Small business / local | 1–2 levels | Home, Services, About, Contact | `/services/{name}` |

**Rule of thumb**: go as flat as possible while keeping nav clean. If a nav dropdown has 20+ items, add a level of hierarchy.

## Hierarchy Levels

| Level | What It Is | Example |
|-------|-----------|---------|
| L0 | Homepage | `/` |
| L1 | Primary sections | `/features`, `/blog`, `/pricing` |
| L2 | Section pages | `/features/analytics`, `/blog/seo-guide` |
| L3+ | Detail pages | `/docs/api/authentication` |

**3-click rule**: any important page should be reachable within 3 clicks from the homepage. Flag important pages buried 4+ levels deep.

## URL Design Rules

1. **Readable** — `/features/analytics`, not `/f/a123`.
2. **Hyphens, not underscores** — `/blog/seo-guide`, not `/blog/seo_guide`.
3. **Reflect the hierarchy** — the URL path should match the site structure.
4. **One trailing-slash policy** — pick with or without and enforce it.
5. **Lowercase always** — `/About` should 301 to `/about`.
6. **Short but descriptive** — `/blog/landing-page-conversions` beats `/blog/how-to-improve-landing-page-conversion-rates`.

## URL Patterns by Page Type

| Page Type | Pattern | Example |
|-----------|---------|---------|
| Homepage | `/` | `example.com` |
| Feature page | `/features/{name}` | `/features/analytics` |
| Pricing | `/pricing` | `/pricing` |
| Blog post | `/blog/{slug}` | `/blog/seo-guide` |
| Blog category | `/blog/category/{slug}` | `/blog/category/seo` |
| Case study | `/customers/{slug}` | `/customers/acme-corp` |
| Documentation | `/docs/{section}/{page}` | `/docs/api/authentication` |
| Legal | `/{page}` | `/privacy`, `/terms` |
| Landing page | `/{slug}` or `/lp/{slug}` | `/free-trial`, `/lp/webinar` |
| Comparison | `/compare/{competitor}` or `/vs/{competitor}` | `/vs/competitor-name` |
| Integration | `/integrations/{name}` | `/integrations/slack` |
| Template | `/templates/{slug}` | `/templates/marketing-plan` |

## Common Mistakes to Flag

- **Dates in blog URLs** — `/blog/2024/01/15/post` adds no value; use `/blog/post`.
- **Over-nesting** — `/products/category/subcategory/item/detail` is too deep; flatten.
- **URL changes without redirects** — every old URL needs a 301 to its new URL, or backlink equity and bookmarks break.
- **IDs / query params for content** — `/product/12345` and `/blog?id=123` should be slugs.
- **Inconsistent parents** — don't mix `/features/analytics` and `/product/automation`; pick one parent.

## Breadcrumb–URL Alignment

| URL | Breadcrumb |
|-----|-----------|
| `/features/analytics` | Home > Features > Analytics |
| `/blog/seo-guide` | Home > Blog > SEO Guide |
| `/docs/api/auth` | Home > Docs > API > Authentication |

Every breadcrumb segment is a clickable link except the current page.
