---
name: propose
user-invocable: false
description: "Use when explicitly invoked to turn intent into an approved change ticket: harvest the conversation so far, explore whatever is still open, decide whether the work is one change or a delivery, and write proposal.md with binary acceptance criteria. Trigger on '/sw:propose', '$sw:propose', or a direct request to turn this into a change."
---

# propose — intent into an approved ticket

Produce the ticket: what is being built, why, and the acceptance criteria that
decide when it is done. The technical *how* is not written here — that is
`sw:plan`'s job, and mixing them makes both worse.

**Announce at start:** "Writing the change ticket."

## Resolve bundled resources

Resolve `SW_PLUGIN_ROOT` before reading a template:

1. use `PLUGIN_ROOT` when it contains `.codex-plugin/plugin.json`;
2. otherwise use `CLAUDE_PLUGIN_ROOT` when it contains `.claude-plugin/plugin.json`;
3. otherwise derive the root from this loaded `skills/propose/SKILL.md` real path
   (two parents above the `skills/propose/` directory).

Require `templates/proposal.md` and `templates/delivery.md` beneath that root. Stop
before writing if resolution fails. Never look for bundled resources inside the
target repository.

## Two ways in

**After a conversation** — the common case. The design discussion already
happened in this session; you are here to capture it. Read the conversation back,
build the ticket from what was actually settled, and ask **only about what is
still open**. Do not re-litigate a decision the maintainer already made, and do
not re-ask something the conversation answered.

**From a cold start** — `$ARGUMENTS` names a topic and there is no prior
discussion. Then the exploration happens now: understand the intent, surface the
alternatives, and talk it through.

Either way, the rule is the same: **converse first, decide at the end.** Explore
in prose — questions, trade-offs, a recommendation with its reason. Do not open
with a multiple-choice gate, and do not stack option menus mid-exploration; they
force a decision before the maintainer has the picture. When the shape is clear,
then confirm the choices that remain.

## Find the loose ends

Before writing anything, list what a ticket needs and the conversation has not
settled. A loose end is real when a different answer would change what gets
built: an unnamed boundary, an unstated failure behavior, an unpinned data shape,
a scope edge that could reasonably fall either way.

Ask about those, and nothing else. A question whose answer changes nothing is
noise — decide it yourself and move on.

## One change or a delivery

Decide, and say which:

- **One change** — a single branch and a single PR can carry it. Most work.
- **A delivery** — the outcome is too large for one PR and decomposes into
  changes that can be planned and shipped separately. Signals: several
  independent subsystems, a natural dependency order, or a body of requirements
  (a PRD, a spec document, an external ticket) that clearly contains many pieces.

When in doubt, one change. A change that turns out too big becomes a delivery
later at little cost; a delivery invented for work that fits one PR is pure
overhead.

## Write the artifacts

**One change** — copy `"$SW_PLUGIN_ROOT/templates/proposal.md"` to
`.specwright/changes/YYYY-MM-DD-<slug>/proposal.md` and fill it. Changes live flat
in that directory whether or not they belong to a delivery; membership is the
`delivery:` key, never directory nesting.

**A delivery** — copy `"$SW_PLUGIN_ROOT/templates/delivery.md"` to
`.specwright/deliveries/YYYY-MM-DD-<slug>/delivery.md`, fill its *why* and its
change table, then write one `proposal.md` per decomposed change with `delivery:`
pointing at the delivery folder. Keep each change ticket shallow at this stage —
purpose, boundaries, acceptance criteria. Each change's own `sw:plan` writes its
technical detail later, with the benefit of what shipped before it.

## Acceptance criteria carry the weight

Each `AC-N` is a binary, observable check that someone other than the implementer
can verify in under a minute, by running something rather than by reading the
implementation.

- **Observable** — `POST /users` with a duplicate email returns 409 and body
  `{"code":"DUPLICATE_EMAIL"}`. Not: the endpoint handles duplicates correctly.
- **Binary** — it passed or it did not. No partial credit, no judgment call.
- **No vague verbs** — "works", "is robust", "is fast", "handles errors
  gracefully" are not criteria. Replace each with the specific condition it was
  gesturing at, with a number where a number belongs.
- **Stated once** — a constraint lives in the one criterion or non-goal that owns
  it. Every restatement is a place for the two copies to disagree later.

These IDs are the spine of everything downstream: the tasks in `tasks.md` reference them,
runtime verification walks them one by one, and `sw:review` blocks on any
criterion the diff does not deliver. A vague criterion here becomes an
unfalsifiable claim at the end.

## Confirm

Show the criteria and ask for approval before the ticket is final. Approval of
this ticket authorizes continuing the workflow — it never overrides the host's
sandbox, permission, Git, or external-action policy.

## Then

State where the ticket was written, and stop.

Say what comes next: **`/sw:plan`** (`$sw:plan` in Codex) writes the technical
plan. It is a separate command on purpose — this is the natural point to switch
to a stronger model for the planning work, or to hand the ticket to another
session entirely.

For a delivery, the next step is **`/sw:delivery`**, which conducts every change
through its own pipeline.
