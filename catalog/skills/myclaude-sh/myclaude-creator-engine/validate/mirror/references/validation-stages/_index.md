# Validation Stages — Index

> Hub for the 8-stage validation pipeline used by `/validate`. Each stage lives in
> its own file and is loaded on demand. Stage ordering is fixed; blocking stages
> stop the pipeline on failure; non-blocking stages report and continue.

## Pipeline Order

| Stage | Name | File | Blocking? | Tier Gate |
|-------|------|------|-----------|-----------|
| **0** | **Intent Coherence** | `stage-0-intent-coherence.md` | **advisory** | — (runs when `.meta.yaml` has `intent_declaration`) |
| 1 | Structural | `stage-1-structural.md` | YES | — |
| 2 | Integrity | `stage-2-integrity.md` | YES | — |
| 3 | DNA Tier 1 | `stage-3-dna-tier1.md` | YES | Tier 1 |
| 4 | DNA Tier 2 | `stage-4-dna-tier2.md` | no | Tier 2 |
| 5 | DNA Tier 3 | `stage-5-dna-tier3.md` | no | Tier 3 (PRO) |
| 6 (+6b) | CLI Preflight + System Health | `stage-6-cli-preflight.md` | YES (6) / advisory (6b) | — |
| 7 (+7b/7c/7d) | Anti-Commodity + sub-stages | `stage-7-anti-commodity.md` | advisory | Tier 2 |
| 8 | Value Intelligence | `stage-8-value-intelligence.md` | advisory | Tier 2 |
| **9** | **Voice Coherence** | `stage-9-voice-coherence.md` | **advisory** | — (runs for every `/validate` at MCS-1+) |

**Stage 0 is the only pre-Stage-1 gate.** It validates intent coherence against the
`intent_declaration` block persisted by `/create`. It runs advisory — never blocks
publish — and skips silently for products that lack `intent_declaration` in `.meta.yaml`.

## Stage Routing by Level

- `--level=1` (Tier 1): Stages **0**, 1, 2, 3, 6, **9**
- `--level=2` (Tier 2): Stages **0**, 1, 2, 3, 4, 6, 7 (+7b/7c/7d), 8, **9**
- `--level=3` (Tier 3): Stages **0**, 1, 2, 3, 4, 5, 6, 7 (+7b/7c/7d), 8, **9**

Stage 9 Voice Coherence is advisory and runs for every `/validate` invocation at MCS-1+.
It is the last stage in the pipeline, after Stage 8. P10 Touch Integrity is the
constitutional anchor.

## Sub-Stages (inside Stage 7 file)

- **7b — Cognitive Mind Fidelity** (advisory) — only fires for cognitive minds
- **7c — Baseline Delta** (advisory) — only fires when a scout report exists
- **7d — Composition Check** (advisory) — only fires for bundle products

## Why this directory exists

The previous monolithic `validation-stages.md` (525 lines) violated Clause VIII (Token ROI):
running Stage 1 forced loading all 8 stages. The split lets `/validate` load only the
stage it needs. Each stage file is self-contained and verbatim-preserved from the original
so behaviour is identical.
