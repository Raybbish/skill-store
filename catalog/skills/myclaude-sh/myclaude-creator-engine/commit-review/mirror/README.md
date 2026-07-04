# Commit Review

> Systematic review of git commits for message quality, diff hygiene, and common mistakes before pushing.

## Install

```bash
myclaude install commit-review
```

## Usage

```
/commit-review              # Review last unpushed commits
/commit-review HEAD~5       # Review last 5 commits
/commit-review --strict     # Strict mode for open source
```

## What It Checks

- **Message quality** — Conventional commit format, imperative mood, 72-char limit
- **Diff size** — Flags oversized commits that should be split
- **Anti-patterns** — Debug code, secrets, large binaries, mixed concerns
- **Quality signals** — Tests alongside code, docs alongside behavior changes

## Requirements

- Claude Code >= 1.0.0
- Git repository with commits to review
