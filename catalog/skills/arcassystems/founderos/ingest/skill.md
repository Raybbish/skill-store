---
name: ingest
description: >
  File a source (URL, file path, or pasted text) into raw/ with provenance preserved. Trigger on "ingest this", "process this source", "file this article", "save this transcript", "add this thread to the OS" (or run /founder-os:ingest). Also fires when the user shares a source they want preserved alongside extracted takeaways. Proposes wiki updates the user approves before writing. Different from knowledge-capture - ingest preserves the source.
why: "Preserves a source with provenance intact so you can cite where an idea came from months later - knowledge-capture organises takeaways but ingest keeps the original."
enhance: "Approve 2 to 4 wiki updates per ingest rather than all or none - selectively cross-referencing sources into decisions.md and brain/patterns.md builds a connected knowledge graph over time."
allowed-tools: ["Read", "Write", "Edit", "WebFetch", "Glob", "Grep", "Bash"]
mcp_requirements: []
---

# Ingest

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

Files a source into the OS with provenance. The raw layer is the immutable archive. The wiki layer holds extracted content with cross-links back to the source.

This skill must:
- Auto-write only the raw source. Every wiki update requires explicit user approval.
- Run on a fresh install (creates `raw/` lazily on first use).
- Never modify a file in `raw/` after it's written.
- Append a single line to `brain/log.md` capturing what was ingested and what wiki updates landed.
- Render the proposal in under 3 seconds for sources under 50KB.

---

## Pre-flight

1. If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`
2. If `raw/` directory does not exist, create it and copy `templates/raw/README.md` into it (so the convention is documented locally).

## Step 1 - Resolve the source

Detect what the user passed in the argument:

- **URL** (matches `https?://`) - fetch with WebFetch. If WebFetch fails, ask the user to paste the content directly.
- **File path** (exists on disk per Glob) - Read the file content.
- **Anything else** - treat as pasted text. The argument body IS the source.

Determine `source_type` from URL or content:
- gist.github.com or raw markdown -> `gist`
- youtube.com, podcast platforms, audio transcript -> `podcast` (or `transcript` if cleaner)
- arxiv, pdf, paper -> `article`
- twitter.com, x.com, linkedin.com posts, reddit threads -> `thread`
- generic article URL -> `article`
- file ending .pdf, .epub, .mobi -> `book`
- otherwise -> `document` or `other`

Determine `source_title`:
- For URLs: extract page title from fetched content. Fall back to URL slug.
- For file paths: use the filename.
- For pasted text: ask the user for a one-line title if not obvious from the first line.

Determine `source_author`:
- For URLs: extract from byline/meta if found, otherwise omit.
- Otherwise: omit unless obvious.

## Step 2 - Write the raw file

Filename: `raw/YYYY-MM-DD-<slug>.md` where `<slug>` is a kebab-case 3-5 word version of the title.

If a file with that name already exists, append `-2`, `-3`, etc.

Write the file with this structure:

```markdown
---
source_type: <type>
source_url: <url if applicable, omit if not>
source_title: <title>
source_author: <author if known, omit if not>
ingested_at: <YYYY-MM-DD>
ingested_by: ingest
wiki_pages: []
---

<the full source content>
```

`wiki_pages` is left empty for now. It gets updated in Step 6 with whatever the user approved.

Confirm to the user: `Source filed to raw/<filename>. Now proposing wiki updates.`

## Step 3 - Extract candidate wiki updates

Read the source. Extract candidate updates across these categories:

| Category | Target file | What qualifies |
|---|---|---|
| Person | `context/clients.md` (append a roster row) | A person worth tracking in the roster. Check `context/clients.md` first; append a new row only if not already there. |
| Decision input | `context/decisions.md` (append) | Information that bears on an open or pending decision. Check current `context/decisions.md` for matches. |
| Pattern | `brain/patterns.md` (append) | A recurring pattern, framework, concept, or principle worth remembering. |
| Action item | `cadence/daily-anchors.md` or `cadence/weekly-commitments.md` (append to Could Do) | A concrete next action surfaced by the source. |
| Company | `companies/<slug>-business.md` (operator path, append a Source notes section) OR `companies/prospects/<slug>.md` (prospect path, append a Notes entry) | Information about a company or organisation. Check the operator path first, then the prospect path. If no file exists at either path and the company is one the user runs, propose creating the operator file with a one-line description. If the company is one the user is selling to or watching, propose running the `prospect-init` flow instead. |

