---
name: adr
description: Architecture Decision Records - the project's design knowledge base. CONSULT ADRs before planning any feature or architectural change. Use when (1) planning implementation, (2) modifying core systems, (3) asked why something works a certain way, (4) making significant technical decisions. ADRs explain WHY choices were made. Also use when asked to write, record, supersede, or amend an architecture decision.
allowed-tools: Glob, Grep, Read, Write, Edit
argument-hint: "[decision title or subsystem]"
---

# Architecture Decision Records

**Input**: `$ARGUMENTS` - names the decision or subsystem to record or research. With no argument, run in consult mode: search and read relevant ADRs before planning.

## Quick Reference

| Status | Priority | Meaning |
|--------|----------|---------|
| **Accepted** | 1st | Active decision, governs implementation |
| **Superseded by ADR-N** | 2nd | Read superseding ADR, original has context |
| **Accepted + Amended by ADR-N** | 2nd | Read both original and amendment together |
| **Proposed** | 3rd | Follow as if accepted, but still open to revision |
| **Deprecated** | 4th | Historical only, no longer applies |

---

## Before Planning (IMPORTANT)

1. Search on disk for ADRs (`docs/adr/*.md`, or `**/adr/*.md` respecting `.gitignore`) and search their contents for keywords related to the subsystem you're modifying
2. Read ADRs related to the subsystem you're modifying - understand what decisions are already in place and what they affect
3. Follow accepted decisions unless explicitly asked to change them
4. If your plan contradicts an ADR, stop and discuss the conflict with the user before proceeding
5. **If your plan involves an architecturally significant decision, include drafting a new ADR as a step in the plan** - see the criteria under Creating ADRs below

---

## Creating ADRs

Create an ADR when the decision:
- Affects system structure or key quality attributes
- Would be costly or difficult to reverse
- Involves tradeoffs between competing concerns
- Will guide future implementation choices

Draft the ADR during planning with status Proposed.

Confirm with the user before writing or editing any ADR file.

Follow the step-by-step procedure in [references/creating-adrs.md](references/creating-adrs.md). When drafting or reviewing an ADR, consult the [writing quality guide](references/writing-adrs.md) for section guidance and anti-patterns to avoid.

**ADRs are immutable once accepted - never edit the content of an accepted ADR.** To change a decision, create a new ADR that supersedes or amends the original (only the old ADR's Status section is updated). If your implementation would contradict an accepted ADR, stop and get user approval before drafting a superseding ADR.

---

## Further Reading

- [ADR background](references/adr-guide.md) - what ADRs are, exclusions and the architectural significance test, template formats
