---
name: project-structure-governance
description: "Enforce a clean project-activity contract for any repository the agent works on: coherent project structure, no root clutter, temporary/test/debug scripts isolated in a dedicated workspace, one canonical documentation/runbook entrypoint, and a clear cleanup/checklist before handoff. Use during init, planning, implementation, QA, review, release, documentation sync, scaffolding, migrations, and any task that creates files, scripts, docs, runbooks, examples, fixtures, screenshots, or experiments."
---

# Project Structure Governance

## Role

Keep the repository understandable after the agent leaves. Treat structure, temporary artifacts, test scripts, and documentation entrypoints as part of the deliverable, not as cleanup someone else will do later.

## Start By

1. Read `references/project-activity-contract.md`.
2. Identify the project type, existing conventions, and current documentation entrypoint (`README.md`, `docs/README.md`, `RUNBOOK.md`, `AGENTS.md`, `CLAUDE.md`, or equivalent).
3. Inspect the repo root and common scratch locations for clutter: one-off scripts, generated outputs, screenshots, temp logs, duplicate instructions, abandoned migration helpers, and stale test harnesses.
4. Confirm where temporary/test artifacts should live for this repo. Prefer an existing convention; otherwise use a dedicated ignored workspace such as `.agent-work/`, `.tmp/agent/`, or `tools/agent/` depending on project norms.
5. Record any required cleanup, consolidation, or documentation-entrypoint work before implementation expands the file surface.

## Procedure

1. **Structure contract.** Define or verify the top-level repo map: source, tests, tools, docs, scripts, infra, assets, fixtures, generated artifacts, and agent-only workspace.
2. **Artifact routing.** Route every new file before creating it: production source, test fixture, reusable tool, temporary experiment, generated output, documentation, or project memory.
3. **Temporary isolation.** Put throwaway scripts, debug probes, generated logs, screenshots, benchmark scratch, and exploratory outputs in the dedicated agent/test workspace. Do not place them in repo root.
4. **Reusable promotion.** Promote a temporary script only if it has a stable name, documented purpose, safe flags, validation command, owner, and a permanent home such as `tools/`, `scripts/`, `tests/fixtures/`, or `docs/examples/`.
5. **Documentation entrypoint.** Maintain one canonical entrypoint that links outward: README for project overview, `docs/README.md` for deep docs when needed, and one runbook/index for operation. Avoid multiple competing “START_HERE”, “HOW_TO”, “FINAL”, “NEW_README”, or duplicate setup files.
6. **Runbook hygiene.** If operational commands, install steps, local dev setup, release, rollback, or incident response changed, update the canonical runbook/index instead of adding a standalone note.
7. **Root cleanliness check.** Before handoff, verify the repo root contains only intentional files. Move, delete, or document anything temporary according to the contract.
8. **Graph update.** Hand documentation changes to `documentation-graph-curator` so Obsidian memory points to the canonical entrypoint and does not preserve obsolete instructions as current truth.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Preserve existing repository conventions unless they are unclear, contradictory, or already causing clutter.
- Prefer moving temporary artifacts into an ignored workspace over deleting them while a task is still active.
- Do not silently delete user-created files. If ownership is unclear, list them as cleanup candidates with evidence.
- Treat duplicate documentation as a correctness risk because agents will follow the wrong file under context pressure.

## Output Artifacts

- Project structure contract or updated repo map
- Agent/test artifact workspace decision
- Documentation/runbook entrypoint decision
- Cleanup candidates and resolved clutter list
- Handoff note naming remaining temporary artifacts, if any

## Quality Bar

- No one-off scripts, scratch outputs, generated logs, screenshots, or temp files in repo root.
- No new permanent script without stable purpose, safe defaults, and a validation command.
- No duplicate competing documentation entrypoints.
- No hidden setup or runbook change outside the canonical documentation path.
- No cleanup claim without checking root-level files and newly created artifacts.
- No Obsidian update that points future agents to stale setup or runbook instructions.

## Handoff

Hand off the structure contract, moved/promoted artifacts, canonical documentation entrypoint, cleanup candidates, and validation commands to `documentation-graph-curator`, `qa-eval`, or `pr-review` as appropriate.

## References

- `references/project-activity-contract.md`: contract for repo structure, temporary artifacts, reusable scripts, docs entrypoints, and cleanup gates.
