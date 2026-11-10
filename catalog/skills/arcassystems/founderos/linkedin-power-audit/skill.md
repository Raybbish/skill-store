---
name: linkedin-power-audit
description: >
  Deep, deterministic read of your own LinkedIn data export - far more than the connection scan. Trigger on "audit my LinkedIn", "power audit my LinkedIn", "analyse my whole LinkedIn", "what does my LinkedIn network look like", "where is my network thin", or when the user wants brand or network-health analysis (the front door routes here for those). A local Python script reads the unzipped export and writes audit.json: profile, metrics, network composition (role clusters, stakeholder buckets, industries, top companies, founder pool), message warmth, invitations, content themes, skills, plus an optional network-gap read. No AI in the extract, no third-party calls, message content never read. audit.json is the prerequisite linkedin-warm-revival and linkedin-brand-direction read.
why: "The scan ranks connections; the audit reads the whole shape of a network - who is in it, what it is weighted toward, where it is thin for the goal, which content lanes the person already plays in. It is the input the brand and revival skills need, and it is deterministic so it costs no AI tokens to produce."
enhance: "Run it on the COMPLETE export (the ~24h installment), not the Basic one (the ~10min installment). The Basic export has no messages, posts, reactions, or invitations, so warmth, content themes, and half the audit come back empty. The script detects which you gave it and says so."
summary: "A deep, deterministic read of your whole LinkedIn export into audit.json."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# LinkedIn Power Audit

Runs on: local-exec - runs a local Python script against a local export folder. On a cloud surface I read the produced audit.json, I do not run the script.

The deep counterpart to `linkedin-network-scan`. The scan ranks who to act on; the audit reads the whole shape of your network and writes a structured `audit.json` the rest of the pack builds on. Python standard library only, no pip install, no AI in the extract, message content never read.

Known limitation: the export is title-only and point-in-time, has no location field, no firmographics, email mostly blank, and no engagement data on other people. The audit is a strong read of the network you have, not a database of strangers.

## Step 1 - the export gate (do this FIRST)

Ask: **"Do you have your LinkedIn data export downloaded and unzipped?"**

This skill needs the UNZIPPED folder, not the .zip (unlike the scan, which takes the zip). If they have not requested it:

> LinkedIn -> Settings -> Data privacy -> Get a copy of your data ->
> **Download larger data archive** -> Request archive.

LinkedIn delivers in two installments:
- **Basic** (within ~10 minutes): profile, connections, positions, education, skills only.
- **Complete** (~24 hours later): everything else - messages, posts, reactions, comments, invitations, follows.

The script detects which one it reads and prints a banner. Run on the Complete export for the full audit; re-run when it arrives if you only have the Basic one. If the zip unzipped to another zip (LinkedIn sometimes wraps twice), unzip again until you see `Profile.csv` and `Connections.csv` directly.

## Step 2 - run the audit

```
python power_audit.py <unzipped-export-folder> <output-folder> [--goal-buckets a,b]
```

- `<unzipped-export-folder>` is the folder with `Profile.csv` and `Connections.csv` in it (the script descends one level automatically if it is nested in a single subfolder, and resolves member-id-suffixed activity files like `Shares_<id>.csv`).
- `<output-folder>` MUST be outside any git repo - `audit.json` holds real names. A folder in their home directory is fine.
- `--goal-buckets` is optional. Pass the stakeholder buckets the user's goal needs (comma-separated) to add a `network.gap` read - see Step 4. Valid bucket keys are in `taxonomy.json` under `stakeholder_priority` (e.g. `founder_owner_entrepreneur`, `tech_product_innovation`, `sales_partnerships_bd`, `hr_talent_recruitment`, `operations_general_management`).
- `--as-of YYYY-MM-DD` is an internal determinism input. `linkedin-start/run.py` supplies today. Tests pass a fixed date.

If `python` is not found, try `python3`. The script refuses a `.zip` path with a clear unzip message.

## Step 3 - read audit.json and give the read

Read `audit.json` from the output folder. It is structured and compact - safe to read (it does not dump 2,000 raw rows; it dumps rolled-up counts plus the top 50 message counterparties and top 30 companies and founders). Give the user the read that matters for their goal:

- **Network composition:** the role clusters and stakeholder buckets - what the network is weighted toward.
- **Industry and company concentration:** where their connections cluster.
- **Founder pool:** how many founders/owners, by use and by industry.
- **Message warmth:** how many hot / warm / dormant / outbound-only / light relationships, from metadata only. Every relationship label requires at least one inbound reply; outbound-only activity is never revival evidence.
- **Content lanes:** posting themes and follow themes - what they already play in (feeds `linkedin-brand-direction`).
- **Export honesty:** if `_meta.export_type` is `basic` or `partial`, say so - the audit is thinner than it looks and a re-run on the Complete export is worth it.

Frame it as a read of where they stand, not a file dump.

## Step 4 - network-gap (over/under-representation)

When the user has a goal, pass `--goal-buckets` with the buckets that goal needs, and surface `audit.json`'s `network.gap`:

- For each goal bucket: its share of the network and a status - `under` (thin, below 10%), `balanced`, or `over` (above 25%).
- The `biggest_gap` is the goal-relevant role the network is thinnest on.
- Every line traces to a real count ("operations leaders: 4 of 220 connections, 1.8% - under"). Do not assert a gap the counts do not show.

This is the "you sell to ops leaders but only 4% of your network holds an ops title" read. It is evidence-cited, never invented.

## What it produces

- `audit.json` - the deterministic structured audit. The prerequisite for `linkedin-warm-revival` (reads the dormant counterparties) and `linkedin-brand-direction` (reads the composition and content lanes). Schema documented in `audit.schema.json`.

## Privacy

- Message **content** is never read - only counterparty, direction, count, and date.
- The script makes no API calls and uses no scrapers. The raw export stays on your machine. What your Claude session reads from `audit.json`, real names included, goes to Anthropic under your plan like anything else the session reads.
- `audit.json` holds real names and should stay local - keep the output folder out of any repo.

## Honest limitations (state these)

- Title-only and point-in-time. Seniority and role are inferred from one title string.
- No location field in the export. Region is never asserted from this data.
- Warmth sees export metadata only - a thread that moved to email looks cold here.
- The Basic export is thin. Half the audit needs the Complete installment.

## Files

- `power_audit.py` - the deterministic extractor + classifier + network-gap (stdlib only).
- `taxonomy.json` - role / stakeholder / industry / founder-pool keyword taxonomy (generic, editable).
- `theme-keywords.json` - content and follow theme keywords (generic, editable).
- `audit.schema.json` - the audit.json contract downstream skills depend on.
