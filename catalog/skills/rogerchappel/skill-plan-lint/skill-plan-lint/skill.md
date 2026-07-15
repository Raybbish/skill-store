# skill-plan-lint

## When To Use

Use this skill when reviewing a `SKILL.md`, skill proposal, or durable agent workflow before publishing, installing, or sharing it.

## Inputs And Tools

Provide a local Markdown file or directory containing skill docs. The CLI reads files from disk only.

## Side-Effect Boundaries

Default commands only read files and print reports. They do not rewrite skills, install anything, call network services, or approve proposals.

## Approval Requirements

Ask for explicit approval before using lint output to apply, reject, quarantine, or rewrite a live skill.

## Examples

`skill-plan-lint check SKILL.md`
`skill-plan-lint report skills --markdown`

## Validation

Run `npm test`, `npm run smoke`, and `bash scripts/validate.sh` before trusting a packaged release.

## Limitations

The linter checks operational completeness, not correctness of every instruction. Human review remains required for safety-critical skills.
