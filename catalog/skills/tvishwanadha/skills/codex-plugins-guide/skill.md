---
name: codex-plugins-guide
description: >-
  This skill should be loaded when creating or modifying a Codex plugin
  manifest (.codex-plugin/plugin.json), registering a plugin in the Codex
  marketplace (.agents/plugins/marketplace.json), adding interface metadata,
  troubleshooting Codex plugin discovery, or troubleshooting subagent role
  discovery. Defines Codex-specific marketplace conventions for this
  repository.
user-invocable: false

---

# Codex Plugin Conventions

## Contracts

Three contracts apply:

- **Codex ingestion** - what the Codex runtime parses and enforces.
- **The preflight validator** - the `$plugin-creator` skill bundled in Codex, at `~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py`. Stricter than ingestion; treat its rules as preflight convention, not runtime behavior.
- **Upstream docs** - https://developers.openai.com/plugins/build/plugins.md. Looser than both.

Write manifests to the preflight validator's contract.

## Plugin Manifest

The manifest at `.codex-plugin/plugin.json` defines the plugin for Codex. Upstream docs make it the required entry point and every field inside it optional. Ingestion requires no field either - each one deserializes with a default, and a blank or absent `name` falls back to the plugin directory basename.

### Fields

Required by the preflight validator, optional to ingestion and to upstream docs:

- `name` - non-empty
- `version` - strict semver
- `description` - non-empty
- `author` - object with a non-empty `author.name`
- `interface` - complete object; supply every subfield required under Interface metadata

Optional: `homepage`, `repository`, `license` (SPDX identifier), `keywords`, `skills`, `mcpServers`, `apps`. Two more carry caveats:

- `hooks` - accepted by upstream docs and by ingestion, rejected by the preflight validator; omit the field and rely on the default `hooks/hooks.json` location
- `id` - inert; the validator allowlists it, ingestion has no such field, no doc defines it

Declare no field outside these lists. The preflight validator rejects unknown manifest fields.

The bundled plugin-creator skill's convention is that the plugin directory name and the manifest `name` are the same normalized plugin name. Neither the preflight validator nor ingestion rejects a mismatch; ingestion substitutes the basename only when `name` is blank.

### Full manifest schema

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "interface": { }
}
```

Fill `interface` with the block from Interface metadata.

All fields use camelCase. Codex ingestion requires the string-valued path fields to be relative, start with `./`, and stay within the plugin root (no `..` components). The preflight validator additionally pins them to fixed contract locations:

- `skills` - `"./skills/"`
- `apps` - `"./.app.json"`
- `mcpServers` - `"./.mcp.json"`, or an inline server object instead of a string

A declared `skills`, `hooks`, or string-valued `mcpServers` path supplements default component discovery; it does not replace it. Omit the field to rely on discovery alone.

### Interface metadata

The `interface` block supplies display metadata for the Plugin Directory. Subfields the preflight validator requires: `displayName`, `shortDescription`, `longDescription`, `developerName`, `category`, `capabilities` (array of strings), `defaultPrompt`.

Optional subfields: `websiteURL`, `privacyPolicyURL`, `termsOfServiceURL`, `brandColor`, `composerIcon`, `logo`, `logoDark`, `screenshots`.

```json
{
  "interface": {
    "displayName": "Plugin Display Name",
    "shortDescription": "Short description for subtitle",
    "longDescription": "Long description for details page",
    "developerName": "Developer Name",
    "category": "Productivity",
    "capabilities": ["Interactive", "Write"],
    "defaultPrompt": [
      "First starter prompt for the plugin.",
      "Second starter prompt for the plugin."
    ],
    "websiteURL": "https://example.com/",
    "privacyPolicyURL": "https://example.com/privacy",
    "termsOfServiceURL": "https://example.com/terms",
    "brandColor": "#3B82F6",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "logoDark": "./assets/logo-dark.png",
    "screenshots": ["./assets/screenshot1.png"]
  }
}
```

Spell the key `defaultPrompt`. The preflight validator also accepts `default_prompt`, but ingestion carries no alias for it - a manifest using `default_prompt` passes preflight and then silently loses its prompts.

Ingestion caps `defaultPrompt` at 3 entries of 128 characters each. It ignores entries past the first 3 with a warning, and drops over-length entries with a warning rather than truncating them.

Asset paths (`composerIcon`, `logo`, `logoDark`, `screenshots`) must start with `./` and reference files that exist inside the plugin directory. Ship every referenced asset with the plugin.

Give `brandColor` a `#RRGGBB` value, case-insensitive.

The preflight validator requires an absolute `https://` URL on `author.url`, `websiteURL`, `privacyPolicyURL`, and `termsOfServiceURL`. It does not enforce this on `homepage` or `repository`.

