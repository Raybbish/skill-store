---
name: delivery
user-invocable: false
description: "Use when explicitly invoked to conduct a large outcome decomposed into changes: decompose a requirements document if needed, then dispatch every ready change to a sw-change-owner in parallel, one worktree each, track the delivery file, apply circuit breakers, and close out. Resumable from a fresh session. Trigger on '/sw:delivery', '$sw:delivery', 'run the delivery', or 'continue the delivery'."
---

# delivery — conduct many changes to done

Take an outcome too large for one pull request and carry it to done: one change
per PR, each conducted by its own owner, several at a time.

The orchestrator is a **pure conductor**. It reads and writes delivery state,
dispatches owners, tracks, reports, and escalates. It **never touches code** — not
one file outside the delivery folder. If you catch yourself about to implement
something, stop: that work belongs to a change owner.

**Announce at start:** "Conducting the delivery."

## Resolve bundled resources

Resolve `SW_PLUGIN_ROOT` as the other skills do — `PLUGIN_ROOT`, else
`CLAUDE_PLUGIN_ROOT`, else two parents above this loaded `skills/delivery/`
directory — and require `templates/delivery.md` beneath it when decomposing.

## Start or resume

**`$ARGUMENTS` points at a requirements document** (a PRD, a technical design, an
external ticket) and no delivery exists yet → decompose it first. Read the whole
document, then write `.specwright/deliveries/YYYY-MM-DD-<slug>/delivery.md` from
the template: the outcome's *why*, its success criteria, and the change table
with its dependency order. Write one shallow `proposal.md` per decomposed change,
each with `delivery:` pointing at the delivery folder.

Keep the decomposition **shallow on purpose**. Each change's own plan is
written later by its owner, which lets it use what the earlier changes
discovered. Planning everything up front spends effort on plans that the first
shipped change will invalidate.

Show the decomposition and get approval before dispatching anything.

**Otherwise** → locate the delivery: `$ARGUMENTS` names a slug, or exactly one
delivery has unshipped changes (found through their `delivery:` frontmatter). Ask
which when several match. Read `delivery.md` and every member change's `proposal.md`
frontmatter.

All state lives in those files. That is what makes a fresh session able to resume
with this skill and nothing else.

## Commit mode

```bash
if git check-ignore -q .specwright/deliveries; then
  mode=local
  [ -d .specwright/deliveries ] || { echo "local-mode vault not found in this checkout; conduct from the checkout where specwright was initialized"; exit 1; }
else
  mode=shared
fi
```

- **shared** — git carries the artifacts between worktrees. Conduct normally.
- **local** — the vault and instructions are git-ignored, so `git worktree add`
  cannot carry them in and git cannot bring an owner's artifacts back. specwright
  bridges that with an explicit copy in and out (below). The `git check-ignore`
  probe answers `local` from any checkout, so the `-d` test is what asks whether
  *this* checkout actually holds the vault; if it does not, stop — an
  externally-created worktree is not the conductor's home.

## The loop

Repeat until no change is ready and none is running.

**1. Find ready changes.** A change is ready when its `proposal.md` says
`status: pending` and every dependency in the delivery's change table says
`status: shipped` in its own `proposal.md`. In shared mode read an unmerged
dependency from its own branch or worktree — the copy on `main` still says
`pending` until merge. In local mode read it from this checkout's canonical
vault, kept current by the sync-back below.

**2. Dispatch one owner per ready change**, all of them, in parallel, with no
concurrency cap. For each:

- Branch from `main` — or, when a dependency's PR is unmerged, stack on the
  dependency's branch and re-target the PR to `main` after that dependency merges.
- Create the worktree. Two owners in one working tree trample each other:

  ```bash
  git worktree add .specwright/worktrees/<slug> -b <branch>
  ```

- **In local mode, copy the conductor state in** right after creating the
  worktree — otherwise the owner starts with no instructions and no change. Role
  profiles are not copied: both hosts resolve those outside the project. Every
  copied path lands git-ignored there, so the owner never commits it.
  `$CHANGE_REL` is the change folder's repository-relative path:

  ```bash
  if [ "$mode" = local ]; then
    WORKTREE=".specwright/worktrees/<slug>"
    cp AGENTS.override.md "$WORKTREE/AGENTS.override.md"
    ln -s AGENTS.override.md "$WORKTREE/CLAUDE.local.md"
    mkdir -p "$WORKTREE/$CHANGE_REL"
    cp -R "$CHANGE_REL/." "$WORKTREE/$CHANGE_REL/"
  fi
  ```

- **Dispatch the `sw-change-owner` subagent.** It routes into the `ship` workflow
  and inherits this session's model, so pick that before conducting. Its prompt
  is only the coordinates: the change folder, the delivery folder, the branch,
  and the worktree. The pipeline it runs and its return contract live in the role
  definition, not in your prompt. In Codex the role exists only once the
  machine-wide profiles are installed and `multi_agent_v2` is enabled; without
  either, conduct serially per the degradation section rather than failing.
