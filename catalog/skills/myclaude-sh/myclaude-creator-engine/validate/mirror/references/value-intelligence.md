# Stage 8 — Value Intelligence

Loaded on-demand by `/validate` SKILL.md for MCS-2+ products.
Reference: `references/intelligence-layer.md` + `config.yaml → intelligence`.

---

## Purpose

Compute a composite value score from 4 objective signals. Transform structural quality metrics into actionable pricing and positioning intelligence. Advisory-only — never blocks publishing.

## Prerequisite

Product must have completed Stage 7 (anti-commodity). For MCS-1, skip entirely.

## Execution

### 1. Load intelligence config
Read `config.yaml → intelligence.pricing` for weights and price_map.

### 2. Compute DEPTH factor (0-4)
```
MCS-1 (75-84%)  → depth = 1
MCS-2 (85-91%)  → depth = 2
MCS-3 (92-100%) → depth = 3
If type=minds AND minds_depth=cognitive → depth += 1
```

### 3. Compute UNIQUENESS factor (0-3)
Read Stage 7 substance score. **Reference-distributed expertise correction:** If substance score is <50 BUT the product has references/ directory with 3+ files totaling >5,000 chars of domain content, apply a +20 adjustment to substance before mapping. This corrects for products (like AEGIS) where expertise lives in reference files, not primary file prose. Log: "Substance adjusted {raw}→{adjusted} (reference-distributed expertise: {N} files, {chars} chars)".
```
substance < 50  → 0 ("Claude already knows this")
substance 50-70 → 1 ("adds some depth")
substance 70-90 → 2 ("genuine expertise")
substance > 90  → 3 ("irreplaceable knowledge")
```

### 4. Compute COVERAGE factor (0-3)
Read Stage 7c baseline delta (if available).
```
No baseline delta → 1 (default)
gaps_addressed < 3  → 0
gaps_addressed 3-6  → 1
gaps_addressed 7-10 → 2
gaps_addressed > 10 → 3
```

### 5. Compute MARKET factor (0-2)
Check `.meta.yaml → intelligence.market_position`.
```
not set     → 1 (default)
saturated   → 0
moderate    → 1
blue_ocean  → 2
```

### 6. Compute VALUE_SCORE (0-12)
```
VALUE_SCORE = round((depth/4 × 0.35 + uniqueness/3 × 0.30 + coverage/3 × 0.20 + market/2 × 0.15) × 12)

# Each factor is normalized to 0-1, weighted by importance, then scaled to 0-12.
# This preserves intended weight ratios: depth 35%, uniqueness 30%, coverage 20%, market 15%.
# G014: original formula omitted normalization+scaling, producing max ~3.2.
# Original raw sum distorted weights. This normalized formula is correct.

# GUARD: if uniqueness=0 AND coverage=0, cap VALUE_SCORE at 2 (free tier).
# Rationale: structural quality alone (high MCS) should not command a price.
# A product that adds nothing Claude doesn't already know is free regardless of depth.
```

### 7. Map to pricing
Read `config.yaml → intelligence.pricing.price_map`. Match bracket. Extract range, strategy, guidance.

### 8. Determine portfolio role
Read `STATE.yaml → workspace.products[]`. Count same-domain products.
```
Only product in domain → "anchor"
1 other product        → "complement"
2+ other products      → "extension"
No domain assigned     → "standalone"
```

### 9. Free-vs-paid recommendation
Apply `config.yaml → intelligence.free_vs_paid` decision tree:
- First in domain → "free"
- <3 published total → "free"
- MCS-2+ AND substance >70 → "paid"
- Else → "free_or_signal"

### 10. Display
```
VALUE INTELLIGENCE (Stage 8):
  Value score: {VALUE_SCORE}/12
    Depth:      {depth}/{max} (MCS-{level})
    Uniqueness: {uniqueness}/3 (substance: {score}%)
    Coverage:   {coverage}/3 ({gaps} gaps)
    Market:     {market}/2 ({position})
  Suggested price: ${min}-${max} ({strategy})
  Free vs paid: {recommendation} — {reason}
  Portfolio role: {role} in {domain}
  
  i Value signal is estimated. Real value is confirmed by daily use.
```

### 11. Update .meta.yaml
```yaml
intelligence:
  domain: "{domain}"
  market_position: "{position}"
  value_score: {N}
  value_score_breakdown: { depth: N, uniqueness: N, coverage: N, market: N }
  suggested_price_range: [min, max]
  pricing_strategy: "{strategy}"
  distribution_channels: ["{channels}"]
  portfolio_role: "{role}"
  scored_at: "{ISO-8601}"
```

### 12. Anomaly detection (self-correcting intelligence)
If VALUE_SCORE <= 4 AND OVERALL MCS score >= 90%, flag:
```
⚠ Value anomaly detected: MCS score {score}% but value_score only {N}/12.
  This usually means intelligence inputs are incomplete:
  - Substance measured only primary file? Check references/ for distributed expertise.
  - No scout data? Run /scout to unlock coverage + market factors.
  - No sparring evidence? Run /fill with sparring to build substance score.
  Most likely cause: {if no scout: "missing scout data" | if substance <50 and refs >3: "reference-distributed expertise not captured" | else: "genuinely low differentiation"}
```
This prevents the Engine from producing contradictory signals (high quality + low value) without explanation. The anomaly flag is coaching — it doesn't change the score, it explains WHY the score seems wrong and what to do about it.

## Design Decisions

- Runs AFTER scoring to consume MCS score and substance score — synthesizer, not primary check.
- Missing data defaults to middle values (1), not zero — no penalty for unscouted products.
- Epistemic caveat ALWAYS shown. No exceptions.
- Advisory-only — never blocks publishing. User always decides pricing.
- Anomaly detection catches contradictions between MCS quality and value_score — the system self-diagnoses when its own outputs don't make sense.
