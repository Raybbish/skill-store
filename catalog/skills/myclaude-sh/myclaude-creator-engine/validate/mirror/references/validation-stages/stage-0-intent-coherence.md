# Validation Stage 0 — Intent Coherence (ADVISORY)

> Loaded on demand by `/validate`. This stage runs **before** Stage 1 when the product's
> `.meta.yaml` has an `intent_declaration` block. Advisory by design: coherence drift is
> coached, never blocked. A product with intent drift still publishes if all blocking
> stages pass. Source of truth: `quality-gates.yaml → validation_stages.stage_0_intent_coherence`.

## When This Stage Runs

**Runs when:** `mcs_target >= MCS-1` AND `.meta.yaml` contains `intent_declaration:` block
(written by `/create` Section 0 Step 11).

**Skips when:** `intent_declaration` field missing OR is null (legacy product forged before
`/create` persisted intent declarations). Emit this advisory note and continue to Stage 1:

> *Intent coherence check skipped — this product was forged before `/create` persisted
> `intent_declaration`. Re-run `/create` on this product to enable Stage 0, or continue —
> the other stages validate structural and DNA quality independently.*

## Inputs (read, never write except for writes_to section below)

1. `.meta.yaml → intent_declaration` (18 top-level fields + 9 engine_parsed sub-fields)
2. `config.yaml → routing.{type}.intent_topology` (legal values per type)
3. `config.yaml → routing.common.intent_topology_enums` (canonical axis enums)
4. `product-dna/{type}.yaml → intent_topology` (codex declaration mode + legal values)
5. `references/runtime-host-dag.md §2` (derivation table for host check)
6. `references/intent-topology.md §4` (habitable cells v1 for cell-name validation)
7. `references/composition-anatomy.md §5` (GAP-COMPOSITION-1 for unroutable_gap_id check)

## Mode-Aware Execution

Before executing the 6 checks, read `intent_declaration.mode`. Three legal values:

| Mode | Source | Checks to execute |
|---|---|---|
| `express` | Section 0 fast path | Checks 1-6 (full validation) |
| `guided` | Section 0 12-step walk | Checks 1-6 (full validation) |
| `legacy_fallback` | Section 1 legacy router (Contract C4) | Checks 5, 6 only (engine_parsed fields are null by design) |

If `mode` is not one of these three values, emit an error: *"intent_declaration.mode
'{value}' is not a legal mode. Legal values: express | guided | legacy_fallback."* and
skip to Stage 1.

When `mode == legacy_fallback`, Checks 1-4 are reported as `n/a (legacy fallback)` in
the output — not as pass, not as error. Legacy forges intentionally leave
`engine_parsed.{verb_family, continuity_bias, invocation_mode, pollution_risk, output_shape,
depth, nature, delivery_mechanism}` as null because they bypassed the 12-step walk. Running
enum/legality checks against null values would falsely error every legacy forge. The only
meaningful Stage 0 checks for legacy forges are the unroutable-reason enum validation and
the locale-adaptive clause presence — everything else is by-design absent.

## The 6 Checks (executed in order)

Each check has a severity. Warnings and errors are reported but **never block publish** —
the entire stage is advisory. The severity controls how the check is surfaced to the creator.

### Check 1 — enum_membership (severity: error)

For each axis `∈ {delivery, nature, depth}`, verify the value in
`intent_declaration.engine_parsed.{axis}` is a member of the canonical enum in
`config.yaml → routing.common.intent_topology_enums.{axis}`.

- Pass → continue.
- Fail → report: *"intent_declaration.engine_parsed.{axis} value '{value}' is not in the
  canonical enum. Legal values: {legal_list}."*

### Check 2 — type_legality (severity: error)

Verify the declared `(delivery, nature, depth)` triple is legal for the product's type
per `config.yaml → routing.{type}.intent_topology`. For `declaration_mode: full` types
(skill, agent), read the `*_legal` lists. For `declaration_mode: derived` types (squad,
system, minds, output-style), read the `*_fixed` or inherited values.

- Pass → continue.
- Fail → report: *"Type '{type}' does not permit ({delivery}, {nature}, {depth}). Legal
  combinations for this type: {legal_combinations}."*

### Check 3 — codex_consistency (severity: error)

Read `product-dna/{type}.yaml → intent_topology` (the codex source-of-truth). If
`declaration_mode: full`, verify the triple is in the codex's legal values. If
`declaration_mode: derived`, verify the triple matches the codex's fixed values.

- Pass → continue.
- Fail → report: *"Codex product-dna/{type}.yaml declares `{declaration_mode}` mode with
  {fixed_or_legal_values}; declared value mismatch."*

### Check 4 — host_derivation (severity: warning)

Compute the runtime host set from `(engine_parsed.delivery_mechanism,
engine_parsed.nature)` using `references/runtime-host-dag.md §2`. Compare to
`engine_parsed.host_set` written at forge time.

- Pass → continue. (Equality on sets.)
- Fail → report: *"Runtime host {declared_host} does not match derivation for
  ({delivery}, {nature}) = {derived_host}. Host is computed, not declared — this is a
  drift signal."*

Note: this check is a sanity check for forge bugs. `/create` Section 0 Step 8 should
always write the correct host_set; a mismatch means something wrote `engine_parsed.host_set`
out of band.

