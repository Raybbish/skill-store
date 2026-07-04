# Validation Stage 4 — DNA Tier 2 (non-blocking, gates Tier 2, LITE+PRO)

> Loaded on demand by `/validate`. Fourth gate. Non-blocking but contributes to Tier 2 score.
> Verifies the advanced DNA patterns (D5-D8, D15-D17, D20).

Load `product-dna/{type}.yaml` → `tier2` patterns where `required: true`.
- D5 Question System: grep question/input table or "if missing, ask"
- D6 Confidence Signaling: grep confidence levels or certainty markers
- D7 Pre-Execution Gate: grep precondition checks
- D8 State Persistence: state file or persistence section
- D15 Testability: test scenarios or expected outputs
- D16 Composability: no hardcoded paths, no common command names
- D17 Hook Integration: hooks section in frontmatter or docs
- D20 Cache-Friendly Design: (claude-md required, system optional) — use the semantic scoping check + token economics check above. Three sub-checks: (1) paths: frontmatter exists with specific globs, (2) primary file <2K chars for claude-md / <4K for system, (3) no dynamic content (date/time/counter patterns). All three pass = PASS. Partial = PARTIAL.
Score: `passed / applicable_count`
