---
name: catch-up
description: >
  Sweep everything captured away from the laptop into the brain. Trigger on "catch up", "process my inbox", "I sent myself some notes", "here's what I captured today", or a paste of raw voice-note transcripts. Reads capture/inbox/ (and pasted text, and a connected meeting-notes tool when one is wired), files each item into brain/rants/ with provenance and processed: false, applies the names-glossary correction pass, then offers /dream to distil. One mental model: get the thought into the inbox any way you can; the OS files it.
why: "The real work happens away from the desk. A thought that cannot land in the brain until the operator is back at a laptop usually never lands at all. The inbox makes capture a dump, not a task."
enhance: "Pair with a capture channel that fits your day (docs/capture-anywhere.md ranks them by friction) and run /dream after a sweep so captures become patterns, flags, and decisions instead of sitting raw."
allowed-tools: ["Read", "Write", "Glob", "Bash(mv:*)", "Bash(mkdir:*)", "Bash(python scripts/agent_runs.py:*)"]
mcp_requirements: []
---

# Catch up - sweep the inbox into the brain

Runs on: local-writes - files things into `brain/rants/`; on a read-only surface it drafts what it would file and says so.

The operator captured thoughts somewhere else - a voice-note app, an email to self, saved messages, a text file dictated into a synced folder. This skill gets them into the brain with provenance, without asking the operator to structure anything.

## Sources, in sweep order

1. **`capture/inbox/`** - any `.txt` or `.md` file in this folder is treated as a capture. This is the drop zone: synced-folder dictation, exported voice notes, anything that can land as a text file.
2. **Pasted text** - if the operator pasted content with this request, treat the paste as one capture.
3. **Connected meeting-notes tool** - if a `meeting_notes` MCP is bound in `stack.json` and reachable, offer to pull transcripts since the last sweep. Never claim to have checked a tool that is not connected.

## Procedure

1. **Sweep.** For each capture, create `brain/rants/<YYYY-MM-DD>-<slug>.md` with frontmatter:

   ```
   ---
   captured: <date from the file's own timestamp or content, else today>
   source: <inbox filename | paste | meeting-notes tool>
   processed: false
   ---
   ```

   Body = the raw text, corrected ONLY per the name pass below. Never rewrite, summarize, or clean up the operator's words at this stage - raw in, raw kept.

2. **Name pass (transcription errors are the rule, not the exception).** Dictation mangles proper nouns. Before filing:
   - Read `context/names.md` (the names glossary). For any name in the capture that closely matches a glossary entry or a listed mishearing, substitute the canonical spelling. Substitute ONLY on a glossary match.
   - A proper noun that matches nothing stays as heard, marked `(sp?)` - for example `Jansi (sp?)`. Collect all `(sp?)` names and ask the operator about them in ONE batch question at the end of the sweep, not one by one.
   - When the operator corrects a name, apply it AND append the wrong-to-right pair to the glossary's mishearings list, so the same mistake never survives twice.
   - Never "fix" a name, number, price, or date you are unsure of. An unsure span stays as heard with the marker. A confident wrong substitution is how fabricated facts enter a brain; the marker is how they stay out.

3. **Move, don't copy.** A swept inbox file moves to `capture/inbox/.processed/` (create if missing) so the inbox reads empty when it IS empty. Nothing is deleted.

4. **Report and offer.** One line per capture filed (`filed brain/rants/2026-07-08-site-visit.md - 2 names confirmed, 1 marked (sp?)`), then offer: "Say 'dream' (or run /dream) and I will distil these into patterns, flags, and decisions." Do not auto-run /dream.

## If two sources cover the same event

When the same conversation arrives twice (say, a meeting-notes tool and the operator's own voice memo), reconcile by this hierarchy - higher wins:

1. A document or screenshot (authoritative for names, numbers, terms)
2. What both sources independently agree on
3. A single source - file it, but mark facts only it carries as `(single-source)`
4. The operator's own correction - overrides everything above

A proper noun the two sources disagree on is surfaced as provisional, never silently picked.

## When one source is all you have

Most of the time it is. You recorded a call on one device and there is no second version of it. That is the normal case, and it has a failure mode worth naming because it does not look like a failure.

A single recording with no second source leaves **nearly every proper noun unconfirmed**. Not wrong, unconfirmed. A person's surname, a company name, a product name you heard once and never saw written down. The capture reads fluently and confidently, so the marked names quietly become facts the next time anything reads that file.

**The fix is never a better transcript.** Re-recording the same audio reproduces the same gaps, because the information was never in the audio. What resolves an unconfirmed name is a second source, a document, or you confirming it. Three things follow:

- When a capture is single-source, say so in the sweep report. "One source, so the names below are unconfirmed" costs one line and changes how the next reader treats the file.
- An unconfirmed name that reaches a client-facing document or another person's inbox is the expensive version of this. Confirm before it crosses that line, never after.
- If the same class of capture problem shows up twice - always single-source, always the same tool dropping speakers - that is a problem with how you capture, not with that day's notes. Fix the capture path.

## Media you consume, not just meetings you attend

A podcast, an audiobook, a course, a long video you were half-listening to. Those land the same way as a meeting and they are worth capturing, because most of what changes how you work arrives that way rather than in a call.

They route differently, though. A meeting updates a person or a client record. Media updates **your method**: it belongs as a proposed insertion into whatever holds how you do the work, through `knowledge-capture`. Media in, proposed edits to your own playbook out, and you approve them. Never a silent rewrite of your method because something in your headphones sounded good.

The one thing to filter: capture the training, not the entertainment. A recording that ran all afternoon may hold one useful arc and three hours of unrelated life. File the arc, skip the rest, and say how many you skipped.

## Rules

- Raw in, raw kept. No summarizing, no cleanup beyond the glossary name pass.
- Every capture gets `processed: false` so /dream can find it. Never mark processed here.
- Ask about unknown names once, in one batch. Never write an invented identity, venture, or fact to make a capture look complete.
- If `capture/inbox/` does not exist, create it with its README from `templates/capture/inbox/README.md` and tell the operator what it is for.
- No em dashes or en dashes. Hyphens only.

---

## Record the run (the closing act, when this runs as a seat)

If `roles/employees.yaml` carries the `capture-filer` row, close with one line so the run leaves a trace whether or not anyone was watching:

    python scripts/agent_runs.py record --seat capture-filer --trigger "inbox sweep"         --read "capture/inbox/,context/names.md" --produced "brain/rants/" --outcome ok

Use `--outcome refused` (with `--could-not "<why>"`) when there was nothing in the inbox to file, and `--outcome failed --could-not "<why>"` when it broke - the script requires the reason for both, so a failure with no reason is never a silent no-record. A refusal is not a failure and the log distinguishes them. Skip this silently if the script or the registry is absent, and never mention it in your reply - it is bookkeeping, not output.
