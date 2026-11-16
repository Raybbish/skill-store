---
name: linkedin-warm-revival
description: >
  Surface the dormant-but-valuable contacts you have not spoken to in months, each with a one-line reopener. Trigger on "who should I reconnect with", "revive my dormant LinkedIn contacts", "who have I gone cold with", "warm up my old connections", or after a power audit when the user wants to reactivate relationships. Reads the audit.json produced by linkedin-power-audit (its prerequisite) - specifically the message counterparties whose warmth is dormant or whose last touch is old - cross-references the network for the valuable ones, and proposes a personal reopener for each. No message content is read; the reopener is drafted from public title and the relationship's metadata only.
why: "A founder's most undervalued asset is the warm contact who went cold. The audit already knows who replied before and then dropped off; turning that into a short, ranked reopener list is the highest-leverage outreach there is - these people already know you."
enhance: "Run linkedin-power-audit on the COMPLETE export first. Warm-revival needs the message metadata (warmth, last touch) that only the Complete export carries; on a Basic export there is no warmth data to revive from."
summary: "Dormant-but-valuable contacts, each with a one-line reopener."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# LinkedIn Warm Revival

Runs on: reasoning - reads the audit.json artifact and reasons the reopeners; any capable agent can run this once audit.json exists. Producing audit.json needs `linkedin-power-audit` (local-exec) first.

The dormant relationship is the cheapest warm lead there is - they already replied to you once. This skill reads the audit, finds the valuable contacts who went cold, and gives you a short reopener for each.

## Prerequisite (enforced)

This skill REQUIRES `audit.json` from `linkedin-power-audit`. If it is not present:

1. Tell the user warm-revival needs the audit first.
2. Route to `linkedin-power-audit` to produce `audit.json` (on the Complete export, so warmth data exists).
3. Come back here once it is written.

Do not guess a dormant list without the audit. The warmth signal lives in the message metadata the audit reads.

## Step 1 - read the audit

Read `audit.json` from the output folder `linkedin-power-audit` wrote. Use:

- `messages.counterparties` - each has `warmth` (hot / warm / dormant / outbound_only / light), `total` messages, `in` (their replies), `last_touch`, `last_touch_days`, and the matched `title` / `company` when the person exists in Connections.csv.
- `network.role_clusters` / `stakeholder_buckets` and `founder_pool.sample_records` - to judge which dormant contacts are worth reviving.

If `_meta.export_type` is `basic`, stop and say there is no warmth data to revive from - the Complete export is needed.

## Step 2 - pick the revival set

A contact is worth reviving when they are **dormant or cold AND valuable AND real**:

- **Dormant:** `warmth` is `dormant`, which already requires at least one real reply (`in >= 1`) and an old last touch. `outbound_only` is cold outreach, never revival.
- **Valuable:** their role matters for the user's goal (a decision-maker, a founder, a hiring manager - judge from the title and the network composition).
- **Real:** they replied to you before (`in >= 1`). Reviving someone who never answered is cold outreach, not revival - keep those out of this list and say so.

Rank the set by value plus how warm the prior relationship was (more prior replies, more recent-but-still-cold = higher). Cap the list at what the user can actually action (10 to 20).

## Step 3 - one reopener each

For each contact, write ONE short, personal reopener line. Ground it in what is real:

- the fact you spoke before (without quoting any message - content is never read),
- their public title or company (a plausible, current reason to reconnect),
- a specific, low-pressure opener - not a pitch.

No mass-blast template. No invented shared history. If you do not have a real hook, say "no strong hook - a simple 'good to reconnect' is honest here" rather than fabricating one.

## Step 4 - hand it back

Give the user the ranked list: name, title/company, how the relationship stands (warmth, last touch, prior replies), and the reopener. Remind them outreach is manual and theirs to send - nothing is sent from here.

## No hallucination

- Never invent a prior conversation, a shared event, or a fact about the contact the audit does not hold.
- Never read or quote message content - it is not in the audit and must not be.
- A contact who never replied is not a revival - do not pad the list with them.

## Honest limitations

- Warmth is metadata only. A relationship that moved to email or WhatsApp looks dormant here even if it is warm elsewhere - flag that the user knows the real state better than the export does.
- Title is point-in-time. Check the current profile before sending if the role matters.

## Files

- `linkedin-power-audit` - produces the `audit.json` this skill requires.
- `audit.json` (in the user's output folder) - the input: counterparties, warmth, network composition.
