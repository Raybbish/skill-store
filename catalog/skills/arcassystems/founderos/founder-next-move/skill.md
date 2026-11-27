---
name: founder-next-move
description: >
  Propose the single highest-leverage next move. For a founder it aims at their next paying customer; for an operator running a role inside a company it aims at the outcome they own for whoever is waiting on it. Trigger on "what should I do next", "what's my next move", "where do I push", "I don't know what to do next", "give me one thing to do", or any moment the operator wants the OS to decide the next step instead of listing options. Also fires on the raw idea pitch: "I have an idea", "is this a good idea", "help me validate my idea", or a first-time founder describing an everyday problem and a solution they want to build. Reads the brain (the Founder or Role Snapshot, the log, the pipeline), works out where they actually are, picks the one move with the most leverage, and closes with three things they can do today (one big, two small). Free-tier; writes nothing to your operating files.
why: "A person drowning in options does not need a list, they need one move. This reads where they actually are and names the single thing with the most leverage - toward a paying customer for a founder, toward the outcome they own for an operator - with a step small enough to start today."
enhance: "Keep brain/log.md current - the stage read and the move both sharpen when the log shows what the founder did this week."
allowed-tools: ["Read", "Bash(python scripts/brain-snapshot.py:*)", "Bash(python scripts/agent_runs.py:*)"]
mcp_requirements: []
---

# Founder Next Move

Runs on: local-exec - reasons over your files after refreshing the local snapshot (`brain-snapshot.py --write`) when it is missing or stale; on a cloud or read-only surface I reason from the snapshot or identity files I can read, I do not run the script. No API key, no paid tool.

This is the propose engine. The OS surfaces the operator's state everywhere else; this is the one place it says "therefore, do this." It reads the brain, decides where they are, and names the single highest-leverage move. It always ends with a step small enough to start today, so nobody leaves with a blank screen.

The North Star depends on who is operating, and the identity role decides it:

- **founder / team_of_one:** **move this founder to their first paying customer faster.** If they already have one, the next one. Nothing the OS proposes is for its own sake; it is for the customer.
- **operator (a person running a role inside a company):** **keep the work they own moving, in front of the person waiting on it.** The customer of an operator's work is whoever they answer to and whoever that work serves. Same compression, same three-step close; the aim point changes.

---

## When the input is a raw idea ("I have an idea for...")

The message that triggers this skill is often the pitch itself: a first-time founder - sometimes a student - describing an everyday problem and a solution, the way they would to any chatbot. Treat that message as brain material, not as a request for a lecture:

- **Parse the pitch the way the setup wizard parses a ramble.** The problem they describe is the customer clue, the solution is the venture, and their own words are the stage evidence - almost always `pre-idea` or `idea-validation`. Offer to capture it in one line ("logging this as your venture - say no to keep it out"), then run the engine as normal.
- **Do not return a startup course, a business plan, a SWOT, or a feature list.** The stage table below already says what an idea needs next: real people with the problem, talked to this week, before anything gets built. That is the move.
- **Say it in their vocabulary.** "Talk to five people who wear glasses in humid weather and ask what they do about the fog" beats "conduct customer discovery interviews". The move must be something they could start today with a phone and no money.
- **A thin or missing snapshot is already handled** by Step 1: the capture move IS the move. Never a blank screen, never an invented plan, and never a refusal that sends a first-timer back to a generic chatbot.

---

## Brain context (read first)

Before proposing, read `brain/.snapshot.md` if it exists. If it is missing, or its `date:` line is more than 3 days old, run:

    python scripts/brain-snapshot.py --write

Then read it. A stale cache read as current is how a proposal ends up aimed at last month's state, so the date check is not optional. If the snapshot script is also missing (older install), read `core/identity.md` directly. Do not block - a thin read still proposes.

The snapshot carries the identity snapshot block - `## Founder Snapshot` (venture, customer, stage seed, biggest blocker) or `## Role Snapshot` (scope, answers to, yours to own, not yours to decide, blocker) - plus the operator's active working preferences, open flags, this week's must-do, and recent decisions.

**The `## Working preferences` block in the snapshot is a gate on this output, not context.** This skill produces the thing operators correct most, because it tells them what to do. If a row says they want the call made rather than a menu, the three-option close still runs (it is the rule) but the recommendation is stated flat, with no hedging around it. If a row says short answers, cut WHY THIS, NOW to two sentences. Apply the rows silently and never mention the file. A preference this engine ignores is a correction the operator has to give twice, and this is the surface where that is most likely to happen. If `brain/.snapshot.md` is unavailable, read `core/working-preferences.md` directly; if that is missing too, carry on without it.

Then read, in this order, skipping what is missing:

