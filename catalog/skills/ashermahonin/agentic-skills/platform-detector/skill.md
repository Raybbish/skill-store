---
name: platform-detector
description: "Detect the target platforms a project is being built for (web, mobile iOS, mobile Android, desktop, console, embedded, server, edge, browser extension, game engine, AI agent, CLI, library), the runtime environments behind them, the store or distribution policy that applies, and the platform-specific quality constraints that must shape architecture and security. Use after init-project when the stack must be matched to the right testing matrix, accessibility floor, store-policy gate, performance budget, and security track (OWASP web/LLM/agentic or mobile MASVS) before architecture or implementation work begins."
---

# Platform Detector

## Role

Translate a fuzzy product idea or an unfamiliar repository into a concrete target-platform matrix the rest of the skill chain can plan against. Without this, security, testing, performance, accessibility, and store-policy choices drift.

## Start By

1. Read `references/platform-matrix.md`.
2. Collect inputs from `init-project`: stack fingerprint, user intent, deployment markers.
3. List the explicit platforms named by the user. If none were named, derive candidates from fingerprint markers and ask the user to confirm before locking in.
4. For each candidate platform, name the store/distribution policy that applies (App Store, Google Play, Microsoft Store, Steam, web, internal enterprise, console SDK, package registry).

## Procedure

1. Build the platform matrix: rows are platforms; columns are runtime, distribution channel, accessibility baseline, performance budget, security track, testing matrix, telemetry constraints.
2. Mark which cells are unknown and would benefit from Context7 MCP lookups (current SDK version, store policy revision, browser support floor, OS version coverage).
3. For each platform, pin the security track: web/API/backend → `security-owasp-web`; native iOS/Android → `security-mobile-masvs` plus backend/API `security-owasp-web` when applicable; LLM feature → `security-owasp-llm`; agentic surface → `security-owasp-agentic`; game → cheat-surface review plus dependency CVE checks.
4. Set a minimum testing matrix: e.g., web → 2 browser engines + 1 mobile viewport; iOS → 2 device sizes + dark mode + accessibility audit; Android → 2 API levels + at least one form factor.
5. Surface conflicts: platforms whose budgets, policies, or stores disagree (for example, an iOS feature blocked by App Store rules but used freely on web).
6. Hand the matrix to `architecture-review` and `requirements-quality` so non-functional requirements pick it up automatically.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before locking platform decisions that change architecture or store strategy.
- Use Context7 MCP whenever current store policy, browser support, OS version table, or platform SDK behavior changes the answer.
- Keep a decision trace: candidate platforms, why included or excluded, store-policy risks, accessibility floor, security track per platform.
- Escalate before locking in a platform whose store policy or certification path could block release.

## Output Artifacts

- Platform matrix (platform × runtime × distribution × accessibility × performance × security × test × telemetry)
- Per-platform security track assignment
- Per-platform testing matrix floor
- Open Context7 lookups required before architecture
- Conflicts and store-policy risks list

## Quality Bar

- Never silently expand the platform list beyond what the user confirmed.
- Never claim store-policy compliance without naming the policy version and date.
- Never let two platforms share a single security track if they have different surface areas.
- Never let unverified browser/OS support assumptions enter the matrix.

## Handoff

Hand off the matrix and per-platform tracks to `requirements-quality`, `architecture-review`, and the relevant `security-*` skill. Flag any conflict that must be resolved before `service-implementation`.

## References

- `references/platform-matrix.md`: template platform × constraints matrix with default budgets and security tracks.
