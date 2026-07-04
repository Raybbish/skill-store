# Validation Stage 7 — Anti-Commodity + Sub-Stages 7b/7c/7d (advisory + coaching)

> Loaded on demand by `/validate`. Seventh gate. Coaching for Tier 1, score-impacting for Tier 2+.
> Contains 4 sections: Stage 7 (substance), 7b (cognitive mind fidelity), 7c (baseline delta), 7d (composition).

## Stage 7 — ANTI-COMMODITY (score-impacting for MCS-2+, coaching for MCS-1)

**Purpose:** Prevent polished-but-generic products from reaching MCS-2. Structure without substance is latão polido.

**The Substance Test (4 checks, scored 0-100):**

1. **Uniqueness Test (0-25):** Read the product's primary file. Could Claude produce equivalent output from a direct prompt like "act as [description]"? Score: 25 if content includes creator-specific knowledge (real cases, contrarian insights, domain heuristics). 15 if content is framework-application (applies known frameworks to a niche). 0 if content is pure framework summary (Wardley Maps primer, JTBD overview).
   **Recursion guard:** This test asks Claude to judge if Claude could produce the same output — a self-referential evaluation prone to generosity bias. Apply a -5 point skepticism discount to the raw score to counteract self-evaluation inflation. If score after discount is still >15, PASS. Record both raw and adjusted scores in the report: "Uniqueness: {raw}/25 (adjusted: {raw-5}/25 after self-eval discount)".

2. **Real Example Test (0-25):** Grep examples/ for specificity markers: named companies, specific numbers, concrete scenarios with outcomes. Score: 25 if examples reference real situations (even anonymized). 15 if examples are realistic but hypothetical. 0 if examples are generic templates.

3. **Sparring Evidence Test (0-25):** Read `.meta.yaml → sparring`. Score: 25 if `real_examples_provided >= 3` and `unproven_sections` is empty. 15 if sparring ran but some sections unproven. 0 if `sparring.skipped: true` or sparring section absent (product created before sparring existed).

4. **Contrarian Test (0-25):** Grep primary file for contrarian markers: "however", "the exception", "this fails when", "counterintuitively", "common mistake", "what most people get wrong". Score: 25 if >= 3 contrarian insights found. 15 if 1-2 found. 0 if none.

**Substance Score = sum of 4 checks (0-100)**

**Impact on overall score (MCS-2+ ONLY):**
- Substance >= 70: No impact — product has genuine depth.
- Substance 50-69: WARNING — "Product has structure but may lack unique expertise. Score capped at 90%."
  Apply: `OVERALL = min(OVERALL, 90)`
- Substance 30-49: WARNING — "Product appears generic. Score capped at 85% (MCS-1 ceiling)."
  Apply: `OVERALL = min(OVERALL, 85)`
- Substance < 30: WARNING — "Product could be reproduced by a direct Claude prompt. Score capped at 80%."
  Apply: `OVERALL = min(OVERALL, 80)`
  Show: "Consider running /fill with sparring to inject real expertise."

**For MCS-1:** Substance score is reported as coaching only, no cap applied. MCS-1 is the "just works" tier — generic is acceptable.

