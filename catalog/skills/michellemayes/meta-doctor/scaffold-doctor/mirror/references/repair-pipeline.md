# Code-Repair Pipeline Reference

This document is the contract Claude uses when generating the doctor's `repair-pipeline` and `repair-ci` modules. The audit-to-ticket path handled by runbooks is language-agnostic and does not belong here. Only the code-repair path described below is language-coupled.

---

## Overview

The repair pipeline takes a single finding from a runbook and attempts to produce a validated patch. It is a five-phase sequence where each phase is one model call. The CI auto-repair loop (`repair-ci`) wraps a variant of phases 4–5 and adds persistence to bound how many times it will retry a failing PR.

---

## The Five Phases

### Phase 1 — Localize Files

**Input:** the full repository file tree + the finding JSON.  
**Prompt shape:** provide the tree and finding; ask the model to return a JSON array of file paths that are likely to contain the bug.  
**Output type:** `string[]`  
**On empty:** abort with reason `"localize-files returned none"`.

### Phase 2 — Localize Functions via Skeletons

**Input:** the file paths from Phase 1 + the finding JSON.  
**Prompt shape:** fetch a skeleton for each file (function/class signatures, no bodies), then ask the model to return a JSON array of `{ file, symbol, startLine, endLine }` objects identifying the relevant functions.  
**Output type:** `{ file: string; symbol: string; startLine: number; endLine: number }[]`  
**On empty:** abort with reason `"localize-functions returned none"`.

**What is a skeleton?** A skeleton is a list of function/class/variable declaration signatures extracted from a source file — the declaration line and its line number, with the body omitted. For TypeScript/JavaScript, extract lines matching the pattern `^(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+\w` and prefix each with `L<lineNumber>: `. The skeleton is presented to the model as a compact map of the file's structure so it can identify which symbol is relevant to the finding without reading the full source.

### Phase 3 — Localize Lines via Snippets

**Input:** the function ranges from Phase 2 + the finding JSON.  
**Prompt shape:** fetch the actual line ranges (snippets) for each function, then ask the model to return a JSON array of `{ file, startLine, endLine, reason }` objects pointing at the exact edit sites.  
**Output type:** `{ file: string; startLine: number; endLine: number; reason: string }[]`  
**On empty:** abort with reason `"localize-lines returned none"`.

### Phase 4 — Repair (Parallel Candidate Generation)

**Input:** the first edit location's file path + its full source + the finding JSON + the edit-locations JSON.  
**Candidate count:** configurable (`patchCandidates`, default 3). Each candidate is a **separate, independent model call** — do not use a single call with `n` or streaming variants. The first call uses temperature 0 (greedy/deterministic); the remaining N−1 calls use a sampled temperature (e.g. 0.7). **All N calls run in parallel** (e.g. `Promise.all`) so the pipeline completes in one round-trip latency rather than N serial calls.

For each candidate:
1. Call the model. Extract the raw text response.
2. Parse SEARCH/REPLACE blocks from the response.
3. Apply the blocks to the file source.
4. Run syntax validation on the patched source.
5. Return `{ content: string; valid: boolean }`.

Any exception at any step marks the candidate `valid: false` with empty content.

**Winner selection:** call `selectWinner` on all candidates. If no winner, abort with reason `"no winning candidate"`.

### Phase 5 — Summarize

**Input:** the winning patch diff + the finding JSON.  
**Prompt shape:** ask the model to return `{ title: string; description: string }` for the PR.  
**Fallback:** if the model returns nothing, use `fix(infra): doctor patch for <finding.signature>` as the title and `finding.description` as the body.

---

## SEARCH/REPLACE Block Format

The model's repair response must use this exact block syntax. One or more blocks may appear in a single response; they are applied sequentially.

```
<<<<<<< SEARCH
<exact text to find in the file>
=======
<replacement text>
>>>>>>> REPLACE
```

**Apply rule:** each SEARCH string must match **exactly once** in the current file content. Zero matches or more than one match is a hard error — discard the candidate.

Reference snippet — port to your stack:

