# Validation Stage 8 — Value Intelligence (advisory, non-blocking — MCS-2+ only)

> Loaded on demand by `/validate`. Eighth and final gate. Synthesizer, not primary check.
> Computes a composite value score (4 factors) and produces pricing/positioning intelligence.

**Purpose:** Compute a composite value score for the product based on 4 objective signals. This is the Intelligence Layer's core computation — it transforms structural quality metrics into actionable pricing and positioning intelligence. Reference: `references/intelligence-layer.md` + `config.yaml → intelligence`.

**Prerequisite:** Product must have completed Stage 7 (anti-commodity). For MCS-1, skip entirely — MCS-1 is "just works" tier where value intelligence adds noise, not signal.

**Execution:**

1. **Load intelligence config:** Read `config.yaml → intelligence.pricing` for weights and price_map.

2. **Compute DEPTH factor (0-4):**
   ```
   MCS-1 (75-84%)  → depth = 1
   MCS-2 (85-91%)  → depth = 2
   MCS-3 (92-100%) → depth = 3
   If product type is minds AND minds_depth is cognitive → depth += 1
   ```
   Use the OVERALL score computed in the scoring section below.

3. **Compute UNIQUENESS factor (0-3):**
   Read Stage 7 substance score (anti-commodity).
   ```
   substance < 50  → uniqueness = 0  ("Claude already knows this")
   substance 50-70 → uniqueness = 1  ("adds some depth")
   substance 70-90 → uniqueness = 2  ("genuine expertise")
   substance > 90  → uniqueness = 3  ("irreplaceable knowledge")
   ```

4. **Compute COVERAGE factor (0-3):**
   Read Stage 7c baseline delta (if available).
   ```
   No baseline delta available → coverage = 1 (default — cannot assess without scout)
   gaps_addressed < 3          → coverage = 0
   gaps_addressed 3-6          → coverage = 1
   gaps_addressed 7-10         → coverage = 2
   gaps_addressed > 10         → coverage = 3
   ```

5. **Compute MARKET factor (0-2):**
   Check `.meta.yaml → intelligence.market_position` (set by /scout or /create marketplace scan).
   ```
   market_position not set     → market = 1 (default — cannot assess)
   saturated (4+ competitors)  → market = 0
   moderate (1-3 competitors)  → market = 1
   blue_ocean (0 competitors)  → market = 2
   ```

6. **Compute VALUE_SCORE (0-12):**
   ```
   VALUE_SCORE = round((depth/4 × 0.35 + uniqueness/3 × 0.30 + coverage/3 × 0.20 + market/2 × 0.15) × 12)
   # Guard: if uniqueness=0 AND coverage=0, cap VALUE_SCORE at 2 (free tier)
   ```
   Note: Each factor normalized to 0-1, weighted by importance, scaled to 0-12. G014: original omitted normalization+scaling (max ~3.2). Original raw sum distorted weights. This normalized formula preserves intended ratios. Guard prevents structural quality alone from commanding a price.

7. **Map to pricing:** Read `config.yaml → intelligence.pricing.price_map`. Find the bracket where `VALUE_SCORE >= min AND VALUE_SCORE <= max`. Extract `range`, `strategy`, `guidance`.

8. **Determine portfolio role:**
   Read `STATE.yaml → workspace.products[]`. Count products in the same domain as the current product.
   ```
   Only product in its domain         → role = "anchor"
   Domain has 1 other product          → role = "complement"
   Domain has 2+ other products        → role = "extension"
   Product has no domain assigned      → role = "standalone"
   ```

9. **Determine free-vs-paid recommendation:**
   Read `config.yaml → intelligence.free_vs_paid` decision tree. Apply in order:
   - Count products in the same domain across `STATE.yaml → workspace.products[]`
   - If this is the first product in the domain → "free" (build authority)
   - If creator has <3 published products total → "free" (build audience)
   - If MCS-2+ AND substance >70 → "paid" (value justified)
   - Else → "free_or_signal" ($0-3)

10. **Display in validation report:**
    ```
    VALUE INTELLIGENCE (Stage 8):
      Value score: {VALUE_SCORE}/12
        Depth:      {depth_raw}/{depth_max} (MCS-{level}{if cognitive: " + cognitive"})
        Uniqueness: {uniqueness_raw}/3 (substance: {substance_score}%)
        Coverage:   {coverage_raw}/3 ({gaps_addressed} gaps{if no delta: " — no scout data"})
        Market:     {market_raw}/2 ({market_position}{if unknown: " — run /scout for data"})
      
      Suggested price: ${range[0]}-${range[1]} ({strategy})
      {guidance}
      
      Free vs paid: {recommendation} — {reason}
      Portfolio role: {role} in {domain}
      
      ⓘ Value signal is estimated from structural quality + market position.
        Real value is confirmed by daily use. If YOU use this every day, others will too.
    ```

11. **Update .meta.yaml intelligence fields:**
    ```yaml
    intelligence:
      domain: "{inferred_domain}"
      market_position: "{market_position}"
      value_score: {VALUE_SCORE}
      value_score_breakdown:
        depth: {depth_raw}
        uniqueness: {uniqueness_raw}
        coverage: {coverage_raw}
        market: {market_raw}
      suggested_price_range: [{range[0]}, {range[1]}]
      pricing_strategy: "{strategy}"
      distribution_channels: ["{channels from config.yaml by type}"]
      portfolio_role: "{role}"
      scored_at: "{ISO-8601}"
    ```

**Design decisions:**
- Value intelligence runs AFTER scoring so it can consume the overall MCS score and substance score — it's a synthesizer, not a primary check.
- Factors with missing data default to middle values (1), not zero — prevents penalizing products that simply haven't been scouted yet. The report explicitly notes which factors are estimated vs measured.
- The epistemic caveat is ALWAYS shown. No exceptions. This is what makes the intelligence trustworthy.
- Value score is advisory-only — it never blocks publishing. The user always decides pricing.
