---
name: brain-pass
description: >
  Synthesise an answer across the brain layer. Say "what did I decide about X", "what have I been avoiding", "what do I know about Y", "give me the brain on this" (or run `/founder-os:brain-pass "<question>"`). Use when a question needs reasoning across log, knowledge, decisions, flags, patterns, and needs-input - not a raw text match. The skill preflights through `scripts/query.py` to pick the candidate files, then synthesises across them. The model running this skill IS the retrieval engine. No embeddings, no API call, no paid tier required.
why: "Synthesises an answer from across your brain files with citations rather than asking you to remember what you already logged or decided."
enhance: "Fill brain/log.md consistently with dated entries - the pass is only as good as the history it can reason across; sparse logs return low-confidence answers."
allowed-tools: ["Read", "Grep", "Glob", "Bash"]
mcp_requirements: []
---

# Brain Pass

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

The user asks a question. You pick the relevant files, scan them, and return a synthesised answer with entry-ID citations - not a list of matches.

## When to use

- A question spans multiple brain files.
- A keyword query (`scripts/query.py`) returns too many matches to reason across.
- A skill needs prior context with citations, not raw text dumps.
- The user asks "what did I decide about X" or "what have I been avoiding" or "what do I know about Y".

## When NOT to use

- A specific entry ID is already known. Use `python scripts/query.py --mode full --ids <id>` instead.
- A simple keyword match is enough. Use `python scripts/query.py "<keyword>"` instead.
- The question is purely about the current state ("what is on today"). Use `/today` or `brain/.snapshot.md` instead.

## Instructions

You are doing a brain pass.

0. **Log history gate.** Run: `python scripts/check-log-has-history.py`

   If exit code is 1, read the output line and surface it to the user verbatim. Do not preflight or scan. Stop. (Fresh install - there are no dated entries yet to reason across.)

1. **Preflight through query.** Before picking files manually, run:

   ```bash
   python scripts/query.py "<the question you were asked>"
   ```

   The query script returns a ranked candidate list with stable IDs. Use that list to drive Step 2. Two cases:

   - **Query returns top results.** Pick the two-to-four highest-ranked files from the list and proceed to Step 2. The query layer already handled stop words, light stemming, recency bonus, and rant-keyword routing, so the candidates are tighter than a hand-pick.
   - **Query returns "No positive match for ...".** Surface this to the operator. Ask if they want you to broaden the search (read `brain/.snapshot.md` plus the channel-level files in the table below) or rephrase the question. Do not silently fall back. The honest no-match signal is the value here.

   Always include `brain/.snapshot.md` in the synthesis context, regardless of what query returns. The snapshot is the runtime state and belongs in every pass.

2. **Pick the relevant files.** The brain layer has structured channels:

   | File | What it holds |
   |---|---|
   | `brain/log.md` | What happened, who was met, what was said. Newest at top. |
   | `brain/decisions-parked.md` | Decisions waiting on a trigger condition. |
   | `context/decisions.md` | Active and resolved business decisions. |
   | `brain/knowledge/*.md` | Distilled lessons from books, calls, articles, experiments. |
   | `brain/flags.md` | Open friction or stall flags with severity. |
   | `brain/patterns.md` | Recurring observations the OS has noticed. |
   | `brain/needs-input.md` | Open questions waiting on the user. |
   | `cadence/weekly-commitments.md` | This week's must-do, should-do, waiting-on. |
   | `cadence/quarterly-sprints.md` | The 90-day arc and sprint targets. |

   When the query preflight returned candidates, the picks come from there. Otherwise pick the two-to-four most likely to contain the answer. Do not read every file.

3. **Scan with intent.** Use `Read` for short files. Use `Grep` to locate concept matches in long files (`brain/log.md` in particular). Stop reading once you have enough to answer. Do not exhaustively load.

4. **Synthesise.** The output is your reasoning across the matches, not a paste of the matches. Cite stable entry IDs (`log-YYYY-MM-DD-NNN`, `flag-YYYY-MM-DD-NNN`, etc.) when they exist so the user can open the source.

5. **Output format.** This is the contract. Other skills depend on it.

   ```
   ## Brain pass: <question>

   **Answer.** <2 to 4 lines synthesising what the brain says about the question.>

   **Evidence.**
   - <entry-id>: <one-line summary> (path/to/file)
   - <entry-id>: <one-line summary> (path/to/file)
   - <entry-id>: <one-line summary> (path/to/file)

   **Confidence.** <high | medium | low> - <why>

   **Gaps.** <What the brain does not know that would change the answer.>
   ```

6. **If the brain has no relevant content, say so.** Output the block with `Answer.` set to "No prior brain content found on this question." and skip Evidence. Do not fabricate.

## Composition with other skills

When called from inside another skill (the calling skill provides the question), return only the structured block. The calling skill incorporates the answer into its own output.

## Privacy

Summarise. Do not paste raw entry bodies that contain personal or client-sensitive content. Cite the ID. Let the user open the source if they want detail.

## Telemetry (opt-in)

When the environment variable `FOUNDER_OS_OBSERVATIONS=1` is set, after producing your structured block, run the telemetry appender so the user can spot shallow synthesis or repeated questions over time:

```bash
python scripts/brain-pass-log.py \
  --question "<the question you were asked>" \
  --confidence "<high|medium|low>" \
  --ids-cited "<comma-separated stable IDs from your Evidence section, or empty>" \
  --files-read <integer count of files you opened during the pass> \
  --has-gaps "<yes|no - did your Gaps section flag missing context?>"
```

Pass the values you used when synthesising. If `FOUNDER_OS_OBSERVATIONS` is not set, the script exits silently and writes nothing - safe to call unconditionally. If `scripts/brain-pass-log.py` is missing (older install), skip this step. Do not block.

The line appends to `brain/observations/<YYYY-MM-DD>.jsonl` next to the existing PostToolUse observation log. `/dream` rolls it into the OBSERVED section so the user sees patterns over time (which questions repeat, which return low confidence, which surface large Gaps).

## Rules

- Read-only on the brain. Never edit a brain file as a side effect of a pass.

<!-- private-tag: not applicable: brain-pass appends structured telemetry (opt-in JSONL), not user-provided speech content -->
