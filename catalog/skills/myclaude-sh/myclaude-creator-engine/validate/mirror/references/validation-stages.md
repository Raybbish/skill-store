# Validation Stages — Moved

> This file has been split into per-stage files under `validation-stages/`.
> It is kept here as a thin pointer for backward compatibility. New call sites
> should load the per-stage file directly.

See `validation-stages/_index.md` for the full pipeline catalogue.

Per-stage files:
- `validation-stages/stage-1-structural.md`
- `validation-stages/stage-2-integrity.md`
- `validation-stages/stage-3-dna-tier1.md`
- `validation-stages/stage-4-dna-tier2.md`
- `validation-stages/stage-5-dna-tier3.md`
- `validation-stages/stage-6-cli-preflight.md`
- `validation-stages/stage-7-anti-commodity.md` (includes sub-stages 7b, 7c, 7d)
- `validation-stages/stage-8-value-intelligence.md`

The split mitigates the Cathedral risk where a single 525-line reference file was
loaded any time `/validate` ran any stage. Per-stage loading is the clean architecture.
