---
name: security-owasp-llm
description: "Review an LLM-powered feature against the OWASP Top 10 for Large Language Model Applications: prompt injection, sensitive information disclosure, supply-chain risk for models and data, data and model poisoning, improper output handling, excessive agency, system prompt leakage, vector and embedding weaknesses, misinformation, unbounded consumption. Produces a per-category status, threat model for the LLM data flow, abuse-case test plan, and release verdict. Use whenever the product surface includes any LLM call, retrieval augmentation, fine-tune, embedding store, or model-routed automation."
---

# Security: OWASP LLM Top 10

## Role

Treat an LLM-using feature as a new attack surface, not a normal API. Walk through every OWASP LLM Top 10 category against the product's data flow and ship a verdict with abuse-case evidence, not vibes.

## Start By

1. Read `references/owasp-llm-top10.md`.
2. Map the LLM data flow: user input → preprocessing → prompt assembly → retrieval/embedding → model call → output handling → downstream effect. Note where untrusted data crosses into prompt context.
3. Identify the model(s), provider(s), tool(s), and the agent's permitted actions.
4. Use Context7 MCP for the current OWASP LLM Top 10 wording and the current model-provider security guidance (Anthropic, OpenAI, Google, Mistral, Meta, etc.).

## Procedure

1. For each LLM Top 10 category, mark status: Pass / Concern / Fail / Out-of-scope.
2. Build an abuse-case list per category: e.g., direct prompt injection, indirect via retrieved doc, system-prompt leakage probe, jailbreak via tool description, exfil via embedding inversion, denial via context blow-up.
3. Verify each abuse case with an eval: at least 10 representative prompts per category, multiple seeds, varied phrasing, plus at least one obfuscated/encoded variant.
4. Cross-check with `security-owasp-agentic` for autonomy/agency risk and with `security-secrets` for prompt content secrets handling.
5. Produce remediation plan, owner per finding, and a release-gate verdict with conditions.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current LLM Top 10 categories, provider safety docs, and any model-card limitations.
- Keep a decision trace: model version, evaluator method, abuse-case coverage, what is not yet tested.
- Refuse to mark a category Pass without an eval run, not just a code review.
- Escalate any unmitigated Excessive Agency or Sensitive Information Disclosure finding before release.

## Output Artifacts

- LLM data-flow diagram (sources, sinks, trust boundaries)
- Per-category status table with eval evidence
- Abuse-case eval results (counts, rates, examples)
- Findings register with owners
- Release-gate verdict and conditions

## Quality Bar

- No category marked Pass from prompt review alone; require eval evidence.
- No mitigation that relies on "the model usually refuses". Require deterministic guardrail evidence.
- No retrieval pipeline approved without an injection test through ingested content.
- No tool-using agent approved without an excessive-agency review.

## Handoff

Hand off to `service-implementation` per finding and to `qa-eval` to add the abuse-case evals into the regression suite.

## References

- `references/owasp-llm-top10.md`: per-category checklist, abuse-case patterns, and provider-specific notes.
