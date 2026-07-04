### HARD VETO (pre-scoring)

Before computing scores, check for absolute blockers that override any score:

1. **Secret detected** → VETO. Score is irrelevant. Product CANNOT proceed regardless of MCS level.
   Output: "HARD VETO: Secret detected in {file}:{line}. Remove ALL secrets before validation can proceed. No score will be computed until secrets are resolved."

2. **Placeholder in primary file** → VETO for MCS-2+. Product cannot claim quality tier with placeholder content.
   Output: "HARD VETO (MCS-2+): Placeholder content found in primary file. Replace all placeholders before MCS-2 validation."

If any HARD VETO triggers, skip scoring entirely and report only the veto reason with fix instructions.

### SCORING (DNA-based, per PRD §4)

```
For each applicable DNA pattern (from product-dna/{type}.yaml):
  PASS    = 1.0   PARTIAL = 0.5   FAIL = 0.0

DNA_SCORE        = (sum pattern_scores / applicable_count) x 100
STRUCTURAL_SCORE = (files_found / files_expected) x 100
INTEGRITY_SCORE  = (valid_refs / total_refs) x 100

OVERALL = (DNA_SCORE x 0.50) + (STRUCTURAL_SCORE x 0.30) + (INTEGRITY_SCORE x 0.20)
```

Thresholds: MCS-1 >= 75%, MCS-2 >= 85%, MCS-3 >= 92%.
Report as `{score}%` with breakdown per component.

### VERDICT (human-readable action signal)

After computing the overall MCS score, produce a three-status verdict:

| Score | Verdict | Meaning |
|-------|---------|---------|
| >= target MCS | **READY** | Product meets quality target. Proceed to /package. |
| >= target MCS - 10% | **NEEDS WORK** | Close but has specific gaps. List top 3 fixes. |
| < target MCS - 10% | **NOT READY** | Significant gaps remain. List all blocking failures. |

Always output the verdict prominently:
```
VERDICT: [READY / NEEDS WORK / NOT READY]
Score: {overall}% (target: {mcs_target}%)
Next steps:
1. {specific action}
2. {specific action}
3. {specific action}
```

Language must be direct — do not soften the message.

### FRONTMATTER COMPLETENESS CHECK (Stage 2 sub-check)

[SOURCE: loadSkillsDir.ts, frontmatterParser.ts, references/cc-platform-contract.md Section 2.1]

For products with primary .md files (skill, agent, squad, system, workflow, minds, design-system, application, output-style):
1. Read `product-dna/{type}.yaml` → `frontmatter.required[]` and `frontmatter.recommended[]`
2. Parse the product's primary file frontmatter
3. Check all required fields are present and non-empty
4. For recommended fields: report as coaching — "Consider adding `{field}` to frontmatter for {benefit}."
5. For `description`: warn if >200 chars — "Description is {N} chars. Only name + description + whenToUse are token-counted for the catalog. Keep descriptions concise for lower ambient cost. [SOURCE: loadSkillsDir.ts:100-105]"

Scoring: required field missing = integrity deduction. Recommended field missing = coaching only.

### AUTO-FIX RULES (--fix flag, CE-D13)

Auto-fix uses a **chain-of-strategies** pattern [inspired by CC compact: session→reactive→micro+traditional]:

**Strategy 1 — Structural fix (cheap, fast):**
- Add missing required files from template (README.md, references/ dir)
- Add missing required frontmatter fields with defaults
- Fix YAML/JSON formatting errors
- Add missing `## Compact Instructions` section from template

**Strategy 2 — Section scaffold (medium, non-destructive):**
- If Strategy 1 doesn't resolve all blocking issues
- Add empty sections with guidance comments from template
- Scaffold missing Quality Gate, Anti-Patterns sections

**Strategy 3 — Guided remediation (expensive, interactive):**
- If Strategy 1+2 don't resolve all blocking issues
- Present remaining issues as interactive questions
- Ask creator to fill specific missing content
- Use AskUserQuestion with 2-4 options per issue

Auto-fix NEVER:
- Modifies or deletes existing content
- Fills in domain-specific sections with AI-generated content
- Changes product logic or architecture
- Removes examples or exemplars

