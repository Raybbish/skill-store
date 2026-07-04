# Fill Protocol — Detail Reference

Loaded by `/fill` SKILL.md when executing section walk and extraction phases.

---

## DISCOVERY PHASE (before section walk)

Before walking sections, front-load ambiguity resolution with 3 questions:

1. **"Who is this for?"** — Target audience and their skill level.
2. **"What's the one thing this does that nothing else does?"** — Core differentiator.
3. **"Walk me through a real scenario where someone would use this."** — Concrete use case.

Store answers in `.meta.yaml` under `creator_intent:`:
```yaml
creator_intent:
  target_audience: "{answer}"
  differentiator: "{answer}"
  primary_use_case: "{answer}"
```

If domain-map.md exists, pre-fill these from the map and ask the creator to confirm or refine.

Only proceed to section walk after all 3 are answered. This prevents rework from discovering ambiguity mid-fill.

---

## ACCEPTANCE CRITERIA CAPTURE (after discovery, before section walk)

Based on the discovery answers, define 3 acceptance criteria that will be machine-verified by /validate:

1. **Truth**: One observable behavior from the user's perspective
   Example: "Running /my-skill produces a formatted report"
2. **Artifact**: One file that must exist with substantive content
   Example: "references/patterns.md exists and has >50 lines"
3. **Key Link**: One critical connection between files
   Example: "SKILL.md references references/ at least twice"

Write these to `.meta.yaml` under `acceptance_criteria:`. They become validation targets in /validate Stage 2.

---

## EXTRACTION MODE SELECTION (MCS-2+, after discovery, before section walk)

**MCS-1:** Standard mode only (section walk + light coaching). Skip this step.

**MCS-2:** Standard mode + mandatory sparring. No menu needed — sparring is always on.

**MCS-3:** Offer extraction mode menu via AskUserQuestion:
```
Your product targets MCS-3 (expert grade). Choose an extraction approach:

  1. Standard     — Section walk with research injection + sparring
  2. Socratic     — I challenge every claim. "Why?" "How do you know?" "What if you're wrong?"
  3. Adversarial  — I play your competitor. "Why would someone choose X over your product?"
  4. Archaeological — Layer by layer. Surface knowledge first, then dig deeper each pass.
  5. Council      — 3 expert lenses examine each section (practitioner, skeptic, buyer)
```

**Mode behaviors:**
- **Socratic:** After each section, ask 3 "why" questions that force the creator to justify their choices. Accept nothing at face value. Goal: uncover the reasoning BEHIND the content, which is often more valuable than the content itself.
- **Adversarial:** After each section, argue against it from a competitor's perspective. "Product X does this differently because..." Forces the creator to articulate defensible positions.
- **Archaeological:** Run the section walker twice. First pass: surface-level answers. Second pass: "Now go deeper. What did you leave out? What's the nuance?" Each pass builds on the previous.
- **Council:** For each major section, generate 3 perspectives: (1) Practitioner: "Does this actually work in production?" (2) Skeptic: "What's the weakest assumption here?" (3) Buyer: "Would I pay for this?" Synthesize all three into the final content.

**Mode recommendation by product type:**
| Product type | Recommended mode | Why |
|-------------|-----------------|-----|
| skill, workflow, hooks | Standard or Socratic | Single-purpose — challenge each claim for depth |
| agent, minds | Adversarial | Advisory products need defensible positions |
| squad | Council | Multi-perspective products benefit from multi-lens extraction |
| system, bundle | Archaeological | Complex compositions need layer-by-layer discovery |
| claude-md, design-system | Socratic | Rule systems need justified constraints |
| application, statusline, output-style | Standard | Execution-focused — depth comes from examples |

Show recommendation but let the creator override. Their domain intuition may suggest a different mode.

Selected mode persists in `.meta.yaml`:
```yaml
fill_config:
  extraction_mode: "{standard|socratic|adversarial|archaeological|council}"
```

---

## PITFALL CHECK (before section walk)

Read `meta/pitfalls/pitfalls.json` if it exists. For each pitfall relevant to this product type (match by `type` field), surface as a coaching nudge before filling starts:

