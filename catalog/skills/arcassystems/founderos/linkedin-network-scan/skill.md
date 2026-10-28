---
name: linkedin-network-scan
description: >
  Turn your own LinkedIn export into a ranked, ready-to-work outreach list, for free. Point it at the data-export ZIP LinkedIn gives you; a deterministic local script scores every connection against an ICP you set and writes a short worklist plus an interactive page you can filter. No scraper, no paid tool, no API call, and no automated actions that could get your account restricted. Message content is never read - only who you spoke to, the direction, and when. The assistant reads only the small ranked digest, never the 2,000-row export, and the raw export, emails and profile links stay on your machine. Use when someone says "scan my linkedin network", "rank my linkedin connections", "who in my network fits my ICP", "build my outreach list from my connections", or shares a LinkedIn export ZIP.
why: "A LinkedIn connections export is tens of thousands of tokens; reading it raw wastes context and money. A deterministic script collapses it to a ranked top-N first, so the model only ever sees a small worklist - and the raw rows, emails and profile URLs stay on the machine."
enhance: "Write a real ICP file before running (roles, industries, company keywords, min seniority, optional region, optional demote keywords) instead of taking the permissive default - a narrowed ICP turns a long flat list into a short, ranked, actionable worklist."
summary: "Rank your own LinkedIn network against an ICP you define."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# LinkedIn Network Scan

Runs on: local-exec - runs a local script; on a cloud surface I read the results, I do not run it.

Turn your own LinkedIn export into a real worklist. You bring the file LinkedIn already lets you download; a local script reads it, scores every connection against the ideal-customer (or ideal-contact) profile you set, and hands back a short ranked list and an interactive page you can filter by fit, region, and warmth.

No scraper. No paid tool. No automated actions that could get your account restricted. The whole thing runs on a free LinkedIn account and Python's standard library, on your own machine. The raw CSVs never enter the conversation - the script collapses them to a compact digest first, so the assistant reads a few hundred lines instead of two thousand rows, and the raw export, emails and profile links stay on your disk. The names in the digest reach Anthropic with the rest of the session.

## When to use

- A user wants to find who in their existing network matches a target customer, hiring, or partnership profile.
- They have (or can request) their LinkedIn data export.
- They want a manual-outreach worklist, not automated sending.

## When NOT to use

- To analyse someone else's export they did not personally download. Refuse on consent grounds.
- To write the outreach messages. That is a separate writing task.
- To scrape LinkedIn or run automated outreach. This skill is export-only and free-plan only, and stays within LinkedIn's terms.

## Step 1 - the ZIP gate (do this FIRST, before anything else)

Ask: **"Do you have your LinkedIn data export downloaded?"**

If no, walk them through requesting it and STOP - do not ingest anything yet:

> LinkedIn -> Settings -> Data privacy -> "Get a copy of your data" -> choose
> **"Download larger data archive"** (it bundles your Connections, messages, and
> invitations) -> Request archive.
>
> Request the larger archive, not the quick "select the files you want" route. The quick
> route is faster but unreliable for Connections - depending on your account it may not
> offer the Connections file, or may hand back an incomplete one - so the larger archive is
> the safe choice. LinkedIn emails a download link, usually within 24 hours (longer for very
> large networks). Request it now and come back with the .zip when it lands. Point me
> straight at the file you downloaded, no need to unzip.

Only continue once they have the file. The most I need from you is the path to that file and
your confirmation that it is your own export.

## Step 2 - get the ICP

Ask whether they have an ICP config, or want to define one now. Two example ICPs ship in this skill folder - copy whichever fits, edit the lists, and save it as their own file:

- `icp.example.yaml` - sales and partnership targeting (founders, owners, and the decision-makers you sell to or partner with). Documents every option including the two optional ICP-hygiene keys below.
- `icp.career.example.yaml` - the people axis: recruiters, talent leaders, and hiring managers who can refer you, hire you, or help you hire, plus decision-makers at the companies you are targeting. Tuned for a job search or a hiring push.

If both fit, ask which goal the user is on right now (selling / partnering, or hiring / job search) and pick the matching example.

If they have no ICP and do not want to build one, run with the permissive default (any decision-maker, no industry/region filter) and tell them explicitly that nothing was narrowed, so the ranking is seniority + warmth only.

### Optional ICP-hygiene keys (generic, off by default)

Both are optional. If the keys are absent from the ICP file, behaviour is unchanged.

- `demote_keywords:` - a list of words that push a match DOWN a tier (not disqualify). Use it to demote a cluster who would just do the job themselves for your offer (for a done-for-you service, the self-serve / in-house crowd is the wrong fit). Generic - you set the words; nothing is hardcoded.
- `require_leadership_title: true` - drops anyone without a real leadership title (founder, owner, C-level, MD, partner, director, VP, head of, GM, president, chair) before scoring. Useful when you only want decision-makers.

## Step 3 - run the scan

```
python scan.py <export.zip OR export-folder> <output-folder> --icp <their-icp.yaml>
```

