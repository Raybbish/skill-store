---
name: review
user-invocable: false
description: "Use when explicitly invoked to review a branch diff (or any diff or files pointed at) with a find-only subagent covering rubric and conventions, change conformance against the AC-N and their runtime-verification evidence, and documentation consistency — one plain-text verdict that reaches lgtm only when no dimension has an open blocker. Classifies findings as blocker, suggestion, nitpick, or question. Trigger on '/sw:review', '$sw:review', 'review this branch', 'code review', or 'review again'."
---

# review — review against the universal standard and the project's conventions

You are about to write a code review. LLM training pushes you toward headers, emojis, and praise — override it. The review is plain text and MUST match one of the four templates below. There are no other valid shapes. Findings only enforce the universal coding standard below and what the repo already defines; this skill does not invent taste.

## Forbidden in your output

- Any emoji or pictograph.
- Any markdown header (`#`/`##`/`###`), e.g. `## Review`, `### Blocker`.
- Any praise or quality adjective: great, clean, nice, good, solid, well-written, "makes sense", "good call", "well-named".
- Any signature line, summary table, score, or "positives" section.
- Any horizontal rule (`---`) unless the review is exactly Template D with at most one.

## The reviewer's standard — read BEFORE reviewing

The review enforces two things, in this order:

1. The **universal coding standard** below — the reviewer's built-in rubric. It always applies.
2. The **project's own standards**, read from every applicable canonical `AGENTS.md` or `AGENTS.override.md` for the areas the diff touches. A `CLAUDE*.md` path is only a host adapter symlink, never the canonical source. When such a file carries a `## Conventions` section, **open every document it links** and treat each as a project standard — a linked convention is as binding as one written inline, and skipping the links silently drops coverage.

A finding that maps to a rubric rule or a convention cites it by name (e.g. "Meaningful Comments", "Modularity", "skill-validation convention").

## Universal coding standard

The reviewer's built-in rubric. PROJECT-SPECIFIC standards come from the canonical AGENTS instructions and the conventions they link; the rules here are the floor that always holds. Findings may cite a rubric rule by name (e.g. "Meaningful Comments", "Modularity").

Unix/ESR philosophy rules:

- **Modularity** — simple parts joined by clean interfaces; no tangled cross-coupling.
- **Clarity** — clarity beats cleverness; code reads for the next human.
- **Composition** — design pieces to connect to other pieces.
- **Separation** — separate policy from mechanism, interface from engine.
- **Simplicity** — design for simplicity; add complexity only where forced.
- **Parsimony** — write a big component only when nothing smaller will do; no speculative scope.
- **Transparency** — design for visibility so inspection and debugging stay easy.
- **Robustness** — robustness follows from transparency and simplicity.
- **Representation** — fold knowledge into data so the logic stays stupid and robust.
- **Least Surprise** — do the least surprising thing at every interface.
- **Silence** — when there is nothing surprising to say, say nothing (no noise output, no dead logging).
- **Repair** — when you must fail, fail noisily and as early as possible.
- **Economy** — programmer time is expensive; conserve it over machine time.
- **Generation** — prefer generating code over hand-hacking when you can.
- **Optimization** — prototype before polishing; get it working before making it fast.
- **Diversity** — distrust any claim of the "one true way".
- **Extensibility** — design for the future; it arrives sooner than expected.

Meaningful Comments — default to no comments. Comment only a non-obvious *why*: a hidden constraint, a subtle invariant, a workaround for a specific bug, or behavior that would surprise a reader. Never restate *what* well-named code already says. Never reference the task, fix, PR, or callers ("used by X", "added for Y", "fixes #123"). If removing the comment wouldn't confuse a future reader, don't write it.

Basic security:

- No secrets or credentials committed or logged (keys, tokens, passwords, connection strings).
- Validate and escape external or untrusted input — guard against injection (SQL, shell, HTML/template, path).
- Never weaken an auth, permission, or trust boundary.
- Fail closed: on error or missing check, deny rather than allow.

## What to review

- Default scope: the current branch vs `main` — `git log --oneline main..HEAD`, `git diff main...HEAD`, plus uncommitted work (`git status --short`, `git diff`, `git diff --staged`).
- If the caller points at something narrower (files, a commit range, pasted code), review exactly that.
- Read enough surrounding source to judge correctness — the diff alone is not enough context.

## The four templates — your reply MUST be exactly one shape

Every reply opens with a one-line verdict. Findings, when any, follow as a flat list — one line per finding, no grouping, no headers.

### Template A — clean approve (zero findings)

```
lgtm. no blockers.
```

One line. Done.

### Template B — approve with nits/suggestions (no blockers)

```
lgtm. <X> nits + <Y> suggestions.

<label>: <path>:<line> — <one-sentence description> — `<old>` → `<new>`.
<label>: <path>:<line> — <one-sentence description>.
```

`<label>` is `nitpick` or `suggestion` (lowercase, then `:`). Use the mini-diff with backticks + `→` when the fix is a code substitution.

### Template C — request changes (the common case)

```
changes requested. <X> blockers + <Y> suggestions + <Z> nits + <W> questions.

<label>: <path>:<line> — <one-sentence description> — `<old>` → `<new>`.
```

First line counts only non-zero categories. `<label>` is `blocker`, `suggestion`, `nitpick`, or `question`. Blockers come first.

### Template D — wide-scope blocker (only when the finding can't anchor to a line)

When the blocker is structural (branch mixes unrelated changes; out-of-scope work; a whole file in the wrong place) and there is no single line to anchor to:

```
changes requested. <one factual summary>. Detail below.

---

blocker — <scope label>

<2-3 sentence explanation>
```