```
Heads up — common issues for {type} products:
  - {pitfall.description} (seen {pitfall.occurrences}x, confidence: {pitfall.confidence})
```

Skip if no pitfalls match.

---

## INTENT-AWARE CALIBRATION (runs before type coaching)

**Purpose.** Tune the section walker, the tone, and the question shape to the product's
declared nature before filling starts. A cognitive mind needs different questions than a
procedural skill, even if both are "skills" at the frontmatter layer. This phase reads the
`intent_declaration` block persisted by `/create` Step 11 and makes the section walker
speak the language of the specific cognition being built.

**Precondition.** `.meta.yaml → intent_declaration` is present AND
`intent_declaration.mode ∈ {express, guided}`. When the mode is `legacy_fallback` OR the
block is absent, skip this phase entirely and run with type-based defaults (the pre-Wave-4
behavior). Emit the advisory note defined in SKILL.md step 2.

**Inputs read:**
```yaml
intent_declaration:
  engine_parsed:
    depth: procedural | advisory | cognitive     # drives section roster + question type
    nature: executor | advisor | orchestrator | observer  # drives tone + voice
    delivery_mechanism: invoked_slash_command | invoked_task_spawn | ambient_constitutional | ambient_path_scoped | reflex_hook_binding | composed_system  # drives continuity awareness
  matched_cell: null | <cell_id>                  # cross-reference for coaching examples
```

### Calibration Axis 1 — Section Roster by Depth

Different depths need different sections emphasized during the walk. The section roster
below **extends** the default SECTION PRIORITY ORDER; it does not replace it. Every section
in the default roster still fires — but depth-specific sections are walked with additional
rigor, and depth-irrelevant sections are walked lightly.

| depth | Sections emphasized (walked with full sparring + elicitation) | Sections walked lightly |
|---|---|---|
| **procedural** | Identity, Activation Protocol, Core Instructions (step-by-step), Quality Gate (checkable criteria), Examples (3+ concrete), Edge Cases | Persona, Knowledge boundaries, Cognitive flow |
| **advisory** | Identity, Persona (bounded), Core Judgment Rules, Confidence Signaling, Anti-Patterns, Examples (realistic judgment calls) | Step-by-step execution, Cognitive layers |
| **cognitive** | Identity + Singularity Markers (≥3 concrete), Cognitive Flow (3-6 steps), Reasoning Patterns (≥3 with triggers), Knowledge Boundaries (explicit not-knowing), Examples (mapping patterns to outputs) | Quality Gate stays, but the walker prompts for reasoning gates specifically |

**For cognitive depth:** walk the 5 references in canonical order —
`cognitive-core.md → personality.md → knowledge-base.md → reasoning-engine.md → examples.md`
— prompting for the C1-C7 cognitive DNA strands per `product-dna/minds.yaml → cognitive_dna_strands`
rubric. The section walker elevates cognitive architecture prompts to front-of-queue; the
creator is asked for singularity markers BEFORE being asked for examples, because examples
without singularity markers become generic.

### Calibration Axis 2 — Tone and Voice by Nature

The creator-facing prose embedded in each section adopts a voice matching the product's
nature. This is not cosmetic — the voice IS the contract between the product and its
eventual invoker. A skill that promises to execute but speaks like an advisor will confuse
the invoker at runtime.

| nature | Voice register | Example question framing | Example output framing |
|---|---|---|---|
| **executor** | Imperative, active, present tense. "This skill DOES X." | *"When someone runs this skill, what happens — step by step?"* | Reports done actions: "Applied X. Produced Y. Done." |
| **advisor** | Judgmental, conditional. "This mind RECOMMENDS X when Y." | *"What's your judgment rule here? When do you choose X over Y?"* | Reports judgments: "Verdict: X. Confidence: moderate. Rationale: ..." |
| **orchestrator** | Routing, sequential. "This coordinates X → Y → Z." | *"How do the pieces hand off? What data crosses the boundary between them?"* | Reports routing: "Delegated to A → received B → routed to C." |
| **observer** | Passive, ambient. "This watches for X and surfaces Y." | *"When should this fire automatically? What's the trigger?"* | Reports observations: "Detected X at {time}. Flagged because Y." |

