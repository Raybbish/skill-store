# App Doctor — Architecture Reference

## The Pattern

A doctor is a scheduled agent that runs on a recurring trigger (e.g., EventBridge, cron, CI schedule) and executes one or more **runbooks** — audit definitions scoped to a specific concern such as log scanning, data integrity, or cost anomalies. Each runbook runs through an agentic loop that calls data-plane tools (query engines, metrics APIs, source-control reads) and emits structured **findings**. After all runbooks complete, findings are deduplicated against already-open PRs and tickets; code-fixable findings are routed to an automated repair pipeline that opens pull requests, while the rest are filed as tracker tickets. A Slack (or equivalent) digest is always posted at the end of the run, even if the remediation phase fails. This audit → classify → remediate-or-file → digest cycle is stack-neutral: the module responsibilities described here are identical whether the engine is implemented as a Lambda function, a GitHub Actions workflow, a container job, or a serverless function on another cloud.

> **Provenance.** This reference is derived from the production implementation in `textnami-v2/infra/lambda/doctor`. It documents a *pattern*, not a snapshot — field names, tool names, and provider integrations will differ per project.

---

## Module Responsibilities

| Module | Responsibility | Source file |
|---|---|---|
| `index` | Entry point, mode router, and remediation orchestrator. Dispatches to `repair-ci` mode or runs the runbook suite, then coordinates dedup → PR creation → ticket filing → digest. Owns the error-isolation invariant for the remediation phase. | `index.ts` |
| `run-skill` | Agentic loop driver. Sends a runbook's prompt + tool definitions to the LLM, executes tool calls, and iterates until the model stops or `maxIterations` is reached. Returns a `SkillRunResult` with findings and token counts. | `run-skill.ts` |
| `repair-pipeline` | Code-fix pipeline. For a single code-fixable finding, fetches the file tree and relevant source snippets, generates `N` patch candidates (one greedy, rest sampled), validates each, and returns the winning patch along with a PR title and description. | `repair-pipeline.ts` |
| `repair-ci` | CI babysitter mode. Enumerates open doctor PRs, reads failing CI logs, generates targeted patches, and pushes fix commits up to `maxAttempts` per PR. | `repair-ci.ts` |
| `dedup` | Deduplication filter. Given the full findings list and the current set of open PRs and tickets, separates findings into `codeFixable` (no existing branch or PR) and `nonCodeFixable` (no existing ticket), preventing duplicates across runs. | `dedup.ts` |
| `error-classifier` | Maps raw error strings or log lines to a `category` and `severity`, normalizing heterogeneous error signals into the `Finding` schema. Used by runbooks and the repair pipeline to annotate findings consistently. | `error-classifier.ts` |
| `types` | Shared type contracts: `Finding`, `RunResult`, `SkillRunResult`, `PipelineResult`, `CiRepairResult`, `RunMode`, `Severity`, `Category`, `SuggestedFix`. No runtime logic. | `types.ts` |
| `summary` | Health roll-up. Reduces a list of `SkillRunResult` objects to a single `health` value (`healthy` / `degraded` / `unhealthy` / `unknown`) for the digest and run record. | `summary.ts` |
| `prompts/` | LLM prompt constructors for each phase: system prompt, runbook localization, repair generation, CI repair, and summarization. Kept separate so prompt text can be iterated without touching orchestration logic. | `prompts/system.ts`, `prompts/repair.ts`, `prompts/ci-repair.ts`, `prompts/summarize.ts`, `prompts/localize.ts` |
| `tools/` | Data-plane tool implementations wired into the agentic loop: query engines (Athena, CloudWatch Logs), metrics (CloudWatch Metrics, Cost Explorer), and integration clients (GitHub, Linear, Slack). Each exports a typed async function; `index.ts` builds the `ToolExecutors` map. | `tools/athena.ts`, `tools/cloudwatch-logs.ts`, `tools/cloudwatch-metrics.ts`, `tools/cost-explorer.ts`, `tools/github.ts`, `tools/linear.ts`, `tools/slack.ts` |
| `skills/` | Runbook definitions — Markdown files, one per audit concern. Each file describes the runbook's goal, the tools it should call, and the `Finding` schema it should emit. The agentic loop in `run-skill` reads these at runtime; they are the primary surface for extending the doctor's audit coverage. | `skills/scan-logs.md`, `skills/audit-sends.md`, `skills/audit-node-links.md`, `skills/audit-stuck-queued.md`, `skills/aws-cost-analysis.md` |
| `skills/index.ts` | Bundles/loads all runbook Markdown files as string constants using bare `import` statements (enabled by `skills/md.d.ts` + esbuild `--loader:.md=text`). Exports a `bundledSkills: Record<SkillName, string>` map consumed by `run-skill`. When no bundler is available, replace the imports with `readFileSync` calls (see the scaffolding section in the generator skill). | `skills/index.ts`, `skills/md.d.ts` |

