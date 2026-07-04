# App Doctor — Alternative-Stack Swap Table

Each row maps one non-default option to the module(s) it affects and what to generate instead of the default.  
Rows are ordered: LLM provider → scheduler → VCS → tracker → chat → language → data source.

---

## LLM Provider

| | |
|---|---|
| **Default** | Amazon Bedrock (`@anthropic-ai/bedrock-sdk`, `AnthropicBedrock`) |
| **Alternative** | Anthropic API direct |
| **Module affected** | `clients.ts`, `run-skill.ts` |

Replace `AnthropicBedrock` with `Anthropic` from `@anthropic-ai/sdk`. In `clients.ts`, remove `awsRegion` and instead read `ANTHROPIC_API_KEY` from the environment (or from the project's secrets store). In `run-skill.ts`, the `BedrockLike` interface is already narrow enough to accept both; the concrete type annotation in `clients.ts` is the only change. For model IDs, swap Bedrock cross-region inference ARNs (e.g., `us.anthropic.claude-opus-4-5`) for plain API model strings (e.g., `claude-opus-4-5`); update `config.ts` fields `model` and `modelFallback` accordingly. The primary/fallback retry in `createMessage` is unchanged.

---

## Scheduler

| | |
|---|---|
| **Default** | AWS EventBridge Scheduler rule invoking a Lambda function |
| **Alternatives** | GitHub Actions workflow / POSIX cron (VM or container) / Kubernetes CronJob |

**GitHub Actions.** Generate a `.github/workflows/doctor.yml` with three `schedule:` triggers (daily, weekly, repair-ci) each passing `inputs.mode` to a `workflow_dispatch` + a `run` step that invokes the doctor entry point (e.g., `npx ts-node index.ts` or the compiled binary). The `mode` payload maps 1:1 to the existing `RunMode` union. Store secrets (`GITHUB_TOKEN`, `LINEAR_TOKEN`, `SLACK_TOKEN` etc.) in GitHub repository secrets rather than AWS Secrets Manager.

**POSIX cron.** Generate a `crontab` snippet (or a `systemd` timer unit) that calls a wrapper shell script with `MODE=daily` / `MODE=weekly` env vars. The doctor entry point reads `process.env.MODE` instead of the Lambda event payload.

**Kubernetes CronJob.** Generate three `CronJob` manifests, one per mode, each setting `MODE` via `env:` on the container spec and mounting credentials from a `Secret`. The `restartPolicy: Never` + `concurrencyPolicy: Forbid` guards replicate the Lambda single-execution semantics.

---

## VCS

| | |
|---|---|
| **Default** | GitHub (`@octokit/rest`) |
| **Alternative** | GitLab (`@gitbeaker/rest` or `gitlab` npm package) |
| **Module affected** | `tools/github.ts` (rename or replace) |

Generate a `tools/gitlab.ts` that provides the same six function signatures as the GitHub module: `readRepoFile`, `branchExists`, `listOpenDoctorPrs`, `createFixPr`, `getFailedCiContext`, and `commitFilesToBranch`. Map each to the GitLab REST API equivalent: repository files API for reads, branches API for existence checks, merge requests API for open-PR listing and creation (using the same `doctor-signature` footer convention), pipelines + jobs API for failing-CI context, and the commits API for multi-file pushes. The `SIGNATURE_FOOTER_RE` regex and `dedupStem`/`signatureHash` helpers are platform-neutral and can be shared unchanged.

---

## Tracker

The default Linear module exposes two exported functions consumed by `index.ts` and `dedup.ts`. All alternative tracker modules must expose the **same two function signatures**:

```typescript
// File a new ticket for a non-code-fixable finding.
// Returns the URL of the created ticket.
export async function fileTicket(input: {
  title: string;
  description: string;
  signature: string;
  severity: Severity;
  category: Category;
}): Promise<string>;

// Returns true if an open ticket already exists for this signature stem
// (prevents duplicate tickets across runs).
export async function hasOpenTicketForSignature(signature: string): Promise<boolean>;
```

Both functions embed the `signature` in the ticket body using the `<!-- doctor-signature:… -->` HTML-comment footer so the `SIGNATURE_FOOTER_RE` dedup regex works without modification across tracker implementations.

### Linear → Jira

| | |
|---|---|
| **Default** | Linear (`@linear/sdk`) |
| **Alternative** | Jira (`@atlassian/jira-client` or REST API via `node-fetch`) |
| **Module affected** | `tools/linear.ts` |

Generate a `tools/jira.ts` that exposes `fileTicket(input)` and `hasOpenTicketForSignature(signature)` with the signatures above. Use the Jira REST `POST /rest/api/3/issue` endpoint to create issues and `GET /rest/api/3/search` (JQL) to query for open issues whose description contains the signature stem. Store the signature in the issue description using the same `<!-- doctor-signature:… -->` HTML-comment footer so the dedup regex (`SIGNATURE_FOOTER_RE`) works without modification.

### Linear → GitHub Issues

| | |
|---|---|
| **Default** | Linear (`@linear/sdk`) |
| **Alternative** | GitHub Issues (Octokit, same client as VCS) |
| **Module affected** | `tools/linear.ts` |

Generate a `tools/github-issues.ts` that exposes `fileTicket(input)` and `hasOpenTicketForSignature(signature)` with the signatures above, calling `github.issues.create` for filing and `github.issues.listForRepo` (filtered by label and state=open) for dedup. Embed the signature footer in the issue body. If GitHub is also the VCS, the same `Octokit` instance from `clients.ts` covers both; no new client is needed.

---

## Chat

### Slack → Microsoft Teams

| | |
|---|---|
| **Default** | Slack (`@slack/web-api`) |
| **Alternative** | Microsoft Teams (Incoming Webhook or Graph API) |
| **Module affected** | `tools/slack.ts` |

Generate a `tools/teams.ts` that posts an Adaptive Card to a Teams webhook URL. Translate the existing Block Kit structure (header block, per-runbook section blocks, PRs/tickets/CI-repair sections, token-count context) to Adaptive Card JSON (`TextBlock`, `FactSet`, `ActionSet`). The `postDigest` function signature — `(client, run: RunResult) => Promise<void>` — stays the same; the client becomes an `AxiosInstance` or a plain `fetch` wrapper initialized with the webhook URL.

### Slack → Discord

| | |
|---|---|
| **Default** | Slack (`@slack/web-api`) |
| **Alternative** | Discord (webhook) |
| **Module affected** | `tools/slack.ts` |

Generate a `tools/discord.ts` that posts an Embed object to a Discord webhook. Map health status to embed color (green/yellow/red/grey). Translate the per-runbook bullet list and PR/ticket link sections into embed `fields`. The function signature mirrors `postDigest`.

---

## Language

| | |
|---|---|
| **Default** | TypeScript |
| **Alternative** | Python |
| **Module affected** | `repair-pipeline.ts` (validation seam), all modules (syntax) |

Generate all modules as `.py` files following the same module-responsibility table. The critical seam that changes is the patch-validation step in `repair-pipeline`: replace the TypeScript compilation check (`tsc --noEmit` on a temp file) with `ast.parse(candidate_code)` (syntax check) or `compile(candidate_code, "<string>", "exec")` (compile-time check). For `run_skill.py`, the agentic loop is structurally identical; use the `anthropic` Python SDK (`anthropic.Bedrock` for Bedrock or `anthropic.Anthropic` for direct). Type contracts in `types.ts` become `dataclasses` or `TypedDict` definitions in `types.py`. The audit→ticket path is unchanged.

---

## Data Source

### Athena → Generic SQL

| | |
|---|---|
| **Default** | AWS Athena (`tools/athena.ts`) |
| **Alternative** | Generic SQL (Postgres, MySQL, BigQuery, etc.) |
| **Module affected** | `tools/athena.ts` |

Generate a `tools/sql.ts` (or `.py`) with a `query_sql(sql, params)` tool that executes against the target database via the appropriate driver (`pg`, `mysql2`, `@google-cloud/bigquery`, etc.). Runbook Markdown files reference `query_sql` instead of `query_athena`; the tool interface and `emit_finding` contract are unchanged.

### Athena → Prometheus

| | |
|---|---|
| **Default** | AWS Athena |
| **Alternative** | Prometheus (HTTP API) |
| **Module affected** | `tools/athena.ts` |

Generate a `tools/prometheus.ts` with a `query_prometheus(promql, start, end, step)` tool that calls the Prometheus HTTP API (`/api/v1/query_range`). Runbooks that audit metrics replace `query_athena` calls with `query_prometheus` calls; all other modules are unchanged.

### Athena → None (no data-source query tool)

| | |
|---|---|
| **Default** | AWS Athena |
| **Alternative** | No query tool (runbooks rely on other tools only) |
| **Module affected** | `tools/athena.ts`, `tools/index.ts` |

**Do not generate** `tools/athena.ts` (or any query tool file). Remove the query-tool entry from the `ToolExecutors` map in `tools/index.ts` and from `allToolDefinitions`. Runbooks must be written to rely only on VCS reads (`read_repo_file`), metrics (`read_cloudwatch_metric`), and log tools (`query_cloudwatch_insights`).

In the runtime context block of the system prompt, replace the data-source line with:

```
- Data source: none — no query tool is registered; use only log, metric, and VCS tools.
```

This prevents the model from attempting to call a query tool that is not in `ToolExecutors`.

---

## Stack-Coupling Note

The audit → classify → file-ticket → digest cycle is stack-neutral: `dedup.ts`, `error-classifier.ts`, `summary.ts`, `types.ts`, and the `prompts/` constructors contain no provider-specific code and require no changes on any stack combination. The autonomous code-repair path (`repair-pipeline` and `repair-ci`) is the most stack-coupled part — it depends on VCS branch management, CI log retrieval, and language-appropriate patch validation — and should be the primary focus of any per-project adaptation.