- `<export.zip>` can be the ZIP itself or an unzipped folder. The script reads `Connections.csv`, `messages.csv` (metadata only), and `Invitations.csv` from inside it.
- `<output-folder>` MUST be outside any git repo - it holds real names and profile URLs. A folder in their home directory or Desktop is fine.
- `--icp` is optional; omit it for the permissive default.
- `--brand "<label>"` is optional; it puts a neutral label in the HTML header (the user's own name or company). The page ships with a plain neutral palette they can rebrand.
- `--as-of YYYY-MM-DD` is an internal determinism input. `linkedin-start/run.py` supplies today. Tests pass a fixed date.

The script is Python standard-library only - no `pip install`, nothing to set up, works on a free plan. If `python` is not found, try `python3`.

### Freshness

The script reads the newest connection date in the export. If that is older than about 30 days, it prints a WARNING with re-pull steps and keeps going (it warns, it does not block). A stale export silently mis-ranks people whose roles have changed, so relay the warning before the user acts on the list. To re-pull: LinkedIn -> Settings -> Data privacy -> Get a copy of your data -> "Download larger data archive" (it includes Connections) -> Request archive. It usually arrives within 24 hours. The quick "select the files you want" route is unreliable for Connections, so use the larger archive.

## Step 4 - read ONLY the compact digest

When the script finishes, **read only `network-scan.md`** from the output folder. It is the ranked top-N digest, a few hundred lines at most.

**Do NOT read `network-scan.csv`, `network-scan.json`, the export's `Connections.csv`, or `messages.csv`** - those are the full raw rows and reading them is exactly the token waste this skill exists to avoid. They are deliverables for the user to open, not for the model to ingest.

Then summarise in one or two sentences: how many connections were read, how many qualified for their ICP, how many have actually replied to them before (warm), and how many pending inbound invitations are waiting. Point them at the two HTML views and at `network-scan.csv` for the full list with emails and URLs.

## What the script outputs (all in the output folder)

- `network-scan.md` - compact ranked digest (the only file the assistant reads).
- `network-scan.html` - **anonymised demo**: an interactive, offline page (vanilla JS, no libraries) with live filter chips, an inline-SVG donut that recomputes as you filter, and a "showing X of Y" table. Names are reduced to initials, companies are masked, links are removed, and the weakest rows are dropped. Safe to screen-record and share - no real names exist in its source.
- `network-scan-full.html` - same interactive page with **real names, companies, and profile links**, watermarked "Local file - not for distribution".
- `network-scan.csv` - every qualified row with email + LinkedIn URL.
- `network-scan.json` - the same data plus the ICP used, for tooling.
- `inbound-invites.csv` - people who sent a connection request still pending (warm inbound).

Every file carries a header reminding the user not to commit or share it.

Both HTML views carry a small footer credit and a soft link back to ARCAS Systems (arcassystems.com), the maker of Founder OS, for anyone who wants more. It is the only ARCAS-branded element - the user's own `--brand` label still owns the header - and it is plain HTML in `scan.py`, so a fork can edit or remove it.

## Model

The scoring engine is deterministic and LLM-free - it runs end to end with no paid AI subscription, which is the free-tier floor for this skill. Only the narrative or synthesis afterward (summarising the digest, drafting talking points) uses the session's own Claude. Use the session's latest available Claude for that step. The skill is not pinned to any model, so newer is fine.

## Privacy

- Message **content** is never read. The script uses only metadata: who messaged whom, the direction, the count, and the date - enough to tell a real two-way relationship from a one-way cold send.
- The script makes no API calls and uses no scrapers or third-party services. The raw export stays on your machine. The compact digest, which holds real names, is what your Claude session reads, so it goes to Anthropic under your plan like anything else the session reads.
- The output holds real names and URLs. The script writes a "keep this local, do not commit" warning into every file; repeat it to the user. The anonymised `network-scan.html` is the one safe to share - the full file and the CSV are not.

## Honest limitations (state these, do not hide them)

- **Seniority and region are inferred from one title string.** A serious-consultancy founder and a side-hustle "founder" can score alike; a region token only matches when it appears in the company or title. The ranking is a strong first cut, not a verdict - skim the top of the list before acting on it.
- **A LinkedIn export carries no location field.** Region is inferred only from the tokens you set. With no region tokens, location is labelled unknown for everyone. "Region unknown" means kept, not excluded.
- **Warmth only sees export metadata.** A thread that moved off LinkedIn (to email or another app) looks cold here even if the relationship is warm.
- **Nothing is sent.** This produces a worklist. The outreach is manual, by design.

## Files

- `scan.py` - the deterministic scanner (stdlib only).
- `icp.example.yaml` - documented ICP template (sales / partnership) to copy and edit, including the optional `demote_keywords` and `require_leadership_title` keys.
- `icp.career.example.yaml` - documented ICP template (recruiters / hiring / job search) to copy and edit.
- `arcas-logomark.png` - the ARCAS Systems mark, inlined into the HTML footer as an offline data-URI (the footer falls back to a text credit if the file is absent).