**Implementation.** During the SECTION WALKER, when composing creator questions for each
section, select the framing column matching `nature`. When proposing section content
(research-injection mode, inline WebSearch mode, or domain-map derivation), frame the
proposed text in the matching voice. When showing quality signals, use the nature-aligned
output framing.

### Calibration Axis 3 — Continuity Awareness by Delivery Mechanism

`delivery_mechanism` tells the walker how the product lives in a creator's session. This
affects two concrete things: (a) whether the primary file needs to be ruthlessly compact,
and (b) whether the Compact Instructions section matters.

| delivery_mechanism | Primary file size target | Compact Instructions emphasis |
|---|---|---|
| `ambient_constitutional` (CLAUDE.md) | **<4K chars** (best practice — always loaded) | **Mandatory full** — survives session restart and `/compact` |
| `ambient_path_scoped` (design-system, statusline, etc.) | <6K chars | Mandatory light — scoped loading means moderate compact risk |
| `invoked_slash_command` (skill, workflow) | <8K chars | Mandatory — session compaction may fire mid-use |
| `invoked_task_spawn` (agent, minds, squad) | <12K chars | Optional — fork context discards post-return anyway |
| `reflex_hook_binding` (hooks) | <3K chars | Not applicable — hooks are event-triggered, no session context |
| `composed_system` (system, bundle) | <5K chars primary + deep references/ | Mandatory — multi-component coordination needs compact survival |

**Implementation.** The INSTRUCTION SIZE OPTIMIZATION phase (later in this protocol) uses
the size target above. Auto-split triggers based on the delivery-mechanism-specific budget,
not a single uniform threshold. The walker also surfaces a coaching line at the Compact
Instructions section whose emphasis matches the table above — for `ambient_constitutional`
products the walker refuses to proceed until Compact Instructions are substantive.

### Section Priority Order — Calibrated by depth + nature

The default SECTION PRIORITY ORDER (later in this file) is replaced by the calibrated order
below when intent-aware calibration fires. The default order is a neutral fallback; the
calibrated order is what the creator actually experiences when `/create` recorded an intent.

