---
name: doc-governance-init
description: Bootstrap or refactor a repository's documentation into a layered governance structure that supports human readers and multiple coding agents (Claude, Codex, OpenCode) without tool lock-in.
---

# Doc Governance Init

Transform unstructured repository documentation into a maintainable, layered system that humans and coding agents can collaboratively maintain.

## Use This Skill

Use this skill when the task involves:

- bootstrapping documentation for a new or undocumented repository
- refactoring scattered docs into a structured governance model
- establishing shared agent collaboration rules (AGENTS.md)
- auditing documentation for drift, duplication, or missing layers
- migrating tool-specific instructions into a shared doc structure
- questions such as "set up docs", "organize documentation", "create AGENTS.md"

## When NOT to use

Do not use this skill when:

- the task is comparing existing docs to code for correctness (use `doc-evidence-compare`)
- the task is editing a single document without structural changes
- the task is generating domain-specific content (API docs, user guides)
- documentation structure already exists and only content updates are needed

## Pre-Read Order

Read the target repository first:

1. `README.md` if present
2. `AGENTS.md` or `CLAUDE.md` or `CODEX.md` if present
3. `docs/` directory listing
4. Any `agents/` or `prompts/` directories
5. `.opencode/`, `.claude/`, `.codex/` tool-specific dirs

Then load bundled guidance from this skill:

6. `references/layer-model.md`
7. `references/migration-rules.md`

## Documentation Layer Model

The skill enforces five documentation layers:

| Layer | Location | Purpose | Owner |
|-------|----------|---------|-------|
| 1 — Entry | `README.md` | Human entry point, project overview | Humans |
| 2 — Collaboration | `AGENTS.md` | Shared rules for all agents | Humans + Agents |
| 3 — System knowledge | `docs/` | Architecture, workflows, constraints | Humans + Agents |
| 4 — Tool guidance | `agents/` | Tool-specific instructions | Per-tool maintainer |
| 5 — Reusable prompts | `prompts/` | Audit, alignment, implementation prompts | Agents |

Rules:

- Project truth lives in `docs/`, not in tool-specific files
- Do not duplicate system explanations across layers
- Agents reference shared docs instead of redefining them
- Prefer cross-references over repeated explanations
- `README.md` links into `docs/` but does not replace it

## Workflow

### Phase 1 — Assess

Analyze the current documentation state. Produce an assessment report.

1. List all documentation files in the repository.
2. Classify each file by layer (1–5) or mark as `unclassified`.
3. Identify problems:
   - duplicated explanations across files
   - scattered architecture docs (spread across README, tool configs, inline comments)
   - tool-specific coupling (project truth locked inside `.claude/` or `.codex/`)
   - missing layers (no AGENTS.md, no docs/ directory, no prompts/)
   - outdated or contradictory instructions
4. Output the assessment as a table: `File`, `Current Layer`, `Problems`, `Action Needed`.

### Phase 2 — Normalize

Propose a clean target structure based on the layer model.

1. Define the target directory tree for this specific repository.
2. Map each existing doc to its target location.
3. Define source-of-truth boundaries:
   - Which file is authoritative for each topic?
   - Which files should cross-reference instead of explain?
4. Define ownership: human-maintained vs agent-maintained vs shared.
5. Output the normalized structure as a directory tree with annotations.

### Phase 3 — Migrate

Generate a concrete migration plan.

For each file, assign exactly one action:

| Action | When to use |
|--------|------------|
| `keep` | File is already in the right place and layer |
| `move` | File content is correct but location is wrong |
| `merge` | Multiple files cover the same topic — combine into one |
| `split` | One file covers multiple layers — separate concerns |
| `rewrite` | Content is outdated or poorly structured |
| `remove` | Content is duplicated elsewhere or no longer relevant |
| `create` | A required layer or document does not exist |

Output the plan as a table: `Source`, `Action`, `Target`, `Notes`.

Execute migrations only after user approval.

### Phase 4 — Future Governance

After migration, generate maintenance artifacts:

1. A `prompts/doc-audit.prompt.md` tailored to this repository
2. A `prompts/doc-alignment.prompt.md` for periodic doc/code sync checks
3. Documentation maintenance rules added to `AGENTS.md`
4. A recommended audit cadence (e.g., monthly, per-release)

## Reference Guide

Load these only when needed:

- `references/layer-model.md` — detailed layer definitions and boundary rules
- `references/migration-rules.md` — migration action definitions and conflict resolution

## Verification

Before finalizing, verify:

1. Every documentation file maps to exactly one layer
2. No project truth is duplicated across layers
3. `README.md` exists and links to `docs/` for detail
4. `AGENTS.md` exists with shared rules, not tool-specific instructions
5. `docs/` contains architecture and workflow docs
6. Tool-specific files reference `docs/` instead of re-explaining
7. At least one audit prompt exists for future maintenance
8. Migration plan was approved before execution

## Output Contract

Return results in this order:

1. `Assessment` — current state table
2. `Target Structure` — proposed directory tree
3. `Migration Plan` — action table
4. `Generated Artifacts` — list of files created or modified
5. `Governance Rules` — maintenance instructions for AGENTS.md
