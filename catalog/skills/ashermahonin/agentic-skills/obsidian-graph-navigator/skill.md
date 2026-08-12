---
name: obsidian-graph-navigator
description: "Navigate the project's Obsidian knowledge graph efficiently so the agent loads the smallest correct context instead of re-reading the whole vault. Uses wikilink topology, MOC (map of content) pages, frontmatter metadata, and tag/property queries to answer 'what do I need to read for this task' in a token-economical way. Use whenever a skill is about to load notes from the project vault, before architecture decisions, before scope clarification, before security review, and any time the agent risks rereading the same artifacts."
---

# Obsidian Graph Navigator

## Role

Be the agent's librarian for the project vault. Walk the wikilink graph and MOC pages to assemble the minimum reading set for the current task, instead of dumping the whole vault into the context window.

## Start By

1. Read `references/graph-navigation.md`.
2. Identify the active task type (intake, research, architecture, decomposition, implementation, QA, review, security, ops, post-launch).
3. Open `00-home.md` in the project vault as the MOC entrypoint. Pull the relevant phase MOC links (Intake, Discovery, Product flow, Architecture, Delivery, Quality, Existing product).
4. Verify the vault layout exists; if missing, route to `documentation-graph-curator` to seed it.

## Procedure

1. Pick the phase MOC matching the task type.
2. Walk wikilinks one hop out from the MOC; collect notes whose frontmatter `type` matches the current artifact need.
3. For each candidate, read only the section that matches the current goal (frontmatter + first heading), not the whole file. Defer deep reads until proven necessary.
4. Filter via frontmatter properties: `status`, `phase`, `service`, `owners`, `depends_on`, `risk_level`, `updated_at`. Reject stale notes (older than relevant cutoff) unless they hold an active ADR or unresolved risk.
5. Build a reading order: dependencies first (e.g., `08-product-scope` before `11-functional-requirements`), then current artifact, then related ADRs and risk entries.
6. Emit the reading list and stop. Hand the list (paths + sections) to the requesting skill instead of reading everything into the parent context.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` when graph evidence will gate a decision.
- Use Context7 MCP only if a referenced external doc must be re-validated.
- Keep a decision trace: which MOC pages were walked, which links were followed, which notes were filtered out and why.
- Never reload a note already in context; reuse it.
- Never silently widen the reading set beyond the requesting skill's need.

## Output Artifacts

- Ordered reading list with file paths, section anchors, and frontmatter snapshot
- Filtered-out list with reason (stale, off-phase, wrong service, unrelated)
- Open ADRs and risks intersecting the task
- Graph hygiene flags (broken wikilinks, missing frontmatter, drifted properties)

## Quality Bar

- No "load entire vault" prompts.
- No reading list that re-includes notes already in the requester's context.
- No reading list without owner/status/phase filtering when those exist.
- No silent ignoring of broken wikilinks; raise them to `documentation-graph-curator`.

## Handoff

Hand the ordered reading list to the requesting skill. Hand broken-link or stale-metadata findings to `documentation-graph-curator`.

## References

- `references/graph-navigation.md`: MOC topology, phase-to-MOC mapping, frontmatter filters, hygiene flags.
