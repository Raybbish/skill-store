---
name: self-review-extension
description: >-
  This skill should be loaded by `reviewer:self-review` when configuring a
  review run in this repository. Extend self-review with plugin structure and
  Codex review types with per-type scopes, lower confidence threshold to 70,
  and add marketplace registry pre-flight checks.
user-invocable: false
---

# Self-Review Extension

Modify the default self-review configuration:

## Add review types

- `review-plugin` (local skill) - assign to `reviewer:reviewer`, scope `explore`
- `reviewer-extras:review-codex` (plugin skill) - assign to `codex:review`, scope `packet`. **Skip if the `codex:review` skill is not installed.**
- `reviewer-extras:review-claude-md` (plugin skill) - assign to `reviewer:reviewer`, scope `explore`

## Adjust confidence threshold

- Lower confidence threshold to >= 70

## Pre-review step: validate marketplace registry

Before launching review tasks, run these pre-flight checks:

1. Read `.claude-plugin/marketplace.json` and parse the `plugins` array
2. For each registered plugin, verify the `source` path resolves to an existing directory on disk
3. Read `.agents/plugins/marketplace.json` and parse the `plugins` array
4. For each registered Codex plugin, verify the `source.path` resolves to an existing directory on disk
5. Search on disk for `plugins/*/` directories and check each against both registries - flag any unregistered plugin directories (a plugin directory with no `.codex-plugin/plugin.json` is Claude-specific - expect it only in the Claude registry)
6. Flag any registry entries whose source path does not exist on disk (orphaned entries)
7. Cross-check that plugins registered in both marketplaces have consistent `name` fields
8. Report pre-flight findings before launching the parallel review tasks
