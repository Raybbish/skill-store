# Validation Stage 6 — CLI Preflight + System Health (BLOCKING + advisory 6b)

> Loaded on demand by `/validate`. Sixth gate. Stage 6 is blocking. Sub-stage 6b is advisory.
> Stage 6 runs the `myclaude` CLI against the staged `.publish/` directory.

## Stage 6 — CLI PREFLIGHT (blocking)

Run `myclaude validate --json` on the `.publish/` directory (if it exists from a previous /package run).
[SOURCE: myclaude CLI v0.9.0 — checks vault.yaml, files, secrets, license, frontmatter, agent-skills-spec]

**Execution logic:**
1. Check if `.publish/` directory exists in workspace/{slug}/
2. If YES: `cd workspace/{slug}/.publish && myclaude validate --json`
   - Parse JSON output → map each CLI check to our report
   - If CLI reports failures → BLOCKING (must fix before publishing)
   - CLI checks complement Engine checks: secrets re-scan, vault.yaml integrity, license validation
3. If NO .publish/: SKIP with note — "CLI preflight deferred. Run /package first to generate .publish/, then re-run /validate for full CLI checks."
4. If `myclaude` not in PATH: SKIP with warning — "myclaude CLI not installed. Install via `npm i -g @myclaude-cli/cli` for marketplace validation."

**CLI checks mapped to Engine report:**
| CLI Check | Maps To | Severity |
|-----------|---------|----------|
| vault.yaml valid | Integrity | BLOCKING |
| secret scan | Integrity | BLOCKING |
| license valid | Integrity | WARNING |
| frontmatter valid | DNA/Structural | WARNING |
| agent-skills-spec | DNA/Composability | COACHING |
| files count+size | Structural | INFO |

## Stage 6b — SYSTEM HEALTH (advisory, non-blocking)

If `myclaude` is in PATH, run `myclaude doctor --json 2>/dev/null` and check score:
- score >= 8.0: PASS — "Marketplace health: {score}/10"
- score < 8.0: WARNING — "Marketplace health: {score}/10. Run `myclaude doctor --fix` to resolve issues."
- CLI unavailable: SKIP silently

This surfaces systemic issues (auth, API reachability, lockfile integrity) that would block /publish later.