```typescript
export function applySearchReplaceBlocks(source: string, blocks: SearchReplaceBlock[]): string {
  let current = source;
  for (const b of blocks) {
    const matches = current.split(b.search).length - 1;
    if (matches === 0) throw new Error(`SEARCH block did not match:\n${b.search}`);
    if (matches > 1) throw new Error(`SEARCH block matched ${matches} times:\n${b.search}`);
    current = current.replace(b.search, b.replace);
  }
  return current;
}

export function parseSearchReplaceBlocks(raw: string): SearchReplaceBlock[] {
  const re = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
  const out: SearchReplaceBlock[] = [];
  for (const m of raw.matchAll(re)) {
    if (m[1] !== undefined && m[2] !== undefined) out.push({ search: m[1], replace: m[2] });
  }
  return out;
}
```

The multi-file variant used by `repair-ci` adds a file-section header before each block group:

```
## File: path/to/file.ts
<<<<<<< SEARCH
...
=======
...
>>>>>>> REPLACE
```

Parse the `## File:` headers to route each block group to the correct source file before applying.

---

## Self-Consistency Winner Selection

This is the most important part of the pipeline. Generating N candidates and picking the majority winner substantially reduces the false-positive rate compared to accepting the first valid patch.

### The Algorithm

1. Filter to valid candidates only (those that passed syntax validation).
2. **If fewer than 2 valid candidates exist, return null** — no winner.
3. Normalize each candidate's content (strip comments, collapse whitespace) to produce a comparison key.
4. Group candidates by their normalized key. Track the group size and the index of the earliest member.
5. Sort groups: largest count first, earliest index as tie-breaker.
6. The winning group must have **count ≥ 2**. If the top group has only one member, return null.
7. Return the content of the earliest member in the winning group (to preserve original formatting).

The threshold in `repair-ci`'s multi-file variant is slightly different: it requires `count ≥ floor(N/2) + 1` where N is the requested candidate count, except when N ≤ 1 the threshold is 1. This means a strict majority for larger candidate pools.

### Reference Snippets — Port to Your Stack

**Single-file winner selection** (`repair-pipeline`):

```typescript
export function selectWinner(candidates: Candidate[], fileName = "tmp.ts"): Candidate | null {
  const valid = candidates.filter((c) => c.valid);
  if (valid.length < 2) return null;
  const groups = new Map<string, { count: number; earliest: number; content: string }>();
  valid.forEach((c, i) => {
    const k = normalizeSource(c.content, fileName);
    const g = groups.get(k);
    if (g) {
      g.count++;
    } else {
      groups.set(k, { count: 1, earliest: i, content: c.content });
    }
  });
  const sorted = [...groups.values()].sort((a, b) => b.count - a.count || a.earliest - b.earliest);
  const winner = sorted[0];
  if (!winner || winner.count < 2) return null;
  return { content: winner.content, valid: true };
}
```

**Multi-file winner selection with majority threshold** (`repair-ci`):

```typescript
function selectWinningOutcome(
  outcomes: CandidateOutcome[],
  requestedCandidates: number,
): CandidateOutcome | null {
  const threshold = requestedCandidates <= 1 ? 1 : Math.floor(requestedCandidates / 2) + 1;
  const groups = new Map<string, { count: number; earliest: number; outcome: CandidateOutcome }>();
  outcomes.forEach((outcome, index) => {
    const key = outcomeKey(outcome);
    const group = groups.get(key);
    if (group) {
      group.count++;
    } else {
      groups.set(key, { count: 1, earliest: index, outcome });
    }
  });
  const winner = [...groups.values()].sort(
    (a, b) => b.count - a.count || a.earliest - b.earliest,
  )[0];
  if (!winner || winner.count < threshold) return null;
  return winner.outcome;
}
```

**`normalizeSource` for TypeScript** uses the TypeScript compiler's own printer with `removeComments: true`, then collapses whitespace:

```typescript
export function normalizeSource(source: string, fileName = "tmp.ts"): string {
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.ES2022,
    false,
    fileName.endsWith(".js") ? ts.ScriptKind.JS : ts.ScriptKind.TS,
  );
  const printer = ts.createPrinter({ removeComments: true, omitTrailingSemicolon: false });
  return printer.printFile(sf).replace(/\s+/g, " ").trim();
}
```

