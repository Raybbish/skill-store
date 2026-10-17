---
name: housekeeping
description: >
  One periodic maintenance sweep that keeps a months-old brain from rotting. Trigger on "clean up the OS", "run housekeeping", "what maintenance is due", "tidy the OS", or /founder-os:housekeeping. Detect mode (default) is read-only: every piece of accumulated debt (stale cadence, aging rants, log bloat, stale wiki graph, broken links, decay-due flags, memory gaps, stale snapshot, skill health) on one screen, each line with its severity and exact fix command. "housekeeping fix" runs the safe reversible fixes in dependency order and hands back a punch-list of the judgment calls plus a verify table. The remediation companion to the read-only audit.
why: "Retrieval quality IS memory quality. A brain with stale cadence, unprocessed captures, and broken links answers from a world that no longer exists - and the operator cannot tell, because each debt item is individually invisible. One sweep makes the debt visible and clears the mechanical half."
enhance: "Run detect weekly (a natural pair with the weekly review). Watch fix mode work a few times before trusting it on a full pile."
allowed-tools: ["Read", "Glob", "Grep", "Bash", "Edit", "Write"]
mcp_requirements: []
---

# Housekeeping

Runs on: local-exec - runs local scripts and edits OS files; on a read-only surface it reports what it would do.

The OS accumulates maintenance debt between sessions. The SessionStart brief and the audit **detect** pieces of it; nothing **remediates** it. This skill encodes the split, the ordering (later fixes read what earlier ones write), and the verify step.

It invents no new machinery. Every detector composes a tool that already ships: the cadence date checks, `/dream`, `scripts/log-archive.py`, `/wiki-build`, the lint skill, `scripts/memory-diff.py`, `scripts/brain-snapshot.py`, `scripts/skill_health.py`.

## The maturity ladder

1. **Detect** (default) - read-only. One report. Writes nothing. Live here first.
2. **Fix** (`housekeeping fix`) - operator-triggered, supervised. Runs the AUTO fixes in dependency order, narrating one line per step, then prints the JUDGMENT punch-list and a verify table.
3. There is no unattended rung. The OS does not run while you sleep (that is the design, not a gap). If you sync your OS to a remote and run cloud routines, a weekly remote "housekeeping fix" is a natural candidate - your call, set up via the `routines` skill's remote upgrade path.

## Pre-flight

If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.` Do not fabricate a report.

If a detector's input is missing or a script errors, do not silently drop the line - mark it `UNKNOWN - <detector> unavailable (<reason>)`. An honest partial sweep beats a confident one built on broken inputs.

## The detector set

Route **AUTO** = reversible, on the approval-gate Auto list, fix mode may run it. Route **JUDGMENT** = needs the operator's call; the skill lists it and never decides it.

| # | Debt class | Detected by | Fix | Route |
|---|---|---|---|---|
| 1 | Daily anchor stale | `## Today:` in `cadence/daily-anchors.md` before today | bump the header, roll the prior anchor to "Previous Anchor" | AUTO |
| 2 | Weekly cadence stale | `## Week of` in `cadence/weekly-commitments.md` more than 6 days old | "run my weekly review" (forces keep/kill on every flag) | JUDGMENT |
| 3 | Unprocessed rants aging | files in `brain/rants/` with `processed: false` older than 7 days | `/founder-os:dream` | AUTO |
| 4 | Log bloat | `brain/log.md` past its 300-line cap | `python scripts/log-archive.py` | AUTO |
| 5 | Wiki graph stale | any wiki-layer `.md` modified after `brain/relations.yaml` | `/founder-os:wiki-build` | AUTO |
| 6 | Broken wikilinks + orphans | the lint skill's checks (run read-only) | triage each: fix the typo, create the real node, or drop the link | JUDGMENT (never blind-fix a link) |
| 7 | Decay-due flags | entries past `Decay after:` in `brain/flags.md` | keep or kill each | JUDGMENT |
| 8 | Memory gaps | `python scripts/memory-diff.py` (a `clients/<slug>/` folder with no auto-memory entry) | add the memory entry, or run `/founder-os:memory-pass` if entries exist but may be stale | JUDGMENT |
| 9 | Quarantine ACTIVE | `Status: ACTIVE` entries in `system/quarantine.md` | resolve the failure or mark RESOLVED / WONTFIX | JUDGMENT |
| 10 | Snapshot stale | `brain/.snapshot.md` missing or older than 3 days (the propose engine and other output skills read it warm) | `python scripts/brain-snapshot.py --write` | AUTO |
| 11 | Skill description bloat | `python scripts/skill_health.py` (over 900 chars warn, over 1024 fail) | trim toward 600 chars | JUDGMENT |
| 12 | Dead skill pointers | `python scripts/skill_health.py` | repoint to the real path, or remove the reference | AUTO (supervised - see fix mode) |

