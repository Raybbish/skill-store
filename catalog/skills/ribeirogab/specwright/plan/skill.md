---
name: plan
user-invocable: false
description: "Use when explicitly invoked to turn an approved proposal.md into its plan — tasks.md always, and design.md when the scope calls for one — written so an agent with no memory of the conversation can implement it, then checked by the handoff-readiness validator. Trigger on '/sw:plan', '$sw:plan', or a direct request to plan an existing change."
---

# plan — the technical plan, written for a stranger

Turn an approved `proposal.md` into the plan an implementer executes: `tasks.md`
always, and `design.md` when the change is large enough to have an architecture.
One rule governs every choice in this skill —

> **The implementer has no memory of the conversation that produced this plan.**

That is not a hypothetical. The plan may be handed to a fresh session, a
different model, a different host, or picked up next week. Anything that lives
only in this conversation is lost the moment this skill ends. If it matters, it
goes in the file.

**Announce at start:** "Writing the technical plan."

## Resolve bundled resources

Resolve `SW_PLUGIN_ROOT` before reading a template or invoking the validator:

1. use `PLUGIN_ROOT` when it contains `.codex-plugin/plugin.json`;
2. otherwise use `CLAUDE_PLUGIN_ROOT` when it contains `.claude-plugin/plugin.json`;
3. otherwise derive the root from this loaded `skills/plan/SKILL.md` real path
   (two parents above the `skills/plan/` directory).

Require `templates/design.md`, `templates/tasks.md`, and
`scripts/validate-change.sh` beneath that root. Stop before writing if resolution
fails. Never look for bundled resources inside the target repository.

## Locate the change

`$ARGUMENTS` names a change folder or slug → use it. Otherwise find the change in
`.specwright/changes/*/` whose `proposal.md` says `status: pending` or
`in-progress`; several → ask which. Set `status: in-progress` when you start.

Every change lives flat at `.specwright/changes/YYYY-MM-DD-<slug>/`, standalone
or delivery-linked alike.

## Read what came before

For a change that belongs to a delivery, read the `## Decisions and discoveries`
section of every **sibling** change already `shipped` — the changes whose
`delivery:` points at the same delivery folder. Those are facts an earlier change
paid to discover: data formats, surprising behaviors, required workarounds,
constraints that only appear at runtime. Fold every applicable one into this
plan's Architecture or Constraints. A plan that trips over a recorded discovery
is a review blocker.

## Scope check

If the change spans several independent subsystems, it should have been
decomposed at the ticket stage. If it was not, stop and say so — for a delivery
change that is a **blocked** report, never a unilateral edit of the delivery.

## Decide the scope first

`scope:` is the first decision, because it decides how many files you write:

- **`low`** — no architecture worth documenting. Write `tasks.md` only, and put
  the few constraints the implementer must respect in its `## Constraints`
  section. Most changes are this.
- **`medium`, `high`, `complex`** — the change has a shape someone could get
  wrong. Write `design.md` too.

Size honestly, in both directions. Skipping a design document for work that has
real architecture leaves the implementer guessing; writing one for a two-file
edit is ceremony. The validator holds you to the answer: any value above `low`
without a sibling `design.md` fails check 7.

## Architecture — `design.md`

Skip this section entirely at `low` scope. Otherwise copy
`"$SW_PLUGIN_ROOT/templates/design.md"` into the change folder and fill it.

- **Frontmatter** — `feature` only. Execution state belongs to `tasks.md`.
- **Architecture** — the approach and why it beat the alternatives. Map every
  file that will be created or modified and what each is responsible for. Units
  with one responsibility and clean boundaries; smaller focused files over large
  ones; files that change together live together; follow the patterns this
  codebase already uses.

This file is written once and read many times. Everything that changes while the
work runs lives in `tasks.md`, so an edit here after implementation starts reads
as what it is: an architecture change.

**Acceptance criteria stay in `proposal.md`.** They are the approved contract. Do
not copy them into either file. If planning exposes a criterion that is wrong or
missing, fix `proposal.md` with the maintainer for a standalone change, or report
it for a delivery change — an approved criterion is never reworded unilaterally,
and any ticket edit is its own commit naming the criterion it changed.

## Tasks — `tasks.md`

Copy `"$SW_PLUGIN_ROOT/templates/tasks.md"` into the change folder and fill it.
Its frontmatter carries `feature`, `created`, `scope` (the decision above),
`branch` (**required**: it is how a fresh session knows where to work),
`worktree`, and `delivery`.

**Each step is one action, two to five minutes.** "Write the failing test" is a
step. "Run it and watch it fail" is a step. "Write the minimal implementation" is
a step. "Run the tests" is a step. "Commit" is a step.

Each task block carries exactly three pieces of metadata:

```markdown
### T1: Component name

**AC:** AC-1, AC-3
**Files:**
- Create: `exact/repository-relative/path.py`
- Modify: `exact/repository-relative/path.py`
**Validation:** `pytest tests/path/test.py::test_name -q`
```

`AC:` names the criteria the task satisfies — every `AC-N` in `proposal.md` must be
claimed by at least one task, and no task may name a criterion that does not
exist. `Files:` lists at least one exact repository-relative path. `Validation:`
is one runnable command that proves the task landed.

Task order in the document is execution order. There is no dependency graph and
no parallel dispatch: one agent works the list top to bottom.

**The checkboxes are the resume state.** `sw:implement` continues at the first
unticked box, which is what lets a run stop and be picked up by another session
or another model. Write them so that is true.

## No placeholders — the handoff rule

The implementer cannot ask you anything. Every one of these breaks the handoff:

- "TBD", "TODO", "implement later", "figure out the right approach";
- "add appropriate error handling" — say which errors and what happens;
- "write tests for the above" without the test code;
- "similar to T1" — repeat the code;
- a step that describes an action instead of showing it;
- a reference to a type, function, or file no task defines;
- an open question left anywhere in the document.

An unresolved question is a defect, not a note. Resolve it with the maintainer,
or take the decision yourself and record it under `## Decisions and discoveries`
in `proposal.md` with the alternative you rejected.

## Self-review, then the gate

Read the plan once as if you had never seen the conversation, and fix what you
could not act on. Then check, in order:

1. **Coverage** — every requirement in `proposal.md` maps to a task.
2. **Traceability** — every `AC-N` is claimed by a task; no task invents one.
3. **Placeholders** — no double-brace survivors, no "TBD", no "TODO".
4. **Consistency** — names and signatures agree across tasks.

Then run the mechanical gate:

```bash
"$SW_PLUGIN_ROOT/scripts/validate-change.sh" <change-folder>
```

A non-zero exit names the structural defect. Fix and re-run until it exits 0 —
with one exception: a failure caused by the approved ticket itself means **stop
and report it with the exact `FAIL` line**, to the maintainer for a standalone
change or in a blocked report for a delivery change. Proceed only after an
acknowledged resolution.

Commit the plan when the gate passes, before any implementation commit.

## Then

Confirm the plan is handoff-ready and say so plainly:

```text
plan ready — <change-folder>/tasks.md
another agent can implement it with: /sw:implement <slug>
```

Stop there.

Say what comes next: **`/sw:implement`** (`$sw:implement` in Codex) executes the
plan. It is a separate command on purpose — the plan is now a self-contained
document, so implementation can run with a cheaper model, in a new session, or on
another host, and none of this conversation is needed.