After auto-fix, re-run the same validation level and report the new score.

### TOKEN BUDGET REPORT (inspired by CC /doctor health checks)

[SOURCE: doctorContextWarnings.ts, loadSkillsDir.ts:100-105]

After all stages, compute and display a token budget summary:

```
Token Budget:
  Primary file:     {N} chars (~{N/4} tokens)  {if <4K: "✓ optimal" | if <40K: "⚠ large" | else: "✗ exceeds /doctor threshold"}
  References/:      {N} files, {total_chars} chars (loaded on-demand — zero ambient cost)
  Frontmatter:      {desc_chars} chars (~{desc_chars/4} tokens in catalog)
  Product type:     {type} — {if claude-md: "⚠ always in context (HIGH ambient cost)" | else: "loaded on invoke (zero ambient cost)"}
  Estimated buyer impact: {if claude-md: "~{chars/4} tokens per turn" | else: "~{desc_chars/4} tokens catalog + {primary_chars/4} tokens per invoke"}
```

This gives creators visibility into the REAL cost of their product to buyers — a differentiator no other framework provides.

### SANDBOX TEST

Sandbox testing is handled by the `/test` skill (separate worktree-isolated skill).
When the creator runs `/test`, it creates a worktree copy, installs the product,
runs 3 test scenarios (happy path, edge case, adversarial), and reports results.
The `/validate` skill focuses on structural + DNA checks; `/test` focuses on runtime behavior.

---

## Output Format

```
═══════════════════════════════════════════════
  MCS VALIDATION REPORT — {product-name} v{version}
═══════════════════════════════════════════════

  Quality: {UX tier name} ({score}%)
  # UX tier mapping (references/ux-vocabulary.md):
  #   MCS-1 (75-84%) → "Verified ✓"
  #   MCS-2 (85-100%) → "Premium ★★"  
  #   MCS-3 (92-100%) → "Elite ★★★"

  PASSED ({passed}/{total}):
  ✓ {check description}
  ✓ {check description}
  ...

  FAILED ({failed}/{total}):
  ✗ {check description} → {what was found}
    Fix: {specific, actionable instruction}
  ...

  {If baseline delta scored:}
  BASELINE DELTA: +{points} points vs Claude vanilla ({delta}% gaps addressed)
    Provenance: {research_backed} research-backed | {creator_knowledge} creator knowledge

  {If bundle composition checked:}
  COMPOSITION: {found}/{total} products verified, {gap_coverage}% gap coverage

  RECOMMENDATION: {one of the following}
    - "All checks passed. Ready for /publish." (score = 100)
    - "Fix {n} items to achieve MCS-{level}." (score < 100)
    - "Run /validate --fix for auto-remediation." (if fixable issues exist)
═══════════════════════════════════════════════
```

### GUIDED ITERATION (when failures exist)

After reporting failures, don't just list them — offer to help fix content issues.
This turns the validator from a reporter into a coach.

For each failed content check, generate a **domain-aware remediation draft** (presented as suggestion only — never auto-fill without explicit creator confirmation):

| Failed Check | Guided Fix |
|---|---|
| Missing anti-patterns section | Draft 3 anti-patterns based on the product's domain (read from .meta.yaml product.type + the product's content) |
| Fewer than 3 exemplars | Draft example scenarios based on the skill's "When to Use" section |
| No quality gate | Draft a quality gate based on the product's Core Instructions (what output should look like) |
| No edge case handling | Suggest 2 edge cases based on the product's scope boundaries |
| Placeholder content found | Show the specific placeholder and suggest domain-specific replacement |

Present as: "I found {N} content issues I can help draft fixes for. Want me to proceed?"

Rules:
- Only write to files if creator explicitly approves
- Show the draft before writing (creator can edit)
- This extends --fix behavior to content, not just structure
- Preserves CE-D13: non-destructive by default, creator controls what gets written

### BATCH VALIDATION (/validate --batch)

When `--batch` is invoked:

1. Glob `workspace/*/.meta.yaml` to find all products
2. For each product found:
   a. Read `.meta.yaml` for product.type and product.mcs_target
   b. Run MCS-1 validation (or target level from meta)
   c. Record: product slug, type, score, pass/fail, critical issues count
