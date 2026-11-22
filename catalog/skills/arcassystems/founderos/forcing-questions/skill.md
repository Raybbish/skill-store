---
name: forcing-questions
description: Pressure-test a new initiative before starting it. Say "should I start this", "is this worth doing", "force me to think this through", or "run forcing questions" (or run /founder-os:forcing-questions). Fires when the founder is about to start something new, expand scope mid-task, or invest time in a fresh idea. Runs six fixed questions that test done state, user pain, smallest ship, replacement cost, urgency, and proof.
why: "Stops new initiatives from starting before the problem, smallest version, and proof are clear - most wasted build time begins with an idea that cannot answer these six questions."
enhance: "Keep context/priorities.md current so the skill can compare this initiative against what is already in flight and surface real conflicts rather than generic caution."
allowed-tools: ["Read", "Write", "Edit"]
mcp_requirements: []
---

# Forcing Questions

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

This is the gate before a new build, offer, content series, process, or product idea starts. The skill tests whether the idea is ready to become work, or whether it should be parked until the founder can state the pain, smallest version, and proof.

## When To Run

- The founder wants to start something new.
- Scope is expanding during an active task.
- A new idea feels urgent but has no external deadline.
- The founder asks whether an initiative is worth doing.

## Pre-Read

Read these files if they exist:

1. `context/priorities.md` - active commitments and what this initiative may replace.
2. `context/decisions.md` - open decisions that may block or bound the idea.
3. Last 50 lines of `brain/log.md` - recent patterns, stalls, and work already in motion.
4. `brain/decisions-parked.md` - parked ideas that may already cover this.

If a file is missing, continue and name the gap in the verdict.

## The Six Questions

Ask all six in one block. Do not answer them for the founder. Do not add a seventh.

```text
INITIATIVE: <one-line initiative>

1. DONE
What does done look like in one sentence?
No process language. A finished state.

2. PROBLEM
What problem is this actually solving? Who feels it today, by name or role?
If you cannot name a person or role who feels the pain right now, that is the answer.

3. SMALLEST VERSION
What is the smallest version you would ship by end of this week?
Not the v1 plan. The thing that proves the idea is real.

4. WHAT IT REPLACES
What existing thing does this replace, displace, or duplicate?
If nothing, the system gets larger. Larger systems cost more to run. Justify it.

5. COST OF DOING NOTHING
If you do not start this for 2 weeks, what breaks?
Specific revenue lost, client risk, dated window, or operational cost. If nothing breaks, the urgency is internal.

6. PROOF
What is the one metric or signal that proves this worked 30 days from now?
Not "we will know." A specific observable.
```

## Verdict Logic

After the founder answers, score the initiative.

| Rule | Trigger | Verdict |
|---|---|---|
| Vague done | Q1 contains start, begin, explore, look at, or similar process words without an end state | RED - sharpen Q1 first |
| Phantom user | Q2 names no real person, role, or signal | RED - find the user before building |
| Scope creep | Q3 is the same as Q1 or longer than 3 lines | AMBER - cut the smallest version smaller |
| Pure addition | Q4 says nothing is replaced and this expands an existing area | AMBER - the system gets larger |
| False urgency | Q5 names a deadline without a dated event, contract, or person driving it | AMBER - urgency is internal until proven otherwise |
| Internal urgency | Q5 only references anxiety, restlessness, fear, or curiosity | AMBER - park or run a tiny test |
| Vague proof | Q6 cannot be checked without asking the founder how it feels | AMBER - choose a visible signal |

If 0 RED and 0 AMBER: GREEN. Ask the founder: "Capture this initiative in `context/priorities.md` and log to `brain/log.md`? (yes / no)". If yes, write both files. If no, stop - reads only.

If 1+ AMBER and 0 RED: PROCEED WITH CAUTION. Recommend a one-week trial with a hard kill date.

If 1+ RED: PARK. Ask the founder: "Write a parked decision to `brain/decisions-parked.md` with the failed answers as the reason? (yes / no)". If yes, write the file. If no, stop - reads only.

## Output Format

```text
Forcing questions on: <initiative>
Run at <YYYY-MM-DD HH:MM>

Q1 DONE:               <one line>
Q2 PROBLEM:            <one line>
Q3 SMALLEST:           <one line>
Q4 REPLACES:           <one line>
Q5 BREAKS IF NOT:      <one line>
Q6 PROOF:              <one line>

Verdict: GREEN | PROCEED WITH CAUTION | PARK
Reason: <rules that fired>
Next action: <one specific next step>
```

## Rules

- Read-only during the question loop (until verdict is rendered).
- Verdict writes (priorities.md, log.md, decisions-parked.md) are gated on a yes/no confirmation. Never auto-write without asking.
- Never lower the bar because the founder pushes back.
- Do not skip a question.
- No em dashes, no en dashes, no banned words.
- This is a forcing function, not a coaching session. State the rule that fired.
