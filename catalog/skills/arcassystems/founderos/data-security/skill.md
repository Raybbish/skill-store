---
name: data-security
description: Check whether data is safe to share with an external tool. Say "is this safe to paste", "can I send this to <tool>", or "classify this data". Fires before pasting, uploading, forwarding, or sending data to an external tool or AI model. Classifies the data and checks it against the user's data-handling policy.
why: "Stops client and sensitive data from moving to tools that were not approved - a single paste to the wrong AI can breach client trust and violate data agreements."
enhance: "Fill rules/data-handling.md with your own per-tool decisions and any client-specific restrictions from context/clients.md - the fallback matrix is generic and may be too permissive for your situation."
allowed-tools: ["Read", "Grep"]
mcp_requirements: []
---

# Data Security

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

Block unsafe data movement before it leaves the user's control.

## When To Run

- The founder is about to paste content into an AI tool.
- A file is about to be uploaded to an external service.
- Client, employee, financial, legal, health, or personal data is involved.
- The tool is new, unlisted, or consumer-grade.
- The user asks "can I paste this" or "is this safe to upload".

## Pre-Read

Read the first available policy source. Skip a source silently if it does not exist; do not error out.

1. `rules/data-handling.md` (likely absent on a fresh install - skip if missing)
2. `rules/approval-gates.md` (or fall back to `templates/rules/approval-gates.md`)
3. `stack.json` (lists which tools the user has approved)
4. `context/clients.md` (per-client restrictions, if any are noted)

If none of the above exist or yield a policy, use the default matrix below and tell the user it is a fallback.

## Data Classes

| Class | Examples | Default Tool Access |
|---|---|---|
| Public | Published posts, public pages, public case studies | Any tool |
| Internal | SOPs, internal notes, non-sensitive business plans | Paid tools with business terms |
| Client general | Client name, project scope, public deal existence | Tools with no-training terms or business agreement |
| Client sensitive | Strategy, financials, private messages, personal data | Approved tools only |
| Regulated | Health, legal, banking, tax, ID, payroll, protected personal data | Specific approved systems only |

If ambiguous, choose the more restrictive class.

## Tool Classes

| Tool Class | Examples | Allowed Data |
|---|---|---|
| Approved secure | Enterprise or API tools listed in the user's policy | Up to the policy limit |
| Business paid | Paid tools with no-training or business terms | Public, internal, client general if policy allows |
| Consumer or free | Free chat tools, unapproved browser tools | Public only |
| Unknown | Anything not listed | Public only |

## Procedure

1. Identify the data involved.
2. Classify the highest-risk data class.
3. Identify the destination tool.
4. Classify the tool class from policy or fallback.
5. Compare data class to tool class.
6. Return `ALLOW`, `REDACT FIRST`, or `BLOCK`.
7. For `BLOCK`, name a safer tool or a local-only path.

## Output Format

```text
Data class: <class>
Tool class: <class>
Call: ALLOW | REDACT FIRST | BLOCK
Reason: <one sentence>
Safe path: <tool or local action>
```

## Redaction Rule

Do not silently redact and proceed. Show what type of information must be removed, then ask the user to confirm the redacted version before using it.

## Rules

- Client-sensitive and regulated data never go to unknown tools.
- Per-client restrictions override the generic matrix.
- A one-time exception needs explicit human approval and a log entry.
