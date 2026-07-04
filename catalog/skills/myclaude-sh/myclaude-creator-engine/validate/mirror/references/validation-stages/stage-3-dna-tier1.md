# Validation Stage 3 — DNA Tier 1 (BLOCKING, gates Tier 1)

> Loaded on demand by `/validate`. Third gate. Blocking for Tier 1 quality.
> Verifies that the universal DNA patterns (D1, D2, D3, D4, D13, D14, D19) are present.

Load `product-dna/{type}.yaml` → `tier1` patterns where `required: true`.
For each applicable pattern, run the validation check:
- D1 Activation Protocol: grep activation section + references/ ref
- D2 Anti-Pattern Guard: grep anti-pattern section, count >= 5 items
- D3 Progressive Disclosure: primary file < 500 lines + references/ exists
- D4 Quality Gate: grep quality gate section, >= 3 verifiable criteria
- D13 Self-Documentation: README.md with what/install/usage/requirements sections
- D14 Graceful Degradation: grep "when not to use" or degradation section
- D19 Attention-Aware Authoring: (claude-md only, required; others optional) — use the attention-position check above. Critical sections (rules/never/must/constraints) must be in last 30% of primary file. For non-claude-md types: check if applicable per product-dna, score as bonus.
Score: `passed / applicable_count`

**Pitfall memory check** (institutional learning):
Load `meta/pitfalls/pitfalls.json` if it exists. For each pitfall entry with `confidence > 0.5`:
  - Check if the current product exhibits the pitfall pattern (grep for the pitfall's `detection_pattern`)
  - If match found, report as `[WARNING]`: "Known pitfall {id}: {description}. Confidence: {confidence}. Previous fix: {resolution}."
  - Pitfall warnings are non-blocking but MUST appear in the validation report
  - This ensures institutional memory is active, not decorative