### Tools module split

`tools/index.ts` exports two things: (1) the **pure-data tool definitions** (`emitFindingTool`, `doneTool`, `athenaTool`, etc.) as plain `const` objects with no SDK imports, and (2) the assembled `allToolDefinitions` array. The actual executor functions that call AWS SDKs, Octokit, etc. are implemented in the sibling tool files (`athena.ts`, `github.ts`, etc.) and imported by `tools/index.ts` only for the `ToolExecutors` map. Tests can safely import `allToolDefinitions` from `tools/index.ts` without instantiating SDK clients, as long as they do not import the executor map. Keep this split when generating the tools layer.

### Data source = "none"

When the user selects data source "none" (Q5 option 4), **do not generate the query tool file** (`tools/athena.ts` or equivalent). Remove the query tool entry from `ToolExecutors` in `tools/index.ts`. The `skills/` runbooks must be written to rely on VCS reads, metrics, or CloudWatch tools only. See also the swap-table row for "none" and the agentic-loop reference for how to reflect this in the system prompt's runtime context block.

---

## Data Flow

```
EventBridge / cron
      │
      │  { mode: "daily" | "weekly" | "repair-ci" }
      ▼
┌─────────────┐
│   index     │  ── mode router ──────────────────────────────────┐
└─────────────┘                                                    │
      │  daily / weekly                                  repair-ci │
      │                                                            ▼
      │  skillsForMode()                          ┌───────────────────────┐
      │  → ["scan-logs", "audit-sends", ...]      │     repair-ci         │
      │                                           │  list open doctor PRs │
      ▼                                           │  → for each PR:       │
┌──────────────────────────────┐                 │    fetch CI logs       │
│  for each runbook            │                 │    generate patch      │
│  ┌────────────────────────┐  │                 │    push fix commit     │
│  │  run-skill (agentic    │  │                 └───────────────────────┘
│  │  loop)                 │  │
│  │  ┌──────────────────┐  │  │
│  │  │ LLM call         │  │  │
│  │  │ tool calls:      │  │  │
│  │  │  query_athena    │  │  │
│  │  │  query_cw_logs   │  │  │
│  │  │  read_metric     │  │  │
│  │  │  query_cost      │  │  │
│  │  │  read_repo_file  │  │  │
│  │  └──────────────────┘  │  │
│  │  → Finding[]           │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
      │
      │  all findings (flat list)
      ▼
┌─────────────┐
│   dedup     │  compare against open PRs + open tickets
└─────────────┘
      │
      ├── codeFixable[]          ──────────────────────────────────┐
      │                                                            ▼
      │                                           ┌───────────────────────┐
      │                                           │  repair-pipeline      │
      │                                           │  fetch file tree      │
      │                                           │  fetch skeletons      │
      │                                           │  fetch snippets       │
      │                                           │  generate N patches   │
      │                                           │  → winning patch      │
      │                                           │  → createFixPr()      │
      │                                           └───────────────────────┘
      │
      └── nonCodeFixable[]       ──────────────────────────────────┐
                                                                   ▼
                                                  ┌───────────────────────┐
                                                  │  tracker (Linear etc) │
                                                  │  fileLinearTicket()   │
                                                  └───────────────────────┘
      │
      │  (remediation phase wrapped in try/catch — see below)
      ▼
┌─────────────┐
│  summary    │  computeHealth(skillResults) → "healthy" | "degraded" | …
└─────────────┘
      │
      ▼
┌─────────────┐
│  digest     │  postDigest() → Slack (always runs)
└─────────────┘
      │
      ▼
  RunResult
```

