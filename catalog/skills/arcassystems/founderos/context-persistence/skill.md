---
name: context-persistence
description: Pull what we already know about a topic before re-explaining. Say "what do we know about <topic>", "give me the prior context", or "remind me where we left off". Fires at session start, after a gap, or when the founder references prior context. Prevents the agent from stating facts without source paths.
why: "Prevents the OS from asking you to repeat context it already has - skills should read your files before asking you a question whose answer is already written down."
enhance: "Keep context/clients.md and context/decisions.md updated after every interaction - the more accurate these files are, the less the OS needs to ask you."
allowed-tools: ["Read", "Grep", "Glob"]
mcp_requirements: []
---

# Context Persistence

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

If a fact already exists in the OS, find it before asking. If you cannot find it, say where you looked and what is missing.

## When To Run

- New session start.
- The founder says "as I mentioned", "like last time", "the thing from yesterday", or similar.
- The agent is about to ask a question whose answer may live in the files.
- The agent is about to state a founder-specific, client-specific, or company-specific fact.

## Source Order

Read only what the task needs, in this order:

1. `CLAUDE.md` - boot rules and live file map.
2. `core/identity.md` - founder profile.
3. `context/priorities.md` - current focus.
4. `context/decisions.md` - open and resolved decisions.
5. `context/clients.md` - prospect and client state.
6. `cadence/daily-anchors.md` and `cadence/weekly-commitments.md` - current time-bound work.
7. `brain/log.md`, `brain/flags.md`, `brain/patterns.md`, and `brain/knowledge/` when history or patterns matter.
8. `stack.json` when tool behavior matters.

Do not load every file by default. Load the smallest set that can answer the question with source support.

## Procedure

1. Parse the user's reference.
2. Search recent and canonical sources.
3. If one match is clear, answer with the source path.
4. If two or three matches are plausible, offer the best candidates and ask the user to pick.
5. If no match is found, say where you looked and ask one narrow question.
6. If the user corrects a stored fact, update the right file only after approval.

## Output Pattern

```text
I found the reference: <specific thing>.
Source: <file path or heading>
Answer: <action or context>
```

If not found:

```text
I could not find that in <files searched>.
Missing: <specific fact>
Question: <one narrow question>
```

## Drift Handling

If current user input conflicts with a file:

1. Treat the current user statement as the freshest signal.
2. Name the file that may be stale.
3. Ask before editing canonical files.
4. Log material corrections to `brain/log.md`.

## Rules

- Do not ask "can you remind me" before searching.
- Do not cite memory without a file path when the fact affects action.
- Do not summarize the whole prior session unless the user asks.
