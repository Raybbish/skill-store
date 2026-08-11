---
name: hypothesis-validator
description: "Convert a design choice, architecture option, market assumption, or feature bet into a falsifiable hypothesis with a measurable kill criterion, the cheapest useful test to settle it, and a clear record of what was supported, disproved, or deferred. Use whenever the agent is tempted to commit to a stack, a pattern, a vendor, a model, a UX flow, or a scope without evidence, and as the core supporting skill for ai-pdlc and architecture-review."
---

# Hypothesis Validator

## Role

Stop the agent from treating opinions as decisions. Force every load-bearing claim through a falsifiable-hypothesis form, then run the cheapest useful test to settle it before commitment.

## Start By

1. Read `references/hypothesis-format.md`.
2. List every load-bearing claim attached to the current decision: stack choice, framework choice, model choice, scope inclusion, performance promise, market segment, user behavior assumption.
3. For each claim, ask: "what would prove this wrong?" If no answer, refactor the claim until one exists.
4. Use Context7 MCP for any claim that depends on current external technology, market, or platform behavior.

## Procedure

1. For each candidate claim, write a hypothesis card: name, claim, why we believe it, kill criterion, cheapest useful test, owner skill, status.
2. Rank hypotheses by impact × uncertainty. The riskiest survives — test it first.
3. Choose the cheapest useful test per hypothesis: spike, paper review, eval set, prototype, telemetry probe, A/B, expert interview, vendor docs lookup, regulatory check.
4. Run or hand off the test to the matching skill (`service-implementation` for spikes, `research-domain` for market, `qa-eval` for evals, `security-owasp-*` for safety claims, `cve-zero-day-scanner` for dependency claims).
5. Record the outcome: supported, disproved, deferred (with reason), or still-open (with planned next test).
6. Update the hypothesis register and notify `ai-pdlc` of phase-boundary impact.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP whenever an external fact gates the test design.
- Keep a decision trace: claim, candidate tests, chosen test, outcome, residual uncertainty.
- Refuse to mark a hypothesis Supported without evidence the test method was sound, not only that the result was favorable.
- Escalate when a "kill criterion" cannot be defined; that is itself the finding.

## Output Artifacts

- Hypothesis register entries (one card per claim)
- Ranked test list with cheapest-useful-test rationale
- Test outcomes per hypothesis
- Hypothesis-derived risks pushed into `07-risk-register`
- Phase-boundary signal to `ai-pdlc`

## Quality Bar

- No claim survives without a kill criterion.
- No kill criterion accepted that is not measurable.
- No test promoted to "Supported" from a single sample where multiple were possible.
- No silent collapse of two hypotheses into one.

## Handoff

Hand off settled hypotheses to `ai-pdlc` and `architecture-review`. Hand the unsettled ones back into the register and to the owner skill that runs the next-cheapest test.

## References

- `references/hypothesis-format.md`: hypothesis card schema, ranking method, cheapest-useful-test catalogue, anti-patterns.