**depth=procedural + nature=executor** (procedural skill, workflow):
1. Identity / Purpose
2. Activation Protocol (what triggers this, what's loaded)
3. Core Instructions (step-by-step, imperative)
4. Quality Gate (checkable criteria, never aspirational)
5. Examples (3+ concrete input→output)
6. Anti-Patterns (specific failure modes)
7. Edge Cases / Graceful Degradation
8. References / Knowledge
9. Compact Instructions

**depth=advisory + nature=advisor** (advisory skill, minds advisory, agent):
1. Identity / Purpose
2. Persona (bounded — what this advises on, what it does NOT advise on)
3. Core Judgment Rules (how it decides)
4. Confidence Signaling (how uncertainty is surfaced)
5. Anti-Patterns (specific advisory failure modes — over-confidence, scope creep, etc.)
6. Examples (realistic judgment calls with reasoning)
7. Knowledge Boundaries (what the advisor does NOT know)
8. Activation Protocol
9. Compact Instructions

**depth=cognitive + nature=advisor** (apex_cognitive_mind cell):
1. Identity + Singularity Markers (≥3 concrete — this is the load-bearing section)
2. Cognitive Flow (3-6 ordered steps)
3. Reasoning Patterns (≥3 with named triggers)
4. Knowledge Base + Boundaries
5. Personality / Behavioral Matrix
6. Activation Protocol
7. Examples (mapping reasoning patterns to outputs)
8. Quality Gate
9. Anti-Patterns
10. Compact Instructions
(+ full 5-layer reference file walk in canonical order)

**depth=procedural + nature=orchestrator** (squad, system, workflow with routing):
1. Identity / Purpose
2. Component Roster (which sub-parts compose this)
3. Routing Logic (who decides which component fires)
4. Handoff Specification (what data crosses boundaries)
5. Activation Protocol
6. Quality Gate (per component + composed)
7. Examples (end-to-end scenarios)
8. Anti-Patterns
9. Compact Instructions

**nature=observer** (hooks, claude-md, statusline, output-style):
1. Identity / Purpose
2. Trigger / Event Surface (what causes this to fire)
3. Observation Logic (what to notice)
4. Reporting Rules (how to surface)
5. Anti-Patterns (false positives, noise, silence)
6. Examples (trigger → observation → report)
7. Activation Protocol
8. Compact Instructions

### Calibration Telemetry (written to .meta.yaml)

Record the calibration decision in `.meta.yaml` so downstream tools (/validate, /status)
and future sessions can audit:

```yaml
fill_config:
  intent_aware: true                          # false if fallback path
  calibration:
    depth: procedural | advisory | cognitive | null
    nature: executor | advisor | orchestrator | observer | null
    delivery_mechanism: <enum value> | null
    section_priority_used: "procedural_executor | advisory_advisor | cognitive_advisor | procedural_orchestrator | observer_generic | default_fallback"
    size_budget_chars: <integer from table above>
    compact_instructions_severity: "mandatory_full | mandatory_light | mandatory | optional | not_applicable"
```

`/validate` Stage 0 reads `fill_config.intent_aware` and `fill_config.calibration` as part
of drift detection: if the filled content drifted from the calibration (e.g., a cognitive
mind whose singularity markers section is empty), Stage 0 surfaces the drift as advisory
coaching, never blocking.

---

## TYPE-SPECIFIC COACHING (before section walk)

### If type=claude-md [SOURCE: claudemd.ts:9-10, :89-90, :254-268, cc-platform-contract.md §1.5, §1.7, §3.5]

Coach these 5 platform principles before filling starts:

1. **Scoping question:** "Should these rules apply to ALL files, or only specific file types?"
   If the creator specifies a scope, guide them to add `paths:` frontmatter:
   ```yaml
   ---
   paths:
     - {their_pattern}
   ---
   ```
   "With path scoping, your rules only load when the user works on matching files — zero token cost otherwise."

2. **Attention-position coaching:** "Put your most critical constraints at the END of the file — Claude pays more attention to content positioned last. Structure: background context first, critical rules last."

3. **Directive voice coaching:** "Claude Code wraps your rules with an override declaration: 'These instructions OVERRIDE any default behavior.' Write 'always use X' not 'consider using X'."

4. **Cost awareness:** "Every character in a claude-md product costs tokens EVERY turn of EVERY session. Be ruthless about size. Move detailed explanations to references/. The Engine will automatically suggest @include decomposition if your file grows beyond 3.5K chars during filling."

5. **Compilation model:** "Your product is compiled once at session start and cached. Mid-session changes need /clear or a new session to take effect."

6. **Content structure guidance:** "Production CLAUDE.md files follow a common pattern. Consider these sections:
   - Pre-Coding rules (clarify, draft approach before writing)
   - While-Coding standards (naming, composition, TDD flow, style)
   - Testing expectations (colocated tests, assertion strength, coverage)
   - Code Organization (shared code rules, module boundaries)
   - Tooling Gates (linter, type checker, formatter commands to run)
   - Git Conventions (commit format, branch naming, PR rules)
   - Shortcuts (mnemonics for common workflows — QNEW, QPLAN, QCODE, QCHECK)
   Not all sections apply to every domain — pick the relevant ones."

### If type=minds [SOURCE: cc-platform-contract.md §2.1]

Coach on `model` frontmatter: "What kind of thinking does this mind do? For deep analysis, use `model: opus`. For fluent conversation, `model: sonnet` is faster and cheaper."

### If type=hooks [SOURCE: cc-platform-contract.md §4.2, §5.1]

Coach these 5 platform principles before filling starts:

1. **Trust layer:** "Hook products install to .claude/settings.local.json (a TRUSTED source). Never install hooks to .claude/settings.json — permissions set there are silently ignored for security reasons."

2. **Fire-once semantics:** "SessionStart and Setup hooks fire ONCE per session. Don't design handlers that expect repeated firing — use FileChanged or PostToolUse for recurring behavior."

3. **Always-emitted vs opt-in:** "SessionStart and Setup are always-emitted (fire without opt-in). All other events require explicit configuration in the hooks config."

4. **Security-critical: PreToolUse is the ONLY blocking gate.** "Of 17 lifecycle events, only PreToolUse can block tool execution before it happens. PostToolUse observes AFTER the fact — it cannot undo. Design safety-critical hooks as PreToolUse handlers. Pattern:"
   ```json
   {
     "hooks": {
       "PreToolUse": [{
         "matcher": "Bash",
         "hooks": [{
           "type": "command",
           "command": "echo '$TOOL_INPUT' | grep -qE 'rm -rf|git push --force' && exit 2 || exit 0",
           "timeout": 5
         }]
       }]
     }
   }
   ```
   "Exit code 0 = allow. Exit code 2 = BLOCK. Any other code = warn but allow."

5. **Hook security hygiene:** "Avoid: shell injection (;, &&, backticks), eval/source commands, curl|sh or wget|sh patterns, base64 decode-execute, unquoted pipes. /validate Stage 2 runs these checks automatically."

6. **The 17 lifecycle events:** SessionStart, Setup (fire once, always-emitted) | PreToolUse (BLOCKING), PostToolUse, PostToolUseFailure | UserPromptSubmit | SubagentStart | Notification | PermissionRequest, PermissionDenied | Elicitation, ElicitationResult | CwdChanged, FileChanged, WorktreeCreate | Stop. Only PreToolUse blocks. All others are observational.

### If type=skill or type=agent [SOURCE: competitive-intelligence S97, references/quality/known-threats.yaml]

Coach these 3 security principles before filling starts:

1. **Supply chain reality:** "36.82% of skills on public registries have documented security flaws. 1,184+ confirmed malicious skills exist (clawhub-*, solana-*, phantom-*, youtube-summarize-*). Document every external dependency: name, author, pinned version, and why it's needed."

2. **MCP server vetting:** "The MCP protocol has 70+ documented CVEs. Before referencing any MCP server, verify: (a) author has public identity, (b) repo has recent commits, (c) no open security issues, (d) pinned exact version. /validate will scan against the known-threats registry automatically."

3. **Dangerous patterns to avoid:** "Your product code will be scanned for: eval(), curl|sh, base64 decode-execute, shell:true spawn, and known malicious IPs/domains. Products with unresolved CRITICAL flags cannot be published."

### If type=system or type=bundle [SOURCE: claudemd.ts:537, :667-670]

Coach on @include constraints and isolation before filling starts:

1. **Depth limit:** "If your system uses @include, keep the tree shallow. Claude Code's hard limit is 5 levels — files at depth 6+ are silently ignored (no error, no warning)."

2. **External @include friction:** "If any @include points outside the product directory (absolute path or ~/), the buyer will see an approval prompt when first loading. Consider copying referenced files into your product's references/ directory instead."

3. **Context isolation principle:** "Each sub-agent operates behind a complete context firewall — it cannot read the parent conversation, parent tool results, or parent state. Only text returns cross the boundary. Design handoffs as explicit data payloads, not shared state."

4. **Token budget awareness:** "Your system's total context is ~140-150K usable tokens of 200K. Budget allocation: ~15% for summary/state preservation, ~40% for inline context, ~10% for verification/quality checks, rest for tool results and response. Structure so detailed knowledge lives in references/ (loaded on-demand). Primary file should be routing + boot logic only. Auto-compaction triggers at 75-92% — your Compact Instructions section determines what survives. If your system has 3+ components, add a continue-here checkpoint at ~70% capacity."

---

## SECTION WALKER

For each section in the primary file (SKILL.md, AGENT.md, etc.):

1. **Read the WHY comment** — understand what this section needs
2. **Check if content exists** — skip sections already filled (ask: "This section has content. Enhance, replace, or skip?")
   **Backup before overwrite:** If creator chooses "replace", save the current content to `.meta.yaml → fill_backup.{section_name}` before writing new content. This ensures no work is ever lost (Safety value #2).
3. **Research injection (if scout report loaded):**
   - Match the current section to relevant gaps and research findings from the scout report
   - PROPOSE content based on research: "Based on research, here's what I'd write for this section:"
   - Show the proposed content with source citations
   - Ask creator: "Validate this? Adjust? Replace with your own version?"
   - KEY PARADIGM SHIFT: creator VALIDATES research-backed proposals instead of creating from zero
   - If creator adjusts/replaces, their version wins — research is a starting point, not a constraint
4. **If NO scout report:** Check if WebSearch tool is available:
   a. **If WebSearch available AND section is domain-specific** (not structural sections like Activation Protocol or Quality Gate):
      - Offer: "I can research '{section_topic}' right now — 2-3 searches for current best practices. Want me to?"
      - If YES: run 2-3 targeted WebSearch queries, synthesize top findings, propose content with source URLs
      - If NO: fall through to creator knowledge mode (4b)
      - Record: `fill_config.inline_research_used: true` in .meta.yaml
   b. **Creator knowledge mode:** Ask the creator a targeted question based on: the WHY comment's guidance, the product spec requirements, the domain-map.md context (if available), and the pitfall registry warnings (if any match this section)
5. **Write the answer** into the section, formatted per the template structure
6. **Show what was written** — let creator approve or edit
7. **Section quality signal** — after writing, give a quick quality read:
   ```
   Section quality: {STRONG / OK / THIN}
   {If THIN: "This section could use more depth. Want to expand, or move on?"}
   ```
   Strong: >100 words with domain-specific content. OK: 50-100 words. Thin: <50 words or generic.

---

## QUESTION STRATEGY

Adapt questions to creator's technical level (from creator.yaml):

- **Beginner:** "In simple terms, what should happen when someone uses this?"
- **Intermediate:** "What specific logic or steps should this section implement?"
- **Expert:** "What's your decision architecture for this? Any edge cases I should encode?"

---

## SECTION PRIORITY ORDER

Fill sections in this order (most important first):
1. Identity / Purpose (what it is)
2. Activation Protocol (how it starts)
3. Core Instructions (what it does)
4. Quality Gate (how to verify output)
5. Anti-Patterns (what to avoid)
6. References / Knowledge (domain expertise)
7. Examples (demonstrations)
8. Edge cases / Degradation (failure modes)

---

## SPARRING PROTOCOL (mandatory for MCS-2+, after each major section)

The Engine is not a form — it's a cognitive partner. After each major section is written, CHALLENGE the content before moving on. This is what separates a product worth buying from one a buyer could generate themselves.

**Sparring sequence (run EXACTLY 3 challenges per major section):**

1. **The Generic Test:** Read what was just written. Could Claude produce this output with ZERO product installed — just from a direct prompt?
   - **If scout report loaded:** Show the baseline side-by-side. Extract Section 1 ("Baseline — What Claude Knows") from the scout report, find the paragraph most relevant to the current section. Display: "Here's what Claude says WITHOUT your product: [relevant baseline excerpt]. Here's what YOUR product says: [section content]. Is there a clear delta? If the buyer can't see the difference, we need to go deeper."
   - **If no scout report:** "This reads like something Claude already knows. What do YOU know about this that Claude doesn't? Give me a specific example from your experience — a case, a surprise, a mistake you made."

2. **The Inversion:** Take the core claim of the section and invert it. "You said X works. When does X FAIL? When should the buyer do the opposite of what you're recommending?" Write the answer into the section as a nuance/caveat.

3. **The Proof:** "Give me ONE real example — a specific situation, client, project, or decision — where this framework changed the outcome. Not a hypothetical. A real one." If the creator says they don't have one, note it and move on — but flag in .meta.yaml as `sparring.unproven_sections[]`.

**Sparring rules:**
- NEVER skip sparring for MCS-2+ products. Structure without substance = latão polido.
- For MCS-1 products, sparring is coaching (optional). For MCS-2+, it's mandatory and results are tracked in .meta.yaml.
- If the creator pushes back ("just fill it"), respect it — but record `sparring.skipped: true` in .meta.yaml. /validate Stage 7 will reference this.
- Goal: extract the 20% of creator knowledge that is GENUINELY unique and can't be found in training data.

**Sparring state tracking (.meta.yaml):**
```yaml
sparring:
  sections_challenged: {N}
  real_examples_provided: {N}
  unproven_sections: ["{section_name}"]
  skipped: false
```

---

## MID-FILL BRAINSTORM

During section walk, if the creator hesitates or says "I'm not sure", "I don't know", "not certain", or similar uncertainty signals:
- Offer: "Want to brainstorm this? Describe what you're thinking and I'll help shape it before we commit to the section."
- If yes: switch to collaborative mode — ask targeted questions, propose options, let creator pick direction
- If no: skip the section and mark as `[deferred]` in fill_progress
- Record: `fill_progress.deferred_sections: ["{section_name}"]` in .meta.yaml
This ensures creators never feel stuck — the Engine adapts to their knowledge boundaries.

---

## ELICITATION DEEPENING (after each major section)

After filling each major section (Identity, Core Instructions, Quality Gate), offer 3 contextually-selected deepening methods:

| Method | Angle | When to Suggest |
|--------|-------|-----------------|
| **Pre-mortem** | "Assume this skill fails completely. What went wrong?" | After Core Instructions |
| **Inversion** | "How would a competitor make this product useless?" | After Identity/Purpose |
| **Red Team** | "What assumption here would kill this product if wrong?" | After Quality Gate |
| **First Principles** | "Strip all assumptions. What MUST be true for this to work?" | After any section with inherited constraints |
| **Stakeholder Lens** | "How would a [beginner/expert/non-dev] experience this?" | After any section, especially for multi-persona products |

Present the top 3 relevant methods as a menu. The creator selects one (or skips). Apply the selected method to deepen the section content. This is optional — never blocking.

---

## MID-FILL STATE PERSISTENCE (compact-safe checkpointing)

After EACH section is written to the product file, immediately update `.meta.yaml`:

```yaml
fill_progress:
  last_completed_section: "{section_name}"
  sections_filled: {N}
  sections_total: {total}
  timestamp: "{ISO timestamp}"
```

**Why this matters:** If context compacts mid-fill (long sessions, ~167K tokens for 200K model), the section walker position is lost. Without this checkpoint, compaction restarts the walker from section 1 — the creator re-answers questions for already-filled sections. With this checkpoint, on skill re-activation after compact, read `fill_progress.last_completed_section` and RESUME from the NEXT section. [SOURCE: autoCompact.ts:63-70]

**On activation:** Check if `.meta.yaml` has `fill_progress`. If present AND the referenced section exists in the primary file with substantive content (>50 words), display: "Resuming from where you left off — next section: {next_section_name}." Skip already-filled sections.

---

## PROGRESS TRACKER (during section walk)

After every 2-3 sections filled, show a progress pulse:

```
Progress: {filled}/{total} sections ({percentage}%)
Estimated MCS: ~{estimate}% {if >75: "(on track for MCS-1)" | if >85: "(on track for MCS-2!)"}
{If milestone: "Nice — core identity locked in." or "Halfway there." or "Home stretch."}
```

**MCS estimate calculation** (lightweight, not full /validate):
- Count filled sections with substantive content (>50 words) → structural estimate
- Check D1 (activation protocol exists?), D2 (anti-patterns count), D4 (quality gate exists?) → DNA estimate
- `estimate = (dna_quick × 0.50) + (structural_quick × 0.30) + (integrity_quick × 0.20)` where integrity_quick = 100 if no placeholders in filled sections, 50 if some remain, 0 if primary file has TODO/PLACEHOLDER patterns

Accuracy: ~85% of actual MCS score.

---

## CONVERSATIONAL MODE (non-dev creators)

If `creator.yaml` → `profile.type` is `domain-expert`, `marketer`, `operator`, OR (`hybrid` AND `technical_level` is `beginner` or `intermediate`):

Switch from section-by-section walk to **narrative extraction**:

1. Ask: "Tell me about your [domain]. What problems do your users face?"
2. Listen for key concepts, then map them to product sections
3. "Based on what you described, here's how I'd structure the [section name]..."
4. Show draft → get confirmation → write

The creator never sees raw DNA pattern IDs (D1, D2...). They tell their story; the engine maps it to structure.

**Transparency rule for acceptance criteria:** Even in conversational mode, if acceptance_criteria have been defined (in .meta.yaml), the creator MUST be shown which sections map to which criteria. Display as: "Your goal '{criterion}' maps to the '{section_name}' section. Let's make sure it's solid."

---

## INSTRUCTION SIZE OPTIMIZATION

[SOURCE: claudemd.ts:92, doctorContextWarnings.ts:44-47]

After each section is filled, check primary file character count:
- If chars > 3,500 (approaching best-practice limit): "Primary file is at {N} chars (recommended: <4,000 for optimal CC performance). The next section should go in references/ to keep the primary file lean."
- If chars > 4,000 (over best practice): "Primary file is {N} chars (best practice: <4,000). Moving the '{last_section}' section to references/{section_slug}.md and adding a reference link in the primary file." Then: Create `references/{section_slug}.md` with the overflow content. In primary file, replace the section with: `See references/{section_slug}.md for {section_name} details.`
- This auto-split is a quality optimization, not a hard cap. CC has no 4K truncation — but shorter primary files = better model attention and context efficiency. The /doctor warning threshold is 40K chars per file.

**@include alternative for claude-md products:** [SOURCE: claudemd.ts:451-469]
If type=claude-md AND primary file exceeds 3,500 chars, suggest @include as an alternative to auto-split:
"Your rules file is {N} chars. Since claude-md products are always in context, consider using @include to compose from smaller files:
```
@./rules/tone-rules.md
@./rules/formatting-rules.md
@./rules/anti-patterns.md
```
This keeps the primary file as a lightweight manifest while loading detailed rules on-demand. Each @included file is loaded as a separate memory entry."
Note: @include works in any memory file (.claude/rules/, CLAUDE.md). Non-existent files are silently ignored. Circular references are prevented.

---

## AFTER ALL SECTIONS FILLED

1. Update `.meta.yaml`:
   ```yaml
   state:
     phase: "content"
   ```

2. **Auto-validate (MCS-1 silent):** Run Stages 1-3 of /validate silently (structural + integrity + DNA Tier 1). Do NOT ask the creator to run /validate separately — this is the Engine conducting the pipeline. Display inline:
   ```
   Auto-check: {passed}/{total} structural checks passed. Score: ~{estimate}%
   {If all pass: "MCS-1 READY — run /package when you're satisfied, or /validate --level=2 for deeper review."}
   {If blocking failures: "Found {N} issues to fix:" + top 3 failures with instructions + "Run /validate --fix for auto-remediation."}
   ```
   Update `.meta.yaml` with auto-validate results (same schema as /validate). If MCS-1 passes, promote state to "validated" automatically. If MCS-1 fails, keep state as "content".

3. **Final MCS estimate:**
   ```
   Content filled! {slug} promoted to "content" state.

   Sections filled: {N}/{total}
   Section quality: {strong_count} strong, {ok_count} ok, {thin_count} thin
   Estimated MCS: ~{estimate}%
   Placeholder content remaining: {count}

   {If estimate >= 75: "Looking good — run /validate for the official score."}
   {If estimate < 75: "Some sections could use more depth. Run /validate --fix for guided remediation."}
   ```

4. **Persona-aware completion message** — read `creator.yaml` → `profile.type`:

   **If marketer/domain-expert/operator:**
   ```
   Your {product_type} is filled and ready for quality check.

   What you built: {one-line description from frontmatter}
   What happens next: /validate checks quality → /package bundles it → /publish ships it

   Type /validate to continue.
   ```

   **If developer/prompt-engineer:**
   ```
   {slug} promoted to "content". Run /validate [--level 2] for scored report.
   ```

5. **Clear `.meta.yaml` fill_progress** — remove `fill_progress` section since filling is complete. This prevents stale resume data on future /fill invocations.
