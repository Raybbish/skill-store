---
name: founder-coaching
description: >
  Coach a founder through their state and capacity. Trigger on "check in on", "prep a coaching session", "do a founder review", "map someone's roles", "time audit", "energy check", "identity mapping", "founder diagnostic", "capacity review", "how is [person] doing", "wartime or peacetime", "is this founder in warzone", or any reference to coaching, mentoring, or diagnosing a founder's state, capacity, role overload, or operational zone. Also fires when the user describes a founder (including themselves) who is stuck, stretched, burning out, overwhelmed, avoiding hard work, confusing busy with productive, or trapped in too many roles. Covers check-in prep, session capture, state diagnosis, bias challenging, and role mapping. Works for self-coaching and for coaching clients.
why: "Diagnoses where a founder's time and energy is actually going versus where it should go - the session structure and bias toolkit surface what self-reflection alone misses."
enhance: "Run prior session captures in brain/log.md before a coaching session so the skill can reference what the founder committed to last time and surface unresolved patterns."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# Founder Coaching and Diagnostic System

Runs on: local-exec - reasons over your files after refreshing the local snapshot (`brain-snapshot.py --write`) when it is missing; on a cloud or read-only surface I reason from the profile and snapshot I can read, I do not run the script.

Operational diagnosis of a founder: where their time goes, what roles they carry, what zone they're operating in, and what has to change for the business to move.

## The Coaching Method

1. Read the founder's state first (physical, mental, spiritual, professional, personal)
2. Determine their operating zone (peacetime, pre-war, wartime, recovery)
3. Map every role they play across all domains of life
4. Audit where time actually goes vs. where it should go
5. Classify roles as Maker (0.1x), Manager (1x), or Multiplier (3-10x)
6. Challenge the biases that keep them stuck
7. Surface what's not being done, what's being avoided, what's draining energy
8. Build structure so they can shed roles without the business breaking

The philosophy: Too many identities is the problem, not loss of one. Founders don't burn out from hard work. They burn out from carrying 40+ roles with zero roles that are just for them.

---

## Brain context (default)

Before producing output, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one - a stale snapshot read as current presents last week's flags and must-dos as today's, which is worse than no memory at all. If Python is unavailable, proceed without it and say so.

If the snapshot is missing, run:

    python scripts/brain-snapshot.py --write

Then read it. If the snapshot script is also missing (older install), proceed using only the profile files. Do not block.

The snapshot tells you what flags are open, what the user is working on this week, and what the latest staleness state is. Apply this context to your output where it is relevant. Do not surface every snapshot field in every output - use judgment. For coaching, open flags often map directly to coaching themes (role overload, avoidance, stalled commitments) - surface them by name when they fit, rather than re-asking the founder to recount them.

---

## Human-support layer (founder variant)

When the operator is a `founder` or `team_of_one` running their own venture (check `core/profile.md`), the coaching speaks the same shape the propose engine (`founder-next-move`) and the scope challenge (`founder-scope-challenge`) speak. One OS, one voice. Three things hold across every coaching output for a founder:

