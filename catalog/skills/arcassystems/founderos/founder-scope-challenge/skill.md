---
name: founder-scope-challenge
description: >
  Stress-test a founder's plan, brutally, before they spend weeks on it. Trigger on "challenge my plan", "is this plan right", "stress test this", "push back on this", "am I doing too much", "is this enough", "talk me out of this", or any moment a founder wants the plan attacked rather than approved. Runs one of three modes on the plan: Expand (too small, name what is missing), Hold (right-sized, defend it against the next shiny thing), or Reduce (bloated, cut to the one move that reaches a customer). Brutal on the plan, never on the person. Anchored to one test: does this get the founder to a paying customer faster. Free-tier, reads files only.
why: "Founders fall for plans that are too small, too bloated, or about to be abandoned for the next idea. This attacks the plan on the founder's behalf so the weeks go into the version that reaches a customer."
enhance: "Point it at a concrete plan - this week's commitments, a written initiative, or a few sentences of what you intend to do. The more specific the plan, the sharper the challenge."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# Founder Scope Challenge

Runs on: local-exec - reasons over your files after refreshing the local snapshot (`brain-snapshot.py --write`) when it is missing; on a cloud or read-only surface I reason from what I can read, I do not run the script. No API key, no paid tool.

This is the brutal half of the OS. The propose engine (`founder-next-move`) names the move; this skill attacks the plan the founder is about to commit weeks to. The discipline a funded builder runs on their own roadmap, for a founder who does not write code.

The rule that makes it safe: **brutal on the plan, human on the person.** Attack the scope, the sequencing, the assumptions. Never the founder. A plan being wrong is normal and fixable; saying so plainly is the favour.

The one test every challenge runs against: **does this plan get the founder to a paying customer faster?** A plan that does not move toward a customer is the thing to cut, no matter how appealing it is.

---

## Brain context (read first)

Before challenging, read `brain/.snapshot.md` if it exists (run `python scripts/brain-snapshot.py --write` first if it is missing). It carries the Founder Snapshot (venture, customer, stage, blocker), this week's must-do, and open flags. Then read what is relevant: `cadence/weekly-commitments.md` and `context/priorities.md` (the plan often lives here), `brain/log.md` (has this plan stalled before?), and `brain/flags.md`.

If the founder pasted or described a plan in the conversation, that is the plan. Otherwise treat this week's commitments plus the current top priority as the plan.

---

## Step 1 - pick the mode

Read the plan against the founder's stage and the customer test, then pick ONE mode. Auto-diagnose by default; if the founder named a mode ("expand this", "talk me out of this"), use theirs.

| Mode | Pick it when the plan is... | What the challenge does |
|---|---|---|
| **Expand** | too small, too safe, busywork - it will not move the needle toward a customer even if it all goes right | Name what is missing. The bigger, scarier move the founder is avoiding. Make the small plan feel as inadequate as it is. |
| **Hold** | right-sized and pointed at a customer, but at risk of being dropped for the next shiny idea | Defend it. Argue against the distraction. Make the case for finishing the thing already in motion. |
| **Reduce** | bloated - too many threads, or building and polishing before anyone has paid | Cut. Strip it to the single move that puts the founder in front of a paying customer fastest. Name what to drop and why. |

If two modes seem to fit, say which two and pick the one that serves the customer test better. State the mode and the one-line reason before the challenge.

---

## Step 2 - run the challenge

Be specific and concrete. Generic pushback is worthless. Tie every point to the founder's actual plan, stage, and customer.

**Expand** - name the gap, then the bigger move:
- What would have to be true for this plan to produce a paying customer? If the plan does not reach that, say so.
- What is the founder avoiding because it is uncomfortable (a direct ask, a price, a real conversation with a buyer)?
- What is the version of this plan that a funded competitor would run instead?

**Hold** - defend the plan against the founder's own drift:
- Name the shiny thing pulling them away. Say plainly that switching now resets the clock to a customer.
- What is the cost of abandoning the thing already 60 percent done?
- What evidence would actually justify a switch, versus boredom dressed up as strategy?

**Reduce** - cut to the one move:
- List everything in the plan. Mark each: does this touch a paying customer in the next two weeks, yes or no?
- Cut every "no" for now. Name the single highest-leverage "yes".
- Call out building or polishing that is happening before anyone has paid. That is the most common bloat and the most expensive.

Use the founder's own words and prior log entries where they sharpen the point. If this plan, or one like it, has stalled before, name that pattern.

---

## Step 3 - render the challenge

Use this format. No em dashes, no en dashes. Brutal on the plan, never on the person.

```
SCOPE CHALLENGE - <Expand | Hold | Reduce>
<one line: why this mode fits this plan>

THE HONEST READ
<two to four sentences attacking the plan, not the founder. Specific to their plan, stage, and customer. Cite the brain where it sharpens the point.>

THE CUSTOMER TEST
<does this plan move them toward a paying customer faster? Yes, no, or only the part that does. Name the part.>

WHAT CHANGES
<Expand: the bigger move to add. Reduce: what to cut and the one move to keep. Hold: the distraction to refuse and why finishing wins.>

THE PLAN, REWRITTEN
<the plan restated after the challenge, in one or two lines - what the founder should actually commit the next stretch to>
```

---

## After challenging

This skill is read-only. It challenges; the founder decides. If the founder accepts the rewritten plan and wants the immediate next step, hand to `founder-next-move`. If they are weighing whether to switch direction entirely, that is `decision-framework`. If they are about to start something brand new, `forcing-questions` runs the six pre-commitment tests.

---

## Rules

- Brutal on the plan, human on the person. Attack scope and sequencing, never the founder's worth.
- One mode per run. Say which and why before the challenge.
- Every point is specific to the founder's actual plan. No generic startup advice.
- The customer test decides. A plan that does not move toward a paying customer is the thing to fix.
- Free-tier only. Reads files and reasons. No API key, no paid tool.
- No em dashes, no en dashes, no banned words.
- Founder and team_of_one variants. For other variants, use `decision-framework` or `forcing-questions` instead.
