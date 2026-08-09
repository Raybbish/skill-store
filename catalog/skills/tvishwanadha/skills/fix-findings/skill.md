---
name: fix-findings
description: >-
  This skill should be used when the user asks to "fix findings", "apply review
  fixes", "address review findings", or after a self-review produces findings.
  Cluster verified review findings and apply fixes interactively, with optional
  background execution.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write, Task, Skill, AskUserQuestion
---

# Fix Review Findings

Cluster verified review findings, then step through them interactively, applying approved fixes.

## Stop conditions

Do nothing and stop if any of these hold:

- there are no findings to act on
- you cannot prompt the user or cannot write files (non-interactive context, read-only sandbox, or running as a dispatched sub-review)

## Procedure

### 1. Gather findings

Use the verified findings from the `self-review` handoff already in context. If none are in context, stop and tell the user to run `reviewer:self-review` first.

### 2. Opening gate

Ask the user how to proceed (one prompt):

- **Interactively** - cluster and step through fixes (default)
- **Apply all safe** - apply only the safe subset (see below) without per-issue prompts, then list the rest; skip steps 3-5 and go directly to step 6
- **Skip** - leave the findings unaddressed and stop

### 3. Cluster (only if more than 5 findings)

Group findings into clusters by shared file, root cause, or fix type. With 5 or fewer findings, treat each finding as its own cluster. Make each cluster file-disjoint. If a root cause forces a cluster to span files, flag it.

### 4. Iterate clusters

For each cluster, in severity order:

1. Present the issue(s), the concrete suggested fix, and offer a deeper explanation if the user asks.
2. Ask: **apply / modify / skip**.
   - **apply** - if no in-flight fix touches the same file, launch a background fixer (step 5) and move to the next cluster immediately; otherwise apply inline.
   - **modify** - incorporate the user's adjustment, then apply.
   - **skip** - leave it.
3. Serialize: a cluster touching a file already being fixed in the background must wait for that fix to finish before starting.

### 5. Background fixer

Hand off to a background agent that can edit files. Give it a scoped prompt with the cluster's findings, the target files, and the agreed fix, and instruct it to make the minimal edit and not touch unrelated code. Collect all fixer results before the summary.

### 6. Summarize

Report applied / modified / skipped / failed counts, list the changed files, and tell the user to review the diff (`git diff`). Offer a re-review via `reviewer:self-review <original review scope> --no-fix` - use the same scope as the original review, not just the changed files.

## Safe subset

For "apply all safe", apply only findings that are all of: verified `real`, confidence >= 90, and have a concrete fix localized to a single site. List everything else as suggested-but-not-applied.
