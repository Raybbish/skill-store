# Iteration 7 -- Agent Teams Docs Audit (Meta)

## Plan

**Type:** Meta-research (docs audit)
**Backlog item:** #25
**Scope:** No research run -- audit existing skill against official Anthropic documentation.

**Goal:** Read official Claude Code agent teams docs and compare our implementation against
recommended patterns, known limitations, and best practices. Use Exa for discovery and
Firecrawl for scraping (not the claude-code-guide agent). Also implement quick wins #26
(arxiv guidance) and #27 (verification verdict expansion).

## Sources Scraped

6 official pages scraped with Firecrawl (`onlyMainContent: true`, `maxAge: 86400000`):

1. `code.claude.com/docs/en/agent-teams` -- Primary agent teams documentation
2. `code.claude.com/docs/en/sub-agents` -- Subagents documentation (for comparison)
3. `platform.claude.com/docs/en/agent-sdk/subagents` -- SDK subagents (programmatic API)
4. `code.claude.com/docs/en/best-practices` -- Best practices guide
5. `anthropic.com/engineering/multi-agent-research-system` -- Anthropic's own research system
6. `claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them` -- Multi-agent guide

Plus 3 Exa searches for discovery (30 results total across `docs.anthropic.com`,
`github.com/anthropics`, and general web).

## Audit Findings

**Green Flags (architecture confirmed correct):**

- **Hub-and-spoke / orchestrator-worker pattern** matches both the agent teams docs and
  Anthropic's own research system architecture. The docs explicitly describe "one session acts
  as the team lead, coordinating work, assigning tasks, and synthesizing results."
- **No peer-to-peer researcher communication** aligns with the agent teams docs' model where
  the lead coordinates all work. The multi-agent blog emphasizes "context-centric decomposition"
  and warns against the "telephone game" of inter-agent information loss.
- **Lead-dispatched assignments** validated. Docs support both explicit assignment and self-claim
  with file locking, but our empirical finding (Iterations 1-2) that lead-dispatched works
  better is consistent with Anthropic's advice to "teach the orchestrator how to delegate."
- **Filesystem output** explicitly recommended. Anthropic's research blog says: "Subagent output
  to a filesystem to minimize the 'game of telephone'... subagents call tools to store their
  work in external systems, then pass lightweight references back to the coordinator."
- **Verification subagent pattern** matches the blog's "verification subagent pattern" exactly,
  including our "assign to fresh perspective" approach.
- **Context-centric decomposition by research angle** (not by role) matches the blog's strong
  recommendation against problem-centric splitting.
- **Shutdown then TeamDelete sequence** matches docs' requirement that cleanup fails if active
  teammates remain.
- **No nested teams** -- our researchers don't spawn sub-teams, which is correct since the docs
  confirm "teammates cannot spawn their own teams."
- **Automatic message delivery, no polling** -- confirmed by docs.

**New Information (resolved questions):**

- **Permission inheritance confirmed:** "Teammates start with the lead's permission settings.
  If the lead runs with `--dangerously-skip-permissions`, all teammates do too." Can change
  individual modes after spawning, but not at spawn time. This partially resolves backlog #5.
- **CLAUDE.md + MCP servers inherited automatically:** "When spawned, a teammate loads the same
  project context as a regular session: CLAUDE.md, MCP servers, and skills." This explains why
  researchers can use ToolSearch to load Exa/Firecrawl -- they inherit MCP server access.
- **Task dependencies available:** Framework supports `blockedBy` for task ordering. We don't
  use this (our lead-dispatched approach handles sequencing manually), but it's available if
  we ever need it.
- **Session resumption doesn't restore teammates:** Our `state.md` resume check in Phase 0 is
  important precisely because of this limitation. Good that we built this.
- **Delegate mode exists:** Pressing Shift+Tab restricts the lead to coordination-only tools.
  Not needed for our skill (which operates programmatically) but useful to know.

**Anthropic's research system comparison:**

Their architecture is strikingly similar to ours. Key parallels: orchestrator-worker pattern,
lead decomposes query and spawns subagents for different facets in parallel, subagents search
independently then return distilled findings, lead synthesizes. Their system uses Opus 4 lead +
Sonnet 4 subagents and outperformed single-agent by 90.2% on their internal eval.

Key difference: they found "token usage by itself explains 80% of the variance." Their effort
scaling rules: simple queries get 1 agent with 3-10 tool calls, direct comparisons 2-4 agents
with 10-15 calls each, complex research 10+ agents. Our scale is more conservative (max 4
researchers for Comprehensive) but appropriate for our token budget.

They also use a separate CitationAgent for adding citations to the final output. We don't have
this -- our lead handles synthesis and citations together. Worth monitoring but not needed now.

**No anti-patterns found.** Our architecture doesn't fight the framework, uses no deprecated
patterns, and follows the recommended cleanup sequence.

**Yellow flags (minor, non-blocking):**

- Our Comprehensive scope uses Opus for all researchers. Anthropic's own system uses Sonnet
  workers successfully. Consider testing Sonnet researchers in Comprehensive to reduce cost
  while maintaining quality. Added as backlog #28.
- No explicit TaskList polling during long researcher waits. If a researcher silently crashes,
  the lead would wait indefinitely. Low risk (hasn't happened in 7 iterations) but worth
  awareness.

## Changes Made

1. **[#26] arxiv scraping guidance** -- Added to `references/researcher-prompt.md` under
   Content Extraction: guidance to use `arxiv.org/html/{id}` instead of `/abs/`, prefer Exa
   summaries for triage, use arxiv API for structured extraction.

2. **[#27] Verification verdict expansion** -- Added SUPPORTED WITH NUANCE as fourth verdict
   in SKILL.md Phase 7, with description: "Directionally correct but specific details differ
   or require qualification."

**Backlog items resolved:** #25 (docs audit), #26 (arxiv guidance), #27 (verification verdict).

## Notes for Next Iteration

- Architecture is validated and mature. 7 iterations without a major structural change needed.
- Permission setup (#5) is now better informed: inheritance confirmed, specific permissions
  needed are mkdir + Write to research dir + Bash.
- Scope calibration (#6) has 7 data points and strong evidence from Anthropic's own scaling
  rules to compare against.
- Consider testing mixed model config: Opus lead + Sonnet researchers for Comprehensive (#28).
