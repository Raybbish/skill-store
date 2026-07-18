---
name: mcp-tools
description: External MCP tools reference. Load at task start.
---

# MCP Tools

**Mandatory: use tools that are visible in your current session.** Not all MCPs are enabled.

## Memory (`memory_*`)

Offload explored findings, persist decisions, recall prior analysis — reduces context bloat.

## Docs (`docs_context7_*`)

`resolve-library-id` first (required), then `query-docs`. Max 3 calls per question.

## Code Search (`docs_github_grep_*`)

Search literal code patterns from public GitHub repos.

## Browser (`browser_*`)

Use `snapshot` to get element refs, then interact via refs. Prefer `snapshot` over `screenshot`.

## Code Indexing (`codeindex_*`)

Local codebase semantic search and indexing.

## Version Control (`cvs_*`)

GitHub, GitLab, Forgejo API access — repos, issues, PRs. Load `cvs` skill for conventions (provider detection, attribution, autonomy levels).

| Tool family     | Provider | Operations                   |
| --------------- | -------- | ---------------------------- |
| `cvs_github_*`  | GitHub   | Issues, PRs, comments, repos |
| `cvs_gitlab_*`  | GitLab   | Issues, MRs, comments, repos |
| `cvs_forgejo_*` | Forgejo  | Issues, PRs, comments, repos |

**CLI fallbacks** (when MCP tools unavailable): `gh` (GitHub), `glab` (GitLab), `forgejo-cli` (Forgejo).

## Web Crawling (`webcrawl_*`)

Fetch and extract content from web pages.

## Reasoning (`sequential_thinking_*`)

Structured step-by-step analysis for complex problems.