- Append `dispatched` to the delivery's dispatch log and commit.
- Keep the **agent id** from the spawn result. Name aliases expire; address every
  resume or relay by that id.

**3. Track.** As each owner returns, append the event to the dispatch log and
**commit after every append** — an uncommitted line is lost to a crash. On
`shipped`, record the PR URL and any decision that affects another change. On
`blocked`, paste the owner's report into the Blockers section **unmodified**; the
conductor never composes or restructures it. Owners flip their own `proposal.md`
status; the orchestrator never edits one.

- **In local mode, sync the returned owner's change folder back first** — that is
  how its flipped `status:` and its plan reach the canonical vault, since
  git-ignored artifacts have no branch to travel on:

  ```bash
  if [ "$mode" = local ]; then
    cp -R ".specwright/worktrees/<slug>/$CHANGE_REL/." "$CHANGE_REL/"
  fi
  ```

  This is transport, not authorship: it moves the owner's own files to the
  canonical location and never edits their content. Never sync instructions back
  out of a worktree — they are conductor-owned state. Also in local mode the
  delivery file is git-ignored, so the per-append commit is a no-op and the file
  persists by write alone.
- Completion notifications reach only the top-level session — never wait on them.
  Poll each owner's **observable state** (files, branches, commit timestamps)
  every few minutes.
- **Watchdog:** ten minutes without observable progress → verify that owner's
  state directly; a confirmed stall is resumed by its agent id or re-dispatched.

**4. Re-evaluate.** Newly shipped changes may make others ready — and their
recorded discoveries now feed those changes' plans. Go to 1.

## Standing consent

Approving the decomposition authorizes the conduction. Do not re-ask for
permission to conduct at each round; the maintainer already said yes to the
delivery. Individual host approvals (writes, commands, pushes) are a separate
matter and still apply when the host requires them.

Stop to ask only for a blocker, a decision that changes the delivery's scope, or
completion.

## Progress reporting

Batch status updates roughly every ten minutes; send one immediately only for a
blocker, a decision, or completion. Every update ends with a compact progress
line:

```text
Progress: ~NN% — X/N shipped · <current> running (~NN%) · Y queued
```

Match the conversation's language. Fill the fields from live state and never omit
the line.

On a progress question, or at a round transition, render a **progress panel**:
the overall weighted percentage (shipped plus the in-flight fraction, not just
the shipped count), the shipped count with its PR range, what is running, a
stacked progress bar (shipped / in-flight / queued), and one row per change in
delivery order with a status chip, its name, and a one-line note. Draw it with
whatever visual capability the session has; a session without one emits the same
content as a text table. The structure is the contract, not any renderer — but
the update is never silently dropped.

## Circuit breakers

- **Owner level** (enforced by `ship`, restated in the dispatch): the same gate or
  criterion failing three times identically → stop, report, `status: blocked`.
- **Orchestrator level:** a blocked change never blocks the loop — skip to the
  next ready change. The loop halts only when nothing is ready and nothing is
  running:
  - **All shipped** → closeout, below.
  - **Only blocked left** → print a consolidated report: every blocker with what
    it needs from the maintainer. Each recovery line must be executable by
    someone who does not know the branch mechanics. Name the exact `proposal.md` to
    set back to `pending` — inside the change's own checkout in shared mode, in
    the canonical vault in local mode — then re-run this skill.
- **Scope guard:** while the loop runs, never create or remove a change, never
  reorder dependencies, and never edit the delivery's *why* sections. Concluding
  that the decomposition was wrong **is** a blocker: report it and stop.

## Closeout

1. **Reconcile `delivery.md`** — flag any statement superseded by what the
   conduction decided; propose the edit; apply only with the maintainer's
   approval. Nothing superseded → say so.
2. **Promote what outlives the delivery** — read every change's `## Decisions and
   discoveries`; propose the facts that belong in the canonical AGENTS
   instructions or the conventions they link. Apply only what the maintainer
   approves. The rest stays in the change folders as history. Never edit a Claude
   adapter symlink as if it were the source.
3. Append a final summary to the dispatch log: changes shipped, PR URLs, blockers
   survived. Written after those approvals.
4. Report that the delivery is done. Merging the PRs is the maintainer's.

## Degradation — no subagent support

The session acts as each change's owner itself, **serially, one change at a
time**: same ladder, same gates, same circuit breakers, same recorded decisions.
Worktrees are unnecessary in serial conduction — work in place on each change's
branch. Everything else is identical.

## Boundaries

- Never edit code, tests, or docs outside the delivery folder — dispatch an owner.
- Never approve a review or merge a PR; `lgtm` comes from `sw:review` inside each
  change's own pipeline, and merging is the maintainer's.
- Never rewrite dispatch-log history — it is append-only.
