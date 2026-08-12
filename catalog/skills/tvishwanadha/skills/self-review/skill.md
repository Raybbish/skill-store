---
name: self-review
description: >-
  This skill should be used when the user asks to "review code", "check changes",
  "audit work quality", "run a self-review", "review a diff", "check for
  performance or efficiency problems", "look for injection or data-integrity
  issues", "find stale docs or broken links", or "did my change break any
  skills". Orchestrate comprehensive code review by launching reviewer agents
  in parallel.
allowed-tools: Read, Glob, Grep, Bash, Task, Skill
argument-hint: "[scope: file, directory, or --diff <ref>] [--no-fix]"
---

# Self-Review

Orchestrate a comprehensive code review by launching parallel reviewer groups, each running one or more review types over a shared context. Coalesce findings into a unified report.

## Examples

- `self-review` - review the current diff (uncommitted changes, or branch vs base if the tree is clean)
- `self-review --diff main` - review changes vs the merge-base with main
- `self-review --diff HEAD~3` - review the last 3 commits
- `self-review src/` - review all files in src/ (whole-file, not diff-scoped)
- `self-review path/to/file.ts` - review a specific file
- `self-review --diff main --no-fix` - review only; skip the fix handoff

## Built-in Defaults

These defaults apply unless overridden by a `self-review-extension` skill:

| Review type | Agent | Scope |
|-------------|-------|-------|
| `review-logic` | `reviewer:reviewer` (opus) | packet |
| `review-skill` | `reviewer:reviewer` (opus) | explore |
| `review-patterns` | `reviewer:simple-reviewer` (sonnet) | packet |
| `review-documentation` | `reviewer:simple-reviewer` (sonnet) | packet |

- **Scopes**: `packet` - the diff packet is the primary view; review the changed lines. `explore` - the review type investigates the whole codebase for what the change affects; the packet records what changed but does not bound the review.
- **Grouping**: review types sharing both agent and scope run inside one reviewer subagent - see step 4.
- **Confidence threshold**: >= 80
- **Verification**: always on - every finding that clears the threshold is verified before it appears in the report (see step 6)
- **Fixing**: after the report, hands off to `reviewer:fix-findings` for interactive fixes, unless `--no-fix` is passed or the context is non-interactive (see step 8)

## Procedure

> **Run all reviewers concurrently.** Launch them all in a single message.

### 1. Parse scope

Determine the review scope from `$ARGUMENTS`. The default scope is the diff, not the whole tree.

First, check for the `--no-fix` flag: if the token `--no-fix` appears anywhere in `$ARGUMENTS`, note it (it suppresses the fix handoff in step 8) and remove it from the string before resolving scope, so it is not mistaken for a file path.

- **Empty or blank**: review the current diff.
  - Run `git diff --name-only HEAD` for tracked changes, and `git ls-files --others --exclude-standard` for untracked (newly created) files. Combine both lists. If non-empty, the scope is the uncommitted changes (staged + unstaged + new files) vs `HEAD`.
  - If both are empty (clean tree), fall back to the branch diff vs the default base `<base>` (the default branch - `origin/HEAD` if detectable, otherwise `main`): `b=$(git merge-base <base> HEAD); git diff --name-only "$b"`.
- **Starts with `--diff`**: extract the git ref (token after `--diff`, default `HEAD~1` if missing). Resolve the merge-base, then diff the **working tree** against it: `b=$(git merge-base <ref> HEAD); git diff --name-only "$b"`, plus `git ls-files --others --exclude-standard` for untracked files. Do NOT use `git diff <ref>...HEAD`.
- **Otherwise**: treat as file path(s) or directory. This is whole-file review, not diff-scoped (no hunk focus in step 4).

### 2. Gather target files and build the review packet

**Diff modes** (the empty default and `--diff <ref>`):

