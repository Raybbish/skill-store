---
name: cross-link
description: >
  Propose [[wikilink]] insertions for backtick-quoted paths and unquoted prose path mentions in a single markdown file. Read-only by default. Say "cross-link this file", "wikilink the references in", "convert backticks to wikilinks", or "retrofit links in". Use after a session edits a file that names other wiki nodes in prose. Companion to wiki-build - cross-link writes the edges, wiki-build extracts them.
why: "Turns flat path mentions into a connected wiki graph so query and lint can traverse what your files reference - backtick paths alone produce no graph edges."
enhance: "Run after any session that adds path mentions to an operating file, then run wiki-build - cross-link writes the edges, wiki-build extracts them into the graph."
summary: "Propose [[wikilink]] insertions for paths a file names in prose."
allowed-tools: ["Bash", "Read", "Edit"]
mcp_requirements: []
---

# Cross-Link

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

Propose wikilink insertions for one markdown file at a time. Deterministic regex over the filesystem index. No LLM call, no semantic guessing - free-tier accessible.

This skill must:
- Run end to end without writing unless the operator approves.
- Resolve every proposed target to an existing wiki file. Unresolvable mentions are skipped silently.
- Skip fenced code blocks, inline code spans containing non-paths, URLs, external absolute paths, and self-references.
- Produce a unified diff so the operator can read the change before approving.
- Be idempotent. Running twice in a row on a file with no new prose produces zero proposals.

---

## Why this exists

Founder OS uses Obsidian-style `[[wikilinks]]` to connect wiki files. The `wiki-build` skill walks all markdown, extracts those links, and writes them as a graph in `brain/relations.yaml`. But wiki-build only extracts links that already exist. When you write `context/decisions.md` inside backticks instead of `[[context/decisions]]`, no graph edge is created and `lint` cannot see the connection. Cross-link closes that gap: it proposes converting backtick paths and bare prose paths into wikilinks, one file at a time, with your approval.

---

## When to use

Use after a live session edits a markdown file and the prose names another wiki node by path. Examples:

- After meeting prep edits a file under `clients/<slug>/` that references `context/clients.md` or another client's notes.
- After a new plan is written and references its predecessor or a context file.
- After a skill SKILL.md is edited and now calls another skill explicitly in prose.
- After a network entry mentions a client folder for the same person.

Do NOT use for:
- Bulk batch retrofits. Edges that no traversal exercises are noise. Use cross-link in the same session as the live edit, not as a cleanup pass over the back-catalog.
- Files in excluded paths (`brain/archive/`, `brain/rants/`, `node_modules/`, `.git/`, `.claude/commands/`).

---

## Pre-flight

If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`

If the target file passed to the command does not exist, stop and say so.

**Script status:** this install may or may not ship a `scripts/cross-link.py` helper. Check first.

- If `scripts/cross-link.py` exists, use it (script path below). It does the detection deterministically and writes the diff.
- If it does not exist, do the detection inline using the rules below, read-only, and produce the proposal manually. Do not claim a script ran when none is present.

---

## Procedure (script present)

1. Run `python scripts/cross-link.py <file>` (no `--apply`). This produces the proposal report and unified diff.
2. Show the operator the report. Do not edit the file.
3. If the operator approves, run `python scripts/cross-link.py <file> --apply`.
4. After apply, run `python scripts/wiki-build.py` to refresh `brain/relations.yaml`.
5. Append a single line to `brain/log.md`: `cross-link: <file> +N edges`. Skip the log line if zero edges were applied.

## Procedure (script absent - inline mode)

1. Read the target file and build an index of candidate paths it mentions.
2. Apply the detection and skip rules below by hand.
3. Resolve each candidate against the filesystem. Skip any that do not resolve to an existing wiki file, are ambiguous (basename matches more than one file), or point to an excluded directory.
4. Present the proposed replacements as a list and a unified diff. Do not write.
5. On operator approval, apply each replacement with Edit, then run `python scripts/wiki-build.py`.
6. Append a single line to `brain/log.md`: `cross-link: <file> +N edges`. Skip if zero.

---

## Detection rules

### Pass 1 - Backtick-quoted paths

Pattern: `` `<path>` `` where `<path>` ends in `.md` (with or without `#anchor`) and resolves to a wiki file in scope.

