---
name: git-workflows
description: "Comprehensive guide to Git and GitHub workflows: semantic versioning, towncrier changelog generation, branch strategies, conventional commits, GitHub Actions patterns, and release workflows. USE FOR: semantic versioning reference, towncrier setup and usage, Git Flow vs trunk-based, conventional commits format, GitHub Actions CI/CD patterns, release checklists, git command reference. DO NOT USE FOR: git internals/plumbing (use git docs), platform-specific git installation, general software architecture."
license: MIT
compatibility: opencode
metadata:
  topic: git-workflows
  schema-version: 2026-05
---

# Git Workflows Reference

Canonical reference for the `git-expert` subagent. Covers semantic versioning, towncrier changelog generation, branch strategies, commit conventions, GitHub Actions patterns, and release workflows.

## 1. Semantic Versioning (SemVer)

**Format**: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`

**Rules**:
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible new features
- **PATCH**: Backwards-compatible bug fixes
- **PRERELEASE**: Unstable versions (alpha, beta, rc) — example: `2.0.0-rc.1`
- **BUILD**: Metadata only; does not affect precedence — example: `1.0.0+build.123`

**Python examples**:
```python
# Using packaging library
from packaging import version

v1 = version.parse("2.1.0")
v2 = version.parse("2.1.1")
assert v1 < v2  # True

# Using setuptools_scm for automatic versioning
# pyproject.toml
[tool.setuptools_scm]
write_to = "src/myproject/_version.py"
version_scheme = "release-branch-semver"
```

**Release decision tree**:
- Breaking change → MAJOR
- New feature (backwards-compatible) → MINOR
- Bug fix only → PATCH
- Prerelease (alpha/beta/rc) → Append to version

---

## 2. Towncrier Changelog Generation

**Purpose**: Automate changelog generation from fragment files (one per PR/issue)

**Fragment format**: `<issue-number>.<type>.rst`

**Types** (customizable; common defaults):
- `feature`: New functionality
- `bugfix`: Bug fix
- `doc`: Documentation improvement
- `removal`: Removal of deprecated feature
- `misc`: Miscellaneous (no user-facing change)

**Fragment content** (reStructuredText):
```rst
Fixed handling of special characters in file paths (@username)
```

**Directory structure**:
```
myproject/
├── pyproject.toml
├── CHANGELOG.md (or CHANGELOG.rst)
└── changelog.d/
    ├── 123.feature.rst
    ├── 124.bugfix.rst
    └── 125.doc.rst
```

**Configuration** (`pyproject.toml`):
```toml
[tool.towncrier]
directory = "changelog.d"
filename = "CHANGELOG.md"
template = "changelog.d/.changelog.jinja2"  # optional custom template
title_format = "## {version} ({project_date})"
issue_format = "[#{issue}](https://github.com/org/repo/issues/{issue})"

[[tool.towncrier.type]]
directory = "feature"
name = "Features"
showcontent = true

[[tool.towncrier.type]]
directory = "bugfix"
name = "Bug Fixes"
showcontent = true

[[tool.towncrier.type]]
directory = "removal"
name = "Removals"
showcontent = true
```

**Workflow** (typically in CI/release script):
```bash
# 1. Install towncrier
pip install towncrier

# 2. Create fragment for PR
towncrier create 123.feature.rst --content "Added new API endpoint"

# 3. Consolidate fragments into CHANGELOG (before release)
towncrier build --version 2.1.0

