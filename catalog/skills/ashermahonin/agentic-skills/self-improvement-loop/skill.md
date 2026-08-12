---
name: self-improvement-loop
description: "Run a controlled self-improvement event loop for agents, skills, prompts, routing, tools, memory, and evaluation packs. Use during an active task or between tasks when the agent fails validation, receives corrective user feedback, chooses the wrong skill, misuses tools, wastes context, misses tests, repeats a weak behavior, or needs a measured repair based on logs, evals, user feedback, Obsidian memory, and regression checks."
---

# Self Improvement Loop

## Role

Improve agent behavior without guessing. Convert task-time signals into measured changes to skills, routing, prompts, tool contracts, memory policies, or evaluation suites, then prove the improvement with regression checks. This skill changes the operating system around the agent; it does not assume model weights are being trained.

The loop is event-driven: while the agent is working, every meaningful failure signal can trigger a bounded observe-analyze-repair-validate-memory cycle. After one bounded improvement attempt, return to the original task with the new evidence instead of stopping work by default.

## Start By

1. Read `references/improvement-loop.md`.
2. Identify the event that justifies the loop: failed check, tool error, rejected output, user correction, route mismatch, stale documentation discovery, repeated uncertainty, or regression signal.
3. Collect evidence: task prompt, selected route, tools used, diffs, tests, validation logs, user feedback, cost/time budget, final outcome, and any relevant Obsidian memory note.
4. Classify the failure: wrong route, missing context, stale docs, weak tool contract, prompt ambiguity, memory drift, evaluation gap, unsafe permission, poor handoff, or implementation bug.
5. Decide whether a loop is justified. If the issue is only a product/code defect, route to the relevant implementation or review skill; if the agent behavior caused or amplified the defect, run one bounded improvement iteration.
6. Define the improvement target as a measurable behavior, not a broad aspiration.

## Procedure

1. **Observe.** Record the event, current task state, expected behavior, acceptance criteria, and the smallest reproduction task.
2. **Analyze.** Identify the first decision where the agent went off track and the evidence that proves it.
3. **Explore alternatives.** If the next move is not obvious, run a small search: inspect nearby docs/code, query Context7 for current external behavior, compare 2-3 repair options, and reject options with concrete reasons.
4. **Choose the repair surface.** Prefer the smallest effective change: routing rule, skill description, SKILL.md procedure, reference file, tool schema, validation script, docs, or memory note.
5. **Design the feedback loop.** Pick one loop type: evaluator-optimizer, Reflexion-style reflection memory, Self-Refine drafting loop, regression-eval loop, skill-library expansion, or harness repair.
6. **Patch or adapt.** Update the chosen artifact, or adapt the current task plan if no persistent artifact should change. Avoid broad rewrites and unrelated cleanup.
7. **Validate.** Re-run structural validators and at least one targeted task/eval that would have caught the original failure.
8. **Regression guard.** Add or update validation so the same failure class is harder to reintroduce.
9. **Record learning.** Add a compact lesson to project memory when it has future retrieval value. Prefer `agentic/obsidian/project-skeleton/53-agent-learning-log.md` or the active project's equivalent note; link affected skills, routes, validators, and decisions with Obsidian wikilinks.
10. **Resume.** Return to the original user task with the corrected route, new evidence, or revised plan. Do not stop unless a stop condition, approval boundary, or repeated ineffective loop blocks progress.

## Event Loop Rules

- Treat each loop as a small control cycle: observe, analyze, repair, validate, remember, resume.
- Keep at most one active improvement loop per failure class in a task.
- Continue the main task after a successful loop; do not turn the whole task into meta-work.
- Run another loop only when a new event gives new evidence, not because the previous loop felt incomplete.
- Stop after two ineffective iterations on the same failure class and escalate the unknown with evidence.
- Do not increase autonomy, permissions, memory retention, external access, or unattended execution as a repair unless `agent-harness-architect` explicitly bounds it first.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before changing routing, skill behavior, permission boundaries, or evaluation criteria.
- Use Context7 MCP for current framework, SDK, MCP, benchmark, security, or tooling guidance involved in the repair.
- Keep a decision trace: failure evidence, rejected causes, chosen repair surface, validation result, and remaining risk.
- Do not let the agent "improve itself" by silently increasing autonomy, permissions, memory retention, or tool access.
- Treat evaluator output as evidence to inspect, not truth to obey automatically.
- Keep the loop live during task execution, but bounded by evidence, validation, and stop conditions.

## Output Artifacts

- Failure taxonomy and root-cause hypothesis
- Baseline reproduction task or eval
- Repair surface and patch summary
- Updated skill, routing, tool, memory, docs, or validation artifact
- Regression check or validator update
- Obsidian learning note when the lesson should be retrieved later
- Before/after evidence and remaining risk

## Quality Bar

- One loop iteration must have a measurable target, a bounded patch, and a validation result.
- Improvements must reduce a specific failure class, not add generic instructions.
- No persistent memory write without future retrieval value.
- No memory write without a short title, trigger event, reusable lesson, affected artifacts, validation result, and expiration/review condition.
- No route changes without checking conflicts against existing entrypoints.
- No evaluator-only acceptance; run project validators or task-specific checks where available.
- Stop after two ineffective iterations and escalate the unknown instead of adding more prompt text.

## Handoff

Hand off with: failure class, changed artifacts, eval evidence, regression guard, open risks, and the next owner. For skill changes, hand off to `custom-skill-builder` or `documentation-graph-curator`; for code changes, hand off to `service-implementation` and `qa-eval`.

## References

- `references/improvement-loop.md`: patterns for evidence-driven agent improvement, loop types, anti-patterns, and regression design.