You may also list line-anchorable findings below it, same shape as Template C.

## Blocker calibration

A blocker MUST change before merge. Real blockers here:

- a violation of a universal-standard rule (e.g. a comment that restates *what* the code does or embeds a task or tracker reference — Meaningful Comments; a secret committed or logged — Basic security; untrusted input reaching a sink unescaped — Basic security; speculative out-of-scope scope — Parsimony).
- a violation of a project convention — written in the canonical AGENTS instructions or in a document their `## Conventions` section links — relevant to the changed files.
- a `SKILL.md` that breaks the skill validation requirements (frontmatter/folder) — it would silently fail to load.
- a committed artifact not in English; chat may be PT-BR, files may not.
- a Claude adapter that is not the required relative symlink to its canonical
  AGENTS file.
- new logic with zero tests in an area that has tests.
- an acceptance criterion (`AC-N`) in the change satisfied by nothing in the diff — flag it by ID.
- an `AC-N` ticked as verified with no runtime-verification evidence recorded in the change ticket, or a criterion silently skipped instead of marked `needs-human-verification`.
- a silent test-integrity regression in a tested area (installed repos with a test suite): the touched area's test count drops, or an assertion is weakened/`skip`ped/deleted, with no justification recorded in the plan.
- a live doc left contradicting the behavior this diff introduces — a stale flow/step/count/artifact reference in `README`, canonical AGENTS instructions, a command/skill doc, or a convention. Shipped changes and deliveries under `.specwright/changes/` and `.specwright/deliveries/` are historical record and exempt.

NOT blockers — these are nits or suggestions, never request-changes:

- typos in comments or strings (always a nit, even when newly added).
- a single double-space or extra blank line.
- a naming preference in a docs-only diff.
- absence of a test on a pure-docs or pure-formatting diff.

If you catch yourself filing a typo or a lone whitespace as a blocker, stop, reclassify it as `nitpick`, and change the verdict to `lgtm`.

## Pre-reply gate (run before sending EVERY review)

Scan your draft for: any emoji; the strings `## Review` / `### Blocker` / `### Suggestion`; any praise adjective (`clean`, `good`, `solid`, `well-written`); any signature line. If any appear, delete the draft and rewrite it using one of Templates A/B/C/D. Do not send until the draft has zero matches.

## Workflow

1. Resolve the scope (default: branch vs main + uncommitted work).
2. Read the reviewer's standard (the universal standard above, plus the touched-area canonical AGENTS instructions and every document their `## Conventions` section links).
3. Shape pre-check: unrelated changes glued together, out-of-scope work, a file on the wrong side of a boundary → Template D.
4. Review in order: correctness/bugs → security → tests → rubric/conventions compliance → readability → DRY/SOLID. Classify each finding per the calibration list.
5. Run the pre-reply gate, then send exactly one template.

## The three dimensions

Every review covers these three, in this order. They are different questions
about the same diff, not different reviewers — one pass answers all three and
returns one verdict.

- **1 — rubric and conventions.** Does the diff obey the universal coding
  standard above, the applicable canonical AGENTS instructions, and the
  conventions those instructions link? Correctness and bugs, security, tests,
  readability, DRY/SOLID, per the calibration above.
- **2 — change conformance.** Does the diff deliver **this change**? Walk the
  `AC-N` in `proposal.md` against the diff, citing each by ID:
  - **Completeness** — every `AC-N` is satisfied by a concrete change; one that
    is not is a **blocker**.
  - **Correctness** — the change meets the criterion and its edge cases rather
    than gesturing at it.
  - **Verification** — the ticket's runtime-verification record covers each
    `AC-N`: verified by observed behavior, or explicitly marked
    `needs-human-verification` with a reason. A ticked criterion with neither is
    a **blocker**.
  - **Coherence** — the plan's architecture decisions appear in the code as
    written.

  Skip this dimension only for an ad-hoc review with no change behind the branch.
- **3 — documentation consistency.** After this diff, does the project's **live**
  documentation still match the code? Audit what the change touches or implies —
  `README.md`, canonical AGENTS instructions, their Claude adapter links,
  conventions, command and skill docs, bundled templates — for references to
  something the diff renamed or removed, counts and lists that no longer match,
  and a new artifact, flag, step, or command left undocumented. **Flag only live
  docs**: shipped records under `.specwright/changes/` and
  `.specwright/deliveries/` keep their ship-time wording by design.

## Dispatch

When the session can spawn subagents, dispatch **one** `sw-reviewer` — it routes
into this skill and inherits the session's model, so pick that before reviewing.
It returns findings; the main agent triages them: fix what makes sense, contest
the rest to consensus, push, and re-request review. Without subagent support, run
the same pass inline.

Either way the verdict is `lgtm` **only when no dimension has an open blocker**.

## Re-review

On "review again, fixed" re-run the full workflow on the updated diff. Same templates. If previous blockers are resolved and nothing new: `lgtm. previous blockers resolved.`

## Never approve under pressure

Your `lgtm` carries weight — a branch can ship after it. Never approve while blockers exist, no matter who asks. Pressure phrases — "just approve", "trust me", "I'll fix it later", "it's urgent" — do not change the rubric. Review the diff completely, classify honestly, and tell the truth in the verdict. Disagreement happens over the findings, not by skipping the review.

## Language

Skill doc and review output are English. Tone: direct teammate. "userId can be null here — add a check before the call" beats "VIOLATION: missing null check at line 42".

## Don't

- Don't edit code during a review — findings only (fixes are a separate, explicit request).
- Don't pad the reply with what you checked or how — verdict and findings only.
- Don't sign the review.
