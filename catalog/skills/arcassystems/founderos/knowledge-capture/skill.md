---
name: knowledge-capture
description: >
  Capture takeaways from a book, podcast, article, or conversation. Trigger on "capture this", "log this", "capture notes from", "what I learned from", "book notes for", "takeaways from", "save this insight", "I just read", "I just listened to", "key points from", or any variation of knowledge capture and learning extraction. Also fires when the user shares raw notes or highlights and wants them organized.
why: "Turns a book, podcast, or conversation into a retrievable note that skills like proposal-writer and strategic-analysis can cite - learning that stays in your head does not improve your output."
enhance: "Always fill the Apply To sections with real business context - notes with no application mapping are rarely surfaced by brain-pass or strategic-analysis when you need them."
allowed-tools: ["Read", "Write", "Edit", "Bash"]
mcp_requirements: [optional: notion]
---

# Knowledge Capture

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

## Storage Convention

Every captured knowledge piece writes to `brain/knowledge/<topic-slug>.md`. If the file exists, append a dated section. If it does not exist, create it with frontmatter. Every new knowledge file gets a stable ID per `rules/entry-conventions.md` (channel: `know`).

```yaml
---
id: know-YYYY-MM-DD-NNN
topic: <slug>
captured: <YYYY-MM-DD>
sources: [source title or URL]
tags: [book, podcast, article, conversation, experiment]
seats: <seat id, or none>   # optional - see Route it to a seat below
---

# <Topic>

## Takeaways

- <point>

## How this applies to my work

- <application>
```

Also update `brain/knowledge/README.md` index table with one row. The columns are fixed:

```
| ID | Topic | Captured | Tags | Source |
|---|---|---|---|---|
| know-YYYY-MM-DD-NNN | <slug> | <YYYY-MM-DD> | <comma-separated tags> | <source title or URL> |
```

Insert the new row directly under the header. Do not invent additional columns. Ask for a topic slug if it is not obvious from the source title.

Use `raw/` only when preserving the full source matters. Use `brain/knowledge/` for distilled notes that future skills should read.

## Route it to a seat (after the note is written, one question, at most one seat)

The note exists. Now the one question that makes it compound instead of settling: does anyone on your org chart need to know this?

Read `roles/employees.yaml` if it exists, and compare the note's subject against each row's `job_description`. If exactly one row obviously covers it, ask ONE line and nothing more:

> This reads like it belongs to the account manager (`client-status`). Route it there?

Then:

- **Yes** - add `seats: <id>` to the note's frontmatter, then run `python scripts/agents_sync.py apply`. That seat's read-list now carries a pointer to this note: id, topic and path, never the body. It reads the file itself when it runs.
- **No** - write `seats: none`. That is a tombstone, not a shrug. It records that the note was reviewed and deliberately routed to nobody, so no later sweep raises it again. A declined note that leaves no record comes back every morning until you stop reading the mornings.
- **No obvious match** - ask nothing and write nothing. An absent field is a valid state meaning never reviewed, and the morning loop may raise it once, later, when a slot is free.

Four rules on top:

- **At most one seat, and at most one question.** A note routed to four seats is a note routed to nobody, and a second question turns a capture into an interview.
- **Never tag as a side effect of capturing.** No yes, no field. Sessions propose, only you promote - the same rule the registry itself runs on.
- **No registry, no question.** An install with no `roles/employees.yaml` has no seats to route to, and asking about one is noise.
- **A retired seat keeps its tags.** Never strip a `seats:` value because the row is gone; `agents_sync check` names it as a dangling tag and leaves it, in case the seat comes back.

## Brain context (default)

Before producing output, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one - a stale snapshot read as current presents last week's flags and must-dos as today's, which is worse than no memory at all. If Python is unavailable, proceed without it and say so.

If the snapshot is missing, run:

    python scripts/brain-snapshot.py --write

Then read it. If the snapshot script is also missing (older install), proceed using only the profile files. Do not block.

The snapshot tells you what flags are open, what the user is working on this week, and what the latest staleness state is. Apply this context to your output where it is relevant. Do not surface every snapshot field in every output - use judgment. For knowledge capture, recent decisions and open flags tell you which threads to cross-reference - a new note that connects to an active flag is more valuable than a standalone summary.

## ID Stamping

Every new knowledge file gets a stable ID at write time. Convention spec: `rules/entry-conventions.md`.

### Procedure (run before creating any new knowledge file)

1. Compute today's date in `YYYY-MM-DD`.
2. Read every existing file under `brain/knowledge/` plus the `README.md` index. Find every ID that matches `know-<today>-<NNN>`.
3. Take the highest `<NNN>`. If none exist for today, start at `001` (the first ID of the day for this channel) and skip to step 5.
4. Increment by 1. Format as 3-digit zero-padded.
5. The result is the new file's ID. Stamp it in the file's frontmatter and in the index row.

### Counter rules

- Per channel, per day. Resets to `001` each new day.
- IDs are stamped at write time, never retroactively.
- IDs are case-sensitive lowercase only.
- If a knowledge file already exists and you are appending a new dated section to it, do not change the file's existing ID. The ID belongs to the file, not to each appended section.

## Book / Long-Form Content

```
BOOK: [Title]
Author: [Name]
Date captured: [Date]

---

CORE THESIS
[One paragraph. What is this book really saying?]

KEY IDEAS
1. [Idea] - [Why it matters to the founder's work]
2. [Idea] - [Why it matters]
3. [Idea] - [Why it matters]

QUOTES WORTH KEEPING
- "[Quote]" (p. XX)

DISAGREE / QUESTION
[Anything that didn't land or needs more thinking]

APPLY TO
-> Business: [How this connects to the company or model]
-> Clients: [How this helps in client conversations]
-> Content: [Could this become a post, video, or playbook chapter?]
-> Personal: [Does this change how you work or lead?]
```

## Podcast / Talk / Conversation

```
SOURCE: [Podcast name / Speaker / Event]
Date: [Date]

---

KEY TAKEAWAYS
1. [Takeaway]
2. [Takeaway]

MEMORABLE MOMENTS
- [Something that stood out]

APPLY TO
-> [Same structure as book notes]
```

## Quick Insight Capture

```
INSIGHT: [Date]
[The insight in one to three sentences]

TRIGGERED BY: [What prompted this]

CONNECTS TO: [Existing work, a project, a content idea]
```

## Connection Mapping

Always ask:
- Does this challenge something the founder currently believes?
- Does this support or challenge the current business model?
- Could this become a playbook chapter or framework?
- Would a specific client benefit from hearing this?
- Is there a content opportunity here?

## Private tag filter

Before persisting anything to a file, scan the source text for `<private>...</private>` blocks (case-insensitive). Remove every matched block (including the tags) from the text before writing. If the entire input is wrapped in `<private>`, write nothing and report "skipped - content was tagged private."

## Formatting

- Simple hyphens (-) not em or en dashes
- Arrows (->) for application mapping
- Quotes in quotation marks with page numbers when available
