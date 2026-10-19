---
name: implement
user-invocable: false
description: "Use when explicitly invoked to execute a change's tasks.md from the first unticked step: implement each task, run its validation, commit, then run the quality gate and verify every acceptance criterion by observed behavior. Needs no conversation context — the change folder is the whole input. Trigger on '/sw:implement', '$sw:implement', or a direct request to implement an existing plan."
---

# implement — execute the plan

Take a change folder — `proposal.md`, `tasks.md`, and `design.md` when the scope
called for one — and build what they describe. This skill is designed to run
**cold**: a fresh session, a different model, a different host, with no memory of
the conversation that produced the plan. Those files are the entire input.

**Announce at start:** "Implementing the plan."

## Locate the change

`$ARGUMENTS` names a change folder or slug → use it. Otherwise list the changes
in `.specwright/changes/*/` whose `proposal.md` says `status: pending` or
`in-progress` and ask which one; a single candidate may be used directly.

Read every file in the folder completely before touching code. Check out the
branch named in `tasks.md`'s `branch:` frontmatter, creating it from the default
branch if it does not exist yet, and set `status: in-progress` in `proposal.md`.

A folder with no `design.md` is not incomplete: a `low`-scope change carries its
constraints in `tasks.md` and needs nothing more. A missing `tasks.md` is a stop —
the change has no plan yet, and writing one is `/sw:plan`'s job, not this
skill's.

## Never work on the default branch

After the checkout and **before the first commit**:

```bash
git branch --show-current
```

If it is `main` or `master` — because `branch:` names it, because the checkout
did not happen, or because the frontmatter is blank — **stop**. Report the branch
this change should be on and let the maintainer create it. Do not commit, and do
not pick a branch name on their behalf.

This gate runs once, here, and it is the only thing standing between an
unattended run and a series of commits on the default branch.

## Resume from the checkboxes

The checkboxes in `tasks.md` are the state. Find the **first unticked step** and
start there — everything above it is done, whoever did it. Never restart a task
whose boxes are ticked, and never re-derive progress from the git log; the file
is the record.

Before starting, confirm the working tree is clean. Uncommitted work from a
previous run is ambiguous: report it and let the maintainer resolve it rather
than committing or discarding on their behalf.

## Work the list

Tasks run in document order, top to bottom. For each task:

1. Read its `Files:` — those are the paths it owns. Touching a path no task
   declares is a signal the plan was wrong; see below.
2. Work its steps in order, ticking each box as it completes.
3. Run its exact `Validation:` command and require it to pass.
4. Commit, then move to the next task.

Commit per task, not per session. A run that stops mid-list must leave the
repository in a state the next run can continue from.

## When the plan is wrong

Plans meet reality and reality wins sometimes. Two cases, two responses:

**A gap you can close** — a missing step, a wrong path, an import the plan did
not anticipate. Fix it, keep going, and record it under `## Decisions and
discoveries` in `proposal.md` as a `[decision]` or `[discovery]`.

**A gap you cannot close** — the approach does not work, a task contradicts
another, or the change needs work outside every declared path. Stop. Do not
improvise a different design: report what broke, what you tried, and what you
need. For a delivery change that is a `blocked` return.

Never edit an approved `AC-N` to make it match what you built. That is the one
edit this skill may not make.

## Circuit breaker

The same command or criterion failing **three times identically** means stop. Not
a fourth variation of the same idea. Report why, what you tried, and what you
need — to the maintainer for a standalone change, or as `status: blocked` in
`proposal.md` plus a blocked return for a delivery change.

## Quality gate

After the last task, detect the code-quality processes the touched modules
actually use — test, lint, typecheck, build, from the Makefile, the
`package.json` scripts, or the area's CI — and run them all. Nothing you did may
break them.

Logic added or changed in an area that has tests, without a test → write the
missing test first. **Test integrity:** the touched area's test count must not
silently drop, and no assertion may be weakened, skipped, or deleted to get the
gate green without a justification recorded in `proposal.md`.

## Runtime verification

Before the review, execute what you built and check **every** `AC-N` by observed
behavior: run the CLI, start the server and call the endpoint, run the script
against a fixture. Reading the code is not verification.

- Stream-sensitive checks use per-stream redirection (`>out 2>err`); a merged
  pipe cannot attribute output to stdout versus stderr.
- A **UI criterion** — one about rendered appearance or interaction, not an HTTP
  response or text output — is verified through a browser when the session has
  one. A session that degrades a UI check to `curl` records the capability gap
  alongside the result.
- A criterion you cannot verify — no browser, no reachable environment — is
  marked `needs-human-verification` in `proposal.md` with one line of reason.

**Never tick a criterion you did not observe, and never write a verification you
did not run.** Record what was verified and how, in `proposal.md` beside the
criteria — that record is the change's durable evidence, and whoever opens the
pull request copies it from there.

## Then

Report what was built, the gate results, and the per-criterion verification
record. Print the record in full: it is what the pull request body needs, and
this is the last step that has it in hand. Stop there.

Say what comes next: **`/sw:review`** (`$sw:review` in Codex) reviews the branch
to `lgtm`. Opening the pull request is the maintainer's, in whatever shape this
repository's conventions ask for.
