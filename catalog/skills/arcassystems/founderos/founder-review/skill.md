---
name: founder-review
description: Your own monthly performance review, run by your OS. Say "review my month", "score my month", "founder review", "coach me through the month", or run /founder-os:founder-review. Two steps - a scorecard counted from your own files first (counts only, never opinions), then at most five coaching questions that end in at most three commitments with dates. Next month opens by scoring those. Private by default. This reviews YOU, not a client and not a digital employee.
why: "The OS reviews its skills, its files, and its jobs, and never reviews the person running it. A solo founder has nobody who reads their month back to them, so the same pattern repeats for a year unnoticed. This is the monthly mirror, evidence before opinion."
enhance: "Run it on the first Sunday of the month, riding the weekly-review rhythm rather than adding a new habit. Thirty minutes."
allowed-tools: ["Read", "Grep", "Glob", "Edit", "Write"]
---

# Founder review - the monthly mirror

Runs on: local-writes - it reads your files and writes commitments into `cadence/queue.md` and one entry into `brain/log.md`.

**Cadence:** monthly, first Sunday, about thirty minutes. It rides the `weekly-review` Sunday rhythm so it is not a new habit to remember.

**This is not** a self-esteem instrument, not something you share, and not daily. The daily step belongs to the coach line in `/founder-os:morning-loop`. This is the monthly altitude pass.

## Step 1 - the scorecard (counted, never judged)

Count these from your own files for the month just ended. Counts only. No interpretation yet, and no number you cannot point at a file for.

| Measure | Where it comes from |
|---|---|
| Weekly must-dos set, and how many landed | `cadence/weekly-commitments.md` retros for the month |
| Days with a log entry, versus days in the month | `brain/log.md` |
| Outreach entries, and days since the most recent one | `brain/log.md` outreach entries, `context/clients.md` |
| Content or deliverables shipped | `brain/log.md`, `cadence/queue.md` DONE |
| Queue items closed, versus opened | `cadence/queue.md` |
| Open flags older than 14 days | `brain/flags.md` |
| Decisions made, versus decisions still parked | `context/decisions.md` |
| Last month's commitments: done, slipped, or killed | the `Review commitment:` items in `cadence/queue.md` |

**The rules that make the scorecard trustworthy:**

- **A measure with no instrument says "no instrument".** It never gets a guessed number. If you want that measure next month, the fix is to start recording it, and that is worth naming as an OS gap rather than a personal failing.
- **Scoring last month's commitments opens the conversation**, not the counts. Each one done, slipped, or killed, in your words first.
- Read `context/priorities.md` silently for the goal the month was serving. The scorecard is measured against that, not against a generic idea of a good month.

## Step 2 - the coaching pass (at most five questions)

Ask at most five questions, in one batch of up to four plus at most one follow-up. Narrow options with a recommendation first. Plain language, no OS jargon. Skipping is always free and costs nothing.

Shape them across the four coaching moves, always forward-looking:

1. **Goal** - one question tying the month to the number or outcome you are actually working toward. If that target is still vague, the question is whether to fix it now, not what it should be.
2. **Reality** - one question on the sharpest gap the scorecard shows. Name the number plainly, without softening it, then ask what is actually in the way.
3. **Options** - two or three concrete moves for that biggest gap, with a recommendation, and with "do nothing this month" as a real option.
4. **Will** - the commitment question. At most three things, each with a date.
5. **The standing question, never dropped:** "What should the OS stop doing for you?" The system gets reviewed by its user every cycle. If only four slots fit, this one survives and Options folds into Will.

Rules for the pass:

- At most one bias lens per session (`rules/biases.md`). Pick the one the sharpest gap suggests, or none.
- No judgments delivered as verdicts. The scorecard shows, the questions ask, you conclude.
- If the scorecard exposes something the OS itself owns - a measure with no instrument, a file nobody has updated in six weeks - name it as an OS gap, not a personal failing. The distinction matters and it is easy to get wrong.

## Step 3 - commitments become queue items

At most three. Each one goes into `cadence/queue.md` with a due date inside the month, titled with the exact prefix:

```
Review commitment: <your words>
```

That prefix is the contract. Next month's scorecard finds these by the prefix and opens by scoring them. Respect the 3-item ACTIVE cap: if ACTIVE is full, commitments land in BACKLOG with their date, which is itself a signal worth saying out loud.

## Close

One entry in `brain/log.md`: `### <date> - Founder review <month>: <one-line outcome>` with the commitments named. The counts stay in this session, the commitments live in the queue, and the log entry is the written record.

Do not write any part of this into a file another person reads. Private by default.

## Rules

- Never invent a number the files do not carry. "No instrument" is an honest row and a guess is not.
- The scorecard proposes, it never grades silently. The coaching pass asks, it never sentences.
- Refuse to run twice in one month unless you explicitly ask for a re-run.
- No em dashes. Writing rules apply.

## Cross-refs

- Daily half: the coach line in `skills/morning-loop`.
- Weekly half: `skills/weekly-review`.
- The same loop pointed at a digital employee instead of you: `skills/employee-review`.
