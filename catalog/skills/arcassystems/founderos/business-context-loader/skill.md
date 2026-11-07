---
name: business-context-loader
description: >
  Load and progressively fill the business-context file for a company you run (operator companies only). Say "load context for <company>", "what's next on <company>", "what's stale on <company>", or "give me an action on <company>". Reads `companies/<slug>-business.md` (derived from `templates/business-context.template.md`). Adapts to whatever state the file is in (empty, partial, mostly-filled, stale) and routes the founder to the next highest-impact move. Mirrors the brand-interview / voice-interview pattern but for company context, not personal voice. For prospect companies (companies you sell to or watch), use `prospect-init` instead - the path convention is `companies/prospects/<slug>.md`.
why: "Fills in the ICP, offer, and pricing context that proposal-writer and strategic-analysis need - without it those skills produce generic output not tied to your actual business."
enhance: "Walk sections 1-7 in order at least once per business; ICP and offer (sections 4 and 5) have the highest downstream impact on any output skill that reads this file."
summary: "Load the founder's business context (ICP, offer, pricing) into the session."
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
mcp_requirements: []
---

# Business Context Loader

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

Scans state, reports gaps, picks the next question, and suggests an action based on what's already filled.

The companion file is `templates/business-context.template.md` (the schema). Filled instances live at `companies/<slug>-business.md`.

## When this skill fires

- User opens a `companies/<slug>-business.md` file
- User says "what's next for <company>", "what's missing on <company>", "what's stale on <company>"
- User starts work on a company workstream and the loader needs to confirm context is fresh enough
- User runs the skill explicitly: `business-context-loader companies/<slug>-business.md`

## What it does (run order)

### Step 1 - Scan

Read the target file. Count markers:

- `[FILL]` (blocking, not yet answered)
- `[PENDING]` (deferred)
- `[SKIPPED]` (not applicable)
- `[STALE]` (older than refresh cadence)

Walk every section header and check the `Last refreshed:` line. Compare against today's date.

**Staleness thresholds:**
- Sections 1-10: stale if `Last refreshed` is more than 365 days old
- Sections 11-12: stale if `Last refreshed` is more than 90 days old
- Any section with `[FILL]` in the date itself: counts as never-refreshed (treat as worse than stale)

### Step 2 - Report

One block, max 12 lines. Use this format:

```
business-context-loader: <slug>

State: <X / 12 sections filled. Y must-fill blocking. Z stale.>

Filled (must-fill 1-7): <list section numbers>
Pending / Fill (must-fill 1-7): <list section numbers + 1-word topic each>
Mature stage (8-10): <state per section>
Quarterly refresh (11-12): <state + age in days>

Gap profile:
- Highest-impact next question: <pick one, see Step 3 priority rules>
- Next action you can take based on what IS filled: <pick one, see Step 4 routing>
```

Do not pad. Do not narrate. The user reads this in 10 seconds or it's failed.

### Step 3 - Pick the next question

Apply this priority order to find the highest-impact gap:

1. **Section 1 (Identity & Stage)** - if anything `[FILL]` here, this is first. Nothing else makes sense without it.
2. **Section 4 (ICP)** - if Section 1 is filled but ICP is `[FILL]`, ICP is next. Without ICP, sections 5-7 cannot be evaluated for sense.
3. **Section 2 (Problem & Thesis)** - once ICP is filled, problem/thesis must align with what the ICP says they need.
4. **Section 5 (Offer & Delivery)** - ICP + problem must exist before offer is meaningful.
5. **Section 3 (Value Model)** - runs alongside Section 5.
6. **Section 6 (Pricing)** - needs offer + value model first.
7. **Section 7 (Market Position)** - last of the must-fill seven; competitive context is sharpest once the rest is clear.
8. **Section 8-10** - mature stage; only flag if business is past month-3.
9. **Sections 11-12** - quarterly refresh; flag if stale.

If multiple sections at the same priority level are blocking, pick the one with the most `[FILL]` markers.

