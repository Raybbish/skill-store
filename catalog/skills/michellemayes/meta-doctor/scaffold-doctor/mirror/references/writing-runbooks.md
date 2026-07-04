---
name: writing-runbooks
description: >
  Reference for authoring doctor runbooks. Use when creating a new runbook,
  understanding runbook structure, adding a runbook to the index, assigning
  a mode, or reviewing an existing runbook for completeness.
  Triggers: write a runbook, add a runbook, runbook structure, how do runbooks
  work, what goes in a runbook, register a runbook.
---

# Writing Runbooks

A **runbook** is the doctor's internal audit definition — a self-contained
markdown file that tells the agentic loop what healthy looks like, what to
inspect, and when a finding is real versus noise. Every automated health check
the doctor runs is driven by a runbook.

> **Terminology note.** The source codebase calls these "skills" internally.
> Everywhere in user-facing content and in this plugin they are called
> **runbooks**. Never use "skills" when referring to a doctor's audit
> definitions.

---

## What a runbook encodes

Every runbook must answer three questions:

1. **What does HEALTHY look like?**
   Describe the steady-state you expect when nothing is wrong. This is the
   baseline the rest of the runbook checks against. A healthy run emits
   **zero findings** — that is the correct and expected outcome, not a
   failure of the runbook.

2. **What to INSPECT?**
   List the concrete queries, tool calls, or data sources the agent runs.
   Pull live config first (never hardcode thresholds — read them from the
   app's config store). Parameterize every subsequent check off that config
   so the runbook stays correct as the app evolves.

3. **How to CLASSIFY findings?**
   Define which results are real violations (call `emit_finding`) and which
   are informational or expected noise (PASS with a note). Separate the two
   explicitly — an informational metric that looks like a violation trains the
   team to ignore findings.

---

## Runbook skeleton

Copy and complete this skeleton when authoring a new runbook.

```markdown
---
name: <kebab-case-name>
description: >
  One to three sentences describing what this runbook audits.
  Trigger phrases: <comma-separated phrases that should invoke this runbook>.
---

# <Title>

## Healthy state

Describe what the system looks like when everything is working correctly.
Be specific enough that a reviewer can confirm the runbook is checking the
right thing. Most healthy runs emit zero findings.

## Inspect

### Step 1: Pull live config

Read thresholds and feature flags from the app's config store before running
any checks. Never hardcode values — parameterize everything off the config
you just read.

### Step 2: <Describe the first data source or query>

Explain what to query, which tool to call, what time window to use, and what
you are looking for.

### Step 3: <Describe the second data source or query>

Repeat for each distinct data source. Keep steps short and ordered — each
step's output should inform the next.

## Classify

For each result category, state whether it is a PASS or triggers
`emit_finding`.

| Result                                      | Action                          |
| ------------------------------------------- | ------------------------------- |
| Count below actionable threshold            | PASS — log count informally     |
| Count at or above threshold, traceable root cause | `emit_finding` (see below) |
| Known noise / expected transient            | PASS — note in output           |

When calling `emit_finding`, include:

- `category` — one of: `code_bug` | `compliance` | `data_drift` | `cost_anomaly` | `infra_drift`
- `signature` — a stable string that uniquely identifies this finding type
  (see the finding-contract reference for the required format per category)
- `suggestedFix.type` — `"code"` | `"heal_script"` | `"manual"`
- `suggestedFix.fileHint` / `suggestedFix.functionHint` — when `type = "code"`
- `suggestedFix.scriptPath` — when `type = "heal_script"`

See `references/finding-contract.md` for the full contract.
```

---

## Registering a runbook

After writing the runbook file, register it in two places:

### 1. Runbook index (`skills/index.ts`)

Import the file and add it to the `bundledSkills` record:

```typescript
import myRunbook from "./my-runbook.md";

export const bundledSkills: Record<RunbookName, string> = {
  // ... existing runbooks ...
  "my-runbook": myRunbook,
};
```

The key must match the `name` field in the runbook's YAML frontmatter.

### 2. Mode assignment

Add the runbook name to either the `runbooksDaily` or `runbooksWeekly` key in the
doctor's config:

```typescript
runbooksDaily: [
  "scan-logs",
  "my-runbook",        // runs every day
],
runbooksWeekly: [
  "aws-cost-analysis", // runs once a week
],
```

**`daily`** — for checks that catch live regressions or fast-moving metrics
(error rates, queue depth, send compliance).

**`weekly`** — for checks where daily noise would exceed signal (cost trends,
coverage drift, long-horizon metrics).

---

## Authoring checklist

Work through these before declaring a runbook done. Distilled from the shape
of production runbooks in this codebase.

- [ ] **Pull live config first.** The very first step reads thresholds from
      the app's config store. No hardcoded numbers anywhere in the runbook.

- [ ] **Parameterize every check off the config.** Time windows, count
      thresholds, feature-flag gates — all come from the config you just read.
      If the product team changes a threshold, the runbook adapts automatically.

- [ ] **Separate violations from visibility.** Informational metrics
      (e.g. "total events processed today") belong in the output narrative,
      not in `emit_finding`. Only call `emit_finding` for actionable problems.

- [ ] **Define a stable finding signature.** Every `emit_finding` call must
      include a `signature` string that is deterministic for a given root cause
      and does not change between runs. Unstable signatures cause duplicate
      tickets. See `references/finding-contract.md` for format requirements per
      category.

- [ ] **Healthy runs emit zero findings.** If a runbook emits a finding on
      every healthy run, it is miscalibrated. Review the threshold and the
      classify logic.

- [ ] **No product-specific hardcoding.** If the runbook names a table, a
      service, or a business rule specific to the current app, it will break
      when the doctor is moved to another project. Derive everything from live
      config or documented inputs.

- [ ] **Registered in index and config.** Added to `skills/index.ts` and
      assigned to a mode via `runbooksDaily` or `runbooksWeekly`. A runbook
      that is not in the index never runs.

---

## Key principle

Most healthy runs emit **zero findings**. A runbook that always fires is not
more thorough — it is wrong. Calibrate thresholds so that a finding is always
worth acting on.
