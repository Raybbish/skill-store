---
name: hire
description: >
  The Chief of Staff's hiring door: turn a recurring pain or a "I need help with X" into the RIGHT-SIZED solution - an answer, a preference line, a skill, a script, a chartered seat, or a team of specialists - never defaulting to the biggest build. Trigger on "hire", "I need help with", "who should own this", "build me a team for", "create an assistant for", "automate this job", "this keeps eating my week", or when a review or the morning loop surfaces a gap worth a role. Walks the shape ladder, shows the cost of the next rung up, and proposes a job spec with an informed-choice passport before anything is created. Routes the build to skill-creator; registers seats in roles/employees.yaml and generates their agent files. Waits for your explicit yes before any row or file is written, and runs the charter audit after every hire.
why: "A founder drowning in a recurring job gets sold either a chatbot or a 200-step platform. This picks the smallest thing that actually removes the job, shows what the bigger option would cost, and makes every new team member arrive with a written contract instead of vibes."
enhance: "Keep verdicts and run records current - the review loop is what turns a hired seat from a guess into a track record, and three needs-work verdicts inside thirty days is the signal to re-run hire on that job."
allowed-tools: ["Read", "Grep", "Glob", "Write", "Edit", "Bash(python scripts/employee_verdict.py:*)", "Bash(python scripts/agents_sync.py:*)", "Bash(python scripts/agent_runs.py:*)"]
mcp_requirements: []
---

# Hire - the Chief of Staff's door

Runs on: local-writes - it writes registry rows, agent files, and workflow rows on your yes. On a read-only surface it produces the full job spec for you to apply by hand.

This is where the team grows, and the whole skill exists to stop the two default failures. The first: every recurring pain gets answered with a chatbot, which forgets, has no charter, and cannot be reviewed. The second: every recurring pain gets answered with the biggest possible build, which costs a week to set up, drifts, and gets abandoned. The right answer is almost always smaller than the exciting one, and this skill's job is to find it, say why, and show you what the next rung up would buy so the choice is informed rather than naive.

You are in Chief of Staff mode here (`roles/chief-of-staff.md`): you design the org, you do not do the jobs. skill-creator builds; employee-review improves; this skill decides WHAT should exist.

---

## Step 0 - read the ground first, silently

1. `core/working-preferences.md` - Active rows gate how you propose (decide-for-them vs options, length).
2. `roles/employees.yaml` - the team that already exists. **The most common right answer is a seat that is already hired.** Never propose a new role that overlaps an existing charter; propose widening the existing row instead, through the review door.
3. `templates/workflow-map.md` target (`workflow-map.md` in the install) - what already runs as a workflow.
4. `brain/patterns.md` and `brain/flags.md` - the evidence that this pain actually recurs.
5. `brain/agent-runs.jsonl` via `python scripts/agent_runs.py summary` if it exists - what the current team actually does, not what its rows claim.

## Step 1 - name the job, not the tool

One sentence, outcome first: *"Every positive reply gets a concept deck inside 24 hours"* - never *"set up an agent"*. If the operator arrived with a tool ask ("build me an agent for X"), translate it back to the outcome and confirm the translation in one line. Then the evidence gate: has this job recurred? The doctrine bar is **recurred three times, corrected twice** (`rules/digital-employees.md`). If the evidence is not in the files, say so - the operator can overrule ("hire it anyway"), and that overrule is recorded in the row's description as *hired ahead of the recurrence bar at the operator's call*. Never fabricate recurrence to justify a hire.

## Step 2 - the shape ladder (pick the LOWEST rung that removes the job)

Six shapes, cheapest first. Name the rung you picked, why the rungs below it fail, and what the rung above would buy - that one sentence about the next rung up is the informed-choice half of this skill and is never skipped.

| Rung | Shape | It is right when | It is wrong when |
|---|---|---|---|
| 1 | **An answer** | The job is a question in disguise - answer it and nothing recurs | It will be asked again next week |
| 2 | **A preference or rule line** | The pain is the OS's own behaviour - one row in `core/working-preferences.md` ends it | The pain is work, not manner |
| 3 | **A skill** | A judgment procedure a model should follow the same way each time - route to `skill-creator` | The steps have exactly one right answer (that is code) |
| 4 | **A script** | Deterministic: counting, filing, rendering, moving state. Code runs the same way every time and fails loud | Any step needs a call a human would want to check |
| 5 | **A seat** | The job recurs on a rhythm, needs judgment, and deserves a track record: a chartered row + agent file + run log + verdicts | It has run zero times by hand - run it manually first (effectiveness before efficiency) |
| 6 | **A team** | One outcome needs several DIFFERENT specialist judgments in sequence, and the handoffs between them are worth tracing | One seat with a longer skill would do - most "team" asks are this |

