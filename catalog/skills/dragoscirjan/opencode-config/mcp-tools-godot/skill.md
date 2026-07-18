---
name: mcp-tools-godot
description: Godot MCP servers reference — editor, diagnostics, testing, docs, runtime. Load when doing Godot game dev.
---

# Godot MCP Servers

> **Opt-in.** All Godot MCP servers are disabled by default in `opencode.json` — enable the ones you need when Godot 4 is installed and you're doing game dev.

Five complementary MCP servers cover different aspects of the Godot development workflow. The `godot-*` TypeScript tools handle asset generation, processing, and visual QA; the MCP servers handle **editor interaction, runtime, diagnostics, docs, and testing**.

## `godot_editor` — Editor & Runtime (`@cgame-directorg-solo/godot-mcp`)

MCP bridge to the Godot editor and runtime. Handles scene management and project execution.

| Tool                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `launch_editor`         | Open a Godot project in the editor                 |
| `run_project`           | Run project in debug mode, capture output          |
| `get_debug_output`      | Retrieve debug/console output from running project |
| `stop_project`          | Stop the running project                           |
| `get_godot_version`     | Detect installed Godot version                     |
| `list_projects`         | List Godot projects in a directory                 |
| `get_project_structure` | Analyze project file/scene structure               |
| `create_scene`          | Create a new scene with a root node                |
| `add_node`              | Add a child node to an existing scene              |
| `load_sprite`           | Load a sprite/texture onto a node                  |
| `export_mesh_library`   | Export a MeshLibrary from scenes                   |
| `save_scene`            | Save a scene to `.tscn`                            |
| `get_uid`               | Get UID for a resource (Godot 4.4+)                |

**When to prefer MCP over bash:**

- `run_project` + `get_debug_output` — interactive debug runs (replaces `godot --headless --quit 2>&1` for runtime testing)
- `create_scene` + `add_node` + `save_scene` — simple scene scaffolding (replaces scene builder scripts for trivial scenes)
- `get_project_structure` — quick project overview without manual `find`/`ls`

**When to stick with bash:**

- `--write-movie` capture (MCP has no equivalent)
- `--check-only` script validation
- `--headless --import` asset import
- Any headless batch operation

## `godot_forge` — Static Analysis & Testing (`godot-forge`)

Script analysis, scene antipattern detection, test running, and docs search. **6 of 8 tools work WITHOUT Godot installed.**

| Tool                     | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `godot_run_tests`        | Run GUT or GdUnit4 test suites                  |
| `godot_analyze_script`   | 10-pitfall detector for GDScript files          |
| `godot_analyze_scene`    | Detect antipatterns in `.tscn` files            |
| `godot_search_docs`      | Search Godot docs with 3-to-4 migration mapping |
| `godot_get_project_info` | Read project metadata                           |
| `godot_get_diagnostics`  | LSP diagnostics (requires editor open)          |
| `godot_run_project`      | Run the project                                 |
| `godot_screenshot`       | Capture viewport as base64                      |

## `godot_diagnostics` — LSP & DAP (`minimal-godot-mcp`)

Bridges Godot's native Language Server Protocol and Debug Adapter Protocol. **No plugin required** — uses Godot's built-in language server.

| Tool                         | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `get_diagnostics`            | Single-file LSP check (syntax errors, type mismatches) |
| `scan_workspace_diagnostics` | Bulk workspace diagnostics scan                        |
| `get_console_output`         | DAP debug console output                               |
| `clear_console_output`       | Clear DAP console                                      |

## `godot_docs` — Online Documentation (`@nuskey8/godot-docs-mcp`)

Search docs.godotengine.org directly — tutorials, guides, and full class reference. Complements the offline `godot-api-docs` tool (XML class reference) with live online search.

| Tool                   | Purpose                              |
| ---------------------- | ------------------------------------ |
| `godot_docs_search`    | Keyword search across all Godot docs |
| `godot_docs_get_page`  | Fetch a specific documentation page  |
| `godot_docs_get_class` | Fetch a class reference page         |

## `godot_gopeak` — Full-Stack Runtime (`gopeak`)

110+ tools for scene/script/resource manipulation, runtime inspection, DAP debugging (breakpoints, stepping, stack traces), input injection, viewport screenshots, and CC0 asset library (Poly Haven, AmbientCG, Kenney). **Requires Godot editor plugin + runtime addon for many tools.**

| Category     | Capabilities                                                               |
| ------------ | -------------------------------------------------------------------------- |
| Scene/Script | Scene tree queries, script management, resource handling                   |
| Runtime      | ClassDB queries, runtime node inspection, property manipulation            |
| Debugger     | DAP integration — breakpoints, stepping, stack traces, variable inspection |
| Input        | Input event injection for automated testing                                |
| Assets       | CC0 asset library browsing (Poly Haven, AmbientCG, Kenney)                 |
| Visual       | Viewport screenshots, scene visualizer                                     |

> **Note:** GoPeak is the most powerful but also the most complex. Enable it only when you need interactive debugging or CC0 asset browsing. For most headless pipeline work, the other four servers suffice.