Ask the next question in the user's words, not template language. Example: don't say "fill in section 4 ICP firmographic axis" - say "we don't have a clear ICP yet for <company>. Who do you think actually buys this - what size, what sector, what geography?"

### Step 4 - Suggest an action based on what IS filled

Cross-reference filled sections against the rest of the OS to surface a concrete next move. Use these routing rules:

| If filled | Cross-reference | Suggest |
|---|---|---|
| Section 4 (ICP) | warm-list / CRM context | "ICP is X. Your warm list has N matching prospects. Want to draft outreach to [name]?" |
| Section 5 (Offer) | live proposal docs | "Offer is defined. Your live proposal at <path> doesn't reference [tier]. Update?" |
| Section 12 (Automation map) | automation platform | "Manual workflow `<process>` is flagged for automation. No workflow exists for it. Want to scope it?" |
| Section 6 (Pricing) | unit-economics skill | "Pricing model is defined. Run unit-economics to model engagement P&L for typical mid-tier?" |
| Section 11 (What's broken) | flags / open issues | "What's broken includes <X>. No open flag for it. Want to file one?" |
| Sections 8-10 marked `[PENDING]` | business stage | "Business is past month-3 (per Section 1). Sections 8-10 should not stay PENDING. Block out 30 min to fill them?" |

If nothing routes cleanly, suggest the simplest follow-up: "Want to walk Section <N> now? Takes ~5 minutes."

### Step 5 - Refresh stamping

Every time the user fills or updates a section through this skill, update the `Last refreshed:` line for that section to today's date. Append a one-line entry to the **Refresh log** at the bottom of the file.

Never silently update a section without changing its date.

## Branches

### Branch A - File doesn't exist yet

If the user mentions a company that has no `companies/<slug>-business.md`:

> "There's no business-context file for <slug> yet. I can copy the template to `companies/<slug>-business.md` and we walk it together (~30 min for the must-fill seven). Or you can have <person> rant the answers into their own AI assistant using the questionnaire format - see `companies/<slug>-questionnaire.md` if it exists, otherwise I can generate one. Which?"

### Branch B - File exists but mostly empty (less than 3 sections filled)

Treat as a fresh interview. Walk Sections 1-7 in order, one question at a time. Use the brand-interview / voice-interview pattern: rambly answers are fine, extract intent, never ask the user to be more concise.

### Branch C - File partially filled (3-9 sections filled)

Run the standard scan-report-pick-suggest flow above. Default to Step 3 (next question) unless the user asks for an action - then default to Step 4.

### Branch D - File mostly filled (10+ sections filled, no STALE)

Don't ask for fills. Instead:
- Run staleness check
- Suggest the most useful action from Step 4
- Ask if there's a workstream the user wants to scope using the filled context

### Branch E - Stale sections only

Walk the stale sections one by one with this opener: "Section <N> on <topic> was last refreshed <X> days ago. Here's what it currently says: <content>. What's changed?"

## Hard rules

- Never invent values. Never fill `[FILL]` with a guess. If the user doesn't know, write `[PENDING]` and move on.
- Never silently overwrite an existing answer. Always show the current answer and ask for confirmation before replacing.
- Always update the per-section `Last refreshed:` date when a section changes.
- One question at a time. Wait for the answer.
- Use the user's language back to them. Don't translate "we sell to small business owners" into "ICP firmographic axis is SMB."
- If the user rambles, extract the answer and reflect it in one line. "Sounds like the ICP is X. Right?"

## Output rules

- Plain language. The user is not a strategist.
- The opening report block (Step 2) is the most-read part of this skill. Keep it tight.
- Never narrate "I'll now scan the file" - just scan it and report.

## What this skill does NOT do

- Does not write the proposal, deliverable, or content based on the context. Other skills do that - this skill makes sure they have the context to do their job.
- Does not run automated financial analysis. It surfaces the trigger and lets the user choose.
- Does not auto-refresh stale sections. It surfaces them. The user decides what changed.

## Re-run behaviour

If the user invokes this skill on a file that has been scanned in the same session, skip the report block and ask: "We already scanned this. Want to keep filling, jump to actions, or check staleness?"