Aim for 2-5 candidates total. Do NOT propose more than 7. If a source produces zero clear candidates, that's fine - proceed to Step 4 with an empty list.

## Step 4 - Show proposal to user

Output the proposal as a single fenced block:

```
INGESTED: <title>
Source: raw/<filename>

Proposed wiki updates (you approve each):

[1] <category>: <target file>
    <one-sentence summary of the proposed addition>

[2] <category>: <target file>
    <one-sentence summary>

...

Reply with: yes (all), or list numbers to keep (e.g. "1,3"), or no (skip all).
```

If there are zero candidates: `No clear wiki updates surfaced. Source filed to raw/<filename> for later reference.` Then jump to Step 6 with an empty approval list.

## Step 5 - Apply approved updates

For each approved update:

- **Person (append):** Append a roster row to `context/clients.md` with `<name> - <one-line note>` plus `Per [[raw/<filename>]]`.
- **Decision input (append):** Append to `context/decisions.md` under the relevant decision header with provenance: `Per [[raw/<filename>]]: <update>`.
- **Pattern (append):** Append to `brain/patterns.md`: `## YYYY-MM-DD - <pattern title>` plus body and `[[raw/<filename>]]` reference.
- **Action item (append):** Append to the relevant cadence file's "Could Do" section with `[[raw/<filename>]]` reference.
- **Company (append or create):** Check `companies/<slug>-business.md` first (operator path). If it exists, append to a "Source notes" section with `[[raw/<filename>]]` reference. If the operator file does not exist, check `companies/prospects/<slug>.md` (prospect path) and append to its **Notes** section with the same reference. If neither file exists, propose creating the operator file (for companies the user runs) or running the `prospect-init` flow (for companies the user sells to or watches) before appending. Do not write both files in one pass - the source belongs at one path, not both.

Use `[[wiki-link]]` syntax for all cross-references per the Wiki Conventions in CLAUDE.md.

## Step 6 - Update raw frontmatter and brain log

1. Edit the raw file's frontmatter to fill `wiki_pages` with the actually-written list. Empty list if user declined all.

2. Append a single line to `brain/log.md`:
   ```
   ## YYYY-MM-DD ingest | <source title> | wiki updates: <list of files written, or "none">
   ```

## Step 7 - Output summary

Five-line confirmation:

```
INGESTED: <title>
RAW: raw/<filename>
WIKI UPDATES: <count> (<list of files>)
LOG: brain/log.md updated
NEXT: Run /founder-os:lint anytime to audit cross-references.
```

---

## Output rules

- Keep the proposal block scannable. One line per candidate plus one body line.
- Never write to a wiki file without explicit user approval. raw/ is the only auto-write.
- If the user declines all proposals, that's a valid outcome. The source still got filed.

## Edge cases

- **Duplicate source.** If a raw/ file with the same source_url already exists, ask: `This source was ingested on <date>. Re-ingest with a fresh proposal?` Default: no.
- **Very large source (>200KB).** Truncate content in the raw file to the first 200KB and append `... [truncated, original at <url>]`. Note in proposal that extraction was truncated.
- **WebFetch fails.** Ask user to paste the content. Do not make up content.
- **Source has no extractable structure** (e.g., a tweet, a one-line note). Filing to raw/ is still valuable. Output proposal: `No clear wiki updates from this source. Filed for reference.`
- **User says "yes" to a category but the target file is missing.** Create the target file first, then write the update. Mention the file creation in the summary.

<!-- private-tag: not applicable: ingest writes raw source provenance and structured wiki updates; sources are URLs or files, not private speech -->