Examples that match:
- `` `context/decisions.md` `` -> `[[context/decisions]]`
- `` `clients/foo/notes.md#meeting-2026-04-01` `` -> `[[clients/foo/notes#meeting-2026-04-01]]`
- `` `skills/lint/SKILL.md` `` -> `[[skills/lint/SKILL]]`

Examples that do NOT match:
- `` `path/to/file.txt` `` (not .md)
- `` `https://example.com/page.md` `` (URL)
- `` `/Users/name/file.md` `` or `` `C:\path\file.md` `` (external absolute path)
- `` `decisions.md` `` where multiple files have basename `decisions.md` (ambiguous, skipped)
- `` `target/SKILL.md` `` where the file does not exist on disk (unresolvable, skipped)

### Pass 2 - Unquoted prose paths

Pattern: bare `path/to/file.md` (or with `#anchor`) bounded by whitespace or punctuation, not inside an existing `[[...]]`.

Examples that match:
- `see clients/foo/notes.md` -> `see [[clients/foo/notes]]`
- `referenced in plans/launch-plan.md` -> `referenced in [[plans/launch-plan]]`

Examples that do NOT match:
- `the [[clients/foo/notes]] file` (already wikilinked)
- `https://example.com/page.md` (URL)
- `bare-slug` (no slash and no .md - ambiguous, skipped)

### Universal skip rules

- Fenced code blocks (` ``` `): everything inside is skipped.
- Self-references: if the resolved target equals the file being processed, skip.
- Already inside an existing `[[...]]`: skip.
- Ambiguous resolution (basename matches multiple files): skip. The operator disambiguates manually.
- Path resolves to an excluded directory: skip.

---

## Output format

```
CROSS-LINK PROPOSAL - <file>
Candidates found: <N>

Proposed replacements:
  L<line>: <old> -> <wikilink>
  ...

Diff:
<unified diff, n=1 context>
```

After apply:

```
APPLIED: wrote N replacements to <file>
Next: run /founder-os:wiki-build to refresh brain/relations.yaml.
```

If zero candidates:

```
CROSS-LINK PROPOSAL - <file>
Candidates found: 0

No new wikilinks to propose. File is already current with the convention.
```

---

<!-- private-tag: not applicable: writes structured wikilink edges and a computed `cross-link: <file> +N edges` log line, not user-provided speech, so the <private> exclusion filter does not apply. -->

## Companion to wiki-build

Cross-link writes the edges into a file. Wiki-build extracts the edges into `brain/relations.yaml`. The two together close the loop:

| Skill | Reads | Writes | Purpose |
|---|---|---|---|
| cross-link | One markdown file + filesystem index | (only on approval) the same markdown file | Propose wikilinks for prose mentions. |
| wiki-build | All markdown files in scope | `brain/relations.yaml` (auto block only) | Extract wikilinks into the graph. |
| lint | All markdown + relations.yaml | nothing | Audit broken refs and orphans. |

Run order after a live session that adds prose references:

1. Say "cross-link <file>" (proposal)
2. Approve, then apply
3. `/founder-os:wiki-build` (refresh graph)
4. (Optional) `/founder-os:lint` (catch broken refs introduced by the new edges)

---

## What this skill does NOT do

- **No auto-write hook on file edits.** The edge of every write is a human approval. Nothing is written without explicit go-ahead.
- **No semantic wikilinker.** No LLM call decides what should be linked. Detection is pure regex over the filesystem index. Free-tier accessible by design.
- **No bidirectional-link enforcer.** Cross-link does not auto-add inbound back-references on the target file. Edges are intentional, written by the file's author at edit time.
- **No bulk back-catalog sweep.** One file per invocation. Wrapping it in a shell loop over `clients/**/*.md` defeats the purpose.

---

## Hard rules

- Read-only until the operator approves the proposal.
- Do not claim `scripts/cross-link.py` ran if this install does not ship it. Fall back to inline mode and say which mode you used.
- No em dashes or en dashes. Hyphens only. No banned words.
- No commentary outside the proposal output block.
