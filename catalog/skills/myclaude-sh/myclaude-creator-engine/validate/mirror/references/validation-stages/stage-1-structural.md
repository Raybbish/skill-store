# Validation Stage 1 — Structural (BLOCKING)

> Loaded on demand by `/validate`. This is the first gate in the validation pipeline.
> Blocking: failure stops the pipeline. The product cannot advance state until fixed.

For each issue found, classify:
- `[BLOCKING]` — Must fix before proceeding. Cannot advance state.
- `[WARNING]` — Can proceed with explicit risk acceptance. Creator must confirm.

Glob: do all required files for the product type exist?
Load `product-dna/{type}.yaml` → `required_files` and `config.yaml` → `routing.{type}.required_files`.

**Bundle exception:** If type=bundle, skip primary file check. Instead check: vault.yaml exists with `bundle.includes[]` array AND `bundle.includes.length >= 2` (a bundle with fewer than 2 products has no curation value — fail with: "Bundle must include at least 2 products. Found: {N}. Add more products to vault.yaml → bundle.includes[] then re-run /validate.").

Score: `files_found / files_expected`

**Frontmatter check:** read the primary file's YAML frontmatter. Verify `description` field is <= 250 characters. If over, report as warning with character count: "Frontmatter description is {N} chars (recommended: <= 250). Trim for marketplace compatibility."
