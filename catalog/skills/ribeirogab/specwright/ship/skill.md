---
name: ship
user-invocable: false
description: "Use when explicitly invoked to run the whole change ladder without stopping — ticket, plan, implementation, quality gate, runtime verification, review to lgtm — deciding every open question autonomously and recording each decision in proposal.md. Trigger on '/sw:ship', '$sw:ship', or a request to take something from idea to a reviewed branch without being asked anything."
---

# ship — the ladder, without stops

Run every step from intent to a reviewed branch in one go, asking nothing along
the way. This is the same ladder as the individual commands — it does not
reimplement any step, it runs them back to back and takes on itself every
decision the interactive path would have handed to the maintainer.

**Announce at start:** "Shipping this end to end — I'll decide open questions and
record each one."

## The steps

Run these in order, each per its own skill. Follow that skill's instructions
exactly; the only difference is that you never stop to ask.

1. **`propose`** — write `proposal.md` with acceptance criteria. If a change
   folder already exists for this work, start from it instead of writing a new one.
2. **`plan`** — decide the scope, write `tasks.md` and, above `low`, `design.md`,
   then pass the handoff-readiness validator.
3. **`implement`** — work the task list, quality gate, runtime verification.
4. **`review`** — review the branch, fix what the findings justify, iterate to
   `lgtm`.

Then set `status: shipped` and the `shipped:` date in `proposal.md`, tick the
criteria that were verified, and commit on the change's own branch.

## Decide, then record

Every question the interactive ladder would have asked, you answer. Two rules:

**Prefer the reversible option.** When two designs are defensible, take the one
that is cheaper to undo. An autonomous run is not the place to make an expensive
bet on the maintainer's behalf.

**Record every decision in `proposal.md`.** Under `## Decisions and discoveries`,
one bullet each, saying what was chosen, why, and what was rejected:

```markdown
- **[decision]** Used cursor pagination instead of offset — the ticket did not
  specify and the table exceeds a million rows. Rejected: offset, which degrades
  with depth.
```

That section is the entire audit trail of an unattended run. A decision you took
and did not write down is indistinguishable from one you never noticed — treat an
unrecorded decision as a defect, not as tidiness.

Record `[discovery]` entries the same way: the non-obvious facts the work paid to
find, written so a future change can act on them.

## What still stops you

Autonomy covers design choices. It does not cover these:

- **Host policy.** File writes, command execution, Git actions, network calls,
  and external actions still obey the current host's sandbox and approval policy.
  Running unattended is not a permission bypass; ask when the host requires it.
- **The circuit breaker.** The same gate or criterion failing **three times
  identically** stops the run. Do not try a fourth variation of the same idea.
- **Verification you cannot perform.** A criterion you cannot execute is marked
  `needs-human-verification` in `proposal.md` with its reason. Never tick a
  criterion you did not observe, and never write a verification you did not run —
  autonomy makes this rule more important, not less, because nobody is watching.
- **An approved criterion.** Never edit an `AC-N` to match what you built.

On a stop, report: what failed, what you tried, and what you need. For a change
dispatched by a delivery, that is a `blocked` return with `status: blocked` set
in `proposal.md`.

## Then

Report the branch, the criteria verified and how, anything left
`needs-human-verification`, and the list of decisions you recorded. Read that
list back explicitly — it is the part the maintainer most needs to see, and the
part they had no chance to weigh in on.

Publishing the branch and merging it are theirs. Once it lands, **`/sw:archive`**
(`$sw:archive` in Codex) closes the change out.
