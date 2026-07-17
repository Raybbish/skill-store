---
name: doc-evidence-compare
description: Compare repository documentation and code evidence for a topic, check whether a business rule or relationship is documented, locate implementation evidence, and identify mismatches or missing documentation with file-backed conclusions.
---

# Doc Evidence Compare

Search documentation and code together, then answer with evidence instead of a freeform guess.

## Use This Skill

Use this skill when the task involves:

- checking whether a business rule, relationship, or behavior is documented
- comparing docs and code for consistency
- locating where a topic is implemented in code
- checking whether documented behavior is actually implemented
- finding missing documentation or documentation drift
- questions such as `有没有写`, `代码里在哪`, `是否一致`, `文档和实现是否对得上`

## When NOT to use

Do not use this skill when:

- the task is only to summarize a single document the user already provided
- the task is only to edit documentation without needing repo-wide evidence gathering
- the task is pure code debugging with no documentation comparison angle

## Pre-Read Order

Read the target repository first:

1. `AGENTS.md` if present
2. `README.md` or repository index docs
3. `docs/opencode-context.md` if present
4. obvious architecture, API, or glossary docs related to the topic

Then load bundled guidance from this skill pack:

5. `references/search-workflow.md`
6. `references/evidence-matrix.md`

## Workflow

1. Read repo context before searching the topic.
   Start with `AGENTS.md`, `README.md`, and any obvious architecture or context docs so term matching happens in the right domain.

2. Expand the query into search aliases.
   Include Chinese and English terms, synonyms, entity names, field names, API names, and likely implementation identifiers before running searches.

3. Search docs first and code second, but do not stop after docs.
   Use `rg` against `docs/`, `README*`, `AGENTS.md`, `openapi*`, `schema*`, then inspect `src/`, `app/`, `packages/`, `services/`, and `tests/` when relevant.

4. Collect evidence, not just matches.
   For each claim, capture the file references and the specific meaning of each hit. Distinguish direct evidence from inference.

5. Classify each claim.
   Use exactly one status per claim: `documented_and_implemented`, `documented_only`, `implemented_only`, `contradictory`, or `not_found`.

6. Output the fixed evidence matrix before any recommendation.
   Keep the final answer in the matrix format defined in `references/evidence-matrix.md` with columns `Claim / 问题点`, `Doc Evidence`, `Code Evidence`, `Status`, `Gap / Notes`, and `Confidence`, then add a short conclusion and recommendation block.

## Reference Guide

Load these only when needed:

- `references/search-workflow.md` for the exact search order, alias expansion, and status rules
- `references/evidence-matrix.md` for the required response template and evidence rules

## Verification

Before finalizing an answer, verify:

1. both docs and code were searched unless the user explicitly limited scope
2. every positive claim includes file references
3. `not_found` means searched but not found, not guessed absent
4. every inference is labeled as inference
5. documented-only and implemented-only cases are kept separate

## Output Contract

Return results in this order:

1. `Top Summary`
2. `Evidence Matrix`
   Use columns `Claim / 问题点`, `Doc Evidence`, `Code Evidence`, `Status`, `Gap / Notes`, and `Confidence`.
3. `Recommendation`
