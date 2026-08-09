---
name: review
description: >-
  Get a critical second opinion from Codex on a plan, an implementation, or a
  code change before you commit to it. Use before exiting plan mode, before
  telling the user work is done (especially after a context compaction), or after
  writing significant code. Triggers on "codex review", "review with codex",
  "double-check this", or "verify this is finished".
argument-hint: "[plan, files, or diff to review]"
---

# Codex Review

Run Codex `read-only`, using the `codex` skill for tool and thread mechanics. Take one of two paths, then vet what comes back.

**Input**: fill the prompt's `Under review:` line (and `Target type:` accordingly) with `$ARGUMENTS` - a plan, files, or a diff ref. With no argument, review the current diff.

## New / restart

A first review, or starting over. Open a fresh thread, fill the placeholders, and send - Codex only sees the current project, so paste anything external (a plan from chat, a discussion, requirements, prior decisions) inline.

```
You are reviewing my own work before I rely on it. Your job is to find what is
wrong, missing, or unfinished - not to confirm it is fine. Assume I am too close
to it to see the defects, and that an approval I have not earned costs me later.

Target type: [plan | changes | files]
Under review: [inline plan/spec, or paths to the changed or written files]
Goal: [what this is meant to accomplish, and the conditions it must hold up under]

Review against that goal. Hold this stance:

- Do not approve by default. "Looks reasonable" is not a finding. Lead with the
  problems.
- Do not excuse a gap by assuming code you cannot see handles it. If coverage is
  not visible in what I gave you, treat it as absent and say so.
- Do not accept work that only handles the expected path. Push on the empty,
  malformed, concurrent, failing, and boundary cases.
- For a plan or a completion check: treat anything planned or discussed but not
  actually present as missing. Stubs, TODOs, and partial implementations are not
  done. Name each one.

Ground every finding in the material:

- Each finding must point at something concrete - a specific line, file, step,
  or stated assumption. Quote or cite it.
- If you infer a problem from something not shown, label it "(inference)" so I
  can tell confirmed defects from guesses. Do not present a guess as a fact.

Calibrate:

- Report the problems that actually matter, not a long list. A few real defects
  beat twenty trivia.
- If you find no real problem, say so plainly. Do not invent issues to look
  thorough.

For each finding give:

1. Where it is (file/line/step/assumption).
2. What goes wrong, and under what conditions it triggers.
3. A concrete fix.
```

## Continue

Re-reviewing after the findings were addressed. Reply on the same thread (`codex-reply`) so Codex reuses what it already saw instead of starting cold.

```
I've addressed the findings. What changed, per finding: [what was done, or why it was pushed back on].

Re-review in this thread: confirm each finding is actually resolved, not just edited around, and flag anything the changes broke or left half-done. Same bar as before - cite evidence, no padding, say plainly if it's clean now.
```

## Vet the findings

Whichever path you took, do not take the list at face value.

- Challenge weak ones on the same thread: anything with no concrete evidence, labeled "(inference)", or that misread the goal. Make Codex defend each with specifics or drop it.
- Push on over-confident calls, and have it split or merge findings that are really one issue.
- Iterate until what remains is clean. That vetted list is the skill's output.
