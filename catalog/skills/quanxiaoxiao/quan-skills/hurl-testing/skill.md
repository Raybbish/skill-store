---
name: hurl-testing
description: Guidelines for generating, maintaining, and repairing Hurl tests for HTTP APIs. Covers contract testing, lifecycle management, cleanup discipline, and incremental maintenance from OpenAPI specs.
---

# Hurl Testing

Generate and maintain Hurl coverage that validates the HTTP contract without drifting into implementation testing.

## Use This Skill

Use this skill when:

- generating Hurl tests from OpenAPI
- adding new Hurl coverage for HTTP endpoints
- repairing failing Hurl files after API changes
- adding regression coverage for caller-visible API bugs
- reviewing Hurl suites for lifecycle or cleanup gaps

## When NOT to use

Do not use this skill when:

- the task is unit or internal integration testing only
- the system is not HTTP-based
- there is no usable API contract or endpoint documentation
- browser automation or performance testing is the real goal

## Pre-Read Order

Read the target repository first:

1. `openapi.json` or `openapi.yaml`
2. existing Hurl files, usually under `tests/hurl/`
3. API documentation or README notes for business rules

Then load bundled guidance from this skill pack:

4. `../../rules/hurl-testing.rule.md`
5. `../../checklists/hurl-quality.checklist.md`
6. `references/test-structure.md`
7. `references/generation-and-repair.md`

## Workflow

1. Start from the contract, not the implementation.
   Treat OpenAPI and documented API rules as the source of truth for status codes, schemas, and error envelopes.

2. Map coverage by operation family.
   Organize files as `create.hurl`, `query.hurl`, `update.hurl`, `remove.hurl`, or one dedicated `[action].hurl` file per custom operation.

3. Keep each file standalone and rerunnable.
   Create any required resources inside the file, capture identifiers locally, and perform cleanup in the same file.

4. Assert declared behavior only.
   Check status codes, required fields, error envelopes, pagination structure, and business-critical invariants. Do not assert internal-only or undeclared fields.

5. Repair failing tests in the right order.
   First verify the contract and actual server behavior. Update Hurl only when the contract changed or the existing assertions were wrong.

6. Add regression coverage for externally visible bugs.
   If the user fixes an API bug, add or strengthen at least one Hurl scenario that would fail before the fix.

## Reference Guide

Load these only when needed:

- `references/test-structure.md` for file layout, lifecycle coverage, cleanup rules, pagination, and assertion scope
- `references/generation-and-repair.md` for generation templates, repair order, and regression rules

## Verification

Always verify at the repository boundary:

1. run the repository's Hurl command if one exists
2. run affected Hurl files in isolation when practical
3. rerun the suite or the relevant tag directory after repairs

If tests depend on environment setup, record the exact missing prerequisite instead of claiming success.

## Output Contract

Return results in this order:

1. `Contract Scope`
2. `Coverage Added Or Repaired`
3. `Verification`
4. `Residual Risk`