1. `core/identity.md` - the snapshot block (source of truth if `brain/.snapshot.md` is stale) and the `## Basics` location (drives the UAE ground-truth layer below).
2. `core/profile.md` - what the OS leads with. Context only, never a gate. The gate for this engine lives in `core/identity.md` and passes on either of two shapes: a `## Founder Snapshot` block plus a `**Role:**` of `founder` or `team_of_one` under `## Basics`, OR a `## Role Snapshot` block plus a `**Role:**` of `operator` (the identity-layer role from setup, not the profile variant - `team_of_one` is a role and never appears in the variant field). The block decides the path: Founder Snapshot runs the founder path below, Role Snapshot runs the operator path. If an install somehow carries both blocks (a by-hand copy of the full template), the `**Role:**` token decides. When neither shape is present, do not run this engine; point them at `/next` instead.
3. `brain/log.md` - the last 5 to 10 entries. This is how you re-infer the stage (below).
4. `context/clients.md` - active deals, pipeline, last-touched dates.
5. `context/priorities.md`, `cadence/weekly-commitments.md`, `brain/flags.md`, `brain/needs-input.md` - grounding for what is already in flight.

---

## Step 1 - is the brain functional?

**Operator path (Role Snapshot present):** the brain is functional the moment **Answers to** is real plus at least one of **Scope** or **Biggest blocker**. With those, propose. With scope but no blocker, propose thin and say so, then ask for the one blocker that would sharpen it. With **Answers to** missing, do not guess a move - the move IS capturing it: "I can point you at a real move the moment I know who is waiting on your work. Tell me in one line." Then stop.

**Founder path:** the brain is "functional enough to propose" the moment the Founder Snapshot has a real **customer** and at least one of **stage** or **biggest blocker**. Check the four fields:

- **If customer plus (stage or blocker) are set:** propose a real move (Step 2 onward).
- **If the customer is set but neither stage nor blocker is:** still propose. Read the stage from the venture and the customer, give a thin first move toward that customer, and say plainly it is thin - then ask for the one blocker that would sharpen it. Do not stall on a missing stage when you already know who the customer is.
- **If the customer is not set (only the venture, or all four thin):** do not guess a move. The move IS capturing the missing field. Say: "I can point you at a real move the moment I know [the missing field]. Tell me in one line: who is your first customer? / what is the single thing blocking your next sale?" Then stop. This is the empty-states rule - a thin brain gets a capture move, never a blank screen and never an invented plan.

Propose from thin data when you have the minimum, and say it is thin. Sharpen as the brain fills.

---

## Step 2 - infer the current stage

**Founder path only.** On the operator path there is no venture stage to infer: skip this step and read the state straight from the Role Snapshot, the log, and this week's commitments - what is owed, to whom, and what has gone quiet. Then go to Step 3.

The stage seed in the Founder Snapshot is a starting read, not a fixed label. Re-infer the current stage every run from the log and the pipeline, then say which signal you used. A founder who closed their first sale last week is at `revenue` this morning even if the seed still says `first-customer`.

Six stages, each with the move that has the most leverage toward a paying customer:

| Stage | What it looks like in the brain | The leverage move |
|---|---|---|
| `pre-idea` | venture vague, no named customer | Name one real customer and go talk to five of them this week. No building. |
| `idea-validation` | customer named, no proof anyone will pay | Get one real signal of money: a deposit, a pre-sale, a signed letter of intent, or five problem interviews. Still no building. |
| `building` | making the product, no buyer lined up | Cut scope to the smallest thing one customer would pay for, and line up one pilot buyer in parallel. Building without a buyer in sight is the trap here. |
| `first-customer` | product exists, zero paying customers | Direct outbound to named prospects, or go where the customer physically is. This is the money stage - the North Star bites hardest here. |
| `revenue` | one or a few paying customers | Do it again with a lookalike. Tighten the offer, ask for a referral and a testimonial, find the second and third customer. |
| `mrr-scale` | repeatable revenue, founder is the bottleneck | The constraint is now founder-dependency on the revenue engine. Route to `bottleneck-diagnostic`, but keep the move anchored to winning more customers, not internal polish. |

Pick the stage from evidence. If the evidence is mixed, say so and pick the lower stage - it is safer to propose the earlier move than to assume progress that has not happened.

---

## Step 3 - pick the one move

