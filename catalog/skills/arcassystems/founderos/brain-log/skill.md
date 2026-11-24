---
name: brain-log
description: >
  Capture a thought, flag, or decision into the brain system. Trigger on "capture this", "log this", "flag this", "park this decision", "note this", "remember this", "save this thought", "brain dump", "I had an idea", "something to track", or any variation. Also fires on user-vocabulary equivalents: "journal entry", "note to self", "diary", "log to journal", "add to my journal", "write in my journal" - the brain log is the journal. Also fires on post-hoc decision phrasing: "I decided", "I made a decision", "decision: <text>" - route into context/decisions.md Resolved section, not just brain/log.md. Also fires when the user shares an observation that should be recorded but does not need immediate action. Three modes: log, cross-reference, or act.
why: "Keeps thoughts, decisions, and flags from living only in your head - a running log is how the OS learns what is actually happening in your week."
enhance: "Log in Mode B or C when you can - thoughts cross-referenced to a client, decision, or priority are far more useful to skills like weekly-review and brain-pass than standalone entries."
allowed-tools: ["Read", "Write", "Edit", "Bash"]
mcp_requirements: []
---

# Brain Log

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

Three modes for incoming thoughts, plus flags and parked decisions.

## Routing

When the founder gives you something to capture, determine which mode:

### Mode A: Log and Move On
The thought is worth recording but doesn't connect to anything specific right now.
- Append to `brain/log.md` with timestamp and a stamped ID (see ID Stamping below)
- Tag: `#context`
- No follow-up

### Mode B: Log and Cross-Reference
The thought connects to an existing file or topic.
- Append to `brain/log.md` with timestamp and a stamped ID
- Tag: `#xref:[target-file]`
- Insert a dated note into the referenced file
- Examples: "This changes my priorities" -> xref to priorities.md. "This affects the deal with X" -> xref to clients.md

### Mode C: Log and Act
The thought requires immediate action.
- Append to `brain/log.md` with timestamp and a stamped ID
- Tag: `#acted`
- Take the action (update a file, create a task, move a priority)
- Note what was done in the log entry

**Default:** Infer the mode from context. The founder can override: "just log it" (Mode A), "tie this to priorities" (Mode B), "act on this now" (Mode C).

## Brain context (default)

Before producing output, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one - a stale snapshot read as current presents last week's flags and must-dos as today's, which is worse than no memory at all. If Python is unavailable, proceed without it and say so.

If the snapshot is missing, run:

    python scripts/brain-snapshot.py --write

Then read it. If the snapshot script is also missing (older install), proceed using only the profile files. Do not block.

The snapshot tells you what flags are open, what the user is working on this week, and what the latest staleness state is. Apply this context to your output where it is relevant. Do not surface every snapshot field in every output - use judgment. For brain logging, recent decisions and open flags help you choose the right tag - if a thought connects to an active flag or recent decision, prefer Mode B (cross-reference) over Mode A (log in isolation).

## ID Stamping

Every new entry across the brain channels gets a stable ID at write time. Convention spec: `rules/entry-conventions.md`.

Channel mapping for this skill:

| Target file | Channel |
|---|---|
| `brain/log.md` | `log` |
| `brain/flags.md` | `flag` |
| `brain/decisions-parked.md` | `parked` |
| `brain/needs-input.md` | `need` |
| `brain/patterns.md` | `pattern` |

### Procedure (run before writing any new entry)

1. Compute today's date in `YYYY-MM-DD`.
2. Read the target file. Find every existing ID that matches `<channel>-<today>-<NNN>`.
3. Take the highest `<NNN>`. If none exist for today, start at `001` (the first ID of the day for this channel) and skip to step 5.
4. Increment by 1. Format as 3-digit zero-padded (`001`, `002`, ..., `099`, `100`).
5. The result is the new entry's ID.
6. Stamp it on the new entry.

If `brain/log.md` does not exist or has no entries today, start at `001`.

### Where the ID lives in the entry

For one-line `brain/log.md` entries, append the ID at the end of the heading line in parentheses:

```
### 2026-05-07 #context Got off the call with the prospect (log-2026-05-07-003)
```

For multi-line entries (flags, parked decisions, needs-input, patterns), put the ID on its own line directly under the heading as `id: <id>`. See template format examples in each brain file.

### Counter rules

- Per channel, per day. Resets to `001` each new day per channel.
- IDs are stamped at write time, never retroactively.
- IDs are case-sensitive lowercase only.
- No global counter. Each file resolves its own next ID independently.

## Flags

When the founder says "flag this" or you detect friction/stalls:

Write to `brain/flags.md` with a stamped `flag-` ID (see ID Stamping):
```
### [date] - [STALL/FRICTION/PERFORMANCE] - [short title]
id: flag-YYYY-MM-DD-NNN
- What: [what's happening]
- Why it matters: [impact if unaddressed]
- Pattern: [if this connects to a recurring issue]
- Action: [what should change]
- Cross-ref: [related files]
```

## Parked Decisions

When the founder says "park this" or you identify a decision that's not ready to be made:

Write to `brain/decisions-parked.md` with a stamped `parked-` ID (see ID Stamping):
```
### [Decision Title]
id: parked-YYYY-MM-DD-NNN
- Status: Parked
- Date parked: [date]
- Context: [why this came up and why it's not ready]
- Trigger to revisit: [specific condition that means it's time to decide]
- Options: [if known]
- Cross-reference: [related files]
```

Every parked decision MUST have a trigger condition. "Revisit later" is not a trigger. "After first paying client" or "after running the system for 2 weeks" are triggers.

## Brain Dump Mode

When the founder says "brain dump" or starts sharing a stream of thoughts:

1. Listen to the full dump without interrupting
2. Categorize each thought: log (A), cross-reference (B), act (C), flag, or park
3. Present the categorization: "Here's how I'd route these - [list]. Any changes?"
4. Process all items after confirmation

## Archive Protocol

Before appending to `brain/log.md`, check its line count. If it's approaching 300 lines:

1. Summarize the oldest entries into key takeaways
2. Extract emerging patterns to `brain/patterns.md`
3. Move raw text to `brain/archive/YYYY-MM.md`
4. Clear the archived entries from log.md

This is mandatory. Don't skip it.

## Log Entry Format

One-line entry (preferred for `brain/log.md`):

```
### YYYY-MM-DD HH:MM - #tag - [Content of the thought] (log-YYYY-MM-DD-NNN)
```

Multi-line entry:

```
### YYYY-MM-DD HH:MM - #tag - [short title]
id: log-YYYY-MM-DD-NNN
[Content of the thought/observation/update]
```

Newest entries on top. Keep entries concise.

## Private tag filter

Before persisting anything to a file, scan the source text for `<private>...</private>` blocks (case-insensitive). Remove every matched block (including the tags) from the text before writing. If the entire input is wrapped in `<private>`, write nothing and report "skipped - content was tagged private."

## Rules

- Capture the insight, not the conversation. "Realized pricing needs to account for delivery time" not "We were talking about pricing and I mentioned that..."
- One log entry per thought. Don't bundle unrelated items.
- Cross-references must point to real files. Check the file exists before referencing it.
- Parked decisions without trigger conditions are just avoidance. Push for a trigger.
- When you detect a pattern across multiple log entries, suggest adding it to `brain/patterns.md` without waiting to be asked.
