---
name: codex
description: >-
  Codex MCP tool usage, thread configuration, and thread lifecycle. Consult this
  skill when an agent or skill needs Codex MCP tool reference for code review,
  plan review, or completion verification.
user-invocable: false
---

# Codex MCP Guide

## Constraints

- **Do not set the model parameter**
- **Project-only file access** - can only read files in the current project

If content is outside the project, inline it in your prompt.

## Thread Configuration

Set at thread start; immutable afterward.

- **approval-policy** - Keep the default.
- **sandbox** - `read-only` for pure review; `workspace-write` when Codex should run tests or edit files.

## Thread Management

**Start thread**: Call the Codex MCP server's `codex` tool with your prompt and configuration.
Save the `threadId` field returned in the response (the field name can vary by Codex version - check the tool schema if absent).

**Continue thread**: Use the `codex-reply` tool with:
- `threadId`: the identifier saved from the previous response
- `prompt`: Your follow-up message

**Surviving context compaction**: Record the thread id in the session's working plan or task list; if neither exists, create a task entry for this review and record the id there.

**Lost thread ID**: If not recorded, start a fresh thread with context recovery info.
