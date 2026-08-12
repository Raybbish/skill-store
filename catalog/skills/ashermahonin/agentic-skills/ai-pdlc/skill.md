---
name: ai-pdlc
description: "Run an AI-augmented Product Development Lifecycle that treats every phase as a hypothesis to test, not a deliverable to push: research, hypothesis, plan-by-phases, prototype, validate, implement under TDD, harden against the matching security track (OWASP/MASVS) and CVE risk, and ship with rollback and post-launch evaluation. Use as the strategic spine when a project is greenfield, a brownfield refactor, an experiment, or a feature whose value is not yet proven; cooperates with sdlc-orchestrator (operational chain) and hypothesis-validator (evidence)."
---

# AI PDLC

## Role

Be the strategic spine that turns ambiguous product intent into a verifiable, phased plan the agent can execute under TDD without losing the "why". Where `sdlc-orchestrator` controls operational routing, `ai-pdlc` controls phase-level evidence: what was proved, what is still a guess, and which guess gets tested next.

## Start By

1. Read `references/pdlc-phases.md`.
2. Pull the product intent and constraints from `intake-coordinator`.
3. Pull existing research from `research-domain` and `competitive-analysis` (if present); request them if missing.
4. Restate the project as 3–5 falsifiable hypotheses, each with a "kill" criterion and a cheapest-useful-evidence step.
5. Use Context7 MCP to validate any external technology, market, or platform-policy claim that gates a hypothesis.

## Procedure

1. **Phase 0 — Define.** Lock product intent, success metric, primary user, and platform matrix (with `platform-detector`).
2. **Phase 1 — Discover.** Run `research-domain` + `competitive-analysis`. Record what is known and what is still guess.
3. **Phase 2 — Hypothesize.** Use `hypothesis-validator` to express each top design choice as a falsifiable claim with a measurable kill criterion.
4. **Phase 3 — Prototype.** Build the smallest artifact that disproves or supports the riskiest hypothesis. Throwaway is allowed.
5. **Phase 4 — Plan.** With `requirements-quality`, `architecture-review`, `user-journey-mapper`, and `decompose-work`, turn surviving hypotheses into requirements, ADRs, journeys, epics, stories.
6. **Phase 5 — Implement.** Run each story through `tdd-workflow` then `service-implementation`. No production code before the failing test and implementation contract exist.
7. **Phase 6 — Harden.** Route the build through the matching security skill (`security-owasp-web`, `security-mobile-masvs`, `security-owasp-llm`, or `security-owasp-agentic`) plus `cve-zero-day-scanner` before release.
8. **Phase 7 — Ship.** Use `qa-eval` for release readiness and `documentation-graph-curator` to sync project memory and the Obsidian graph.
9. **Phase 8 — Evaluate.** Compare measured outcome against the original hypothesis kill criterion. Record what was proven, what was wrong, and what to learn next.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` at every phase boundary.
- Use Context7 MCP whenever a hypothesis depends on current API, framework, market, or platform-policy reality.
- Keep a decision trace per phase: facts, assumptions, options, choice, evidence, rollback, follow-up.
- Stop and escalate before destructive or irreversible work, security-sensitive shipping, or production data migration.
- Never collapse two phases into one to save time when the earlier phase still has unfalsified guesses.

## Output Artifacts

- Phase ladder with status per phase
- Hypotheses register with kill criteria and current evidence
- Phase-boundary review notes
- Cross-references to `sdlc-orchestrator` route and the per-phase skills that produced evidence
- Post-launch evaluation entry against the original hypotheses

## Quality Bar

- No phase advance without explicit evidence the prior phase's hypothesis is settled or consciously deferred.
- No phase skipped silently.
- No "we'll harden later"; security and CVE checks belong before ship.
- No documentation drift; the Obsidian graph reflects what the phase actually produced.

## Handoff

Hand off per phase. Each handoff lists: phase, hypothesis, evidence, next skill, residual risk, what would force a rollback.

## References

- `references/pdlc-phases.md`: detailed phase ladder, gate criteria, and skill mapping per phase.
