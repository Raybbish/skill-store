---
name: finance-import
description: Parse a finance CSV export into a normalized markdown summary the OS can read later. Say "import this finance export", "parse this finance CSV", or "summarize this finance export". Read-only at the source - it never writes back to your accounting tool. Detects amount, date, account, category, and memo columns and totals by category.
why: "A bank or accounting CSV is unreadable to the OS as-is, so financial context never makes it into your operating layer. This turns one export into a clean markdown mirror your other skills can cite without ever touching the source system."
summary: "Parse a finance CSV export into a markdown summary the OS can read."
enhance: "Re-run after each new export so the markdown mirror stays current - skills like unit-economics and proposal-writer are only as accurate as the last import."
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
mcp_requirements: []
---

# Finance Import

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

Convert a finance export into a markdown summary the OS can read later. The skill is read-only at the source boundary: it parses an export you give it and never writes back to your accounting tool or bank.

CSV input is supported. PDF input is a manual path until a per-format parser is tested (see PDF build path below).

## Pre-flight

If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`

## When to invoke

Invoke when you have a finance CSV export and want a clean markdown mirror in the OS for later retrieval, planning, or to feed into `unit-economics`.

## Protocol

1. Accept a CSV path and a reporting period (`YYYY-MM`).
2. Parse the header row and all records.
3. Detect likely amount, date, account, category, and memo columns.
4. Produce a normalized markdown summary with totals by category and warnings for missing fields.
5. Write the summary to `finance/<period>/summary.md` under the OS root (create the folders if they do not exist). Confirm the path with the operator before writing.
6. Print a one-line `WROTE:` confirmation with the path, byte count, and a short description.
7. Append a one-line trace to `brain/log.md` recording the period and record count.

<!-- private-tag: not applicable: the brain/log.md write is a computed import trace (period and record count), not user-provided speech, so the private-tag filter does not apply here. -->

## Output schema

```yaml
finance_import:
  status: ok | blocked
  input_type: csv | pdf
  source_path: "<path to the export>"
  period: "<YYYY-MM>"
  records_read: <number>
  records_skipped: <number>
  totals:
    - category: "<category>"
      amount: "<decimal string>"
  warnings:
    - "<warning or none>"
  output_path: "<path to summary.md>"
```

## Failure modes

- **Source type is PDF:** return `blocked_pdf_scaffold` and ask for a CSV export instead.
- **Amount column missing:** stop and ask the operator to map columns.
- **Date column missing:** proceed only if the operator supplies the period.
- **Confidential identifiers found** (full account numbers, tax IDs): stop and ask the operator to redact before import. Do not echo them.
- **Output path missing or unconfirmed:** ask for the path before writing. Never overwrite an existing `summary.md` without confirmation.

## Composes with

- `unit-economics`, which can read the category totals to ground a margin or break-even calculation in real numbers.
- `strategic-analysis`, which can cite the mirror when an analysis needs financial context.
- `data-security`, which classifies whether a given export is safe to keep in the OS as-is or needs redaction first.

This skill is standalone - it does not depend on any other finance skill. It produces the markdown mirror and stops.

## Free-tier path

Free-tier users paste a small CSV sample into chat and copy the markdown summary into `finance/<period>/summary.md` manually. Large files should be summarized locally before pasting so the raw rows never enter context.

## Worked example

Input CSV:

```csv
date,account,category,memo,amount
2026-04-01,Operating,Revenue,Example invoice,1200.00
2026-04-02,Operating,Software,Tool subscription,-50.00
2026-04-03,Operating,Revenue,Second invoice,800.00
```

Output:

```yaml
finance_import:
  status: ok
  input_type: csv
  source_path: "exports/finance-2026-04.csv"
  period: "2026-04"
  records_read: 3
  records_skipped: 0
  totals:
    - category: Revenue
      amount: "2000.00"
    - category: Software
      amount: "-50.00"
  warnings: []
  output_path: "finance/2026-04/summary.md"
```

Expected file header:

```markdown
# Finance Summary - 2026-04

Source: `exports/finance-2026-04.csv`
Records read: 3
Records skipped: 0
```

Output line:

```text
WROTE: finance/2026-04/summary.md | 612 bytes | normalized finance summary for 2026-04
```

## PDF build path

PDF parsing is not enabled by default because table extraction from a PDF is fragile and a wrong total is worse than no total. To enable it for your export format:

1. Collect three sample PDFs of the same export type with confidential fields redacted.
2. Define the page and table patterns for that export type.
3. Add a visual review step before trusting any extracted total.
4. Compare PDF extraction totals against a CSV export for the same period.
5. Promote PDF input only after the totals match across repeated tests.

## Cross-reference

- `skills/unit-economics/SKILL.md` - reads the category totals for business math.
- `skills/data-security/SKILL.md` - classifies whether the export is safe to keep as-is.
