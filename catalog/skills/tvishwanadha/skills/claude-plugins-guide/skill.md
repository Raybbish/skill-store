---
name: claude-plugins-guide
description: >-
  This skill should be loaded when creating a plugin, modifying a Claude Code
  plugin manifest (.claude-plugin/plugin.json), registering a plugin in the
  Claude marketplace, or adding skills or agents to a plugin. Defines Claude
  Code marketplace registration and plugin conventions for this repository.
user-invocable: false

---

# Claude Code Plugin Conventions

## Plugin Manifest

The manifest at `.claude-plugin/plugin.json` defines the plugin for Claude Code.

### Required fields

- `name` - lowercase, hyphen-separated identifier (the only required field)

### Optional fields

- `$schema` - JSON Schema URL for editor autocomplete; ignored at load time
- `version` - semver; a set version pins updates until bumped
- `displayName` - UI-only display name
- `description` - concise summary of the plugin's purpose
- `author` (object; `name` required, `email` and `url` optional), `homepage`, `repository`, `license` (SPDX identifier), `keywords`
- `userConfig` - object; user-configurable values prompted at enable time
- `channels` - array; channel declarations for message injection, each binding to a key in the plugin's `mcpServers`
- `lspServers` - string, array, or object; Language Server Protocol configs
- `workflows` - string or array; workflow script files or directories
- `outputStyles` - string or array; output style files or directories
- `experimental.themes` - string or array; color theme files or directories
- `experimental.monitors` - string or array; background monitor configs
- `dependencies` - array of plugin dependencies; see below
- `defaultEnabled` - whether the plugin is enabled by default, subject to precedence (highest first):
  1. The user's setting - an entry for the plugin in `enabledPlugins` at any settings scope. Once written it persists across updates and reinstalls, so changing `defaultEnabled` in a later release does not flip an existing user.
  2. A dependency requirement - when a plugin is required by another active plugin, Claude Code writes `true` for it at install or enable time, giving it an explicit setting so its own default no longer applies.
  3. `defaultEnabled` itself, which defaults to `true`.

  A marketplace entry's `defaultEnabled` takes precedence over the value in `plugin.json`.

`experimental.themes` and `experimental.monitors` may change shape between releases. Declaring them at the top level still works but `claude plugin validate` warns, and a future release will require the `experimental.*` form.

This list lags the upstream spec. Before flagging a manifest field as invalid because it is absent here, check https://code.claude.com/docs/en/plugins-reference.md.

Unrecognized manifest fields are ignored at load. `claude plugin validate` warns on them; `--strict` promotes warnings to errors. Fields with the wrong type still fail to load - a `keywords` value that is a string instead of an array is a load error, and `claude plugin validate` reports it as an error, not a warning.

#### `dependencies`

Array of entries; each is a bare plugin-name string (`"audit-logger"`) or an object.

Object fields:
- `name` (string, required) - resolves within the same marketplace as the declaring plugin
- `version` (string, optional) - semver range (`~2.1.0`, `^2.0`, `>=1.4`, `=2.1.0`); resolves to the highest tagged version satisfying the range
- `marketplace` (string, optional) - a different marketplace to resolve `name` in

```json
{
  "dependencies": [
    "audit-logger",
    { "name": "secrets-vault", "version": "~2.1.0", "marketplace": "other-marketplace" }
  ]
}
```

Version constraints resolve against git tags on the marketplace repository, named `{plugin-name}--v{version}`; `claude plugin tag` creates them. If no tag satisfies the range, the dependent plugin is disabled with `no-matching-tag`.

Cross-marketplace dependencies are blocked unless the target marketplace is listed in `allowCrossMarketplaceDependenciesOn` in the marketplace.json of the ROOT marketplace - the one hosting the plugin the user is installing. Only its allowlist is consulted, so trust does not chain through intermediate marketplaces. Otherwise install fails with a `cross-marketplace` error.

Enabling or installing a dependent plugin writes `true` for each dependency that has no higher-precedence setting; see the `defaultEnabled` entry above. If a dependency is set to `false` at a higher-precedence scope, the enable fails rather than overriding it.

Reference: https://code.claude.com/docs/en/plugin-dependencies.md

### Component paths

Auto-discovered by default, all at plugin root (not inside `.claude-plugin/`):

