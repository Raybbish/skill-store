---
name: client-update
description: >
  Write a status update or milestone report for whoever is waiting on the work - a client, or the person you answer to inside a company. Trigger on "update the client", "write a status update", "write my status update", "project update", "send a progress report", "milestone update", "weekly update for", "status for my manager", or any variation of packaging progress for the person waiting on it. Reads `core/voice-profile.yml` and writes in your voice.
why: "Keeps the people waiting on your work informed without the operator writing from scratch each time - consistent format builds trust and prevents the relationship from going silent."
enhance: "Fill core/voice-profile.yml first so the update sounds like you, and keep context/clients.md current with milestone notes so the skill has real project specifics to draw on."
allowed-tools: ["Read", "Write", "Bash(python scripts/check-voice-ready.py:*)", "Bash(python scripts/check-brand-voice-ready.py:*)", "Bash(python scripts/agent_runs.py:*)"]
mcp_requirements: []
---

# Client Update

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

<!-- private-tag: not applicable: writes client-facing deliverable drafts, not user speech to brain/context state files -->

Updates build trust through transparency, not polish.

The recipient is whoever is waiting on the work. For a founder that is usually a client. For an operator running a role inside a company it is a manager, a director, or an internal stakeholder - same skill, same formats, and the header names them instead of a client company. For an internal recipient, read the `## Role Snapshot` in `core/identity.md` (the `Answers to` line) and any notes on them in `context/clients.md` - the clients file is the stakeholder register, whoever the stakeholder is.

## Voice routing (operator or brand?)

Apply the routing rules in `skills/your-voice/SKILL.md`. Default to operator voice. If the update is going out from a brand the operator runs (e.g. an agency client update where the agency is the brand), use brand voice from `brands/<slug>/voice.yml`.

## Before you write

If using operator voice, run: `python scripts/check-voice-ready.py`
If using brand voice, run: `python scripts/check-brand-voice-ready.py --brand <slug>`

If exit code is 1, read the output line and surface it to the user verbatim. Do not produce any draft. Stop.

If the user explicitly chooses to proceed with defaults after seeing that message, write the update using the universal anti-AI baseline from `your-voice` and clearly label that the voice profile was not applied. Do not pretend the update is voice-coupled.

Then read the chosen voice profile so the rest of this skill can apply it.

After producing a draft and before returning it, run the anti-examples filter:

1. Read the `anti_examples.pairs` block in `core/voice-profile.yml`.
2. For each line in your draft, scan for matches against any `bad:` pattern (literal substrings, structural markers like negation-contrast, or rule-of-three lists).
3. If a line matches, rewrite it using the `good:` pattern as the model and the `rule:` line as the constraint.
4. Also reject any line that uses an `aesthetic_crimes` phrase or a `red_flags` pattern.
5. Return the cleaned draft.

Do not surface this filter to the user as a separate step. The user sees only the cleaned draft.

Before drafting, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one - a stale snapshot read as current presents last week's flags and must-dos as today's, which is worse than no memory at all. If Python is unavailable, proceed without it and say so. Use the open-flags block to avoid topics that contradict current operator stance. Use the must-do block to lean the draft toward what the operator is actively working on. Use the voice and brand blocks (if present) to set tone. The freshness check above is not optional: skipping the regeneration and reading a week-old snapshot is the one way this block makes output worse.

If the operator has filled `core/brand-profile.yml`, follow the visual brand for any branded version of the update (PDF, doc, etc.). Plain-text updates do not need brand assets.

If the engagement has a company-specific context file, read it for project specifics, named milestones, and the agreed scope. Check in this order:

1. `companies/<slug>-business.md` (operator path)
2. `companies/prospects/<slug>.md` (prospect path - typically pre-engagement, but the file may exist if this update is going to a prospect you have been tracking)

Prefer the operator file if both exist. If neither exists, proceed without company-specific context and surface a one-line note offering to run the `prospect-init` flow if this is a tracked prospect.

## Core Principles

**Lead with outcomes, not activities.** "Your hiring process now takes 3 days instead of 12" beats "We reviewed and optimised the hiring workflow."

**Bad news travels fast.** If something is off track, say it immediately. Don't bury it.

**Short and structured.** The client should get the picture in 30 seconds of scanning.

**Specific dates, not soft adverbs.** No "soon", no "in the coming weeks". Either commit to a date or admit you don't have one yet.

## Weekly / Regular Update

```
PROJECT UPDATE: [Engagement Name]
Client: [Company Name]
Period: [Date range]
STATUS: [On Track / Attention Needed / Behind]

COMPLETED THIS PERIOD
-> [Outcome]
-> [Outcome]

IN PROGRESS
-> [What's being worked on] - [Expected completion]

COMING NEXT
-> [What's planned]

NEEDS FROM YOU
-> [Decisions, access, feedback needed]
```

## Milestone Update

```
MILESTONE REACHED: [Name]
Date: [Date]

WHAT WE DELIVERED
[2-3 sentences on impact]

DELIVERABLES
-> [Item delivered]

WHAT THIS MEANS FOR YOU
[What changes now]

NEXT MILESTONE
[What comes next, when]
```

## Issue / Delay Communication

```
SITUATION
[What happened. Direct.]

IMPACT
[What this means for timeline or deliverables]

WHAT WE'RE DOING
[Actions to resolve]

REVISED TIMELINE
[New dates if applicable]
```

## Writing Rules

- Simple hyphens (-) not em or en dashes
- Arrows (->) for lists
- Specific dates, not "soon" or "in the coming weeks"
- No padding. If a section has nothing, skip it.
- Apply the operator's voice profile if available. If not, default to plain, direct sentences.

## Self-check before sending

1. Could the client read this in 30 seconds and know status, what's coming, and what they need to do?
2. Is bad news in the first three lines, not the last?
3. Are all dates specific, or is anything hidden behind "soon"?
4. Did you run the result against the universal anti-AI baseline (banned words, em dashes, rule of three, negation-contrast)?
5. If the engagement has a brand profile and this is going out as a PDF or doc, did you use `your-deliverable-template` to apply it?

---

## Record the run (the closing act, when this runs as a seat)

If `roles/employees.yaml` carries the `client-status` row, close with one line so the run leaves a trace whether or not anyone was watching:

    python scripts/agent_runs.py record --seat client-status --trigger "update for one client"         --read "context/clients.md,brain/log.md" --produced "the draft file" --outcome ok

Use `--outcome refused` (with `--could-not "<why>"`) when the voice profile was not set up and no generic draft was asked for, and `--outcome failed --could-not "<why>"` when it broke - the script requires the reason for both, so a failure with no reason is never a silent no-record. A refusal is not a failure and the log distinguishes them. Skip this silently if the script or the registry is absent, and never mention it in your reply - it is bookkeeping, not output.
