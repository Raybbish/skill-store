# Agentic Loop Reference

This document is the contract Claude uses when generating the doctor's `run-skill` module and `prompts/system` module. It is stack-neutral prose. The only code blocks are two short labeled reference snippets (model fallback, anti-loop guard) — everything else is description.

---

## 1. Runbook-runner loop contract

The `runSkill` function accepts a single compiled runbook (as Markdown) and drives the agent to completion. Its contract:

1. **Build the system prompt.** Concatenate the doctor system prompt, the runtime-context block, and the runbook Markdown into a single string. Pass it to the model as the `system` parameter using the prompt-caching block structure:

```typescript
system: [{ type: "text", text: systemPromptString, cache_control: { type: "ephemeral" } }]
```

This structure (an array with a single object containing `type`, `text`, and `cache_control`) tells Bedrock/Anthropic to cache the large, stable prompt across the iterations of the same run. The `text` value is the full assembled string (identity + behavioral contract + gotchas + runtime context + runbook).

2. **Seed the message history.** Initialize the conversation with exactly one user message: `"Begin the skill."` This gives the agent an unambiguous starting signal without revealing any prior reasoning.

3. **Loop while `iterations < maxIterations`.** On each iteration:
   a. Increment the iteration counter.
   b. Call the model. If the call throws, capture the error and return a structured `SkillRunResult` with `error` populated — do **not** let the exception propagate (see §5).
   c. Accumulate `input_tokens` and `output_tokens` from each response's usage block.
   d. If `stop_reason` is **not** `tool_use`, break — the model has finished its turn with no further tool requests.
   e. Append the assistant's full content block to the message history.
   f. For each `tool_use` block in the response, execute the tool and collect a `tool_result` block (see §2 for the two control tools).
   g. After all tool results are collected, apply the anti-loop guard (see §4) and append the results as a new user message.
   h. If any block called `skill_done`, break immediately after appending the results.

4. **Return a `SkillRunResult`** containing: the runbook name/identifier, the accumulated `findings` array, iteration count, token counts, and (on error) the error detail. A run with zero findings and no error is a normal, healthy outcome.

---

## 2. Control tools

Two tools govern the run and are handled before any application tool:

### `emit_finding`

The agent calls this to record a confirmed problem. The loop:
- Accepts the tool's input payload (validated by the model against the tool schema).
- Stamps it with the current runbook identifier as the `skill` field.
- Pushes the enriched `Finding` into the run's findings array.
- Returns `"accepted"` as the tool result.

`emit_finding` does **not** terminate the loop. The agent may continue investigating and emit multiple findings per run.

### `skill_done`

The agent calls this when its investigation is complete — whether it found problems or not. The loop:
- Returns `"ok"` as the tool result.
- Appends the result to the message history, then breaks.

`skill_done` is the agent's only sanctioned exit signal. A run that exhausts `maxIterations` without calling `skill_done` is still valid; it just returns whatever findings were collected.

---

## 3. Scoped application tools

Beyond the two control tools, the doctor exposes a set of read-only application tools scoped to the deployment's data sources (e.g. query tools, log readers, metric fetchers). Each call goes through a `toolExecutors` dispatch map:

- If the tool name is found in the map, execute it with the block's input and return the result as a string.
- If the tool name is **not** found, return a `tool_result` with `is_error: true` and a message like `"Unknown tool: <name>"`. Do not throw.
- If execution throws, catch the error, return a `tool_result` with `is_error: true` containing the error message. Do not let tool errors escape the loop.

---

## 4. Anti-loop guard

When the last three consecutive tool calls are all the same tool name, inject an additional plain-text block alongside the tool results nudging the agent to either call `skill_done` or choose a different tool. This prevents the agent from spinning on a stuck query without ever concluding.

**Reference snippet — port to your stack:**

```typescript
if (lastCalls.length >= 3 && new Set(lastCalls.slice(-3)).size === 1) {
  toolResults.push({
    type: "text",
    text: `You have called '${lastCalls.at(-1)}' three times in a row. ` +
          `Review what you have learned and call skill_done if the investigation ` +
          `is complete, or choose a different tool.`,
  });
}
```

`lastCalls` is a flat array of tool names appended in call order across all iterations. No pruning is needed — only the tail matters for the guard.

---

## 5. Model fallback

Invoke the primary model configured for the doctor. If that call throws (capacity, throttling, model unavailable), retry once against a configured fallback model. If the fallback also throws, let the error propagate to the outer try/catch in the loop, which captures it and returns a structured error result.

**Reference snippet — port to your stack:**

```typescript
async function createMessage(client, params, model = config.model) {
  try {
    return await client.messages.create({ ...params, model });
  } catch (err) {
    if (model === config.modelFallback) throw err;
    return await client.messages.create({ ...params, model: config.modelFallback });
  }
}
```