3. Output summary table:

```
═══════════════════════════════════════════════
  BATCH VALIDATION REPORT — {date}
═══════════════════════════════════════════════

  Products scanned: {N}

  | Product | Type     | MCS Target | Score | Status |
  |---------|----------|------------|-------|--------|
  | {slug}  | {type}   | MCS-{N}    | {N}/100 | PASS/FAIL |
  | ...     | ...      | ...        | ...   | ...    |

  Summary: {passed}/{total} products passing target MCS level

  Critical issues requiring attention:
  - {product}: {issue description}
  - ...
═══════════════════════════════════════════════
```

4. Update each product's `.meta.yaml` with validation result
5. Flag stale products (>30 days since last validation)

Batch mode runs MCS-1 by default. Use `--batch --level=2` for MCS-2 batch validation.

### PUBLISH PRE-FLIGHT (WP-12, WP-13)

Run automatically when `.publish/` directory exists (i.e., after `/package`). This is the final safety net before the CLI takes over.

**Check:** Does `vault.yaml` in `.publish/` contain all REQUIRED fields?

Required fields per WP-3:
- `name` — slug format, non-empty
- `version` — valid semver
- `type` — one of: skill, agent, squad, workflow, design-system, claude-md, application, system, bundle, statusline, hooks, minds
- `description` — non-empty, 10-500 chars
- `entry` — file path that exists in `.publish/`
- `license` — valid license identifier

If any required field is missing or invalid:
```
Pre-flight FAILED: vault.yaml is incomplete.
  Missing: {field1}, {field2}
  Fix vault.yaml in .publish/ before running myclaude publish.
```

If all required fields are present:
```
Pre-flight PASSED: vault.yaml has all required fields.
```

This check does NOT validate enrichment fields (display_name, mcs_level, tags, etc.) — those are optional and the CLI applies defaults for them.

---

Update `.meta.yaml` after validation:
```yaml
state:
  phase: "validated"                # only if all checks passed
  last_validated: "{YYYY-MM-DD}"
  last_validation_score: {overall_score}
  dna_compliance:
    tier1: {score}
    tier2: {score}
    tier3: {score or null}
  overall_score: {score}
  score_history:                    # APPEND — never overwrite previous entries
    - date: "{YYYY-MM-DD}"
      score: {overall_score}
      delta: {score - previous_score}  # null if first entry
      level: {mcs_level_attempted}
```

Update `STATE.yaml` after validation (project root):
```yaml
mcs_results:
  {slug}:
    level: {mcs_level_attempted}
    overall_score: {overall_score}
    structural_score: {structural_score}
    integrity_score: {integrity_score}
    dna_score: {dna_score}
    tier1_pass: {true/false}
    tier2_pass: {true/false}
    tier3_pass: {true/false/null}
    failures: [{pattern: "D2", check: "anti-patterns count <5"}]
    validated_at: "{ISO-8601}"
```

**Score trajectory**: When score_history has 2+ entries, include trajectory in the validation report:
```
Score trajectory: {previous_score}% → {current_score}% ({delta:+N}%)
```
This gives creators visible progress feedback — one of the most motivating signals in any quality system.

### PERSONA-AWARE OUTPUT RENDERING (UX-first for ALL personas)

**CRITICAL: Load `references/ux-vocabulary.md` before rendering ANY output.** The Engine speaks human to creators, not engineer. This applies to ALL profile types — developers included. Technical details are available but never lead.

**Primary output (shown to ALL creators regardless of profile.type):**

```
┌─────────────────────────────────────────────┐
│  ✦ {product_name}                           │
│  Quality: {tier_name} {stars}  ({score}%)   │
│                                              │
│  {If score >= 85:                           │
│    "Your product is premium quality.        │
│     It fills real expertise gaps that        │
│     Claude doesn't cover on its own."}      │
│  {If score >= 75 and < 85:                  │
│    "Your product is verified and working.   │
│     A few improvements would make it        │
│     premium:"}                               │
│  {If score < 75:                            │
│    "Almost there. {N} things to address:"}  │
│                                              │
│  {For each failure, in plain language:}      │
│    → {human_description}                     │
│                                              │
│  {If baseline delta:}                        │
│  📊 Fills {gaps_addressed} knowledge gaps    │
│     Claude doesn't cover (+{points} depth)  │
│                                              │
│  {If value intelligence:}                    │
│  💰 Suggested: ${min}-${max}                │
│                                              │
│  Next: {next_pipeline_step}                  │
└─────────────────────────────────────────────┘
```