# 4. Commit result and remove fragments
git add CHANGELOG.md changelog.d/
git rm changelog.d/*.rst
git commit -m "Release 2.1.0"
```

**Common towncrier commands**:
```bash
towncrier build --version X.Y.Z          # Build changelog, remove fragments
towncrier build --draft                  # Preview without modifying files
towncrier create ISSUE_NUMBER.TYPE.rst   # Create new fragment
towncrier build --name "MyProject"       # Override project name
```

---

## 3. Branch Strategies

### Trunk-Based Development
- **Main branch**: `main` (always releasable)
- **Feature branches**: Short-lived (1-3 days), branch from `main`, merge back via PR
- **Release branches**: Optional; created from `main` near release, patched separately
- **Hotfix**: Branch from `main` or release branch, merge to both `main` and release

**Pros**: Simple, fast feedback, fewer merge conflicts
**Cons**: Requires strong CI/test discipline

### Git Flow
- **Main branch**: `main` (releases only)
- **Development branch**: `develop` (integration branch)
- **Feature branches**: Branch from `develop`, merge back via PR
- **Release branches**: `release/X.Y.Z` for release prep (bugfixes only)
- **Hotfix branches**: `hotfix/X.Y.Z` from `main`, merged to both `main` and `develop`

**Pros**: Clear separation; explicit release prep phase
**Cons**: Complexity; more branches to manage; slower feedback

### GitHub Flow (Simple)
- **Main branch**: `main` (production)
- **Feature branches**: `feature/name` or `fix/name`
- **Merge via PR**: Code review, tests, then merge
- **Deploy from main**: CD pipeline auto-deploys

**Pros**: Simple, suitable for web apps with CD
**Cons**: No staging phase; all merges go to production

---

## 4. Conventional Commits

**Format**: `<type>(<scope>): <subject>`

**Types** (standardized):
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring (no feature/fix)
- `perf`: Performance improvement
- `test`: Test changes
- `chore`: Build, CI, dependency updates

**Examples**:
```
feat(auth): add JWT token refresh endpoint
fix(api): handle null response in parser
docs: update installation instructions
perf(database): optimize query with index
```

**Optional body and footer**:
```
feat(payment): support cryptocurrency transfers

Add support for Bitcoin and Ethereum payments.
Integrates with Coinbase API.

Closes #456
Breaking-change: Old REST endpoints deprecated
```

**Benefits**:
- Automatic changelog generation (via tooling)
- Semantic versioning decisions (feat → MINOR, fix → PATCH)
- Better commit history readability

---

## 5. GitHub Actions Patterns

### Basic CI Workflow
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -e ".[dev]"
      - run: pytest
      - run: black --check .
      - run: ruff check .
```

### Release Workflow (Tag-Triggered)
```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install build
      - run: python -m build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
      - run: pip install twine
      - run: twine upload dist/ --skip-existing
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}
```

### Pull Request Checks
```yaml
name: PR Checks

on: pull_request

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install ruff black mypy
      - run: ruff check .
      - run: black --check .
      - run: mypy src/
```

---

## 6. Release Workflow Checklist

### Before Release
- [ ] All PRs merged to `main`
- [ ] CI passes (tests, lints, type checks)
- [ ] Dependency security scan passes
- [ ] Release notes ready (or towncrier fragments present)
- [ ] Version number decided (SemVer bump)
- [ ] CHANGELOG updated (towncrier consolidation or manual)

### During Release
- [ ] Update version in `pyproject.toml` (or equivalent)
- [ ] Run towncrier to consolidate fragments
- [ ] Commit: `git commit -m "Release X.Y.Z"`
- [ ] Tag: `git tag -a vX.Y.Z -m "Release X.Y.Z"`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] CI/CD pipeline auto-publishes (or manual publish)

### After Release
- [ ] Verify package published (PyPI, npm, etc.)
- [ ] Verify release notes visible on GitHub
- [ ] Bump version to next dev version (optional; e.g., `X.Y.Z+dev`)
- [ ] Create GitHub release from tag (if not automated)
- [ ] Announce release (changelog, email, etc.)

---

## 7. Git Commands Reference

### Inspection
```bash
git log --oneline --graph --all           # Visual history
git log -p -- <file>                      # Changes to specific file
git diff <branch1> <branch2>              # Compare branches
git status                                # Current state
git branch -a                             # List all branches
git tag -l                                # List all tags
git remote -v                             # List remotes
```

### Local Changes
```bash
git add <file>                            # Stage file
git add -A                                # Stage all changes
git commit -m "message"                   # Commit staged changes
git restore <file>                        # Discard changes (before staging)
git reset <file>                          # Unstage file
git stash                                 # Temporary save
git stash pop                             # Restore stashed changes
```

### Branching
```bash
git branch <name>                         # Create branch
git checkout <branch>                     # Switch branch
git checkout -b <branch>                  # Create and switch
git branch -d <branch>                    # Delete (safe)
git branch -D <branch>                    # Force delete
git merge <branch>                        # Merge into current
git rebase <branch>                       # Rebase current onto branch
```

### Remote Operations
```bash
git fetch                                 # Fetch without merge
git pull                                  # Fetch + merge
git push origin <branch>                  # Push branch
git push origin <branch> --force          # Force push (dangerous!)
git push origin :<branch>                 # Delete remote branch
git push --tags                           # Push all tags
```

### Tagging
```bash
git tag <name>                            # Create lightweight tag
git tag -a <name> -m "message"            # Annotated tag (preferred)
git push origin <tag>                     # Push single tag
git push origin --tags                    # Push all tags
git tag -d <name>                         # Delete local tag
git push origin :<tag>                    # Delete remote tag
```

---

## 8. GitHub CLI (gh) Commands

### Common Operations
```bash
gh repo view                              # Show repo info
gh repo view --web                        # Open repo in browser
gh issue list                             # List issues
gh issue create                           # Create issue
gh pr list                                # List pull requests
gh pr create --title "..." --body "..."   # Create PR
gh pr view <number>                       # View PR
gh pr status                              # Current PR status
gh release list                           # List releases
gh release create v1.0.0 --notes "..."    # Create release
```

---

## 9. Common Git Troubleshooting

### Undo Commits
```bash
git revert <commit>                       # Create undo commit (safe)
git reset --soft HEAD~1                   # Undo last commit, keep changes staged
git reset --mixed HEAD~1                  # Undo last commit, keep changes unstaged
git reset --hard HEAD~1                   # Undo last commit, discard changes
```

### Stale Branches
```bash
git fetch -p                              # Prune deleted remote branches
git branch -vv                            # Show branch tracking status
git branch --merged                       # List merged branches
git branch -d $(git branch --merged)      # Delete all merged branches
```

### Merge Conflicts
```bash
git status                                # Show conflict markers
git diff                                  # Show differences
# Edit files to resolve
git add <resolved-file>
git commit -m "Resolve merge conflict"
```

---

## 10. Git Hooks for Automation

**Location**: `.git/hooks/` (or `.githooks/` with `git config core.hooksPath`)

**Common hooks**:
- `pre-commit`: Run tests/lints before commit
- `commit-msg`: Validate commit message format
- `post-checkout`: Update dependencies after branch switch

**Example `pre-commit`**:
```bash
#!/bin/bash
# Run lints before commit
black --check . || exit 1
ruff check . || exit 1
```

---

## 11. Monorepo Patterns (if applicable)

**Structure**:
```
monorepo/
├── packages/
│   ├── package-a/
│   │   ├── pyproject.toml
│   │   └── src/
│   └── package-b/
│       ├── pyproject.toml
│       └── src/
├── .github/
│   └── workflows/
│       └── ci.yml
└── pyproject.toml (root)
```

**Considerations**:
- Each package has its own version (or shared version)
- CI runs tests for affected packages only (using path filters)
- Releases may be per-package or coordinated
- Use tools like `changesets` or `lerna` for version management

---

## 12. References

- Semantic Versioning: https://semver.org/
- Conventional Commits: https://www.conventionalcommits.org/
- Towncrier: https://towncrier.readthedocs.io/
- Git Flow: https://nvie.com/posts/a-successful-git-branching-model/
- GitHub Flow: https://guides.github.com/introduction/flow/
- GitHub Actions: https://docs.github.com/en/actions
- Git Documentation: https://git-scm.com/doc
