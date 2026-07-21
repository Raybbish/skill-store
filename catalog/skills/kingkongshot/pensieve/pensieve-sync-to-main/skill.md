---
name: pensieve-sync-to-main
description: Sync Pensieve's Chinese development/release branch into the English main branch. Use in the Pensieve repository when the user asks to sync zh or experimental to main, publish the English branch, translate Pensieve README/tool specs/templates/SKILL.md, or run the zh-to-main release flow. Do not use for ordinary project localization or generic i18n.
---

# Pensieve Sync to Main

Use only inside the Pensieve repository itself.

This skill syncs changes from `experimental` or `zh` into `main`, preserves contributor history, and ensures `main` remains the English release branch. This is a maintainer release flow, not a default pipeline that should be seeded into every Pensieve user project.

## Hard Rules

- `main` must remain English-only and release-grade.
- Preserve source-branch commit history; do not squash contributor history unless the user explicitly asks.
- Code logic must stay identical across language branches; only text content may differ.
- Do not translate code identifiers, paths, protocol names, command names, frontmatter keys, or Markdown link targets unless the branch rules below explicitly require it.
- When the worktree has unrelated local changes, do not run destructive git cleanup commands.

## Branch Strategy

- `experimental`: development branch
- `zh`: Chinese release branch
- `main`: English release branch

Default source branch is `zh` unless the user explicitly specifies `experimental`. Default remote is `kingkongshot`.

## Translation Scope

Chinese content in these files must be translated into English:

- `README.md`
- `SKILL.md`
- `.src/references/*.md`
- `.src/tools/*.md`
- `.src/templates/**/*.md`

These files are synced directly by default; translate only if user-visible Chinese appears on the English branch:

- Scripts and code
- JSON/YAML configuration
- Deleted files
- Binary assets

## Workflow

### 1. Confirm scope

1. Check current state:
   ```bash
   git branch --show-current
   git status --short
   git remote -v
   ```
2. Confirm source branch:
   ```bash
   git fetch kingkongshot
   git diff --stat main..kingkongshot/<source-branch>
   ```
3. Classify changed files as: needs translation, direct sync, deletion, binary/config.
4. If the worktree has unrelated local changes, report them before switching branches.

### 2. Create sync branch

1. Start from latest `main`:
   ```bash
   git checkout main
   git pull kingkongshot main
   git checkout -b sync/zh-to-main-<date>[-topic]
   ```
2. Merge the source branch to preserve history:
   ```bash
   git merge kingkongshot/<source-branch> -X theirs --no-edit
   ```
3. If the user explicitly asks to sync only a few files, use targeted checkout:
   ```bash
   git checkout kingkongshot/<source-branch> -- <file>
   ```
4. Resolve conflicts before translating.

### 3. Translate

Rules:

- Translate all Chinese prose into English.
- Preserve Markdown structure, frontmatter, code blocks, command syntax, and HTML tags.
- Preserve intentionally bilingual matching regexes, such as the Exploration Reduction compatibility check.
- Installation commands in English-branch docs must use `git clone -b main`, not `git clone -b zh`.
- English-branch language-switch links should point back to the Chinese README.
- Translate Chinese strings in scripts only when they are user-visible on the English branch.

Validation:

```bash
rg -n --pcre2 '\p{Han}' README.md SKILL.md .src docs
```

After translation, results may only include intentionally retained Chinese, such as language-switch links or bilingual regexes.

### 4. Validate, commit, and open PR

1. Run checks that exist in the current repository:
   ```bash
   git diff --check
   ```
2. Commit:
   ```bash
   git add -A
   git commit -m "translate: sync <source-branch> to main"
   ```
3. Push and create a PR:
   ```bash
   git push kingkongshot sync/zh-to-main-<date>[-topic]
   gh pr create --repo kingkongshot/Pensieve --base main --head sync/zh-to-main-<date>[-topic]
   ```
4. Unless the user explicitly delegated the full release flow, ask for confirmation before merging the PR.

## Failure Fallback

- Merge conflicts remain: stop, list conflict files, and resolve them directly. Prefer source-branch content, then translate.
- Chinese remains after translation: inspect each item, translate it, or explain why it is intentionally retained.
- Push rejected: fetch, rebase the sync branch onto latest `kingkongshot/main`, then retry.
- GitHub CLI authentication fails: report the exact authentication error; do not switch to an unknown remote.
