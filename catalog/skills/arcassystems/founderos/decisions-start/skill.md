---
name: decisions-start
description: >
  The front door to the Decisions pack: get unstuck when you cannot decide, cannot prioritise, or have lost the thread. Trigger on "help me decide", "cut my list to one", "I'm overwhelmed", "I'm stuck", "what should I do", "help me think this through", "should I start this", "where do I stand", or any open-ended request where the user is blocked on a choice or a list rather than on a specific task. You name the block; the OS reads your own files, then routes you to the move that clears it: weigh a real choice, gate a new idea, cut an overloaded list to one thing, read the state of your whole OS, or run the weekly reset. One honest disclaimer, reasoning only, and the call stays yours. Routes to decision-framework, forcing-questions, priority-triage, queue, strategic-read, strategic-analysis, or weekly-review depending on the block.
why: "A founder running alone has no chief of staff to think with, so decisions stall and lists grow until everything feels urgent. This is the one entry that reads which kind of stuck you are and routes to the move that clears it, instead of making you name the right skill while overwhelmed."
enhance: "Keep context/priorities.md, brain/flags.md, and cadence/weekly-commitments.md current. The decision skills read your real state, so the more honest those files are, the sharper the call they help you reach."
summary: "Name the block; the OS reads your own state and routes you to the move that clears it."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# Decisions Start

Runs on: reasoning - this skill reads your own operating files and routes you to the member skill that clears the block. It reasons over what you already hold; it makes no external call and it does not make the decision for you. On a read-only or cloud surface, it explains the same route from the files it can read.

This is the front door for being stuck. There are a few kinds of stuck and they need different moves: a real choice between options, a shiny new idea you cannot tell is worth it, a list so long everything feels urgent, or a fog where you have lost the thread of where you stand. This skill reads which one you are in and points you at the move that clears it.

The principle: do the thinking with you, not for you. The OS reads your own state and structures the call; it never pretends to know your gut, your risk appetite, or what you can live with. It surfaces the decision clearly. You make it.

## The kinds of stuck

| You are | What it means | Where it routes |
| --- | --- | --- |
| **Weighing a choice** | a real decision between named options | `decision-framework` |
| **Tempted by something new** | a shiny idea you cannot tell is worth starting | `forcing-questions` |
| **Drowning in a list** | too many things, everything feels urgent | `priority-triage` (cut to one) |
| **Capacity-blind** | unsure what is actually on your plate right now | `queue` (the 3-item cap) |
| **Lost the thread** | you do not know where you stand across the whole OS | `strategic-read` |
| **Sizing a market or rival** | a strategic read of an opportunity or competitor | `strategic-analysis` |
| **Due a reset** | the week has drifted and needs a retro and re-plan | `weekly-review` |

Not sure which? Say "I'm just stuck" and the OS asks the one sorting question (is it one decision, one too-long list, or a general fog) and routes from your answer. When in doubt it runs `strategic-read` first, because seeing where you stand usually names the block for you.

## Read the state before routing

The route is only as good as what it knows. Before choosing, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one. The open-flags block tells you what is stuck, the must-do block tells you what this week is actually about, and the patterns block tells you what keeps happening - a front door that routes without them is a cold start at the exact moment the user is deciding whether this OS knows them. If Python is unavailable, route from the files you can read and say so.

## The flow

### 1. Read the state first

Before asking anything, read your own files: `context/priorities.md` for what is rolling, `brain/flags.md` for what is open, `cadence/weekly-commitments.md` for this week, `context/decisions.md` for what is already parked. The block is often visible there before you describe it.

- **Cold install** (no priorities, no flags): route on what they tell you, and note that the decision skills get sharper as those files fill.
- **A populated OS**: use it. If five priorities have rolled three weeks, that is the block, route to `priority-triage` and say why.

### 2. One honest disclaimer

Before routing, say one true thing and only one:

> I can structure this and read it against your own files, but I do not make the call and I do not know your gut. I will lay the decision out clearly, name the trade-offs, and where I lean I will say so and give you the counter-case. The choice stays yours.

Never imply the OS decides for the user. It frames; they choose.

### 3. Route to the move

- **Weighing a choice** -> `decision-framework`, which tests options against time, energy, regret, and reversibility.
- **Tempted by something new** -> `forcing-questions`, the six-question anti-shiny-object gate before anything new gets started. It can park the idea cleanly if it does not pass.
- **Drowning in a list** -> `priority-triage`, which runs four filters and cuts the list to the one thing that matters now.
- **Capacity-blind** -> `queue`, which shows what is moving and enforces a hard cap of three active items.
- **Lost the thread** -> `strategic-read`, the five-section state-of-the-OS report (identity, commitments, decisions, flags, next moves), read-only.
- **Sizing a market or rival** -> `strategic-analysis`, which grounds a competitor map, market sizing, or opportunity read in your actual position.
- **Due a reset** -> `weekly-review`, which runs the retro and rolls the sprint.

Follow the skill you route to for the actual run. This skill hands off; it does not re-run the reasoning itself.

### 4. Deliver the clarity, not a file dump

When the routed skill finishes, frame the result as the block cleared: here is the decision laid out, here is the one thing to do now, here is where you stand. If the move wrote to your files (a parked decision, a re-cut priority list, a rolled sprint), say what changed.

### 5. Offer more than they asked

After delivering, name the adjacent move in one line. "You came to decide. If the wider list is the real weight, I can cut it to one thing. If you want the whole picture, a strategic read shows where you stand in five sections." Invite, never gate. If they say no, stop cleanly.

### 6. Bias honesty (built in)

When the OS leans toward an option, it says so out loud, attaches the counter-case and a confidence level, and names what evidence is missing. It never claims a bias-free answer, because none exists. If it is agreeing mainly because it is your plan, it flags that. This is how the decisions stay yours and honest, not rubber-stamped.

## Honest positioning (say this, do not oversell)

Lead with the defensible truth: the OS reads your own state, structures the decision, and gives you the counter-case, with no extra service or key, and nothing goes to anyone but the Claude session you are already in. It is the thinking partner a solo founder does not have, not an oracle.

Be honest about the limits: it does not know your risk appetite or what you can live with, it cannot see what you have not written down, and it will not make an irreversible call for you. It clears the block so you can decide; the decision is yours.

## When NOT to use

- When the user already named the move ("run the forcing questions", "give me a strategic read", "run my weekly review") - route straight to that skill; the front door is for the open-ended "I'm stuck".
- For a specific task that is not actually a decision. If they know what to do and just need it done, route to the skill that does it, not here.

## Files this skill routes to

- `skills/decision-framework/SKILL.md` - weigh a real choice.
- `skills/forcing-questions/SKILL.md` - gate a new initiative before it starts.
- `skills/priority-triage/SKILL.md` - cut an overloaded list to one thing.
- `skills/queue/SKILL.md` - the 3-item capacity cap.
- `skills/strategic-read/SKILL.md` - the five-section state-of-the-OS report.
- `skills/strategic-analysis/SKILL.md` - market and competitor reads.
- `skills/weekly-review/SKILL.md` - the weekly retro and sprint roll.
- `skills/decisions-pack.md` - the pack manifest, with the full member map.
