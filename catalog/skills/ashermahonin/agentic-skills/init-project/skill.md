---
name: init-project
description: "Initialize a project for AI-agent development. Detects existing codebase architecture, language, framework, platform, runtime, package manager, test runner, CI, secrets backend, and existing documentation, or scaffolds a fresh project from a one-line intent like web app, iOS app, Android app, desktop app, game, CLI, or AI agent. Produces a working agent configuration, CLAUDE.md/AGENTS.md overlay, Obsidian project skeleton seed, and the next-step skill chain so the user can immediately give a normal product prompt without first explaining stack, layout, or conventions."
---

# Init Project

## Role

Be the first skill the user touches. Either fingerprint the existing project so the agent works inside its real conventions, or scaffold a fresh project from a short intent. Either way, end with a configured agent, a seeded project memory, a recommended skill chain, and a single sentence the user can read to know what to do next.

## Start By

1. Read `references/init-decision-tree.md`.
2. Check the working directory: list root files (≤2 levels) without reading them yet, then probe for fingerprint markers: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle*`, `Podfile`, `*.xcodeproj`, `AndroidManifest.xml`, `project.godot`, `*.uproject`, `*.unity`, `Dockerfile`, `helm/`, `terraform/`, `.github/`, `.gitlab-ci.yml`.
3. Decide one of three modes: **fingerprint** (existing project), **scaffold** (empty directory or explicit user intent like `init: I want a web app`), or **hybrid** (existing repo + new initiative inside it).
4. If the user passed a free-text intent, route to `intake-coordinator` for a 30-second clarification before scaffolding.

## Procedure

1. **Fingerprint pass.** From markers, derive: language(s), framework(s), platform(s), package manager, test runner, build system, deploy target, secrets backend, observability stack, CI provider. Note unknowns explicitly. Do not read source files yet.
2. **Hypothesis pass (scaffold mode only).** Use Context7 MCP to pull current best-practice docs for the candidate stack. Compare 2–3 viable stacks against the user intent. Pick one, record why, and list rejected options.
3. **Resolve support root.** Prefer repo-root resources (`agentic/routing`, `agentic/obsidian`, `.claude/rules`). If this pack was installed with `--copy`, use the installed support root beside the skills folder (`../../routing`, `../../obsidian`, `../../claude-rules`).
4. **Seed project memory.** Copy the resolved Obsidian `project-skeleton/` into the project's chosen vault path. Fill `00-home.md` with project name, current phase, detected stack, and links to MOC pages.
5. **Write agent overlay.** Generate `CLAUDE.md` and `AGENTS.md` in the project root that point to this skill pack, list the detected stack, and pin the next-step skill chain.
6. **Wire routing.** Drop or refresh `.claude/rules/` and `.agents/routing/agentic-skills.json` from the resolved support root so the agent picks the right skill on the first user prompt.
7. **Recommend chain.** Pick the entrypoint from the resolved `routing/skills.json` matching the detected mode: greenfield → `sdlc-orchestrator` chain; existing product → `analyze-codebase` chain; narrow change → `intake-coordinator` chain.
8. **Stop.** Print: detected stack, scaffold/fingerprint summary, next skill, one user prompt example, open assumptions.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before moving from fingerprinting to scaffolding.
- Use Context7 MCP whenever the detected or proposed stack involves an external library, framework, platform, API, or CLI whose current behavior shapes the scaffold.
- Keep a decision trace: candidate stacks, evaluation criteria, why the chosen one wins, what would change the decision, what was left out.
- Never overwrite an existing `CLAUDE.md`, `AGENTS.md`, or project vault without an explicit confirmation step.
- Refuse to scaffold against an unverified stack assumption. Ask before guessing.

## Output Artifacts

- Stack fingerprint report (language, framework, platform, runtime, CI, secrets, observability)
- Project-mode classification: fingerprint, scaffold, or hybrid
- Seeded `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, and `.agents/` routing files
- Seeded project memory (Obsidian skeleton inside the project)
- Recommended skill chain and the first user prompt to send
- Open assumptions and stop conditions

## Quality Bar

- Never start `service-implementation` directly from `init-project`.
- Never scaffold a stack the user did not confirm.
- Never write secrets, tokens, or machine-specific absolute paths into seeded files.
- Never replace existing project artifacts silently.
- Always end with a concrete next prompt the user can copy.

## Handoff

Hand off with: detected mode, stack fingerprint, seeded artifacts, chosen entrypoint skill, open clarifying questions, and the single next skill to invoke.

## References

- `references/init-decision-tree.md`: decision tree for choosing fingerprint, scaffold, or hybrid mode and the matching skill chain.
