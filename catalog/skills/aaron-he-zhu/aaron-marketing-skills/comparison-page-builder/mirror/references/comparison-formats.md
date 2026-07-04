# Comparison Page Formats

Four page formats, the keyword map, the single-source competitor data schema, and a section checklist. Pick one format per page; reuse one competitor data file across all pages.

## Format 1 — [Competitor] Alternative (singular)

- **Intent**: actively looking to switch from one named competitor.
- **URL**: `/alternatives/[competitor]` or `/[competitor]-alternative`
- **Keywords**: "[Competitor] alternative", "alternative to [Competitor]", "switch from [Competitor]"
- **Structure**: why people look for alternatives → you as the alternative (quick positioning) → detailed comparison (features, service, pricing) → who should switch and who should not → migration path → social proof from switchers → CTA

## Format 2 — [Competitor] Alternatives (plural)

- **Intent**: researching options, earlier in the journey.
- **URL**: `/alternatives/[competitor]-alternatives`
- **Keywords**: "[Competitor] alternatives", "best [Competitor] alternatives", "tools like [Competitor]"
- **Structure**: why people look for alternatives → what to look for (criteria framework) → list of alternatives (you first, plus 4-7 real options) → summary comparison table → detailed breakdown of each → recommendation by use case → CTA
- **Rule**: include 4-7 real alternatives. Genuine helpfulness builds trust and ranks better.

## Format 3 — You vs [Competitor]

- **Intent**: directly comparing you to one competitor.
- **URL**: `/vs/[competitor]` or `/compare/[you]-vs-[competitor]`
- **Keywords**: "[You] vs [Competitor]", "[Competitor] vs [You]"
- **Structure**: TL;DR (2-3 sentences) → at-a-glance table → detailed comparison by category (features, pricing, support, ease of use, integrations) → who you are best for → who the competitor is best for (be honest) → switcher testimonials → migration support → CTA

## Format 4 — [Competitor A] vs [Competitor B]

- **Intent**: comparing two competitors, not you directly.
- **URL**: `/compare/[competitor-a]-vs-[competitor-b]`
- **Structure**: overview of both → comparison by category → who each is best for → the third option (introduce yourself) → three-way table → CTA
- **Why it works**: captures competitor search traffic and positions you as knowledgeable.

## Keyword Map

| Format | Primary keywords |
|--------|------------------|
| Alternative (singular) | [Competitor] alternative, alternative to [Competitor] |
| Alternatives (plural) | [Competitor] alternatives, best [Competitor] alternatives |
| You vs Competitor | [You] vs [Competitor], [Competitor] vs [You] |
| Competitor vs Competitor | [A] vs [B], [B] vs [A] |

## Single-Source Competitor Data Schema

One file per competitor, reused by every page that references it. Update once, propagate everywhere.

```yaml
competitor: "[Name]"
positioning: "one-line market position"
target_audience: "who they serve"
pricing:
  - tier: "Starter"
    price: "$X/mo"        # label: Measured / User-provided / Estimated
    includes: "..."
    hidden_costs: "..."
features:
  - name: "..."
    rating: "strong | partial | none"
    note: "..."
strengths: ["honest strength", "..."]
weaknesses: ["honest weakness", "..."]
best_for: "ideal customer"
not_ideal_for: "who should look elsewhere"
common_complaints: ["from G2/Capterra/TrustRadius reviews", "..."]
migration_notes: "what transfers, what needs reconfiguration"
sources: ["url + date for each non-obvious claim"]
```

## Section Checklist (before handoff)

- [ ] TL;DR summary present for scanners
- [ ] At-a-glance comparison table
- [ ] Paragraph comparisons explain *why* each difference matters
- [ ] Pricing compared tier-by-tier, hidden costs noted
- [ ] "Who it's for" stated for every option, honestly
- [ ] Migration section where switching is the intent
- [ ] Every competitor claim sourced or flagged `[needs source]`
- [ ] No fabricated pricing, feature, or review figures
- [ ] Backed by a single-source competitor data file