**UX tier mapping (from references/ux-vocabulary.md):**
- Score 75-84% → "Verified ✓" — "Tested and working."
- Score 85-91% → "Premium ★★" — "Deep expertise. Genuine knowledge."
- Score 92-100% → "Elite ★★★" — "Best in class."

**Technical details (shown AFTER the primary output, clearly labeled):**

```
Technical details (for builders):
  MCS-{level}: {score}% = DNA {dna}% × 0.50 + Structure {struct}% × 0.30 + Integrity {integ}% × 0.20
  Stages: {passed}/{total} passed | Substance: {substance}/100 | Fidelity: {fidelity}%
  {expand per-stage details on request}
```

**Plain-language translations for common failures:**
- D1 missing → "Your product doesn't tell Claude what to load before starting. Add a 'What This Loads' section."
- D2 insufficient → "Add more examples of what your product should NEVER do (at least 5)."
- D4 missing → "Add a quality checklist — how do you know the output is good?"
- D5 missing → "Great products ask questions before answering. Add a 'Questions This Always Asks' section."
- D6 missing → "Show confidence levels in your outputs — 'I'm 80% confident because...' builds trust."
- D13 missing → "Your README needs a clear explanation of what this does and how to install it."
- D14 missing → "Document what happens when something goes wrong or input is unclear."
- Compact Instructions missing → "Add a '## Compact Instructions' section so your product survives long sessions."
- Substance low → "Your content could be replicated by a generic prompt. Add real examples, contrarian insights, or domain-specific patterns that only an expert would know."

This rendering layer changes ONLY the output format. The scoring engine, gate logic, and state updates remain identical for all personas.

---

## Quality Gate

The Validator skill itself passes if:
- It correctly identifies product type from `.meta.yaml` or file structure
- It runs all checks appropriate for the requested MCS level
- Every failed check includes a specific, actionable fix instruction (not generic advice)
- Score calculation is accurate: `passed / total * 100`
- `.meta.yaml` is updated after every validation run
- `--fix` never modifies content that the creator wrote

---

## Decision Notes

> **Note:** CE-D references are from Creator Engine v1.1.0. SE-D references are from Studio Engine v2.0 PRD. Updated for Studio Engine v3.0.0.

**CE-D13:** Validation is non-destructive by default. `--fix` has a conservative scope: structural and formatting only. Protecting existing creator content is more important than perfect automation.

**Why stop at first failing stage:** A product with broken file structure cannot be meaningfully content-validated. Stopping early gives the creator the clearest, most actionable feedback instead of a flood of cascading errors.

**CE-D21:** Progressive validation — each level builds on the previous. This means a product that passes MCS-2 is guaranteed to have also passed MCS-1. Levels cannot be skipped.

**CE-D9 (Anti-Commodity Gate):** Runs only at MCS-2+, as MCS-1 is the minimum publishable bar without differentiation requirements. Commodity products at MCS-1 are acceptable; at MCS-2+ they are not.

**Stage 7b (Baseline Delta):** No other product validation system quantifies the delta between an LLM's baseline knowledge and the product's contribution. This closes the value proof loop: /scout measures what Claude knows → /create + /fill build what's missing → /validate proves the gap was filled. Three design choices: (1) severity-weighted scoring prevents gaming via minor-gap-stuffing, (2) density checks prevent keyword-stuffing without substance, (3) research provenance tracking distinguishes externally-verified knowledge from unverified creator claims. The epistemic caveat (simulated baseline) is declared, not hidden — honest measurement beats precise-looking fabrication.

**Stage 7c (Composition Check):** Bundles are curated collections, and curation quality is invisible without a check. The scout coherence sub-check verifies the bundle fulfills the scout's original recommendation — closing the loop from intelligence gathering to validated delivery. Advisory-only because bundle curation is a creative decision; the Engine coaches, never blocks creative choices.
