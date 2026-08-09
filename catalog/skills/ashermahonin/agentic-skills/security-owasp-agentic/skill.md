---
name: security-owasp-agentic
description: "Review an agentic AI system against the current OWASP Top 10 for Agentic Applications categories, including ASI01 Agent Goal Hijack, ASI02 Tool Misuse and Exploitation, ASI03 Identity and Privilege Abuse, ASI04 Agentic Supply Chain Vulnerabilities, ASI05 Unexpected Code Execution, ASI06 Memory and Context Poisoning, ASI07 Insecure Inter-Agent Communication, ASI08 Cascading Failures, ASI09 Human-Agent Trust Exploitation, and ASI10 Rogue Agents. Produces per-category status, autonomy budget, tool inventory with least-privilege scope, abuse-case eval results, kill-switch verification, and a release-gate verdict. Use for any system where an LLM-driven agent reads, writes, calls tools, plans, or coordinates other agents."
---

# Security: OWASP Agentic AI

## Role

Treat an agent as a stateful, tool-using actor with broader blast radius than a normal LLM. Walk through the OWASP Top 10 for Agentic Applications, lock the autonomy budget, prove the kill switch works, and only then approve release.

## Start By

1. Read `references/owasp-agentic.md`.
2. Inventory the agent: planner/loop type, memory stores, tools, sub-agents, scopes/credentials per tool, escalation paths, kill switches.
3. Pull the LLM threat surface from `security-owasp-llm` and the secrets posture from `security-secrets`.
4. Use Context7 MCP for current OWASP Agentic AI guidance and current agent-framework safety patterns (Anthropic Agent SDK, LangChain, LlamaIndex, AutoGen, CrewAI, etc.).

## Procedure

1. For each current ASI category (goal hijack, tool misuse, identity and privilege abuse, agentic supply chain, unexpected code execution, memory/context poisoning, inter-agent communication, cascading failures, human-agent trust exploitation, rogue agents), mark Pass/Concern/Fail/Out-of-scope.
2. Build an autonomy budget per agent: allowed actions, allowed time, allowed cost, allowed destructive operations, mandatory human-in-the-loop steps.
3. Verify least privilege per tool: scope, identity, audit trail, revocation path.
4. Run abuse-case evals: poisoned memory injection, ambiguous goal injection, tool spoofing, RCE-via-tool-output, cascading-loop test, kill-switch trigger test.
5. Confirm the kill switch: how a user, operator, or monitor can halt the agent within a bounded time; verify by drill.
6. Produce remediation plan, owner per finding, and release-gate verdict.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current OWASP Agentic AI categories and current framework safety affordances.
- Keep a decision trace: agent architecture, autonomy budget, tool inventory with scopes, eval evidence.
- Refuse to approve any agent with destructive tools and no working kill switch.
- Escalate before granting any agent access to credentials, payments, public posting, or production write paths.

## Output Artifacts

- Agent architecture diagram (planner, memory, tools, sub-agents, escalation, kill switch)
- Autonomy budget table per agent
- Tool inventory with scopes, identities, audit, revocation
- Per-threat status table with abuse-case eval evidence
- Kill-switch drill record
- Release-gate verdict

## Quality Bar

- No agent approved without a verified kill switch.
- No tool approved beyond least privilege required to complete the smallest user task.
- No multi-agent system approved without a cascading-loop test.
- No memory store approved without a sanitization or attestation step on read.
- No "trust the LLM to refuse" mitigation. Require deterministic enforcement.

## Handoff

Hand off to `service-implementation` for fixes and to `qa-eval` so the abuse-case suite enters regression. Re-run on every tool-list change.

## References

- `references/owasp-agentic.md`: per-threat checklist, autonomy-budget template, kill-switch drill protocol.
