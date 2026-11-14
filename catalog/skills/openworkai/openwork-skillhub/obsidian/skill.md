---
name: obsidian
description: Manage and automate Obsidian vaults (plain Markdown on disk) through obsidian-cli.
description_en: "Manage and automate Obsidian vaults"
version: 1.0.0
display_name: "Obsidian 知识库"
tags:
  - obsidian
  - notes
  - markdown
  - knowledge-base
visibility: public
---

# Obsidian

An Obsidian vault is just a folder of Markdown files on disk.

## Vault anatomy
- Notes: `*.md` — plain text, editable anywhere.
- Config: `.obsidian/` — workspace and plugin settings; usually leave it alone from scripts.
- Canvases: `*.canvas` (JSON).
- Attachments: the folder you configured in Obsidian settings.

## Finding the active vault
Obsidian desktop records known vaults in `~/Library/Application Support/obsidian/obsidian.json` (macOS). `obsidian-cli` reads that file; a vault's name is normally its **folder name** (the path's last segment).

To ask "which vault is active / where are my notes?":
- If a default is already set: `obsidian-cli print-default --path-only`
- Otherwise read `obsidian.json` and pick the entry with `"open": true`.

Don't guess vault paths — read the config. Avoid hardcoding vault paths in scripts; use `print-default` or the config instead.

## obsidian-cli quick start
Set a default once:
```bash
obsidian-cli set-default "<vault-folder-name>"
obsidian-cli print-default             # path + name
obsidian-cli print-default --path-only
```

Search:
```bash
obsidian-cli search "query"             # note names
obsidian-cli search-content "query"     # inside notes (snippets + line numbers)
```

Create:
```bash
obsidian-cli create "Folder/New note" --content "..." --open
```
This needs the `obsidian://` URI handler (Obsidian installed). Avoid creating notes under hidden dot-folders via URI — Obsidian may reject them.

Move / rename (safe refactor):
```bash
obsidian-cli move "old/path/note" "new/path/note"
```
Unlike `mv`, this rewrites `[[wikilinks]]` and ordinary Markdown links across the vault.

Delete:
```bash
obsidian-cli delete "path/note"
```

When it's simpler, just open the `.md` file and edit it directly — Obsidian picks up the change.