**Creator override:** If the creator explicitly says "I accept the substance score", the cap is noted but the state still advances. Record `substance_override: true` in .meta.yaml. This respects creator agency (Value #1) while making the quality tradeoff visible.

For MCS-2+, also load `references/quality/expert-panel.md` and compute Expert Panel Score (0-100) using Domain Specialist (0-40), Buyer Advocate (0-30), and Platform Architect (0-30) dimensions. Scores < 50 produce strong warnings with remediation.

## Stage 7b — COGNITIVE MIND FIDELITY (advisory, non-blocking — minds depth:cognitive only)

**Purpose:** When validating a cognitive mind (`.meta.yaml` has `minds_depth: cognitive`), run the 5-layer fidelity scoring defined in `product-dna/minds.yaml → fidelity_scoring`. Advisory minds skip this entirely.

**Prerequisite:** Product type is `minds` AND `.meta.yaml` has `minds_depth: cognitive`. If `minds_depth` is absent or `advisory`, skip silently.

**Execution:**

1. **Layer Completeness (weight: 0.30):**
   - Verify all 5 layer files exist: AGENT.md, references/cognitive-core.md, references/personality.md, references/knowledge-base.md, references/reasoning-engine.md
   - Count lines per layer. Compare against target ranges from `product-dna/minds.yaml → layers.{L}.target_lines`
   - Sum total lines. Target: 800-1200 (reference benchmark = 1,032)
   - Score: `existing_layers / 5` × range compliance

2. **Identity Integrity (weight: 0.25):**
   - C1: Grep AGENT.md for "You ARE" (not "Act as", not "You are an assistant")
   - C2: Grep cognitive-core.md for 3+ dates or named events (biographical anchors)
   - C4: Grep cognitive-core.md for singularity section with 3+ markers
   - C5: Grep personality.md for 5+ characteristic expressions/phrases
   - Score: `passed_checks / 4`

3. **Cognitive Depth (weight: 0.25):**
   - C3: Grep for cognitive flow with named steps (not "think carefully")
   - C6: Grep knowledge-base.md for 3+ domain sections with depth AND boundary declarations
   - C7: Grep reasoning-engine.md for 3+ named reasoning patterns with triggers
   - Score: `passed_checks / 3`

4. **Substance (weight: 0.20):**
   - Examples have real scenarios (not hypothetical — grep for specificity markers)
   - Reasoning engine has concrete models (grep for "When", "trigger", application examples)
   - Boundaries are specific ("I do not X because Y" not "I have limitations")
   - Score: `passed_checks / 3`

5. **Compute Fidelity Score:**
   ```
   FIDELITY = (layer_completeness × 0.30) + (identity_integrity × 0.25) + (cognitive_depth × 0.25) + (substance × 0.20)
   FIDELITY = FIDELITY × 100 (percentage)
   ```

6. **Display:**
   ```
   Cognitive Mind Fidelity: {FIDELITY}%
     Layers: {found}/5 ({total_lines} lines, target 800-1200)
     Identity: C1 {✓/✗} C2 {✓/✗} C4 {✓/✗} C5 {✓/✗}
     Depth:    C3 {✓/✗} C6 {✓/✗} C7 {✓/✗}
     Substance: {score}/3 checks passed
   ```
   If FIDELITY >= 80%: "Benchmark-grade cognitive mind."
   If FIDELITY 60-79%: "Good foundation. Strengthen: {weakest strand names}."
   If FIDELITY < 60%: "Needs deeper content. Missing strands: {list}."

7. **Update .meta.yaml:**
   ```yaml
   state:
     fidelity:
       score: {FIDELITY}
       layers_found: {N}
       total_lines: {N}
       strands_passed: [C1, C3, ...]
       strands_failed: [C2, ...]
       scored_at: "{ISO-8601}"
   ```

## Stage 7c — BASELINE DELTA (advisory, non-blocking — requires scout report)

**Purpose:** Quantify what the product adds beyond Claude's vanilla knowledge. (Formerly 7b — renumbered after cognitive fidelity insertion.) If a scout report exists for this product, compare the baseline (what Claude already knows) against the product's content (what the product teaches). This is the Engine's value proof: "+N points vs Claude vanilla."

**Prerequisite:** `.meta.yaml` has `scout_source` field (set by /create step 10b when scout-aware routing was used). If `scout_source` is absent, skip silently — not all products have scout reports.

**Execution:**

1. **Load scout report:** Read `workspace/{scout_source}` (e.g., `workspace/scout-kubernetes-security.md`). If file doesn't exist, SKIP with note: "Scout report '{scout_source}' referenced in .meta.yaml but not found in workspace/. Run `/scout` to regenerate, or remove scout_source from .meta.yaml."
   **Model version check:** Parse Section 6 for "Baseline model:" field. If present and different from the current model being used, WARN: "Scout baseline was measured with {scout_model}. Current model is {current_model}. Baseline knowledge may have changed — delta accuracy is approximate. Consider re-running /scout to refresh." Non-blocking — proceed with delta calculation but note the discrepancy.

2. **Parse baseline and gaps:**
   - Extract Section 1 (Baseline) — this is what Claude knows without the product.
   - Extract Section 2 (Gap Analysis) — parse the gap table. Each row has: `#`, `Gap`, `Lens`, `Severity`, `Detail`.
   - Build gap inventory: `{id, name, severity, lens}` for each gap.

3. **Weight gaps by severity:**
   ```
   critical    = 3 points
   significant = 2 points
   minor       = 1 point
   ```
   `TOTAL_WEIGHTED_GAPS = sum(weight per gap)`

4. **Score product coverage:** For each gap in the inventory:
   - Extract 3-5 signature keywords from the gap name + detail (e.g., Gap "Supply chain attacks (SLSA, SBOM)" → keywords: "supply chain", "SLSA", "SBOM", "provenance").
   - Grep the product's primary file + references/ for each keyword.
   - **Addressed** (full weight): >= 2 distinct keyword matches AND >= 50 words within 500 chars of at least one match (density check — mention alone is not coverage).
   - **Partially addressed** (half weight): 1 keyword match OR 2+ matches but < 50 words nearby (thin mention without depth).
   - **Not addressed** (zero): 0 keyword matches.
   - `ADDRESSED_WEIGHT = sum(weight of addressed gaps) + sum(half-weight of partially addressed gaps)`

5. **Compute delta score:**
   ```
   BASELINE_DELTA = (ADDRESSED_WEIGHT / TOTAL_WEIGHTED_GAPS) x 100
   ```
   Round to integer.

6. **Compute point gain:**
   ```
   DELTA_POINTS = ADDRESSED_WEIGHT (raw weighted points gained over baseline)
   ```

7. **Display in validation report:**
   ```
   Baseline Delta: +{DELTA_POINTS} points vs Claude vanilla ({BASELINE_DELTA}% of identified gaps addressed)
     Gaps addressed: {N}/{total} ({critical_addressed}C / {significant_addressed}S / {minor_addressed}M)
     Scout report: {scout_source} ({scout_date})
   ```
   If BASELINE_DELTA >= 70%: "Strong differentiation — product substantially extends Claude's baseline."
   If BASELINE_DELTA 40-69%: "Moderate differentiation — product addresses key gaps but leaves some uncovered. Uncovered critical gaps: {list of critical gap names not addressed}."
   If BASELINE_DELTA < 40%: "Low differentiation — product covers few identified gaps. Uncovered critical gaps: {list of critical gap names not addressed}. Consider running /fill with research injection to increase coverage."
   Always append: "(baseline is simulated — see scout report Section 6 for confidence caveats)"

8. **Research provenance:** For each addressed gap, check if the product content near the keyword matches references URLs or citations from the scout report's Section 4 (Research Findings). If yes: mark as "research-backed" (content was sourced during /fill research injection). If no citations nearby: mark as "creator knowledge" (content comes from the creator's domain expertise). Report: "Research-backed: {N} gaps | Creator knowledge: {M} gaps". This distinguishes products built on verified external research from those built on unverified creator claims — a critical quality signal for buyers.

