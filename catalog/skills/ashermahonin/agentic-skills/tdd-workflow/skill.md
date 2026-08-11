---
name: tdd-workflow
description: "Run a strict test-driven-development loop for AI-agent implementation, following Anthropic's published guidance for Claude Code: write the test first, watch it fail, define the minimum implementation contract, verify green after service-implementation, refactor under green, and produce evidence the agent did not silently overfit to the test. Use whenever a new feature, bug fix, refactor, or design hypothesis must be implemented with a verifiable safety net rather than after-the-fact tests."
---

# TDD Workflow

## Role

Force the agent to write the failing test before any production code, define the smallest implementation contract that should make it pass, then verify green and refactor under a green bar. Treat tests as the executable specification of the change and as the rollback signal if the implementation regresses.

When a route also includes `service-implementation`, this skill owns the test contract, red evidence, anti-overfit criteria, and reproduction commands. `service-implementation` owns the production code change under that contract. When this skill is used alone, it may execute the full red/green/refactor loop itself.

## Start By

1. Read `references/tdd-loop.md`.
2. Restate the change in one sentence and pin its acceptance criteria from `requirements-quality` or the story file.
3. Pick the test level (unit, contract, integration, browser, eval) that proves the smallest correct slice.
4. Use Context7 MCP to confirm the current test-runner API, assertion style, and matcher behavior for the language/framework before writing the test.

## Procedure

1. **Red.** Write one failing test that encodes a single acceptance criterion. Run it. Verify it fails for the right reason; reject failures from import errors, missing fixtures, or syntax mistakes.
2. **Implementation contract.** If `service-implementation` is in the route, hand off the failing test, expected behavior, owned files, and validation command before production code changes. If not, write only the minimum implementation that makes the test pass.
3. **Green.** Run the new test after implementation. Confirm it passes without skipped assertions or weakened checks.
4. **Refactor.** Improve naming, structure, and duplication while keeping the suite green. Run the full affected suite, not only the new test.
5. **Anti-overfit check.** Add at least one boundary or negative test (invalid input, edge value, failure path) the original test did not cover. If the implementation breaks under it, return to step 1.
6. **Coverage and intent gate.** Report which acceptance criteria are now covered by passing tests, which are not, and the reason. Never claim coverage from a snapshot, golden file, or mock that simply mirrors the implementation.
7. **Handoff to `qa-eval`.** Provide the test list, the levels chosen, the unchecked acceptance criteria, and the commands to reproduce.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before treating a green suite as proof.
- Use Context7 MCP for current test framework, runner, fixture, and assertion behavior.
- Keep a decision trace: chosen test level, what it proves, what it cannot prove, what the next level up would catch.
- Refuse to write code before the failing test exists, except for trivial scaffolding required for the test runner.
- Never delete or weaken an existing test to make a new feature pass.

## Output Artifacts

- The failing test (commit before the green commit)
- The implementation contract for `service-implementation`, or the minimum passing implementation when this skill runs standalone
- The refactor commit under green
- At least one negative/boundary test per acceptance criterion
- Coverage-vs-acceptance-criteria report
- Reproduction commands for `qa-eval`

## Quality Bar

- No production code without a failing test that justifies it.
- No skipped, xfailed, or commented-out tests in the green commit.
- No mocks that only echo the implementation back at it.
- No claims of "tested" without naming the test file and the assertion.
- No green report when the full affected suite was not re-run.
- Test names and any in-test comments follow `.claude/rules/coding-conventions.md`: comment in the user's session language, no ALL-CAPS signal words, no marketing voice, no decorative banners. Test names describe the behavior asserted, not the implementation detail.

## Handoff

Hand off to `qa-eval` with: test files added, suite re-run output, acceptance criteria covered and uncovered, anti-overfit evidence, and any test debt deferred.

## References

- `references/tdd-loop.md`: red/green/refactor loop, anti-overfit rules, and the per-language matrix of test runners and matchers.