| Path | Contents |
|---|---|
| `skills/` | skills |
| `agents/` | agent definitions |
| `commands/` | commands |
| `hooks/hooks.json` | hooks |
| `.mcp.json` | MCP servers |
| `workflows/` | workflow script files |
| `output-styles/` | output style definitions |
| `themes/` | color theme definitions |
| `monitors/monitors.json` | background monitor configurations |
| `.lsp.json` | LSP server configurations |
| `bin/` | executables added to the Bash tool's PATH, invokable as bare commands while the plugin is enabled |
| `settings.json` | default settings applied when the plugin is enabled; only the `agent` and `subagentStatusLine` keys are supported |

A plugin-root `SKILL.md` loads the plugin as a single-skill plugin when there is no `skills/` subdirectory and no `skills` manifest field (Claude Code v2.1.142+). The frontmatter `name` determines the invocation name, falling back to the directory basename.

| Manifest field | Semantics |
|---|---|
| `commands`, `agents`, `workflows`, `outputStyles`, `experimental.themes`, `experimental.monitors` | replace the default directory scan; to keep the default and add more, list it explicitly, e.g. `"commands": ["./commands/", "./extras/"]` |
| `skills` | adds to the default `skills/` scan, except for a marketplace entry whose `source` resolves to the marketplace root, where declaring specific subdirectories replaces the default `skills/` scan |
| `hooks`, `mcpServers`, `lspServers` | merge with other sources |

`hooks` is a path to a hooks JSON file (default `hooks/hooks.json`), an array of hook file paths, or an inline object - not a path to a hooks directory.

## Marketplace

### Registering a plugin

Add an entry to the marketplace's `plugins` array with a `source` pointing at the plugin's directory:

```json
{
  "name": "plugin-name",
  "source": "./relative/path/to/plugin",
  "description": "Short description"
}
```

**Required per-plugin**: `name` and `source`. `description` is optional but recommended.

### Path resolution

The marketplace file lives at `<repo-root>/.claude-plugin/marketplace.json`. Source paths are relative to the repo root. `metadata.pluginRoot` sets a base directory prepended to relative sources.

Non-local source forms also exist (`github`, git `url`, `git-subdir`, `npm` objects) - see https://code.claude.com/docs/en/plugin-marketplaces.md. Run `claude plugin validate <path>` as the pre-publish check; pointed at a marketplace directory it validates `marketplace.json` (schema errors, duplicate plugin names, source path traversal) plus each local-source entry's own `plugin.json`, warning when the entry's `version` disagrees with `plugin.json`.

## Plugin Components

### Skills

Skills within plugins follow the same conventions as local skills. Each skill lives in `skills/<skill-name>/SKILL.md`. For skill authoring guidance, consult `skills-guide`.

### Commands

Custom commands are merged into skills - a `commands/<name>.md` and a `skills/<name>/SKILL.md` create the same command, and existing commands keep working. Prefer skills for new components: they support bundled files and invocation-control frontmatter.

### Agents

Agent definitions are Markdown files in `agents/`, one per agent, with YAML frontmatter and a system prompt body.

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | |
| `description` | Yes | |
| `model` | No | `sonnet`/`opus`/`haiku`/`fable`, a full model ID, or `inherit` (default) |
| `tools` | No | string or YAML list |
| `skills` | No | preloads full skill content into the agent at startup |
| `effort` | No | |
| `maxTurns` | No | |
| `disallowedTools` | No | |
| `memory` | No | |
| `background` | No | |
| `isolation` | No | only valid value is `worktree` |

Plain-language descriptions are the current style - `<example>`/`<commentary>` blocks are not mandated. `hooks`, `mcpServers`, and `permissionMode` in plugin agent frontmatter are ignored for security.

### Hooks

Hooks are configured as a hooks JSON file (default `hooks/hooks.json`), an array of hook file paths, or an inline object in the manifest; see https://code.claude.com/docs/en/hooks.md.

`${CLAUDE_PLUGIN_ROOT}` resolves to the plugin's install directory, for referencing bundled files in hook and MCP configs.

## Reference

- Canonical Claude Code plugin spec - manifest, component discovery, and agent frontmatter: https://code.claude.com/docs/en/plugins-reference.md
- Marketplace registration and source forms: https://code.claude.com/docs/en/plugin-marketplaces.md
- Plugin dependencies - version constraints, tags, cross-marketplace rules: https://code.claude.com/docs/en/plugin-dependencies.md

## This Repository

This repo always sets `version` and bumps it on change.

Register plugins in [`.claude-plugin/marketplace.json`](../../../.claude-plugin/marketplace.json) with `"source": "./plugins/<name>"`.

This repo publishes no plugin version git tags. Declare `dependencies` without a `version` constraint until it does.