---

## 6. Error handling

A thrown LLM call (after the fallback retry is exhausted) must **not** crash the Lambda or task. The outer loop wraps the model call in a try/catch and, on any error, immediately returns:

```
{
  skill: <runbook-id>,
  findings: <findings accumulated so far>,
  iterations: <count>,
  inputTokens: <count>,
  outputTokens: <count>,
  error: { name: <string>, message: <string> }
}
```

The orchestrator that called `runSkill` is responsible for deciding what to do with an errored run (log, alert, retry at the schedule level). Individual tool errors inside the loop are surfaced as `is_error: true` tool results — they do not short-circuit the run.

---

## 7. Token and iteration budgets

| Parameter | Recommended default | Notes |
|---|---|---|
| `max_tokens` per call | 4096 | Sufficient for tool call reasoning; increase if runbooks emit long structured outputs |
| `maxIterations` | 15 | Hard cap enforced by the loop counter, not by the model |

These are defaults. Scaffold time may override them per runbook or per deployment stage.

---

## 8. System-prompt structure

The compiled system prompt passed to the model on every call has four sections, assembled in order:

### 8.1 Identity block (PARAMETERIZED at scaffold time)

```
You are <Product> Doctor, an automated auditor for the <Product> platform.
```

Replace `<Product>` with the application name at scaffold time. The identity sentence establishes the agent's role and tone for all downstream reasoning.

### 8.2 Core behavioral contract

Static prose covering:

- **One runbook per invocation.** Each run executes exactly one runbook appended below. The agent must not invent or import logic from other runbooks.
- **Signature format.** Every finding requires a stable, deterministic `signature` for deduplication across runs. The prompt specifies the exact formats:
  - Code bug with stack frame: `{ExceptionClass}:{relativeFilePath}:{lineNumber}`
  - Code bug without stack frame: `{ExceptionClass}:unknown:{md5_12chars_of_normalized_message}`
  - Audit finding: `{runbook}:{category}:{bucketDate}` (e.g. `audit-sends:tcpa_spike:2026-04-W17`)
  - When unsure, err toward broader bucketing — false deduplication is cheaper than duplicate PRs or tickets.
- **When to emit.** Only emit for a real, confirmed violation, regression, or anomaly that warrants code or human action. **Most healthy runs emit zero findings — that is the expected, correct outcome.** Do not emit for PASS results, informational metrics the runbook itself labels as non-violations, clean scorecards, or expected baselines. When in doubt, do not emit.
- **Output contract.** Never write PRs, tickets, or messages directly. Use `emit_finding`; the orchestrator routes based on `suggestedFix.type`: `code` → PR pipeline, `heal_script` → PR adding the script, `manual` → human ticket.
- **Budgets.** Max iterations per runbook (default 15). Keep tool calls focused; avoid repeating identical calls; prefer narrow, filtered queries over broad reads.

### 8.3 Known gotchas (PARAMETERIZED at scaffold time)

An extension point populated at scaffold time with stack-specific caveats the agent must respect — connector quirks, false-positive log patterns, authoritative source precedence rules, etc. Example categories:

- Query engine limitations (unsupported syntax, NULL-drop bugs, operator restrictions)
- Log messages that look like errors but are healthy debug output
- Data source precedence rules (e.g. which field is authoritative when multiple sources conflict)

At scaffold time, if the user provided no gotchas, emit the heading with a single placeholder line so runbook authors know where to add them:

```
### Known gotchas

_None yet — add stack-specific caveats here as you discover them._
```

Do not omit the section; its presence signals to future runbook authors that it is the canonical extension point.

### 8.4 Runtime context block (injected at run time)

Appended after the static prompt on every invocation, immediately before the runbook Markdown:

```
## Runtime context
- Today's date: <ISO-8601 date>
- Current deployment stage: <stage>
- Use only <stage> resources for this run, even if the runbook examples mention production.
- Default data-source catalog/connection: <value>
- Default output/scratch location: <value>
- Preferred log group(s): <value(s)>
```

All values are resolved at run time from the deployment configuration. The stage line is critical: it prevents the agent from accidentally querying production resources during a staging run.

When the data source is "none" (no query tool registered), replace the `Default data-source catalog/connection` line with:

```
- Data source: none — no query tool is registered; use only log, metric, and VCS tools.
```

This prevents the model from attempting to call a query tool that does not exist in the `ToolExecutors` map.

### 8.5 Runbook content

The runbook Markdown is appended last, separated by a horizontal rule and a `## Skill to execute` heading:

```
---

## Skill to execute

<runbook Markdown>
```

The word "skill" in the heading is intentional — it matches the control-tool semantics (`skill_done`, `emit_finding`'s `skill` field). Do not rename this heading in generated code.
