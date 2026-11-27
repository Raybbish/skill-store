---
name: release-flow
description: Automate the full application release flow for BrewMate, including committing local changes, bumping version, waiting for GitHub Actions release build, and pushing the in-repo cask update (Casks/brewmate.rb). Trigger this skill whenever the user mentions releasing a new version, deploying the application, publishing version, or running the cask release workflow.
---

# Release Flow Skill

This skill automates the end-to-end application release cycle for BrewMate. It guides the model through running local verifications, committing changes, bumping the version, pushing tags, tracking the release workflow run on GitHub, and merging the corresponding Cask update PR in the custom Homebrew tap.

## Prerequisites

- Ensure the local workspace is clean (`git status`).
- Ensure the GitHub CLI (`gh`) is authenticated on the user system.
- Since the agent environment may contain a dummy `GITHUB_TOKEN` that overrides your keyring, prefix GitHub CLI commands with `env -u GITHUB_TOKEN` to use the active keyring credentials.

---

## Step-by-Step Instructions

### 1. Pre-Release Verification
Before making any release, ensure the codebase compiles and passes all checks.
- Run unit tests:
  ```bash
  npm test
  ```
- Run the build script to compile the TypeScript files:
  ```bash
  npm run build
  ```
If any checks fail, stop and report the errors to the user. Do not proceed with the release until the code is fully verified.

### 2. Stage and Commit Outstanding Changes
Stage all modified files and commit them using Conventional Commits.
- Stage all local changes:
  ```bash
  git add .
  ```
- Identify the staged files to ensure only the expected files are staged:
  ```bash
  git diff --cached --name-only
  ```
- Commit using Conventional Commits:
  ```bash
  git commit -m "fix: resolve stuck loading state for categories donut chart"
  ```
  *(Modify the commit type and message dynamically based on the changes you are releasing).*

### 3. Bump Version and Push Tag
Bump the package version and push the changes together with the tag to trigger the GitHub Actions release workflow.
- Bump the version (defaults to a patch release, e.g., `npm version patch`):
  ```bash
  npm version patch
  ```
  *(If the user explicitly requests a minor or major release, run `npm version minor` or `npm version major` instead).*
- Push the commit and its corresponding tag to the remote repository:
  ```bash
  git push origin main --follow-tags
  ```

### 4. Monitor GitHub Actions Release Run
Query the workflow runs to track the progress of the release build.
- List the most recent workflow runs:
  ```bash
  env -u GITHUB_TOKEN gh run list --limit 5
  ```
- Identify the run corresponding to the new version tag (e.g. `1.0.26` under the `Release` workflow).
- If the run is `queued` or `in_progress`, wait and check periodically (e.g., using a background scheduler or timer) until the status changes to `completed` and the conclusion is `success`.
- If the build fails, notify the user immediately.

### 5. Cask Updated In-Repo (No External PR Needed)
Once the GitHub Actions Release build completes successfully, the `create-release.yml` workflow automatically:
1. Updates `Casks/brewmate.rb` in this repo with the new version and SHA256.
2. Commits and pushes the change directly to `main` with `[skip ci]`.

No external PR to `romankurnovskii/homebrew-awesome-brew` is needed. The cask is now maintained **in-repo** — the release workflow pushes the updated cask directly to the BrewMate repository's `main` branch.

**To verify the cask update:**
```bash
git pull origin main
cat Casks/brewmate.rb
```

---

## Success Criteria

The release flow is complete when:
1. The new version tag is pushed.
2. The GitHub Actions release build completes successfully.
3. The `Casks/brewmate.rb` file is updated with the new version and SHA256 on the `main` branch.