- Partition the changed file list into **existing files** (still on disk) and **deleted files** (removed in this diff). Existing files are the review scope. Deleted files are passed as context in each review prompt. If both lists are empty, report "No changes found" (name the ref for `--diff`; for the empty default say "no uncommitted changes and no diff vs `<base>`") and exit without launching review tasks.
- **Write the review packet.** Each review round re-runs `mktemp` to generate a fresh packet file: `packet=$(mktemp "${TMPDIR:-/tmp}/self-review-packet.XXXXXX")`. Build the whole thing by redirecting shell output straight to the file - do not read the diff or hunks into your own context at this step. The packet must contain, in order:
  1. The commit list for the resolved range: `git log --oneline "$b"..HEAD`. If the scope is the empty-default uncommitted-changes case (no commit range, just working tree vs `HEAD`), write a line noting "uncommitted changes only" instead.
  2. `git diff --stat` for the resolved range (`git diff --stat HEAD`, or `git diff --stat "$b"` for `--diff` / clean-tree modes).
  3. The full diff with wide context: `git diff -U10 HEAD`, or `git diff -U10 "$b"` (same ref resolved in step 1).
  4. Each untracked file, appended in full and labeled with its path (e.g. `echo "=== <path> (untracked, full file) ==="` followed by the file's contents).

**Directory**: discover files in the directory. No packet (whole-file review).

**File paths**: use the paths directly. No packet (whole-file review).

### 3. Load the framework and extension

Load `reviewer:reviewer-framework` - it defines the finding format, deduplication, coalescing, and threshold rules this procedure applies.

Try to load `self-review-extension`.

If it loads, its instructions take priority over the built-in defaults. Extensions are additive - built-in review types are always included unless the extension explicitly removes them. The extension can:
- Add or remove review types from the list
- Change agent assignments per review type
- Declare a scope (`packet` or `explore`) per review type; a review type with no declared scope defaults to `packet`
- Adjust the confidence threshold
- Add pre/post-review steps

**Namespace resolution**: built-in types can be referenced with or without the `reviewer:` prefix (e.g., `review-logic` or `reviewer:review-logic`). Custom types from extensions use their skill name directly (e.g., `review-plugin`).

If it does not load (skill not found), use the built-in defaults.

### 4. Launch grouped reviews

Group the final review-type list by (agent, scope). Agent names are opaque keys - custom agents from extensions form their own groups alongside the built-in ones. Spawn ONE reviewer subagent per group.

For each group, spawn a reviewer subagent:

- **Agent**: the group's agent
- **Prompt**: a numbered list of the group's review skills in run order, each invoked with the scope as its argument. Instruct the agent to build context once, invoke each skill in sequence over that shared context, and label every finding with `Found by: <review-type>` - required even for a single-skill group.

**In diff modes**, also pass the packet file's path plus the file list, so reviewers concentrate on what changed. **Whole-file modes** (directory / file paths) group the same way but omit the packet path and the packet-reading blocks below - there is no packet to read.

Do not add ad-hoc suppression to reviewer prompts - no "do not flag X", no pre-rated severities. Durable exceptions belong in versioned convention files (local review overrides, `self-review-extension`); anything else gets raised by the reviewer and adjudicated after verification.

Example prompt for a **packet**-scoped group (diff mode):
```
Build context once, then invoke each skill below in sequence, passing the
scope as its argument. Label every finding with `Found by: <review-type>`.

1. Invoke `reviewer:review-patterns` with argument: src/handler.ts src/utils.ts tests/handler.test.ts
2. Invoke `reviewer:review-documentation` with argument: src/handler.ts src/utils.ts tests/handler.test.ts

Review scope: changes vs the merge-base with main.

Files to review:
- src/handler.ts
- src/utils.ts
- tests/handler.test.ts

Deleted files (review for stale references, not file contents):
- src/old-handler.ts

Review packet: /tmp/self-review-packet.a1B2c3

The packet is your view of the diff - read it once; its commit list, diff
stat, and `-U10` context lines carry the changes. Do not re-run git to
re-derive the diff, and do not re-read changed files just to see the changes
again. Exception: if a hunk you must judge is cut off mid-function even at 10
lines of context, read that file directly and say so in your report.

Focus: review ONLY the changed lines shown in the packet. Do not flag
pre-existing code unless this change directly breaks or worsens it. The only
other out-of-hunk findings allowed are about a deleted file or a reference
this change leaves stale. You may search the wider codebase to confirm a
finding about a changed line (a reinvented helper, a duplicated block, a
broken caller); still report only what these changed lines cause.
```

Example prompt for an **explore**-scoped group (diff mode):
```
Build context once, then invoke each skill below in sequence, passing the
scope as its argument. Label every finding with `Found by: <review-type>`.

1. Invoke `reviewer:review-skill` with argument: src/handler.ts src/utils.ts tests/handler.test.ts

Review scope: changes vs the merge-base with main.

Files to review:
- src/handler.ts
- src/utils.ts
- tests/handler.test.ts

Deleted files (review for stale references, not file contents):
- src/old-handler.ts

Review packet: /tmp/self-review-packet.a1B2c3

The packet records what changed - read it once, then investigate the
codebase as widely as the review skills' rules require. Flag only what this
change causes or invalidates, not pre-existing untouched issues.
```

### 5. Coalesce findings

After all reviewers return, apply the framework's coalescing rules to their outputs, with a confidence threshold of >= 80 (or as adjusted by the extension). If a finding has no `Found by` label, attribute it to its group's skill list.

The result is the set of **survivors** - findings that cleared the threshold. These go to verification.

### 6. Verify findings

Verification always runs on the survivors from step 5. It never adds new findings - it only keeps, drops, or downgrades existing ones.

**Tier 0 - mechanical filter (no agent).** Consult the packet file from step 2 with targeted searches (e.g. grep for the file/line or `@@` marker), not a full read:

- Drop any finding whose `file:line` is not inside a changed hunk, unless the finding names specific unchanged code that this change breaks or worsens (judge by the finding's substance, not whether it is phrased as an argument), or concerns a deleted file / stale reference.
- Drop findings whose `file:line` does not exist or does not contain what the finding describes (spot-check by reading the file). This does not apply to deleted-file findings.
- Whole-file modes have no packet: skip the hunk-membership check and apply only the reference-validity check.
- All diff modes diff the working tree (against `HEAD` or the merge-base), so hunk line numbers match what reviewers read on disk; still allow a small line offset before dropping a near-miss.

**Tier 1 - adversarial fanout.** For each finding that survives Tier 0, spawn a `reviewer:reviewer` (opus) subagent whose job is to *refute*, not re-review. Run at most 10 verifier subagents in flight at once; launch each batch in a single message. One verifier may take several findings from the same file, passed in one prompt. Each prompt contains the finding(s) plus the packet path (in whole-file modes, pass the surrounding file region instead, since there is no packet) and instructs:

```
Do NOT invoke any review skill. Your job is to refute the finding(s) below.
- Findings with a runtime trigger (logic, edge cases, error handling): try to
  construct the input or code path that triggers the bug, or show it cannot
  occur. Return `refuted` if you cannot demonstrate it is real.
- Findings with no executable trigger (documentation, naming, style,
  skill/structure): check whether the claim is factually wrong or absent from
  the code. Return `refuted` only if you can show the claim is false; if you
  can neither confirm nor disprove it, return `uncertain` - never `refuted`
  merely because there is no runtime trigger.
Also judge whether the suggested fix is correct.

Return, for each finding: verdict (real | refuted | uncertain),
adjusted_confidence (0-100), and a one-line reason.
```

Apply each verdict:

- `refuted`: drop the finding
- `uncertain`: set its confidence to `adjusted_confidence` and re-apply the threshold (drop if it now falls below)
- `real`: keep (use `adjusted_confidence` if higher than the original)

Count every finding dropped at this step - Tier 0 mechanical drops, Tier 1 `refuted` verdicts, and `uncertain` findings that fell below threshold - as a single "dropped at verification" total for step 7.

### 7. Present report

```
# Self-Review Report

**Scope**: <description of what was reviewed>
**Review types**: <list of review types run>
**Confidence threshold**: >= <threshold>

## Findings

<findings in the reviewer-framework output format, grouped by severity>

## Summary

Total: N findings (X critical, Y high, Z medium, W low)
Filtered out: M findings below confidence threshold
Dropped at verification: V findings (mechanical + refuted + re-scored below threshold)
```

If no findings survive (threshold + verification), report:

```
# Self-Review Report

**Scope**: <description>
**Review types**: <list>

No issues found above the confidence threshold (>= <threshold>).
<N> findings were filtered out below threshold; <V> were dropped at verification.
```

### 8. Hand off to fixing

Skip this step and end with the report if `--no-fix` was set (step 1), or if the context is non-interactive - running as a subagent, or with no user available to answer prompts. Otherwise invoke `reviewer:fix-findings` to apply fixes for the findings just reported; the verified findings are already in context.

### 9. Iterative re-review

If the user fixes issues and asks for re-review, repeat the process against the same scope as the original review, not just the flagged or fixed files. Narrow only when the user explicitly asks.
