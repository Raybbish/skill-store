---
name: capture-sweep
description: Notice what was recorded and propose where it should go, without being asked. Say "sweep my meetings", "anything new to capture", "check my recorder", or run /founder-os:capture-sweep. Reads the capture inbox and a connected meeting recorder since the last sweep, sorts each item (client or contact conversation, training media, internal, personal), then proposes queue items and provisional-fact rows. Propose only - it never files a record, never routes personal data, and never does the capture itself.
why: "A recorded conversation sits in a recorder doing nothing until you remember it exists. The record only ever updates because you thought of it, which means a busy week is a week the OS learns nothing. This is the OS noticing on its own."
enhance: "Run it in the morning or at the end of a day with meetings in it. Pair it with catch-up, which files the raw text; this one decides what each item is for."
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write"]
---

# Capture sweep - notice, sort, propose

Runs on: local-exec - it writes queue items and provisional-fact rows through scripts. On a surface that cannot run scripts, it reports what it would propose and you file it.

The difference between this and `catch-up`: catch-up files raw text into the brain. This sweep decides **what each item is for** and proposes where it belongs. Run catch-up to get words in. Run this to get them routed.

It notices and proposes. It does not capture.

## Hard contract

- **Propose only.** The only things it writes are queue items (`cadence/queue.md`), rows in the provisional-fact ledger (`python scripts/unconfirmed_facts.py add`), and its own marker file. It never edits a client record, never writes a contact's file, never runs the capture itself.
- **Preflight first.** Check that the recorder you rely on is actually reachable before claiming to have swept it. If it is not, say so in one line, note it in `system/quarantine.md`, and stop. This is the rule from `rules/hands-resilience.md` and it is the whole reason this sweep is honest: a sweep that silently found nothing because the tool was absent is worse than no sweep.
- **No personal data in any item or row.** An item carries the ask and the person's name, never a phone number, an email, or an amount. The ledger enforces its own version of this and will refuse the row rather than store it. Do not work around the guard, phrase around it.
- **Never guess who someone is.** Resolve a person against `context/names.md` and your own files first. If you cannot, the item says so plainly and stays unresolved until you confirm. A wrong name is the exact failure this whole layer exists to prevent.
- **Provisional stays provisional.** Every unconfirmed name in a conversation goes to the ledger, not into an item as though it were established. A company name heard once and never spelled out is a ledger row, never a fact.
- **Read each item on its own terms.** You recorded these with no thought of the OS. Preserve your own words in the summary rather than translating them into system language, and never assume a recording refers to something already open in the OS.

## Where it looks

| Source | How | Marker key |
|---|---|---|
| `capture/inbox/` | any `.txt` or `.md` dropped there | `inbox` |
| `{meeting_recorder}` | the meeting recorder bound in `stack.json`, if one is connected and reachable | `recorder` |
| A paste | anything you pasted with the request | n/a, handled in the moment |

The marker lives at `brain/.capture-sweep.json`, holding the newest timestamp seen per source. First run has no marker: sweep what is there, then write the marker and say "marker set, future sweeps start from here".

If no recorder is connected at all, that is a normal install. Sweep the inbox, and say in one line that no recorder is bound rather than implying you checked one.

## Sorting each item (this is the whole judgment)

Pick exactly one per item:

1. **A conversation with a client or contact.** Resolve the person. Propose ONE queue item: the ask is whether to capture it properly and update their record. For every name you could not confirm, add a ledger row rather than writing it down as fact.

2. **Training or media you were consuming** - a podcast, a course, an audiobook, a long video. This updates your method, not a person's record. Propose one item pointing at `knowledge-capture`, so the takeaways land as proposed additions to how you work and you approve them. Media in, proposed edits out, never a silent rewrite of your own playbook.

3. **Internal or operational talk** that carries a real ask, a blocker, or a fact the OS should hold. Propose an item only if it is actually actionable. Ambient process chatter gets skipped and counted, not filed.

4. **Personal.** Family, errands, sport, a film, an argument. **Skip it.** Count it in the summary and move on. Never an item, never a ledger row. One recording can hold an hour of useful work and three hours of your actual life, and only the first belongs here.

## Procedure

1. **Preflight** the recorder. Absent means one line, a quarantine note, and stop.
2. **Read the marker** at `brain/.capture-sweep.json`. Missing means first run.
3. **Pull what is new** since the marker: inbox files, then recorder items newer than the watermark.
4. **Split and sort** every item per the four types. Print the sorting decision per item (`title -> type`) so the judgment is visible rather than buried.
5. **Show the proposed items first**, grouped by type. Run them on your go, in one batch.
6. **Write the marker** with the newest timestamp per source.
7. **Close honestly:** one line per item filed and per ledger row added, the skipped and personal counts, and a plain statement that the sweep filed intake and did not do the capture.

## What this never does

Run the capture itself. Edit a person's record or any owning file. Put personal data or money into an item. Route a full transcript anywhere. Assert a provisional name as fact. Guess at an unknown person. Read or send anything outside the sources named above.
