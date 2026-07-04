---
name: scan-logs
description: >
  Scan recent application error logs for actionable bugs. Groups errors by
  stable signature, identifies root causes traceable to source code, and
  emits findings only for error groups above the actionable threshold.
  Triggers: scan logs, check for errors, any errors in prod, error report,
  what's crashing, are there exceptions, log health check.
---

# Scan Logs

Find real bugs in the noise. The goal is not to dump log lines — it is to
identify **distinct error signatures**, count how often each fires, map each
to a source file and line, and emit a finding only when the rate crosses the
actionable threshold.

Most healthy runs emit **zero findings**.

---

## Healthy state

No error group meets or exceeds the actionable threshold (`errorThreshold`)
read from live config. Background noise (known transients, infrastructure
keep-alives, expected retries) stays below that threshold and is noted
informally without triggering a finding.

---

## Inspect

### Step 1: Pull live config

Before querying logs, read the doctor config to get:

- `logGroups` — the list of log group ARNs or names to scan
- `lookbackMinutes` — how far back to query (e.g. 60 for the last hour)
- `errorThreshold` — minimum occurrence count for a finding to be actionable
- `knownNoise` — optional list of normalized signature prefixes to suppress

Never hardcode these values. All subsequent steps are parameterized off this
config.

### Step 2: Bucket errors by time window

For each log group in `logGroups`, run a time-binned query over the last
`lookbackMinutes` minutes, filtering for lines that contain error indicators
(e.g. `Error`, `FAILED`, `500`, `Timed out`, `ECONNRESET`, `ECONNREFUSED`,
`Unhandled`, `Exception`, `panic`).

Bin by a short interval (e.g. 5 minutes) and count events per bin.

A **flat low count** across bins is background noise — note it and continue.
A **spike in the most recent bins** is a live issue — prioritize it in
classification.

### Step 3: Group by normalized signature

One bug firing hundreds of times is one bug. Extract a normalized signature
from each error message before grouping:

1. **Strip volatile tokens.** Replace UUIDs, long numeric IDs, and request
   IDs with stable placeholders (`{uuid}`, `{id}`, `{req}`). This collapses
   all occurrences of `Failed to process request {uuid}: TypeError` into a
   single group regardless of which request ID appeared.

2. **Extract the exception class.** Look for a pattern matching
   `ExceptionClass: message` at the start of the error line. Use that class
   as the signature prefix. Fall back to `Error` when no class is found.

3. **Group.** Aggregate normalized messages and count occurrences, first-seen,
   and last-seen per group. Take the top 20 by count.

Present each distinct group with: count, first/last seen, one representative
raw message.

### Step 4: Pull a stack trace per distinct group

For each group above `errorThreshold`, fetch a representative raw log stream
and extract the full stack trace. Multi-line errors require reading the raw
stream — do not use narrow-filter queries that strip context lines.

Identify the **first application stack frame** that is not inside
`node_modules/` (or your language's equivalent vendor directory). That frame
gives you the file path and line number.

### Step 5: Map to source code

Stack traces reference compiled or transpiled output. Map each frame back to
the corresponding source file:

- Strip build-output prefixes (`/app/dist/`, `__pycache__/`, etc.)
- Match by function name or module path when line numbers drift after
  compilation
- Read around the referenced line to understand the callsite

This step turns "there are errors" into "here is what is wrong and here is
where to fix it."

---

## Classify

For each distinct error group, decide:

| Condition                                                          | Action                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Count < `errorThreshold`                                           | PASS — note informally in output                            |
| Signature matches a `knownNoise` entry                             | PASS — acknowledge once, do not re-report                   |
| Count >= `errorThreshold`, stack frame found, not in `knownNoise` | `emit_finding` with category `code_bug`                     |
| Count >= `errorThreshold`, no stack frame recoverable              | `emit_finding` with category `code_bug`, note limited trace |

When calling `emit_finding`:

```
emit_finding({
  signature: "{ExceptionClass}:{relative/file/path}:{line}",
  severity: "high",
  category: "code_bug",
  title: "<ExceptionClass> in <file> at line <line>",
  description: "<normalized message>; <count> occurrences, first seen <ISO timestamp>, last seen <ISO timestamp>",
  evidence: {
    logSnippets: ["<one representative raw log line>"],
    metricValues: [{ name: "occurrences", value: <count> }]
  },
  suggestedFix: {
    type: "code",
    fileHint: "<relative/file/path>",
    functionHint: "<symbol at the referenced frame>"
  }
})
```

**Signature format:** `{ExceptionClass}:{file}:{line}` — for example,
`TypeError:src/handlers/process-event.ts:142`. This format is stable: the
same bug produces the same signature on every run, so the repair pipeline can
deduplicate tickets correctly.

When no app frame is recoverable (vendor-only stack or minified bundle),
substitute `unknown` for file and a short MD5 hash of the normalized message
for line: `TypeError:unknown:a3f9c12b44e1`.

See `references/finding-contract.md` for the full finding schema and
deduplication rules.

---

## Output

For each log group scanned, summarize compactly:

```
### <Log Group Name>

Live spike: <yes | no>
Findings emitted: <count>
Groups above threshold: <list of signatures with counts, or "none">
Groups below threshold (noted): <count>
```

Omit full stack traces from the summary — the finding detail carries them.
