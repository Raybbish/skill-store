---
name: reviewer-framework
description: >-
  This skill should be loaded when running or orchestrating a review. Defines
  confidence scoring, severity levels, finding output format, and the
  deduplication and coalescing rules orchestrators apply.
user-invocable: false
---

# Reviewer Framework

## For Reviewers

### Confidence Scoring

Rate each finding on a 0-100 scale:

| Range | Meaning | Example |
|-------|---------|---------|
| 90-100 | Certain - verifiable fact or clear spec violation | Missing required field, broken file reference |
| 70-89 | High confidence - strong evidence, minor ambiguity | Likely bug based on control flow analysis |
| 50-69 | Moderate - reasonable concern, context-dependent | Naming inconsistency that may be intentional |
| 30-49 | Speculative - possible issue, needs human judgment | Potential performance concern |
| 0-29 | Low - stylistic preference or uncertain observation | Alternative approach suggestion |

**Reporting threshold**: return all findings with their scores - do not filter. The orchestrator applies the threshold.

### Severity Levels

- **Critical** - Must fix. Causes failures, data loss, security vulnerabilities, or spec violations that prevent correct operation.
- **High** - Should fix. Degrades quality, safety, portability, or maintainability significantly.
- **Medium** - Consider fixing. Meaningful improvement with moderate effort. The code works but could be better.
- **Low** - Minor. Style suggestions, best-practice nudges, or small readability improvements.

### Output Format

Structure each finding as:

```
[SEVERITY] Category: Brief description (confidence: N)
  File: <path>:<line>
  Details: What's wrong and why it matters
  Suggestion: Specific fix or improvement
  Found by: <review-type>
```

Include the `Found by` line whenever your task assigns one or more review skills, even a single one.

Group findings by severity (critical first, then high, medium, low).

After all findings, include a summary line:

```
Total: N findings (X critical, Y high, Z medium, W low)
```

**Terse output contract**: your final message is the report itself, not a description of it. Begin directly with the findings or verdict - no preamble, no process narration ("I reviewed...", "Let me check..."), no closing summary beyond the totals line above. Every line must be a verdict, a finding with file:line, or a check performed.

### Review Methodology

When reviewing code or content:

1. **Understand scope** - read the target files and understand their purpose before flagging issues
2. **Check against loaded rules** - apply the specific review rules (from defaults and/or local extensions)
3. **Verify claims** - search the codebase to confirm issues rather than guessing
4. **Score conservatively** - when uncertain, lower the confidence score rather than omitting the finding
5. **Be specific** - every finding must reference a file and line number, describe the issue concretely, and suggest a fix
6. **Avoid false positives** - do not flag intentional patterns as issues; if unsure, lower confidence

### Running Multiple Review Types

When your task assigns more than one review skill, build context once. Invoke each assigned skill in sequence, in the order listed, over that shared context - do not re-read files or re-derive context between skills. Label every finding with `Found by: <review-type>`. Report one combined list of findings with a single totals line covering all assigned review types.

## For Orchestrators

### Deduplication

When multiple review types flag the same issue:

- Keep the finding with the highest confidence score
- If confidence is equal, keep the one with the most specific suggestion
- Merge context from duplicates into the kept finding's details
- Accumulate every originating review type in the kept finding's `Found by` field

### Coalescing Rules

The orchestrator combines findings from parallel review tasks:

1. Collect all findings from all review tasks (a task may return findings for several review types)
2. Deduplicate (see above)
3. Filter by confidence threshold (default >= 80; an orchestrator or its extension may adjust it)
4. Sort by severity (critical > high > medium > low), then by confidence (descending)
5. If the orchestrator defines a verification step (as `self-review` does), verify the surviving findings before presenting; otherwise present directly
6. Present the unified report
