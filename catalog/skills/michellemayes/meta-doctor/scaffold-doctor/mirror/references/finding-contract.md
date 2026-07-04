# Finding Contract

A `Finding` is the atomic output unit of every runbook agent. The doctor orchestrator reads findings, deduplicates them, and routes each one to a PR or a tracker ticket. This document is the language-neutral contract that all runbook implementations must satisfy.

---

## Schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `signature` | string | yes | Stable dedup key. See [Signature Formats](#signature-formats). |
| `severity` | `low` \| `medium` \| `high` | yes | Impact level of the finding. |
| `category` | `code_bug` \| `compliance` \| `data_drift` \| `cost_anomaly` \| `infra_drift` | yes | Classification bucket for routing and grouping. |
| `title` | string | yes | Short human-readable label (one line). |
| `description` | string | yes | Full explanation: what was observed, why it is a problem. |
| `evidence` | object | yes | Supporting data. At least one sub-field should be populated. |
| `evidence.queryIds` | string[] | no | IDs of queries or jobs whose output supports the finding. |
| `evidence.sampleRows` | object[] | no | Representative data rows. |
| `evidence.logSnippets` | string[] | no | Relevant log lines. |
| `evidence.metricValues` | `{name, value, unit?}`[] | no | Named numeric measurements. |
| `evidence.links` | string[] | no | URLs to dashboards, runbooks, or external references. |
| `suggestedFix` | object | yes | Routing directive. See [Routing Semantics](#routing-semantics). |
| `suggestedFix.type` | `code` \| `heal_script` \| `manual` | yes | Controls which pipeline receives the finding. |
| `suggestedFix.fileHint` | string | no | Relevant only when `type = code`. Path hint for the repair agent. |
| `suggestedFix.functionHint` | string | no | Relevant only when `type = code`. Symbol hint for the repair agent. |
| `suggestedFix.scriptPath` | string | no | Relevant only when `type = heal_script`. Path to the heal script. |

### JSON Example

```json
{
  "signature": "TypeError:scheduler/poller.ts:142",
  "severity": "high",
  "category": "code_bug",
  "title": "Uncaught TypeError in poller during backfill window",
  "description": "Log scan found TypeError thrown at poller.ts:142 when the due_at timestamp falls inside a holiday exclusion window. The exception is swallowed by the outer catch, silently dropping the send.",
  "evidence": {
    "logSnippets": [
      "ERROR [poller] TypeError: Cannot read properties of undefined (reading 'tz') at poller.ts:142"
    ],
    "links": [
      "https://console.aws.amazon.com/cloudwatch/..."
    ]
  },
  "suggestedFix": {
    "type": "code",
    "fileHint": "services/scheduler/src/poller.ts",
    "functionHint": "processWindow"
  }
}
```

---

## Signature Formats

A signature must be **stable and deterministic** across runs so the dedup layer can suppress duplicate PRs and tickets. Choose the format that best fits the finding type.

### Code bug — with stack frame

```
{ExceptionClass}:{relativeFilePath}:{lineNumber}
```

Example: `TypeError:scheduler/poller.ts:142`

Use when the log entry or exception report includes a precise stack frame.

### Code bug — without stack frame

```
{ExceptionClass}:unknown:{md5_12chars_of_normalized_message}
```

Example: `TypeError:unknown:a3f9c2b81d04`

Normalize the message by stripping run-specific tokens (IDs, timestamps, counts) before hashing, so the same logical error produces the same signature across runs.

### Audit finding

```
{runbook}:{category}:{bucketDate}
```

Example: `audit-sends:tcpa_spike:2026-04-W17`

Use ISO week (`YYYY-WNN`), ISO date (`YYYY-MM-DD`), or ISO month (`YYYY-MM`) as the bucket granularity depending on how frequently the condition is expected to recur.

### Bucketing guidance

> When unsure, err toward broader bucketing — false dedups are cheaper than duplicate PRs/tickets.

If two slightly different signatures would both point a human to the same fix, use the same signature. Merging findings that belong together is always preferable to filing two separate work items for the same root cause.

---

## Routing Semantics

`suggestedFix.type` determines where the finding goes after dedup. There are exactly three routes.

| `type` | Pipeline | Outcome |
|---|---|---|
| `code` | Repair pipeline | Automated repair agent attempts a patch; if a valid patch is produced, a PR is opened. |
| `heal_script` | PR pipeline | A PR is opened that adds or invokes the heal script at `scriptPath`. |
| `manual` | Tracker ticket | A Linear ticket is filed for human follow-up. |

**Every finding becomes a PR or a ticket — there is no informational routing.** If a finding does not warrant a PR or a ticket, it must not be emitted at all.

---

## When to Emit / When Not to Emit

### Emit a finding when

- A real, confirmed violation, regression, or anomaly exists.
- The finding warrants code action (a patch) or human action (a ticket).

### Do NOT emit a finding for

- **PASS results** — a rule that is working correctly (e.g., "Memorial Day block working correctly", "all sends inside the TCPA window", "no opt-out violations today").
- **Informational or visibility metrics** that the runbook itself labels as informational rather than a violation (e.g., near-window duplicate counts, per-state exposure counts that are expected).
- **Clean scorecards, healthy funnels, or expected baselines** — absence of a problem is not a finding.

> When in doubt, do not emit. A missed informational note costs nothing; a spurious finding files noise that a human must triage and close.

---

## Dedup Rules

The orchestrator runs all emitted findings through a dedup filter before dispatching them. The filter is applied separately per routing type.

### `code` findings

A `code` finding is suppressed if **either** condition is true:

1. An open PR already exists whose `signature` stem (derived by `dedupStem`) matches the finding's stem.
2. A branch already exists whose name corresponds to this finding's signature.

The stem strips run-specific suffixes so that a finding for the same root cause does not create a second PR while the first is still open.

### `manual` findings (and `heal_script`)

A non-code finding is suppressed if a tracker ticket already exists for the **exact signature**.

### Within a single run

If the same signature stem appears more than once in a single run's output, only the first occurrence is processed; subsequent duplicates are dropped.

---

## Control Tools

Every runbook agent communicates with the orchestrator through exactly two tools.

### `emit_finding`

Emits one structured finding. Call this each time a confirmed, actionable issue is identified. The orchestrator queues the finding for dedup and routing after the runbook calls `skill_done`.

**Required inputs:** `signature`, `severity`, `category`, `title`, `description`, `evidence`, `suggestedFix` (with `type`).

**Optional inputs on `suggestedFix`:** `fileHint`, `functionHint` (when `type = code`); `scriptPath` (when `type = heal_script`).

Do not call this tool for PASS results or informational observations — only for findings that will survive the "every finding becomes a PR or ticket" rule.

### `skill_done`

Signals that the runbook's investigation is complete and no further findings will be emitted.

**Required inputs:** `summary` — a brief natural-language summary of what the runbook checked and what (if anything) it found.

Call `skill_done` exactly once, as the final action of the runbook. The orchestrator stops processing the runbook after this call. Do not call `emit_finding` after calling `skill_done`.
