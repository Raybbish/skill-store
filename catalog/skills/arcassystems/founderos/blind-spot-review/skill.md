---
name: blind-spot-review
description: Pressure-test a draft for blind spots before pre-send review. Say "find blind spots", "what am I missing", or "review for risk". Runs nine fixed review categories covering evidence, risk, timing, relationships, data, upside, and walkaway planning. Read-only.
why: "Catches the assumptions and missing context that first-draft writers always miss - the categories no one thinks to check until after a deal falls apart."
enhance: "Provide the source material the draft was built from - the review is weakest when run on a deliverable alone and sharpest when it can compare draft claims against meeting notes or brief."
allowed-tools: ["Read", "Write"]
mcp_requirements: []
---

# Blind-Spot Review

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

The first draft of an advisory deliverable is rarely the safe final draft. This skill runs a second pass against nine fixed categories so the founder can decide what to add, what to accept, and what to leave out.

## When To Run

- A proposal, brief, playbook, meeting-prep note, client update, or decision document has a complete first draft.
- The founder asks what is missing.
- A deliverable is about to run through `pre-send-check`.
- The stakes include external trust, legal exposure, financial terms, client expectations, or relationship damage.

## Inputs Required

- Path to the deliverable.
- Source material used to create it: transcript, notes, client context, prior decision, or brief.
- The external party or audience.
- Intended send channel and date, if known.

If any input is missing, stop and name the gap. Do not review a deliverable without source context.

## The Nine Categories

For each category, mark `ADDRESSED`, `GAP`, or `NOT APPLICABLE` with a one-line reason.

### 1. Legal and IP Status

Check ownership, licenses, registrations, names, contracts, claims, and any rights the deliverable assumes.

### 2. Contracts In Flight

Check pending proposals, signed contracts, vendor terms, partner terms, employment or contractor terms, and anything that changes if the advice is followed.

### 3. Creditor and Payment Positions

Check unpaid invoices, loans, deposits, deferred pay, refund exposure, or anyone who must be paid before value is split.

### 4. Community and Data Assets

Check audiences, email lists, CRM records, customer data, content libraries, social accounts, group chats, and consent boundaries.

### 5. Relationship Externalities

Check co-founders, team members, family, friends, partners, investors, and anyone whose position changes because of the recommendation.

### 6. Regulatory and Timing Issues

Check renewal dates, tax dates, filing deadlines, permit windows, launch dates, meeting dates, campaign timing, or any dated constraint.

### 7. Pre-Meeting Communication

Check whether the other party has been prepared, whether a written pre-brief is needed, and what silence before the meeting may signal.

### 8. Upside Scenarios

Check what happens if the other party responds well, offers more than expected, or helps design the solution. Good outcomes need a plan too.

### 9. Walkaway Plan

Check what the founder or client does if the meeting fails, the deal stalls, or the recommendation is rejected.

## Output Format

```markdown
# Blind-spot review on `<deliverable-name>` - <YYYY-MM-DD>

## Categories addressed

1. Legal and IP status: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
2. Contracts in flight: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
3. Creditor and payment positions: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
4. Community and data assets: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
5. Relationship externalities: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
6. Regulatory and timing issues: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
7. Pre-meeting communication: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
8. Upside scenarios: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>
9. Walkaway plan: ADDRESSED / GAP / NOT APPLICABLE - <one-line specifics>

## Additions to fold back into the deliverable

- <specific change, with section or file location>

## Verdict

READY FOR pre-send-check | FIX THEN RE-REVIEW
```

## Rules

- Review only. Do not edit the deliverable in this skill.
- If any category is marked GAP, the verdict is `FIX THEN RE-REVIEW` unless the founder explicitly accepts the risk.
- Name the highest-risk gap first if the user is under time pressure.
- No em dashes, no en dashes, no banned words.