**Language-agnostic fallback** (no AST printer available — e.g. config files, YAML, or languages without a readily importable printer): strip `#`- and `//`-prefixed comment lines, then collapse all whitespace runs to a single space:

```typescript
function normalizeSourceFallback(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|#)/.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
```

Use the AST-printer form when the language has one (see the Syntax Validation Seam section). Use the fallback for plain-text files or any stack where importing a parser/printer is impractical.

---

## Syntax Validation Seam

This is the only language-coupled part of the pipeline. Everything else is language-agnostic.

**TypeScript implementation** uses `ts.transpileModule` with `reportDiagnostics: true`. A candidate is valid if no diagnostic has category `Error`.

```typescript
export function validateSourceSyntax(source: string, fileName: string): boolean {
  const result = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
      noEmit: true,
    },
    fileName,
  });
  return (result.diagnostics ?? []).every((d) => d.category !== ts.DiagnosticCategory.Error);
}
```

**When generating a doctor for a different language, replace this function:**

| Language | Validation approach |
|---|---|
| Python | `compile(source, filename, "exec")` or `ast.parse(source)` — catch `SyntaxError` |
| Go | `go/parser.ParseFile` with `parser.AllErrors` mode |
| Rust | invoke `rustfmt --check` or `rustc --edition 2021 --crate-type lib -` via subprocess |
| Ruby | `ruby -c` via subprocess |
| Plain JS | Any JS parser (`acorn`, `@babel/parser`) |

The normalization function (`normalizeSource`) used for winner-selection keying must also be replaced with the language's AST printer. If no AST printer is available, the whitespace-collapse fallback described above is acceptable.

---

## CI Auto-Repair Loop (`repair-ci`)

The CI repair module runs on a schedule (or webhook trigger) and iterates over open doctor PRs that have a failing CI job.

### Loop Steps

1. **Read persisted attempt counter.** Fetch the current attempt count for this PR from durable storage (e.g. a PR comment with a structured marker, a database record, or a file on the branch). If `attempts >= maxAttempts`, return `outcome: "max-attempts"` immediately without calling the model.

2. **Fetch failing CI context.** Query the CI provider for the most recent failed job on the PR's head commit. Collect: the job name, a tail of the log (configurable line count), the list of files changed in the PR, and the current head SHA. If no failure is found, return `outcome: "no-failure"`.

3. **Fetch file sources.** Read the current content of each changed file from the PR branch.

4. **Generate candidates.** Build a prompt from the failing job name, the log tail, and the file sources. Run 1 greedy call (temperature 0) + N−1 sampled calls (e.g. temperature 0.7) in parallel.

5. **Validate and select winner.** For each candidate, parse multi-file SEARCH/REPLACE blocks, apply them, and validate syntax for each changed file. Only candidates where all files are valid are eligible. Run `selectWinningOutcome` with the majority threshold. If no winner, increment the attempt counter and return `outcome: "no-candidates"`.

6. **Commit.** Push the winning patch to the PR branch as a new commit, using the expected head SHA to guard against concurrent writes. If the commit fails (e.g. SHA mismatch), return `outcome: "patch-failed"`.

7. **Increment and persist the attempt counter.** This must happen regardless of whether a winner was found (step 5) or the commit succeeded (step 6). The counter must survive process restarts — it cannot be in-memory only.

### Attempt Counter Persistence

The counter is the primary guard against infinite retry loops. It must be stored durably (PR comment with a structured tag, a database row keyed to `(repo, prNumber)`, or similar). The counter is checked at the top of every run before any model calls are made, so even if the agent crashes mid-run and is restarted, the cap still holds.

### Outcomes

| Outcome | Meaning |
|---|---|
| `max-attempts` | Attempt cap reached; no action taken |
| `no-failure` | No failing CI job found on the PR |
| `no-candidates` | Model produced no valid majority winner; counter incremented |
| `patch-failed` | Winner found but commit was rejected (e.g. SHA conflict) |
| `patched` | Commit pushed successfully; includes `commitSha` |

---

## Scope Note

The audit-to-ticket path — where a runbook produces a finding that cannot be auto-repaired — is entirely language-agnostic and is not covered by this document. Only the code-repair path (`repair-pipeline` and `repair-ci`) is language-coupled, and only at the syntax-validation seam described above.
