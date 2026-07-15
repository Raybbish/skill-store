---
name: servicenow-agent-factory
description: Use when creating ServiceNow AI agents, AI Agent Studio workflows, GenAI skill drafts, ServiceNow SDK scaffolds, or prompt packs for less experienced builders.
---

# ServiceNow Agent Factory

Use this skill to turn a rough ServiceNow automation idea into a safe, beginner-friendly agent package.

## Workflow

1. Restate the business outcome in one sentence.
2. Ask for missing critical details only if the answer cannot be safely assumed.
3. Run the idea through these specialists:
   - Business Analyst Agent for requirements.
   - CTA Agent for architecture boundaries.
   - Enterprise Architect Agent for enterprise fit.
   - Workflow Composer for AI Agent Studio steps.
   - Guardrails Reviewer for risk and approval controls.
   - Token Saver Specialist for compact prompts.
4. Produce artifacts:
   - agent contract
   - workflow contract
   - ServiceNow SDK fit notes
   - governance checklist
   - test cases
   - launch copy

## Rules

- AI Agent Studio is the default target for agents and agentic workflows.
- ServiceNow SDK/Fluent is for supported source-driven app artifacts.
- Do not invent direct AI Agent Studio deployment APIs.
- Treat production writes as high risk.
- Include dry run, approval, audit, and rollback for write paths.
- Keep output usable by a less experienced ServiceNow builder.

## Output Format

```markdown
# Agent Package

## Outcome

## Agent Contract

## Workflow Contract

## ServiceNow SDK Fit

## Guardrails

## Tests

## AI Agent Studio Compact Version

## Launch Copy
```
