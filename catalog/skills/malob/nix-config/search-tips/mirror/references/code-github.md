# Code and GitHub

## When to Use

Code examples, library documentation, package APIs, GitHub repos/issues/discussions, open-source
project research, technical implementation patterns.

## Code Search

**Primary tool:** `get_code_context_exa` -- searches code-related content including repos,
packages, documentation, Stack Overflow, and technical blogs.

**Query tips:**

- Always include the **programming language** ("Go generics" not just "generics")
- Include framework + version when applicable ("Next.js 15", "React 19", "Python 3.12")
- Use exact identifiers: function names, error messages, class names, config keys
- More specific queries perform better than broad ones (Exa is semantic, not keyword-based)

Good: "How to use React Server Components with Next.js 15 app router for data fetching"
Bad: "react server components nextjs"

**`tokensNum` tuning:** Controls how much context is returned per result.

- Focused snippet needed: 1000-3000
- Most tasks (default): 5000
- Complex integration patterns: 10000-20000

## GitHub Discovery

`get_code_context_exa` also searches GitHub repos, issues, discussions, and READMEs. This is
the fastest path for finding relevant GitHub content -- no special permissions needed.

## GitHub Deep Read

When you need the full content of a specific GitHub page:

- **Firecrawl scrape** (`npx firecrawl-cli scrape "<url>"`) works well for GitHub issues,
  discussions, READMEs, and wiki pages
- **Raw file content:** `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` for clean
  file content without UI noise. Scrape this URL via Firecrawl.

## GitHub Data via `gh` CLI

Prefer `gh` subcommands over `gh api` -- subcommands are auto-approved while `gh api` with
write flags (`-X`, `-f`, `-F`) requires user approval.

- `gh repo view {owner}/{repo} --json stargazerCount,forkCount,pushedAt,licenseInfo`
- `gh issue list -R {owner}/{repo} --state open --json number,title,labels,createdAt`
- `gh issue view {number} -R {owner}/{repo} --json body,comments`
- `gh pr list -R {owner}/{repo} --json number,title,state` -- check for pending fixes
- `gh pr view {number} -R {owner}/{repo} --json body,comments,files`
- `gh search repos "{query}" --json fullName,stargazersCount,description`
- `gh search code "{pattern}" --repo {owner}/{repo}`
- `gh release list -R {owner}/{repo}`
- `gh release view {tag} -R {owner}/{repo}`

For data without subcommand equivalents, `gh api` GET requests are also auto-approved:
- `gh api repos/{owner}/{repo}/stats/participation` -- weekly commit activity
- `gh api repos/{owner}/{repo}/contributors` -- contributors with commit counts

## Gotchas

- **GitHub rate limits:** The `gh api` commands use your authenticated token, so limits are
  generous (5000/hour). Unauthenticated API calls are 60/hour.
- **Large repos:** READMEs and issue threads can be very long. Use
  `npx firecrawl-cli scrape "<url>" --only-main-content` to get the main content without
  sidebar noise.
- **GitHub search via Exa vs `gh`:** Exa is better for semantic discovery ("libraries for X").
  `gh search repos "query"` is better for exact keyword matches and quantitative filtering
  (stars, language, license).
