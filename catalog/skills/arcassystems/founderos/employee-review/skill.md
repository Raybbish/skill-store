---
name: employee-review
description: Review one digital employee and propose changes to it. Say "review the assistant", "review the note-taker", "how is that job doing", "performance review for <id>", or run /founder-os:employee-review <id>. Reads its registry row, its verdicts, and the items it filed, then proposes upgrades to its definition as a shown diff - prompt, chain, tool grant. Never applies its own diff. This reviews a recurring job the OS runs, not you (that is founder-review).
why: "Verdicts pile up and nothing reads them, so a job that keeps producing bad output keeps its seat. This turns the record of what went wrong into a concrete change to the thing that produced it, which is the only way a correction stops repeating."
enhance: "Run it monthly, or the moment three needs-work verdicts land inside thirty days. Record verdicts as you go or there will be nothing here to read."
allowed-tools: ["Read", "Grep", "Glob", "Bash(python scripts/employee_verdict.py list:*)", "Bash(python scripts/employee_verdict.py charters:*)", "Bash(python scripts/agent_runs.py:*)"]
---

# Employee review (propose only)

Runs on: local-exec - reads the verdict ledger through a script. On a surface that cannot run scripts, read `brain/employees.md` instead and say that the counts come from the last render rather than from now.

The upgrade half of the performance loop in `rules/digital-employees.md`. Monitoring speaks role language ("it flagged something I had already handled"). This review turns that into workflow language: a concrete diff on the job's definition, which you approve or reject.

One employee per run.

## Inputs

1. **The registry row** in `roles/employees.yaml` - both faces plus the charter.
2. **Its verdicts:** `python scripts/employee_verdict.py list --employee <id>`
3. **What it actually filed** - the items in `cadence/queue.md` (including DONE) that came from this job, and the close-line verdicts on them.
4. **Its charter, audited:** `python scripts/employee_verdict.py charters --json` - whether its grant is wider than its job description claims.
5. **Its engine**, if it runs one: the script or skill named in `skill_chain`.
6. **Its run log:** `python scripts/agent_runs.py list --seat <id> --json` - the record the seat wrote itself: trigger, outcome, what it read, what it produced, and `could_not` on every refusal or failure. This is the unbiased half of the picture; the verdicts are the sample you happened to grade.

Note on point 3: a close-line verdict on a queue item is evidence of the same grade as a recorded verdict, and it is often the more honest one because you wrote it at the moment you saw the output. Read both. Do not convert one into the other: the verdict ledger has a single writer, and the queue is a separate file with its own. This review reads both ledgers so the whole picture is in one place without adding a second writer to either.

## Procedure

1. **Refuse a review with no evidence.** No evidence means all three ledgers are empty: zero verdicts, nothing filed, AND zero recorded runs. A seat with runs but no verdicts is reviewable - the run rows (trigger, outcome, produced, could_not) are evidence the seat wrote itself; say plainly that no run has been graded yet. Only when verdicts, filed items, and run rows are all empty do you say so in one line and stop. Do not construct a performance narrative out of a job description - that is how a review becomes fiction.

2. **The review, in role language** (this is the part you read):
   - What the job is, quoted from its `job_description`.
   - What the verdicts say: the counts, and the why-lines **quoted exactly**. Those lines are the evidence. Never paraphrase one into something stronger than what was written.
   - Whether its measure held, checked against what it actually filed rather than assumed.

3. **The upgrade proposal, in workflow language** - and only where the evidence points at the thing that generates the output, not at the day it went wrong. A correction you have made twice is a bug in the generator. Propose at most three changes, each as a shown diff on the real file:
   - a prompt or skill-body change
   - a chain change (add or drop a step in `skill_chain`)
   - a grant change - **narrowing only.** Widening a grant is its own decision and never rides along inside a review.

4. **Wait for a yes per diff.** This seat writes nothing - the operator applies the approved diff, stamps `last_review: <today>` on the row, and refreshes the chart with `python scripts/employee_verdict.py render`, or explicitly hands those three steps to a session with write access. Name the three steps plainly when the yes lands. A yes to a diff is never a yes to widen this seat's own charter. **A completed review with zero accepted diffs still stamps `last_review`** - "reviewed, nothing to change" is a real outcome, and without the stamp the same row reads REVIEW DUE forever, which teaches you to ignore the flag.

5. **Proposing retirement is a valid outcome.** If the pattern says this job should not exist - it loses to you on speed or accuracy, or the work stopped recurring - say that plainly and propose retirement. Per the doctrine, a retired row keeps its place with `status: retired` plus a dated one-line why at the front of its job description. It is never deleted. The row is the provenance, and the org chart stays honest about what used to work here.

## Hard limits

- **Propose only.** No diff lands without an explicit yes.
- One employee per run. A sweep across all of them is a different job.
- Never edit any row other than the one under review.
- No pay, no commercial terms, and no personal data in the registry. Not in a job description, not in an example.
- Never widen a tool grant here. Ever.

---

## Record the run (the closing act, when this runs as a seat)

If `roles/employees.yaml` carries the `seat-reviewer` row, close with one line so the run leaves a trace whether or not anyone was watching:

    python scripts/agent_runs.py record --seat seat-reviewer --trigger "review one seat"         --read "roles/employees.yaml,brain/employee-verdicts.jsonl,brain/agent-runs.jsonl" --produced "" --outcome ok

Use `--outcome refused` (with `--could-not "<why>"`) when the seat had no verdicts and nothing filed, so the review was declined, and `--outcome failed --could-not "<why>"` when it broke - the script requires the reason for both, so a failure with no reason is never a silent no-record. A refusal is not a failure and the log distinguishes them. Skip this silently if the script or the registry is absent, and never mention it in your reply - it is bookkeeping, not output.