9. **Interaction with Anti-Commodity (Stage 7):** Baseline delta is INDEPENDENT of substance score. A product can have high substance (real expertise, contrarian insights) but low delta (covers gaps Claude already knows). Conversely, high delta with low substance means the product covers new ground but with thin content. Both signals matter — report them side by side, never merge.

10. **Update .meta.yaml after scoring:**
   ```yaml
   state:
     baseline_delta:
       score: {BASELINE_DELTA}
       points: {DELTA_POINTS}
       gaps_total: {total}
       gaps_addressed: {addressed_count}
       gaps_partial: {partial_count}
       gaps_research_backed: {research_backed_count}
       gaps_creator_knowledge: {creator_knowledge_count}
       scout_source: "{scout_source}"
       scored_at: "{ISO-8601}"
   ```

## Stage 7d — COMPOSITION CHECK (advisory, non-blocking — bundle type only)

**Purpose:** For bundle products, verify that all included products exist, are valid, and compose without redundancy. A bundle is a curated collection — curation quality matters.

**Prerequisite:** Product type is `bundle`. For all other types, skip silently.

**Execution:**

1. **Load bundle manifest:** Read the product's `vault.yaml` → `bundle.includes[]`. Each entry should be a product slug.

2. **Verify product existence:** For each slug in `bundle.includes[]`:
   - Check `workspace/{slug}/.meta.yaml` exists. If missing: WARNING — "Bundle references '{slug}' but no product found in workspace/. Build or import it before publishing the bundle."
   - If exists: read `.meta.yaml` for `product.type`, `state.phase`, `state.overall_score`.

3. **Composition quality checks:**

   a. **Type diversity:** Count unique product types in the bundle. If all products are the same type: COACHING — "All {N} products in this bundle are type '{type}'. Bundles with diverse types (e.g., minds + skill + workflow) offer more complete capability coverage."

   b. **Validation status:** For each included product, check `state.phase`:
      - If any product is in `scaffold` phase: WARNING — "Bundle includes '{slug}' which is still in scaffold phase. Fill and validate it before publishing the bundle."
      - If any product hasn't been validated: COACHING — "Bundle includes '{slug}' (not yet validated). Consider running /validate on all included products."

   c. **Scout coherence (if scout report exists):** If the bundle's `.meta.yaml` has `scout_source`, load the scout report's Section 5 (Setup Recommendation → Composition Map). Verify:
      - All products recommended in the scout report are present in `bundle.includes[]`. Missing = COACHING: "Scout report recommended '{slug}' but it's not in the bundle."
      - No products in the bundle are absent from the scout recommendation. Extra = INFO (acceptable — creator may have added products beyond scout scope).

   d. **Gap coverage breadth:** If scout report exists, for each included product, run the baseline delta gap-matching logic (from Stage 7b step 4). Aggregate: which gaps are covered by at least one product in the bundle?
      - Report: "Bundle covers {N}/{total} gaps from scout report ({percentage}%)."
      - If coverage < 60%: COACHING — "Bundle leaves significant gaps uncovered. Consider adding products that address: {list of uncovered critical gaps}."

4. **Display in validation report:**
   ```
   Composition Check (bundle):
     Products: {N} included ({types_summary})
     Existence: {found}/{total} found in workspace
     Validation: {validated_count}/{total} validated
     {If scout exists:}
     Scout alignment: {recommended_found}/{recommended_total} recommended products included
     Gap coverage: {covered}/{total_gaps} gaps addressed ({percentage}%)
   ```
