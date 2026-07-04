# Validation Stage 9 — Voice Coherence (ADVISORY)

> Loaded on demand by `/validate`. This stage runs **after** Stage 8 and is the last
> stage in the pipeline. Advisory by design: voice drift is coaching, never blocked.
> A product with voice drift still publishes if all blocking stages pass. Source of
> truth: `quality-gates.yaml → validation_stages.stage_9_voice_coherence`. Anchored
> by P10 Touch Integrity (`structural-dna.md §P10`).

## When This Stage Runs

**Runs when:** `mcs_target >= MCS-1` (i.e., every product passing through `/validate`,
at every level). Stage 9 is the default last pass of the pipeline.

**Degrades gracefully when:** the voice substrate is missing. If
`references/quality/engine-voice-core.md` cannot be read (renamed, deleted, corrupted),
Stage 9 emits a single advisory line and returns a zero-check result:

> *Voice coherence check skipped — micro voice contract not found at
> `references/quality/engine-voice-core.md`. Stage 9 requires the substrate to audit
> against. Restore the file or see `structural-dna.md §P10`.*

Never crash on substrate absence. Never block `/validate` output on Stage 9 infrastructure.

## Inputs (read, never mutated except for `writes_to` section below)

1. `references/quality/engine-voice-core.md` — micro voice contract, ≤600 tokens, EAGER.
   Source of the Vocabulary always/never list, the `✦` signature rules, the three tones,
   the six anti-patterns, and the error-as-intimacy distinction.
2. `references/quality/engine-voice.md` — full voice substrate, 231 lines. Loaded LAZY
   **only** when Check 1 detects a peak-moment section in the product output that needs
   audit against the full Brand DNA (e.g., publish celebration render, first-product WOW,
   milestone pause).
3. `references/ux-vocabulary.md` — internal → user-facing translation layer. Consumed by
   Check 3 (non-dev jargon leak) when the creator is non-developer.
4. The product's primary file — `SKILL.md`, `AGENT.md`, `SQUAD.md`, `OUTPUT-STYLE.md`, or
   per `config.yaml → routing.{type}.primary_file`.
5. The product's `README.md` — the market-facing surface; every user encounters this
   before the product itself.
6. `creator.yaml → creator.profile.type` — calibrates Check 3's jargon severity. Stage 9
   applies the full jargon audit only when the creator type is non-developer.

## Mode-Aware Execution

Stage 9 has no mode enum like Stage 0 — it runs the same five checks against every
product. The ONE branching signal is `creator.profile.type`:

| Creator type | Checks to execute |
|---|---|
| `developer`, `prompt-engineer` | Checks 1, 2, 4, 5 (skip Check 3 jargon audit) |
| `domain-expert`, `marketer`, `operator`, `domain-generalist`, `agency`, `hybrid` | Checks 1, 2, 3, 4, 5 (full audit) |

If `creator.yaml` is missing OR `creator.profile.type` is unset, default to the full
audit (Check 3 included). Better to surface a false positive on jargon than to silently
leak internal vocabulary to an unknown audience.

## The 5 Checks (executed in order)

Each check has a severity. Warnings and advisories are reported but **never block
publish** — the entire stage is advisory. The severity controls how the check is
surfaced to the creator in the Stage 9 report block.

### Check 1 — signature_presence (severity: warning)

Audit the product's primary file and README.md for peak-moment sections. A peak moment
is any section whose surface matches one of the peak-moment anchors declared in
`engine-voice-core.md §The ✦ signature`:

- Section headers matching `/celebration|celebrate|wow|milestone|welcome|launch|published|first|ritual/i`
- Blocks framed as `┌─` ... `─┐` (brand frame)
- Explicit "published" / "live now" markers
- First-product output sections

For each detected peak-moment section, count occurrences of `✦`:

- **Expected:** exactly 1 occurrence per peak moment.
- **Pass:** exactly 1.
- **Warning (missing):** 0 occurrences → *"Peak moment detected at {section_name} but `✦`
  signature missing. See `engine-voice-core.md §The ✦ signature`."*
- **Warning (stacked):** ≥2 occurrences on adjacent lines or within 200 chars → *"`✦`
  stacked at {section_name} — signature dilutes when used more than once per peak moment.
  See `engine-voice-core.md §The ✦ signature`."*

Non-peak sections are not audited. A SKILL.md body with zero `✦` is legitimate — the
symbol is reserved for peak moments by design.

**Pass condition:** every detected peak-moment section has exactly one `✦` occurrence.
**Grep pattern:** `✦` (literal UTF-8 code point U+2726).

### Check 2 — vocabulary_always_never (severity: warning)

Grep the product's primary file and README.md for the Vocabulary always/never patterns
declared in `engine-voice-core.md §Vocabulary`. These are the phrases the voice contract
forbids in user-facing output:

| Pattern (regex, case-insensitive) | Why it's flagged | Correct form |
|---|---|---|
| `\buser\b` (meaning the Creator) | Flattens the relationship to SaaS framing | "Creator" (myClaude-specific) |
| `great job\|good work\|nice work\|well done` | Cheerleader anti-pattern — praises the person, not the work | Praise the work specifically |
| `looks good\|seems fine\|should work` | Non-committal — the Engine hedges when it should commit or ask | Commit to a judgment or ask a question |
| `I think maybe\|possibly\|perhaps` (hedging) | Projects uncertainty without naming the confidence tier | Name confidence: high / moderate / low |
| `sorry but\|apologies\|I apologize` (theatrical) | Apology loops burn trust; diagnose + secure in one line | Engine-fault voice per engine-voice-core.md |

Run each regex against the primary file and README.md. For each match, emit:

> *[warn] vocabulary_always_never — pattern `{pattern}` matched at {file}:{line}. See
> `engine-voice-core.md §Vocabulary`.*

**Pass condition:** zero matches across both files.

**Exemption:** matches inside fenced code blocks (```...```) or inline backticks are
exempt — they may be showing the anti-pattern as a negative example.

### Check 3 — non_dev_jargon_leak (severity: warning)

Runs **only** when `creator.profile.type ∈ {domain-expert, marketer, operator,
domain-generalist}` per the mode-aware execution table above. Grep user-facing output
(primary file non-code sections + README.md) for internal vocabulary that
`references/ux-vocabulary.md` translates:

| Internal term (regex) | Should be translated to |
|---|---|
| `\bMCS-[123]\b` | Verified / Premium / Elite |
| `\bD(1\|2\|3\|4\|5\|6\|7\|8\|9\|10\|11\|12\|13\|14\|15\|16\|17\|18\|19\|20)\b` (standalone pattern names) | the human capability name |
| `\bscaffold\b` (as user-facing) | draft / starter |
| `\bforge\b` (as user-facing verb) | build / create |
| `\bactivation protocol\b` (as user-facing) | how it starts up |
| `\bquality gate\b` (as user-facing) | quality check |
| `\bdiscriminators?\b` (as user-facing) | decision signals |
| `\bhabitable cell\b` | form / category |

For each match, emit:

> *[warn] non_dev_jargon_leak — internal term `{term}` at {file}:{line} leaked to
> user-facing section. Translate per `references/ux-vocabulary.md`. Creator type:
> `{creator_type}`.*

**Pass condition:** zero matches in user-facing sections.

**Exemption:** matches inside frontmatter (`---` blocks), fenced code blocks, inline
backticks, HTML comments, or sections explicitly marked `<!-- technical -->` are exempt.
Those surfaces are internal by contract.

### Check 4 — error_voice_distinction (severity: advisory)

If the product's primary file contains error-handling sections (grep for
`## Graceful Degradation`, `## When Not To Use`, `## Error`, `## Failure`, or explicit
`if .* fails` branches), verify each error path is explicitly marked with its voice.
The two voices, per `engine-voice-core.md §Error as intimacy`:

- **environment-fault voice** — the error is outside myClaude (YAML parse error, CLI
  timeout, missing file, permission denied, network failure). Tone: diagnostic-and-safe,
  neutral. Phrase template: *"{what broke}. {fix suggestion}. Your work is safe."*
- **engine-fault voice** — the error is inside myClaude (schema drift, contract
  violation, unexpected state, forge that produced an invalid artifact). Tone: slightly
  self-critical + collaborative. Phrase template: *"That I didn't expect. {diagnosis}.
  {the way out}. Your work is safe."*

For each error section detected, check if the section or its surrounding comment
explicitly names which voice applies. Acceptable markers:

- A comment `<!-- voice: environment-fault -->` or `<!-- voice: engine-fault -->`
- A heading `### Environment-Fault Error` or `### Engine-Fault Error`
- A cross-reference to `engine-voice-core.md §Error as intimacy` in the section body

If an error section exists and has zero voice markers:

> *[advisory] error_voice_distinction — error path at {file}:{section} does not declare
> its voice. Conflating environment-fault and engine-fault is a P10 Touch Integrity
> violation. See `engine-voice-core.md §Error as intimacy`.*

**Pass condition:** every error section has at least one voice marker, OR the product
has no error sections (zero-false-positive for pure procedural skills without failure
branching).

### Check 5 — tone_singularity (severity: advisory)

Audit each major output block (celebration sections, dashboard panels, feedback blocks,
verdict renders) for tone mixing. The three tones declared in
`engine-voice-core.md §Three tones`:

- **conducting** — guiding the Creator through a next action. *"Your next move is {X}."*
- **celebrating** — acknowledging a peak moment. Specific praise for the work, never
  generic praise for the person.
- **confronting** — naming a real problem without apology. Direct, diagnostic, named.

A single output block commits to ONE tone. Mixing two tones in the same block is an
anti-pattern (cheerleader + conductor; confronter + celebrator; etc.).

Heuristic for detecting mixing in a block:

1. Extract each section of the primary file and README.md.
2. For each section, count keyword matches from three lexicons:
   - Conducting lexicon: `next move|next step|your next|run /|continue with`
   - Celebrating lexicon: `live|published|shipped|complete|milestone|first|✦`
   - Confronting lexicon: `missing|failed|blocked|invalid|wrong|does not|cannot`