### The Three Modes

| Mode | Trigger cadence | Runbooks executed | Remediation |
|---|---|---|---|
| `daily` | Every 24 hours | Fast runbooks: log scanning, data audits | Yes — PRs + tickets |
| `weekly` | Every 7 days | Expensive/slow runbooks: cost analysis, deep audits | Yes — PRs + tickets |
| `repair-ci` | After doctor PRs are opened | None — CI babysitter only | Patches open doctor PRs whose CI is failing |

---

## Error-Isolation Invariant

The runbook phase (agentic loops, Bedrock calls) is the expensive operation. By the time the remediation phase begins — listing open PRs, creating fix branches, filing tickets — those tokens have already been spent and the findings are in memory.

**A failure in the remediation phase must never discard findings or suppress the digest.**

The implementation achieves this by wrapping the entire remediation block (dedup through ticket filing) in a single `try/catch`. On failure:

1. `remediationError` is recorded on the `RunResult`.
2. The error is logged for observability.
3. Execution continues unconditionally to `computeHealth` and `postDigest`.

The digest therefore always posts, even if zero PRs were created and zero tickets were filed. The Slack message surfaces the `remediationError` so the on-call team can act on findings manually while the root cause is investigated. This invariant must be preserved in any port of this pattern.

---

## Default-Stack File Tree

> **Proven-stack default.** The layout below reflects the TypeScript/Lambda implementation in `textnami-v2`. Module responsibilities are identical across stacks even when filenames, languages, or idioms differ.

```
doctor/
├── index.ts                # entry point, mode router, remediation orchestrator
├── types.ts                # shared type contracts (no runtime logic)
├── config.ts               # all tunables: budgets, model IDs, routing targets
├── clients.ts              # SDK client construction (Bedrock, GitHub, Slack, …)
├── run-skill.ts            # agentic loop driver
├── dedup.ts                # deduplication filter
├── error-classifier.ts     # error → category/severity mapping
├── repair-pipeline.ts      # multi-candidate code-fix pipeline
├── repair-ci.ts            # CI babysitter (repair-ci mode)
├── summary.ts              # health roll-up
├── prompts/
│   ├── system.ts           # base system prompt
│   ├── localize.ts         # runbook-specific context injection
│   ├── repair.ts           # patch-generation prompt
│   ├── ci-repair.ts        # CI-fix prompt
│   └── summarize.ts        # digest summarization prompt
├── tools/
│   ├── index.ts            # ToolExecutors map
│   ├── athena.ts           # query_athena
│   ├── cloudwatch-logs.ts  # query_cloudwatch_insights
│   ├── cloudwatch-metrics.ts # read_cloudwatch_metric
│   ├── cost-explorer.ts    # query_cost_explorer
│   ├── github.ts           # read_repo_file, search_repo_code, createFixPr, …
│   ├── linear.ts           # fileLinearTicket, hasOpenTicketForSignature
│   └── slack.ts            # postDigest
└── skills/
    ├── index.ts            # bundles runbook Markdown for runtime access
    ├── scan-logs.md        # runbook: error/warning log scanning
    ├── audit-sends.md      # runbook: message-send integrity audit
    ├── audit-node-links.md # runbook: graph-node link integrity audit
    ├── audit-stuck-queued.md # runbook: stuck-queue detection
    └── aws-cost-analysis.md  # runbook: AWS spend anomaly detection (weekly)
```