## Marketplace

A marketplace file alone installs nothing. Register a repository marketplace with `codex plugin marketplace add` before its plugins become available. Personal marketplaces at `~/.agents/plugins/marketplace.json` are discovered implicitly and need no registration.

To exclude a plugin from Codex, omit it from the marketplace file and ship no `.codex-plugin/plugin.json` for it.

### Marketplace file format

**Top-level fields**: `name` (required), `plugins` (array, required), `interface.displayName` (optional). Plugin order in `plugins[]` determines render order in the Plugin Directory.

**Required per-plugin**: `name` and `source`.

- `source` - either an object or, for local entries, a bare string path like `"./plugins/name"`
- `source.source` (object form only) - `local`, `url`, `git-subdir`, or `npm`
- `source.path` (object form only) must start with `./`, no `..` components

**Recommended per-plugin** (from upstream `$plugin-creator` conventions):

- `policy.installation`: `NOT_AVAILABLE`, `AVAILABLE` (default), `INSTALLED_BY_DEFAULT`
- `policy.authentication`: `ON_INSTALL` (default), `ON_USE`
- `category`: display category for the Plugin Directory

### Path resolution

The marketplace file lives at `<root>/.agents/plugins/marketplace.json`. Source paths resolve relative to `<root>`, two directories up from the marketplace file, so `"./plugins/adr"` resolves to `<root>/plugins/adr`. This holds for both repo marketplaces (`<repo-root>/.agents/plugins/marketplace.json`) and home marketplaces (`~/.agents/plugins/marketplace.json`).

## Plugin Components

### Skills

Skills within plugins live in `skills/<skill-name>/SKILL.md` and follow the same conventions as local skills. For skill authoring guidance, consult `skills-guide`.

Codex reads skills from the `skills/` directory of an installed plugin and from these roots:

- `.agents/skills` at the repository root - the documented cross-harness location; prefer it for project skills
- `<project>/.codex/skills` - read, but undocumented and gated on project trust
- `~/.agents/skills` - personal skills
- `$CODEX_HOME/skills` - deprecated, retained for backward compatibility

Codex skips the entire project config layer for a project that is not marked trusted: `<project>/.codex/skills`, `.codex/config.toml`, and `.codex/agents/**/*.toml` stay inert until the project is marked `trust_level = "trusted"` under `[projects."<path>"]` in the user-level `~/.codex/config.toml`.

Codex custom prompts in `~/.codex/prompts` are deprecated. Author skills instead.

### Agents

Codex plugins cannot contribute subagent definitions - the manifest has no `agents` field. If a plugin relies on custom agents, document the required TOML in the plugin README so users can create the files manually. See the [Codex subagents guide](https://learn.chatgpt.com/docs/agent-configuration/subagents.md) for the full schema.

Codex discovers role files recursively as `*.toml` under `<project>/.codex/agents/` and `~/.codex/agents/`. The project-level directory is subject to the trust gate above.

Required in each discovered file:

- `name` - non-empty
- `description` - non-blank
- `developer_instructions` - non-blank

A file missing any of these is dropped with a startup warning.

Optional in each discovered file:

- `nickname_candidates` - array of strings
- ordinary Codex config keys such as `model`, `model_reasoning_effort`, and `mcp_servers`, which override the parent session for that agent

Codex ships the built-in agents `default`, `worker`, and `explorer`. A custom agent that reuses one of those names overrides the built-in.

### Hooks

Plugin hooks live in `hooks/hooks.json` at the plugin root by default.

### Apps and MCP servers

App connector mappings in `.app.json` connect plugins to external services (GitHub, Slack, etc.). MCP server configuration in `.mcp.json` gives the plugin access to additional tools.

## Reference

- `openai/plugins` repo: canonical marketplace example with `interface` metadata - https://github.com/openai/plugins
- Official docs: https://learn.chatgpt.com/docs/plugins.md
- Build guide: https://developers.openai.com/plugins/build/plugins.md
- Subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents.md
- Skills: https://learn.chatgpt.com/docs/build-skills.md

## This Repository

Register plugins in `.agents/plugins/marketplace.json`:

```json
{
  "name": "teja-skills",
  "interface": { "displayName": "Teja Skills" },
  "plugins": [
    {
      "name": "plugin-name",
      "source": { "source": "local", "path": "./plugins/plugin-name" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Developer Tools"
    }
  ]
}
```

- Set `source.source` to `"local"` for every entry.
- Expose a local skill at `.claude/skills/<name>` to Codex with a relative symlink at `.agents/skills/<name>` pointing to `../../.claude/skills/<name>`.
- Omit the `hooks` manifest field and rely on the default `hooks/hooks.json` location.
- Multi-agent configuration for this repository lives in `plugins/cascade/README.md`.