## Detect mode (default)

Read-only, deterministic, cheap: file reads plus three scripts (`memory-diff.py`, `skill_health.py --json`, and the date math). Render exactly this and nothing else:

```text
HOUSEKEEPING - DETECT - <YYYY-MM-DD HH:MM>
---
AUTO (safe to fix - say "housekeeping fix" or run the command per line):
  [<severity>] <debt class> - <one-line state> -> <fix>
  (none)
JUDGMENT (your call - command given, decision is yours):
  [<severity>] <debt class> - <one-line state> -> <fix>
  (none)
UNKNOWN (detector unavailable):        [omit when all detectors ran]
  <debt class> - <reason>
---
<N> AUTO, <M> JUDGMENT. Say "housekeeping fix" to clear the AUTO half.
```

Severity: HIGH (cadence stale, decay-due, quarantine ACTIVE), MED (rants aging, memory gaps, broken links), LOW (log bloat, graph stale, snapshot stale, skill health). One line per item - except skill health, which can return many findings at once: render dead pointers one line each (they route AUTO and are few) and the description-bloat findings as ONE summary line with the count and the command that reveals them. A stated summary, not a silent cap.

## Fix mode ("housekeeping fix")

Operator-triggered, supervised. Run the AUTO fixes in this dependency order, narrating each step in one line. Do not re-prompt per item (every AUTO item is on the approval-gate Auto list); do not touch JUDGMENT items.

1. **Daily anchor bump** - cheap, and everything below reads dates.
2. **Rants** - `/dream` if any are aging.
3. **Log bloat** - `python scripts/log-archive.py`.
4. **Dead skill pointers** - apply a repoint only when the correct target is unambiguous (the name exists at a clear alternate path, e.g. a command instead of a skill). Show each one-line edit. No obvious target: move it to the punch-list, never blind-remove.
5. **Wiki graph** - `/wiki-build`, after any link edits so the graph reflects them.
6. **Snapshot last** - `python scripts/brain-snapshot.py --write`, because it captures everything above. Without `--write` the script only prints; the cache on disk stays stale.

Then print:

```text
HOUSEKEEPING - FIX - <YYYY-MM-DD HH:MM>
---
RAN (AUTO):
  <debt class> -> <command> -> <result>
PUNCH-LIST (your call):
  [<severity>] <debt class> - <state> -> <fix>
VERIFY (did it actually happen):
  | Fix | Check | Result |
  | <debt class> | <how confirmed> | <PASS / UNVERIFIED> |
---
<N> AUTO cleared, <M> on your punch-list.
```

Fill the VERIFY table by re-reading the side-effect, not by trusting an exit code: the anchor header shows today's date, the rant frontmatter flipped to `processed: true`, `relations.yaml` carries a fresh timestamp, `.snapshot.md` is dated today. Mark any row you did not confirm as UNVERIFIED and never dress it up.

## Rules

- Detect mode writes nothing, ever.
- Never run the weekly review inside fix mode - it forces judgment calls that belong to the operator.
- Never blind-fix a broken wikilink, and never create a hollow stub to silence a checker.
- If a referenced file does not exist on this install (`brain/flags.md`, `system/quarantine.md`), report the detector as UNKNOWN with the reason - do not report zero debt you did not check.
- No em dashes or en dashes. Hyphens only.