### Check 5 — unroutable_reason_enum (severity: error)

If `intent_declaration.unroutable == true`, verify `unroutable_reason` is one of the five
legal values: `no_habitable_cell | v2_cell_deferred | blocked_by_composition_gap |
ambiguous_between_cells | explicit_legacy_router`.

The fifth value (`explicit_legacy_router`) covers the case where the creator intentionally
invoked the legacy router (via `--legacy-router` flag or by answering "I don't know yet"
at Section 0 Step 1) rather than the walk returning unroutable. The forge is marked
unroutable to flag that it bypassed the canonical topology, but the reason is volitional,
not a failure of the walk.

If `unroutable_reason == blocked_by_composition_gap`, verify `unroutable_gap_id` is
populated and matches a gap id declared in `references/composition-anatomy.md §5`
(currently only `GAP-COMPOSITION-1`).

- Pass → continue.
- Fail → report: *"Invalid unroutable_reason '{value}'. See references/capability-matrix.md §3 Step 9."*

### Check 6 — locale_adaptive_clause_presence (severity: warning, with planned promotion to error)

Read the product's primary file (from `config.yaml routing.{type}.primary_file`). Grep
for both marker strings:

```
<<< LOCALE-ADAPTIVE CLAUSE (runtime contract, do not edit) >>>
<<< END CLAUSE >>>
```

Verify: (a) both markers present, (b) open marker before close marker, (c) at least 3
non-empty lines between them.

- Pass → continue.
- Fail → report: *"Locale-adaptive clause markers not found in primary file. This product
  will not adapt to non-source-language invokers. Re-run `/create` or manually inject the
  clause from `references/locale-adaptive-clause.md §2`."*

**Severity transition (planned).** Current severity is `warning` across all products. The
planned promotion to `error` applies only to products whose `.meta.yaml` contains an
`intent_declaration` block — products forged before `/create` persisted the declaration
stay under the advisory warning regime (per D19) to avoid breaking legacy workspaces. The
promotion lands when the drift-check rule is promoted in `scripts/codex-drift-check.py`;
until then, this section documents the target state, not the current state. Editing the
primary file of a product with `intent_declaration` and stripping the clause markers will
block validation once the promotion is live.

### Recursion for `type == system` (advisory)

If `product.type == system`, Stage 0 recursively validates each sub-part's
`intent_declaration` in addition to the system-level declaration. For each sub-part:

1. Read the sub-part's `.meta.yaml` (in `workspace/{slug}/sub-parts/{name}/.meta.yaml`).
2. Run Checks 1–6 against the sub-part's `intent_declaration`.
3. Aggregate results as `system_recursive_stage0_results` in the system's own
   `.meta.yaml → stage_0_results`.

If a sub-part lacks its own `intent_declaration`, skip it with the same advisory note
used in "Skips when" above.

## Outputs (writes_to)

Stage 0 writes three fields to the product's `.meta.yaml`:

```yaml
stage_0_results:
  executed_at: "{ISO timestamp}"
  checks_run: 6
  checks_passed: {N}
  checks_warned: {N}
  checks_errored: {N}
  check_results:
    enum_membership: "pass|error — {message if error}"
    type_legality: "pass|error — {message if error}"
    codex_consistency: "pass|error — {message if error}"
    host_derivation: "pass|warning — {message if warning}"
    unroutable_reason_enum: "pass|error|n/a — {message if error}"
    locale_adaptive_clause_presence: "pass|warning — {message if warning}"
  system_recursive_stage0_results: []  # only populated for system type

intelligence:
  intent_coherence_score: {0-100}      # (checks_passed / checks_run) * 100
  intent_drift_detected: {true|false}  # true if any check != pass
```

## Reporting Format (creator-facing)

Stage 0 reports inline in the `/validate` output **between** the "Validating {slug}..."
header and Stage 1 results. The format:

```
Stage 0 — Intent Coherence: {passed}/6 checks passed ({coherence_score}%)
  {if any warning or error, list each on its own line with severity tag}
  [warn] host_derivation — Runtime host ...
  [error] locale_adaptive_clause_presence — Markers not found...

  → Intent drift is advisory. This product will still publish if other stages pass.
     Re-run /create to regenerate from the current intent_declaration, or continue.
```

## Why This Stage Is Advisory

Intent coherence drift is a **diagnostic signal**, not a publishing blocker. A creator who
edits their scaffold after forge may legitimately drift from the declared cell (e.g.,
starts as `procedural_skill`, grows during /fill into something that looks more like
`reasoning_skill_cognitive`). Stage 0 surfaces the drift as coaching: *"your product has
drifted from the cell you declared at forge time — want to re-forge, or is the drift
intentional?"* — and lets the creator decide.

Blocking on drift would force creators to re-run `/create` every time `/fill` expanded
scope, which is punitive. Stage 0's job is to make drift **visible**, not to make it
**illegal**.

## Consumer Status

**handler_ready** — this document defines the full check contract; `quality-gates.yaml →
validation_stages.stage_0_intent_coherence.consumer_status` currently reads `handler_ready`.
The `/validate` runner invokes this stage end-to-end against every product with an
`intent_declaration` block; products without the block trigger the "Skips when" note and
continue to Stage 1 without loss. Promotion from `handler_ready` to `native` lands once
the runtime wire is verified empirically against the six checks.