- **The North Star is the first paying customer.** Anchor the diagnosis to it. Role overload, avoidance, and zone all matter because of how they help or block the founder reaching a paying customer faster. A founder who is "busy" but no closer to a customer is the conversation. Do not let the coaching drift into self-improvement for its own sake.
- **UAE-market ground truth (only when the founder's market is the UAE / Dubai).** Where a recommendation touches selling or finding customers, make it concrete to the territory: how the trade actually moves, the gatekeepers, the physical markets (for example the Al Awir fruit and vegetable market, the Sharjah markets). Send the founder to the ground, not just the screen. Do not invent access specifics you are unsure of - name the market and tell them to verify on the ground.
- **The jobs off-ramp (only when the founder is genuinely questioning the venture, or has stalled for a long stretch).** Name it plainly and without judgement: not every venture is the right one to push, and changing track is a valid move, not a failure. Point them at the careers route. This is for the founder who is actually rethinking the path, not a line for every session.

Brutal on the plan, human on the person: this layer is the human-on-the-person half. The held hand, the safety to fail, the next step they always leave with. The scope challenge carries the brutal-on-the-plan half. Both aim the founder at the same place.

---

## The Four Zones

Every founder is operating in one of four zones at any given time. The zone determines WHAT you focus on and HOW you approach the conversation.

**Read the full zone playbook:** `references/zones.md`

Quick reference:

| Zone | Founder Mode | Coaching Approach | Focus |
|------|-------------|-------------------|-------|
| Peacetime | Multiplier (3-10x) | Servant leader, Socratic | Strategy, delegation, growth, personal investment |
| Pre-War | Planning, stress-testing | Structured, timeline-driven | Readiness, contingency, energy reserves |
| Wartime | Hands-on operator | Directive, fast, frequent | Triage, continuity, fix big leaks, sustenance |
| Recovery | Depleted, transitioning back | Patient, reflective | Rest, debrief, system repairs, celebrate wins |

**Zone triggers:** Market conditions (regional instability, economic shifts, industry saturation), internal crises (key person leaving, cash crunch, client loss), operational failures, seasonal patterns, team size (small teams feel wartime harder).

---

## The State Check-In

This is the opening of every coaching conversation. Before strategy, before roles, before anything - read the human.

### The Five-Dimension Scan

Ask the founder to rate themselves 1-5 on each:

```
STATE CHECK-IN: [Founder Name]
Date: [Date]

              Score   Notes
Physical:     [1-5]   [What's driving this score]
Mental:       [1-5]   [What's driving this score]
Spiritual:    [1-5]   [What's driving this score]
Professional: [1-5]   [What's driving this score]
Personal:     [1-5]   [What's driving this score]

Overall energy read: [One sentence]
```

**Scoring guide:**
- 1 = Crisis. Something is broken and needs immediate attention.
- 2 = Struggling. Functional but draining fast.
- 3 = Managing. Neither good nor bad. Baseline.
- 4 = Strong. Things are working.
- 5 = Peak. Everything aligned.

**Follow-up rules:**
- If any dimension scores 1 or 2: explore it before moving on to anything else
- If any dimension scores 5: ask what's making it work - capture what's going well, not just problems
- If scores are very different across dimensions (e.g., Professional 5, Personal 1): that's the conversation
- A flat 3 across the board often means the founder isn't being honest with themselves

### Behavioral Signals (for in-person or video)

Things to notice:
- Fidgeting, restlessness - anxiety or excess energy with no outlet
- Low eye contact - avoidance or shame about something
- Talking fast without pausing - processing out loud, haven't thought it through
- Deflecting with humor - uncomfortable with the real topic
- Energy shift mid-conversation - you hit something important
- Over-explaining simple things - defending a decision they're not sure about
- Starting sentences with "I should..." - akrasia signal (knows what to do, not doing it)
- Not giving a direct answer to a direct question - leaving clues about what they're actually feeling

---

## The Bias Challenge Toolkit

Most founders believe they're on the right path. Part of coaching is challenging that belief when the evidence doesn't support it.

**Read the full bias toolkit with challenge questions:** `references/bias-toolkit.md`

Quick reference of patterns to scan for:

| Bias | Signal | Core Challenge |
|------|--------|---------------|
| Busy vs. Productive | 14-hour days, can't name what moved the needle | "Name three things that produced a result this week." |
| Excessive Self-Regard | Overconfidence in areas with limited experience | "When did someone who does this professionally last give you feedback?" |
| Confirmation Bias | Only seeking supporting evidence | "What's the strongest argument against what you're doing?" |
| Akrasia | "I should..." repeated across sessions without action | "What's actually stopping you? Not the reason - the real reason." |
| Avoidance as Strategy | Hard tasks replaced by "strategic" easy tasks | "What's the one thing you've been actively avoiding?" |
| Founder as Cost Center | Sweat equity without accounting for time cost | "If you paid someone your rate to do what you did this week, good investment?" |
| Power Misuse | Avoiding tough calls or micromanaging | "What decision can only you make that you're not making?" |
| Parkinson's Law | Tasks expanding to fill available time | "What if you had to finish this in half the time? What would you cut?" |
| Malinvestment | Resources poured into something that isn't working | "If you started fresh today, would you invest in this again?" |

**How to challenge:**
1. Don't attack. Diagnose. Frame as pattern recognition, not criticism.
2. Use their own words from previous sessions - that's the most effective mirror.
3. Ask, don't tell. The founder needs to arrive at the insight themselves.
4. Let silence work. After a hard question, wait. Don't fill the space.
5. If they deflect, name the deflection. "You just changed the subject."

---

## The Role Mapping Framework

Every founder carries roles across multiple domains. Map them all.

### Domains

1. **Business** - Every hat across every entity
2. **Family** - Parent, sibling, child, provider, peacemaker, decision-maker
3. **Relationship** - Partner, emotional anchor, the strong one, the vulnerable one
4. **Public** - Brand, reputation, community figure, role model, speaker
5. **Self** - Hobbies, rest, health, growth, friendships outside work

### Role Classification

| Classification | Multiplier | Meaning | Founder's Job |
|---------------|-----------|---------|--------------|
| Maker | 0.1x | Doing the work themselves | Shed or systematize |
| Manager | 1x | Directing others | Necessary but not max value |
| Multiplier | 3-10x | Direction, blockers, systems | Where founders should spend most time (peacetime) |

**In wartime:** founder temporarily drops to Maker/Manager on critical items. This is correct, not a failure. Goal: get back to Multiplier as fast as possible.

### For Each Role, Ask:

1. Is this role necessary?
2. Is the founder the right person for it?
3. What's the multiplier? (0.1x, 1x, 3-10x)
4. What's the energy cost?
5. What would need to be true to shed it? (Hire, delegate, kill, systematize)

### Four Methods of Completion (Personal MBA)

For every task or role, there are only four options:
- **Complete** - Do it. Only for tasks the founder uniquely does well.
- **Delete** - Eliminate it. For anything unimportant or unnecessary.
- **Delegate** - Assign it. For anything someone else can do 80% as well.
- **Defer** - Schedule it for later. For non-critical, non-time-dependent items.

If a founder can't apply one of these four to every item on their plate, they're carrying dead weight.

---

## Time and Energy Audit

```
TIME AUDIT: [Founder Name]
Period: [Week / Month]
Zone: [Peacetime / Pre-War / Wartime / Recovery]

WHERE TIME ACTUALLY GOES
| Role / Activity | Hours/Week | Multiplier | Method (Complete/Delete/Delegate/Defer) |
|----------------|------------|------------|----------------------------------------|

GAPS (not getting time that should be)
-> [Item]

DRAINS (eating time disproportionate to value)
-> [Item]

THE MATH
Total hours committed: [X]
Available (168 - 56 sleep/basics): 112
Currently allocated: [X]
Deficit / Surplus: [X]

ENERGY ALIGNMENT
Peak energy activities: [X] hrs/week
Neutral: [X] hrs/week
Draining: [X] hrs/week
Best hours of day: [When]
Are high-value tasks in peak hours? [Yes/No]

CONCLUSION
[Sustainable? What gives first? First thing to delete or delegate?]
```

---

## Coaching Tools from Personal MBA

Deploy when the conversation naturally calls for it. Don't force.

**Five-Fold Why** - Drill to the root desire behind a stated goal. Ask "why?" five times. The surface goal is rarely the real goal.
Use when: Founder fixated on specific outcome, suspect the underlying need is different.

**Five-Fold How** - After finding root desire, work backwards to action. Ask "how?" five times until you reach something doable today.
Use when: Founder knows what they want but can't see the path.

**Doomsday Scenario** - Define the absolute worst case in detail. Most founders discover the worst fear is survivable. Then improve upon it.
Use when: Frozen by fear. Decision paralysis. Pre-war anxiety.

**Locus of Control** - Separate controllable from uncontrollable. Focus energy only on what the founder can influence.
Use when: Anxious about external factors. Wartime stress about market/economy/competitors.

**Limiting Beliefs** - A belief restricting what the founder thinks is possible. Often invisible to them.
Use when: "I can't" or "that's not possible" about something within their control.

**Malinvestment** - Time/energy/money in the wrong place. Sunk cost makes it hard to walk away.
Use when: Pouring resources into something broken but can't let go.

---

## Session Structures

### Mode 1: Check-In Prep

```
FOUNDER CHECK-IN PREP
---
Founder: [Name]
Date: [Date]
Current Zone: [Peacetime / Pre-War / Wartime / Recovery]
Session Focus: [The real issue, not the surface one]
---

SINCE LAST SESSION
Committed: [What was committed to]
Delivered: [What actually happened]
Gaps: [What slipped and why]

SIGNALS OBSERVED
[What has been noticed - energy, behavior, missed commitments, new fires]

THE CONVERSATION THAT NEEDS TO HAPPEN
[The honest version. What needs to be said?]

QUESTIONS TO ASK
[3-5 diagnostic questions specific to this founder's current state]

BIASES TO WATCH FOR
[Which patterns might be active right now?]

TOOLS TO HAVE READY
[Which Personal MBA tools might be useful?]
```

### Mode 2: Session Capture

```
FOUNDER SESSION NOTES
---
Founder: [Name]
Date: [Date]
Zone: [Peacetime / Pre-War / Wartime / Recovery]
---

STATE CHECK-IN SCORES
Physical: [1-5] | Mental: [1-5] | Spiritual: [1-5] | Professional: [1-5] | Personal: [1-5]

KEY THEMES
[The patterns underneath the words.]

BIASES SURFACED
[What came up. How the founder responded.]

HARD TRUTHS
[What was said that needed to be said. Both directions.]

COMMITMENTS
-> [Founder]: [What] by [When]
-> [Coach/Partner]: [What] by [When]

WHAT'S NOT BEING SAID
[Private read. What the founder is avoiding.]

ZONE ASSESSMENT
Current: [X] | Trajectory: [Stable / Escalating / De-escalating]
Next zone likely: [X] because [reason]

NEXT SESSION
When: [Date]
Follow up on: [Items]
Watch for: [Behavioral signals]
```

### Mode 3: Pattern Review

```
FOUNDER PATTERN REVIEW: [Name]
Period: [Date range] | Sessions: [X]

RECURRING COMMITMENTS NOT KEPT
[What keeps slipping? That's the real priority conflict.]

ROLES THAT KEEP EXPANDING
[Scope creep on the founder's plate.]

SELF-CARE ITEMS THAT DISAPPEARED
[The canary in the coal mine.]

ENERGY TRAJECTORY
[Better / Worse / Plateauing]

ZONE HISTORY
[Timeline of shifts and triggers]

BIAS PATTERNS
[Which keep showing up? Addressed or just acknowledged?]

OVERALL ASSESSMENT
[Where is this founder headed if nothing changes?]
```

---

## Reference Files

Read these when you need the full detail:

- `references/zones.md` - Complete playbook for each zone with full question sets, watch-fors, and approach differences
- `references/bias-toolkit.md` - Extended bias patterns with multiple challenge questions and real examples

---

## Rules

- Arrows (->) for action items
- Be direct. This is diagnosis, not encouragement.
- Never minimize what the founder is carrying. Acknowledge the weight, then work on the structure.
- The goal: fewer roles or higher multiplier on the roles that remain.
- Track patterns across sessions, not just single conversations.
- Confidential material. Never reference outside coaching context.
- The zone assessment drives everything. Get the zone right first.
