---
name: git-rebase-workflow
description: >
  Guide Claude through safe git rebase workflows: interactive rebase, conflict resolution,
  squash strategies, and force-push safety. Use when the user asks "rebase my branch",
  "clean up commits", "squash commits before PR", "rebase onto main", "resolve rebase conflicts",
  or wants help with git history cleanup. 安全的 Git Rebase 工作流指南：交互式变基、冲突解决、
  提交压缩策略和安全强制推送。
allowed-tools: Bash Read Grep
---

# Git Rebase Workflow

Guide the user through safe, team-friendly git rebase operations — from syncing with main to interactive commit cleanup and safe force-pushing.

## When to Use

- User wants to rebase a feature branch onto main/develop
- User needs to squash or clean up commits before a PR
- User sees "branch has diverged" and needs guidance
- User asks about interactive rebase (`rebase -i`)
- User wants to set up rebase aliases or hooks

## When NOT to Use

- User is on `main` or a shared branch — warn them and suggest merge instead
- User wants to rewrite history that has already been merged — this is destructive
- User is resolving a complex merge and wants to preserve conflict resolution history

## Prerequisites

- Git installed (>= 2.0)
- Working in a git repository with a remote

## Step-by-Step Workflow

### 1. Assess the Situation

```bash
git status
git log --oneline -10
git rev-parse --abbrev-ref HEAD
```

Confirm the user is on a feature branch, not main. If on main, STOP and warn.

### 2. Sync with Upstream

```bash
git fetch origin
git rebase origin/main
```

If conflicts occur:
1. Show the conflicted files: `git diff --name-only --diff-filter=U`
2. Help resolve each conflict
3. Stage resolved files: `git add <file>`
4. Continue: `git rebase --continue`
5. If unrecoverable: `git rebase --abort`

### 3. Interactive Rebase (Commit Cleanup)

```bash
git rebase -i origin/main
```

Apply these strategies:
- **squash** WIP/typo/fix commits into their parent logical commit
- **reword** vague messages like "updates" into descriptive ones
- **drop** accidental commits (debug logs, temp files)
- Keep logical boundaries: separate refactors from features from tests

Ordering: refactors first → features → tests → docs.

### 4. Force Push Safely

```bash
git push --force-with-lease
```

**Never use `--force`** — it can overwrite teammates' work. `--force-with-lease` fails safely if the remote has new commits you haven't seen.

If the push is rejected, fetch and rebase again before retrying.

### 5. Verify

```bash
git log --oneline origin/main..HEAD
```

Confirm:
- Commits are in logical order
- No WIP/fixup commits remain
- Commit messages follow the team's convention

## Input/Output Spec

- **Input**: A git repository with a feature branch that needs rebasing or cleanup
- **Output**: Clean, rebased branch with logical commits ready for PR review

## Edge Cases & Error Handling

| Scenario | Action |
|---|---|
| On main branch | STOP — warn user, never rebase main |
| Rebase conflicts in every commit | Consider `git rebase --abort` and doing a merge instead |
| "diverged from origin" after rebase | Expected — verify with `git log`, then `--force-with-lease` |
| Coworker pushed to same branch | Fetch first, discuss with coworker before force pushing |
| Pre-push hook blocks push | Check if `--force-with-lease` is being blocked by policy |

## Examples

### Example 1: Clean up before PR

User: "I have 8 messy commits on my feature branch, help me clean up before opening a PR"

```bash
git fetch origin
git rebase -i origin/main
# In editor: squash WIP commits, reword vague ones
# Result: 3 clean commits — "add API endpoint", "add tests", "update docs"
git push --force-with-lease
```

### Example 2: Sync stale branch

User: "My branch is 47 commits behind main"

```bash
git fetch origin
git rebase origin/main
# Resolve any conflicts one by one
git push --force-with-lease
# Branch is now up-to-date with clean linear history
```

### Example 3: Recover from bad rebase

User: "I messed up a rebase and my branch looks wrong"

```bash
git reflog  # find the commit before rebase started
git reset --hard HEAD@{N}  # reset to pre-rebase state
# Now try again more carefully, or use merge instead
```