From the stage, the blocker, and what is already in flight (pipeline, flags, this week's must-do), pick the SINGLE highest-leverage move toward a paying customer. One move, not three. The founder has too many options already - your job is to compress them to one.

Bias the pick toward the territory, not the screen. A founder at `first-customer` is better served by "go stand in the market where your buyer is on Saturday" than "redesign your landing page." Action that touches a real potential customer beats internal work almost every time.

If a deal in `context/clients.md` has stalled with no touch in 7+ days and no blocker, that stalled deal is usually the move - a warm prospect going cold costs the most.

On the operator path the same logic reads sideways instead of outward: the highest-leverage move is almost always the one that lands or unblocks the thing whoever you answer to is waiting on. A commitment gone quiet for 7+ days is the operator's stalled deal, and anything that sits inside "not yours to decide" is never the move - the move there is handing it upward with a recommendation attached.

---

## Step 4 - the human-support layer

Two conditions add to the output. Apply them only when they fit.

**UAE ground truth (only when the founder's location or market is the UAE / Dubai).** Put one or two concrete, territory-level specifics into the move: how the trade actually moves, the gatekeepers, the physical markets (for example the Al Awir fruit and vegetable market, the Sharjah markets), who you have to get past to reach the buyer. Send them to the ground, not just to the inbox. Do not invent specifics you are unsure of - name the market and the move, and tell them to verify the access detail on the ground.

**The jobs off-ramp (only when they signal they are rethinking the whole venture - or, on the operator path, the role itself - or a stage has stalled for a long stretch with no movement).** Name it plainly and without judgement: not every venture is the right one to push, and changing track is a valid move, not a failure. Point them at the careers route. Do not surface this on a normal proposal - it is for the founder who is actually questioning the path.

---

## Step 5 - render the proposal

Use this format. Keep it tight. No em dashes, no en dashes.

```
YOUR NEXT MOVE
<the single move, one or two sentences, clearly toward a paying customer>

WHY THIS, NOW
<two or three sentences. The stage read and why this move has the most leverage toward a customer. Cite the brain - the blocker, the named customer, a stalled deal, an open flag.>

WHERE YOU ARE
Stage: <inferred stage> (<one line: seed, or re-inferred from the log because X>)
Aiming at: your <first / next> paying customer

[Operator path: replace the two lines above with]
Scope: <the part of the job you run, from the Role Snapshot>
Aiming at: the work you own, in front of <who they answer to>

[UAE ground truth - include only when the market is the UAE]
<one or two concrete territory specifics tied to the move>

DO ONE OF THESE - YOU LEAVE WITH A STEP IN YOUR HAND
1. <HIGH: the ambitious version, the one that moves the needle most>
2. <LOW: a 15 to 30 minute step toward it>
3. <LOW: the smallest possible step, something you can do from your phone right now>

[Rethinking the whole thing? - include only when the founder signals a track change or a long stall]
<the jobs off-ramp line, plainly stated, pointing at the careers route>
```

The three-option close is the rule, not a suggestion: one high, two low. The founder must always leave with at least one step small enough that there is no excuse not to start.

---

## After proposing

This skill recommends; the founder acts. It writes nothing to the founder's operating files - the only side effect is refreshing `brain/.snapshot.md` when it is stale or missing. If the founder then does the move, that gets logged through the normal brain-log flow, not by this skill.

If the founder asks "is this the right move" or pushes back on the plan, that is a different job - route to `founder-scope-challenge` to stress-test the plan, or `decision-framework` for a structured choice.

---

## Rules

- One move. Not a menu. The whole point is compression.
- Every proposal cites the brain. No move without a reason drawn from the founder's own files.
- Always end with the three-option close. Never a blank screen, never zero next steps.
- A thin brain gets a capture move, not an invented plan. Do not fabricate a customer, a stage, a manager, or a blocker.
- The North Star is a paying customer for a founder, and the work you own in front of whoever waits on it for an operator. Internal polish is almost never the move on either path.
- Free-tier only. Reads files and reasons. No API key, no paid tool.
- No em dashes, no en dashes, no banned words.
- The gate is identity, not variant: a `## Founder Snapshot` block with the `founder` or `team_of_one` role, or a `## Role Snapshot` block with the `operator` role, in `core/identity.md`. The profile variant never gates this engine. When neither shape is present, point to `/next`.

---

## Record the run (the closing act, when this runs as a seat)

If `roles/employees.yaml` carries the `next-move-caller` row, close with one line so the run leaves a trace whether or not anyone was watching:

    python scripts/agent_runs.py record --seat next-move-caller --trigger "asked for the next move"         --read "brain/.snapshot.md,core/identity.md,brain/log.md" --produced "" --outcome ok

Use `--outcome refused` (with `--could-not "<why>"`) when the brain was too thin to propose and you asked for the missing field instead, and `--outcome failed --could-not "<why>"` when it broke - the script requires the reason for both, so a failure with no reason is never a silent no-record. A refusal is not a failure and the log distinguishes them. Skip this silently if the script or the registry is absent, and never mention it in your reply - it is bookkeeping, not output.
