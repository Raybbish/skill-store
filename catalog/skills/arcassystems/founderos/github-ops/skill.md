---
name: github-ops
description: Fast GitHub operations via the gh CLI. Use when the user mentions GitHub issues, PRs, repos, actions, releases, creating or triaging issues, opening or reviewing pull requests, managing branches, inspecting repo state, or checking CI. Works on any repo the operator's gh CLI is authenticated against.
why: "Keeps repo work in the same place you think and write, so triaging an issue or opening a pull request does not pull you out of the OS into a browser tab."
enhance: "Authenticate the gh CLI once before first use - the skill drives gh directly, so an unauthenticated CLI is the one thing that stops it cold."
summary: "Run GitHub operations through the gh CLI - issues, PRs, branches, releases."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# GitHub Operations

Runs on: local-exec - runs a local script; on a cloud surface I read the results, I do not run it.

Fast GitHub operations on any repo your `gh` CLI is authenticated against.

## Trigger

When the operator asks about GitHub issues, PRs, repos, actions, or releases.

## Interface: gh CLI is canonical

Use the `gh` CLI via Bash for all read and write operations: `gh issue list`, `gh pr view`, `gh api`, `gh run list`, and so on. The CLI is the canonical interface for this skill.

A GitHub MCP server, if present in the session, may expose only `authenticate` and `complete_authentication` (auth-only) and not the full issue, PR, or Actions tool surface. Do not assume MCP covers an operation. Check the available tools at session start before relying on MCP, and fall back to `gh` whenever MCP does not cover what you need. If a future session has a fuller GitHub MCP wired up, prefer those tools and fall back to `gh` only for gaps.

## Pre-flight

- Confirm `gh` is installed and authenticated: `gh auth status`. If it is not, tell the operator to run `gh auth login` and stop.
- Confirm the target repo. If the working directory is a git repo, `gh` infers it. For another repo, pass `--repo owner/name` explicitly.

## Capabilities

### Issues
- Create issues: `gh issue create --title "..." --body "..."`
- List and filter open issues: `gh issue list --state open`
- Comment on issues: `gh issue comment <number> --body "..."`
- Close or label issues: `gh issue close <number>`, `gh issue edit <number> --add-label "..."`

### Pull requests
- List open PRs: `gh pr list --state open`
- Review PR diffs and comments: `gh pr view <number> --comments`, `gh pr diff <number>`
- Create PRs (only when explicitly asked): `gh pr create --title "..." --body "..."`
- Check PR CI status: `gh pr checks <number>`

### Actions and CI
- View recent workflow runs: `gh run list`
- Check a specific run status and logs: `gh run view <run-id> --log`
- Re-trigger a failed run (only when explicitly asked): `gh run rerun <run-id>`

### Repository
- View repo stats: `gh repo view`
- Browse files and directories: `gh api repos/{owner}/{repo}/contents/{path}`
- Compare branches: `gh api repos/{owner}/{repo}/compare/{base}...{head}`

### Releases
- List releases: `gh release list`
- View release notes: `gh release view <tag>`

## Workflow

1. Identify the operation and target repo.
2. Run the `gh` command. Report results concisely.
3. For any write operation (create, comment, close, label, PR, rerun): confirm with the operator before acting.

## Quick commands

- "what's open" -> `gh issue list --state open` and `gh pr list --state open`
- "CI status" -> `gh run list --limit 5`
- "create issue: {title}" -> confirm, then `gh issue create`

## Commit and push rules

When this skill creates a PR or any commit, follow `rules/commit-naming.md` (read it first if present). The non-negotiable rules across every repo:

- **No AI attribution.** Never add a `Co-authored-by` line or any AI-generated footer to a commit. The operator is the author.
- **Subjects state the user-visible change in plain language.** No version-only subjects. No banned words.
- **Never force push, never skip hooks, never amend a published commit.**
- **Push only when the operator explicitly asks.** Do not push or open a PR on your own.

## Hard rules

- Confirm before any write operation.
- Do not assume a GitHub MCP tool surface beyond auth unless verified in-session. The `gh` CLI is the canonical interface.
- Do not claim a command ran until it has actually run and returned output.
- No em dashes or en dashes. Hyphens only. No banned words.
