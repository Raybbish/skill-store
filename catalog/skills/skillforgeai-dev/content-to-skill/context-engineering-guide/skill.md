---
name: context-engineering-guide
description: >
  Analyze and apply context engineering principles to LLM applications. Use when the user asks
  about "context engineering", "context window management", "prompt vs context engineering",
  "how to structure LLM context", "RAG context design", or wants to optimize what goes into
  an LLM's context window. Also triggers on "context engineering vs prompt engineering".
  LLM 上下文工程分析框架：帮助用户理解和应用上下文工程原则，优化 LLM 上下文窗口的信息填充策略。
---

# Context Engineering Guide

A framework for understanding and applying context engineering — the practice of designing all information that a language model receives, not just the user-facing prompt.

Based on Andrej Karpathy's definition: "the delicate art and science of filling the context window with just the right information for the next step."

## When to Use

- User wants to optimize an LLM application's performance by improving context design
- User asks about the difference between prompt engineering and context engineering
- User is building RAG pipelines, agents, or multi-turn systems and needs context strategy
- User's LLM app produces inconsistent or low-quality outputs despite good prompts

## When NOT to Use

- User is writing a single one-off prompt for a chatbot (prompt engineering is fine for this)
- User needs help with model fine-tuning or training (different domain)
- User is asking about prompt injection / security (use a security-focused skill)

## Core Framework: The 4 Operations

Context engineering consists of four distinct operations on the context window:

### 1. Write

Craft the static components: system instructions, task descriptions, output format specs, persona definitions.

Key principle: be specific about constraints and format, not just intent.

### 2. Select

Choose the right dynamic information to include: retrieved documents (RAG), conversation history, tool outputs, user metadata.

Key principle: relevance > recency. Not everything recent is relevant; not everything relevant is recent.

### 3. Compress

Reduce information to fit the context window without losing critical signal: summarize long documents, extract key facts, truncate old conversation turns.

Key principle: preserve decision-relevant information. Summaries should retain what the model needs to act on, not just what happened.

### 4. Isolate

Separate concerns into distinct context segments to avoid interference: use system vs user vs assistant roles intentionally, separate instructions from data, use XML tags or markdown headers as boundaries.

Key principle: clear boundaries prevent the model from confusing instructions with data.

## Decision Framework

```
Is the LLM app a single prompt?
  YES -> Prompt engineering is sufficient
  NO  -> Context engineering required
    |
    v
What goes wrong?
  |
  +-- Irrelevant outputs    -> SELECT problem (wrong docs retrieved, wrong history included)
  +-- Inconsistent format   -> WRITE problem (weak system instructions)
  +-- "Forgets" earlier info -> COMPRESS problem (context window overflow, poor summarization)
  +-- Confuses data vs instructions -> ISOLATE problem (no clear boundaries)
```

## Key Concepts

### Context Window as RAM

The context window is not a chat log — it is the model's entire working memory. Everything the model knows about the current task must be in this window. Design it like you would design a function's input parameters: intentionally, with the right type and amount of information.

### The 60/30/10 Rule (Production Failures)

In production LLM applications, approximately:
- 60% of failures are **context problems** (wrong, missing, or stale information in the window)
- 30% are **reasoning problems** (model can't solve the task even with perfect context)
- 10% are **prompt problems** (awkward phrasing, missing instructions)

Most teams over-invest in prompt tweaking when the real issue is context design.

### Prompt Engineering vs Context Engineering

| Aspect | Prompt Engineering | Context Engineering |
|---|---|---|
| Scope | The user instruction | Everything the model sees |
| Focus | Phrasing and structure | Information selection and architecture |
| Components | Task description, few-shot examples | Memory, retrieval, tools, state, history, metadata |
| When it works | Simple, single-turn tasks | Production systems, agents, multi-turn workflows |
| Failure mode | "Rephrase until it works" | "Design the information pipeline" |

## Common Anti-Patterns

1. **Context overload** — Dumping everything into the window "just in case." The model wastes attention on irrelevant information, and costs increase.
2. **Stale context** — Using cached summaries or outdated tool outputs. The model confidently acts on wrong information.
3. **Missing memory** — No mechanism to carry information across turns or sessions. The model starts fresh every time.
4. **Blurred boundaries** — User data mixed with system instructions. The model treats user-provided text as instructions (prompt injection risk).
5. **Retrieval without ranking** — RAG that returns top-k documents without relevance scoring. Quantity != quality.

## Output Template

When analyzing an LLM application's context engineering:

```
## Context Engineering Analysis: [Application Name]

### Current Context Architecture
- System prompt: [length, key components]
- Dynamic context: [what gets injected and how]
- History management: [how conversation turns are handled]
- Tool integration: [what tools provide context]

### Diagnosis
- WRITE: [assessment of static instructions]
- SELECT: [assessment of dynamic information selection]
- COMPRESS: [assessment of information density and summarization]
- ISOLATE: [assessment of boundary clarity]

### Recommendations
1. [Highest-impact change]
2. [Second priority]
3. [Third priority]

### Expected Impact
[What improvement to expect and how to measure it]
```

## Examples

### Example 1: RAG Pipeline Optimization

User: "My RAG chatbot answers questions about our docs, but often gives wrong answers even though the right document is in our collection."

Analysis:
- **SELECT problem**: Retrieval returns top-5 by embedding similarity, but relevance != similarity. A document about "pricing" might be similar to "billing" but not answer "how to cancel."
- **COMPRESS problem**: Full documents are stuffed into context. Key facts buried in noise.
- Recommendation: Add a reranking step after retrieval (SELECT), extract relevant paragraphs instead of full docs (COMPRESS), add source attribution instructions (WRITE).

### Example 2: Agent System Context Design

User: "My coding agent loses track of what it's doing after 3-4 tool calls."

Analysis:
- **COMPRESS problem**: Raw tool outputs (full file contents, long command outputs) fill the context window. After 4 calls, earlier task context gets pushed out.
- **ISOLATE problem**: Tool outputs and agent reasoning are interleaved without clear boundaries.
- Recommendation: Summarize tool outputs to key facts before adding to context (COMPRESS), use structured sections: `[TASK]`, `[PROGRESS]`, `[TOOL_OUTPUT]`, `[NEXT_STEP]` (ISOLATE), periodically re-inject the original task description (WRITE).