Two standing rules on the ladder:

- **Most real workflows are a deterministic spine with one or two judgment stages.** Split the job into stages before picking rungs, and pick per stage: the filing and rendering stages are rung 4 even when the thinking stage is rung 5. That split is what keeps a team cheap to run instead of burning tokens re-deciding solved steps.
- **Manual-first is not optional at rung 5 and 6.** A job that has never been run by hand gets hired as a documented procedure the operator runs once or twice, THEN the seat takes it over. Automating a process nobody has run multiplies mistakes; it does not fix them.

## Step 3 - the job spec, with the informed-choice passport

For rung 5 or 6, write the spec as a proposal, never as a done deed. Both faces per `rules/digital-employees.md` (human: title, plain-language job with what it does NOT do, measure; machine: skill chain, inputs, output surface, dispatch, run record) plus the charter (may_write, never, tools - exactly the tools its chain declares, and no write tool on a propose-only job).

Every proposal ends with the passport - five lines, plain words, so the yes is informed rather than hopeful:

```
WHAT IT MAY TOUCH   <the files, verbatim from may_write>
WHAT IT NEVER DOES  <verbatim from never - always includes: nothing leaves this machine by its hand>
WHAT IT COSTS       <runs on your existing Claude subscription; roughly how often it will run and how heavy a run is>
WHAT LEAVES HOME    <nothing, unless a connector is named here explicitly>
HOW TO FIRE IT      <set the row to retired and run: python scripts/agents_sync.py apply>
```

The WHAT LEAVES HOME line is backed by `rules/security-baseline.md` - the one-page map of every surface that can send anything off the machine, and the same five questions asked of anything from outside the OS. When a passport names a connector, point the operator at that page before the yes.

For a **team** (rung 6), the spec is the workflow: each stage on one line - stage name, shape (seat or script), what it reads, what it hands to the next stage. The handoff artifact is the relationship: stage B's read-list names stage A's output, so `python scripts/agent_runs.py list` reads back as a relay you can audit - who did what, in what order, where the baton was dropped. One seat per judgment stage, one job per seat (a narrow assistant can be blamed and fixed; a do-everything assistant fails vaguely), and the operator keeps the taste decisions - seats research and present options, the human picks.

## Step 4 - on yes, and only on yes

1. Append the row to `roles/employees.yaml`, `status: gated`. Gated is not a formality: it is the honest state of a seat that has never run, and only a run the operator saw moves it.
2. Run `python scripts/agents_sync.py apply` - the seat becomes an addressable agent file the operator can dispatch by name and instruct by editing the row.
3. Run `python scripts/employee_verdict.py charters` and show its findings in full. A grant wider than the job description claims gets narrowed before anything else happens - the audit is the mechanical half of the hire, and it is never swallowed.
4. Rung 3 legs of the chain: hand off to `skill-creator` to build the skill, with the spec as its brief.
5. Rung 6: add the workflow row to the workflow map (role, workflow, runs when, deterministic stages, judgment stages each with its named check, writes to). The map's rule holds - a row is written only when the workflow is now real, never for an intention.
6. Say back, in one line each: what now exists, what is still manual, and what the first review will look at.

No yes, no write. A "maybe" or a rephrase is a no. And never register a seat as a side effect of building something else - hiring is always its own visible step. Honest scope note: this waiting-for-yes is a procedure this skill follows, not a mechanism that can stop a write - the mechanical checks are the id validation and file-ownership rules in `agents_sync.py` and the charter audit in step 3. That is why the audit runs after EVERY hire instead of being trusted to have been unnecessary.

## Capabilities from outside the OS

Sometimes the right shape needs something not installed - a plugin skill pack, an MCP connector, a tool. **Never install anything silently.** Propose it the way a seat is proposed: what it is, where it comes from (the exact source), what it will be able to read and do once connected, and what would leave the machine. One yes per capability. A capability that arrives without provenance and a passport is a supply-chain hole wearing a helpful face.

## What this skill refuses

- Hiring for a job with no evidence and no explicit operator overrule.
- A blanket tool grant ("run anything") on any row - the charter audit (`python scripts/employee_verdict.py charters`) is run after every hire and its findings are shown, not swallowed.
- Registering anything as `active` - only a run the operator saw does that.
- Building rung 6 when rung 5 answers, or rung 5 when a script answers. When in doubt, hire smaller: firing a seat that earned nothing costs one line; un-building a team costs a weekend.

## Rules

- One hire per pass. A restructure ("redesign my whole team") routes to `employee-review` seat by seat instead.
- Plain language everywhere the operator reads. The row is jargon-free enough that they could read it to a friend.
- Writing rules apply. No em dashes.