3. If a section has ≥2 hits in 2 different lexicons AND the section is ≤20 lines,
   flag as tone-mixing:

> *[advisory] tone_singularity — section `{name}` mixes {tone_a} and {tone_b}. Each
> output block commits to ONE tone. See `engine-voice-core.md §Three tones`.*

**Pass condition:** every section hits ≥2 lexicons in at most one lexicon (clean),
OR sections are long enough (>20 lines) that multi-tone is unavoidable and legitimate
(e.g., a full dashboard with multiple panels).

**False-positive guard:** conducting-only sections (instruction manuals, activation
protocols, core instructions bodies) that naturally contain problem-words like
"failed" in documentation examples are exempt. The heuristic ignores fenced code blocks
and explicit "Example:" prefixed lines.

## Outputs (writes_to)

Stage 9 writes two fields to the product's `.meta.yaml`:

```yaml
stage_9_results:
  executed_at: "{ISO-8601 timestamp}"
  substrate_loaded: true                       # false if engine-voice-core.md missing
  checks_run: {N}                              # 4 for developer/prompt-engineer, 5 otherwise
  checks_passed: {N}
  checks_warned: {N}
  checks_advisory: {N}
  check_results:
    signature_presence: "pass|warning — {message if warning}"
    vocabulary_always_never: "pass|warning — {count} matches: {file_locations}"
    non_dev_jargon_leak: "pass|warning|skipped — {count} matches OR 'skipped: developer creator type'"
    error_voice_distinction: "pass|advisory|n/a — {message if advisory, or 'n/a: no error sections'}"
    tone_singularity: "pass|advisory — {count} tone-mixing sections: {section_names}"

intelligence:
  voice_coherence_score: {0-100}               # 100 - (warnings * 10). Advisories do not deduct.
```

**Score formula:** `voice_coherence_score = max(0, 100 - (warnings * 10))`. Advisories
are surfaced but do not impact the score — they are coaching, not judgment. A product
with zero warnings and three advisories scores 100. A product with two warnings and
zero advisories scores 80.

## Reporting Format (creator-facing)

Stage 9 reports inline in the `/validate` output **after** Stage 8 and before the final
verdict block. The format:

```
Stage 9 — Voice Coherence: {passed}/{checks_run} checks passed, {coherence_score}%
  {if any warning, list each on its own line with severity tag and fix pointer}
  [warn] signature_presence — Peak moment detected at README.md§Celebration but ✦ missing.
         Fix: add ✦ to the celebration header per engine-voice-core.md §The ✦ signature.
  [warn] vocabulary_always_never — 'user' matched 3× in SKILL.md (lines 42, 58, 71).
         Fix: use 'Creator' per engine-voice-core.md §Vocabulary.
  [advisory] tone_singularity — section 'When Not To Use' mixes conducting and confronting.
         Fix: separate into two blocks, or commit to one tone.

  → Voice drift is advisory. This product will still publish if other stages pass.
     See `references/quality/engine-voice-core.md` for the micro contract, or the full
     substrate at `references/quality/engine-voice.md`.
```

If all checks pass cleanly:

```
Stage 9 — Voice Coherence: {checks_run}/{checks_run} checks passed, 100% clean.
  Voice substrate honored — ✦ signature consistent, vocabulary clean, tones discrete.
```

## Why This Stage Is Advisory

Voice coherence is a **quality signal**, not a publishing gate. The Creator's own voice
is ALWAYS honored inside the myClaude frame — Stage 9 flags places where the Engine's
own generated scaffolding or prefill contradicts the voice contract, not places where
the Creator intentionally chose a different register.

A creator writing a product with a deliberately irreverent tone, or a culturally-specific
voice, or a domain-specific register, is not "wrong" — and Stage 9 is not the place to
argue with that choice. It flags only the structural patterns: missing `✦` on peak
moments, internal jargon leaked to non-dev audiences, error paths that conflate
engine-fault and environment-fault.

Blocking on voice drift would be P10 Touch Integrity turning against the Creator, which
is the opposite of what P10 declares. P10 protects the felt experience OF THE CREATOR.
Stage 9 is how the Engine polices ITSELF against P10, not a tool to police others.

## Consumer Status

**handler_ready** — the handler exists (this file) with five concrete checks using
grep patterns against the voice substrate and the product's primary file + README.md.
Promotion to **native** requires end-to-end verification that the `/validate` runner
invokes this handler in production, every check executes against real product files,
and results persist to `.meta.yaml → stage_9_results` and
`.meta.yaml → intelligence.voice_coherence_score`.

**Integration note (read before consuming):** the `/validate` skill runner executes
Stage 9 as the last stage in the pipeline per the stage routing table in
`.claude/skills/validate/references/validation-stages/_index.md`. Future waves may
integrate Stage 9 into specific sub-stages of Stage 7 (anti-commodity) where voice
substrate audits naturally compose with commodity checks. Until then, Stage 9 stands
as a distinct advisory gate — the last pass before the verdict.
