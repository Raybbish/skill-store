---
name: linkedin-start
description: >
  The front door to everything Founder OS can do with your LinkedIn data. Trigger on "help me with my LinkedIn", "what can I do with my LinkedIn", "give me my LinkedIn data", "do something with my LinkedIn export", "I downloaded my LinkedIn data", or any open-ended LinkedIn request where the user has not yet picked a specific job. You bring one file (the LinkedIn data export); the OS shows the baseline of your network as it stands today and routes you to the outcome you want: more leads, a better job, a louder brand, or a healthier network. One honest disclaimer, no full onboarding, and never a claim the data cannot support. Routes to linkedin-network-scan, linkedin-power-audit, linkedin-brand-direction, or linkedin-warm-revival depending on the outcome chosen.
why: "A new user does not know which of six LinkedIn skills they need - they know the outcome they want (clients, a job, a name, a healthier network). This is the one entry that turns one file plus one choice into the right path, so nobody has to learn the skill list first."
enhance: "Have your LinkedIn export downloaded before you start (Settings -> Data privacy -> Get a copy of your data -> Download larger data archive). With the file in hand the OS can show your real baseline in the same session instead of waiting on the email."
summary: "Pick your LinkedIn outcome; the OS aims your own data at it."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# LinkedIn Start

Runs on: local-exec - the happy path runs one local Python entrypoint against the user's export and writes the completed private bundle outside the repo. On a read-only or cloud surface, explain the same route without claiming the run happened.

This is the front door. You have a LinkedIn data export (or can request one). Underneath that one file sit several outcomes. This skill shows you the honest baseline of your network and aims the same data at the outcome you actually want, without making you learn which skill does what first.

The principle: do more for you than you asked, in priority order, and never invent a fact your data does not hold. If the export cannot prove something (seniority, buying power, headcount, where someone is based), the OS says so rather than guessing.

## The four outcomes

| You want | What it means | Where it routes |
| --- | --- | --- |
| **Leads** | more or better revenue relationships | `linkedin-network-scan` with the sales ICP (`icp.example.yaml`) |
| **A better job** | who in your network can refer or hire you | `linkedin-network-scan` with the career ICP (`icp.career.example.yaml`) |
| **A louder brand** | what your network already rewards, and the content lane to own | `linkedin-power-audit` then `linkedin-brand-direction` |
| **A healthier network** | over and under-represented roles versus your goal | `linkedin-power-audit` (the network-gap read) |

Not sure which one? Pick "show me all lightly" and the OS runs the cheapest read first (the scan) and names what each other outcome would add, so you choose with your own numbers in front of you.

There is a fifth path the data also supports: **reviving dormant-but-valuable contacts** (`linkedin-warm-revival`). It needs the power audit's `audit.json` first, so if a user asks for it directly, run `linkedin-power-audit` before routing there. Never route to warm-revival without that prerequisite.

## Read the state before routing

The route is only as good as what it knows. Before choosing, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one. The open-flags block tells you what is stuck, the must-do block tells you what this week is actually about, and the patterns block tells you what keeps happening - a front door that routes without them is a cold start at the exact moment the user is deciding whether this OS knows them. If Python is unavailable, route from the files you can read and say so.

## The flow

### 1. Read the state first

Before asking anything, check what the OS already knows:

- Does `core/identity.md` exist? Does `core/profile.md`? Is there a prior LinkedIn run (an output folder the user named, a breadcrumb at `brain/.linkedin.md`)?
- **Cold install** (no `core/`): go straight to the outcome chooser. Do not push the user through full onboarding to scan a file.
- **An OS that already knows the person**: reuse what it knows. If `core/identity.md` already states who they sell to, lead with the Leads outcome and pre-fill the sales ICP from their positioning instead of asking from scratch. If `core/profile.md` says they are job-hunting, lead with the Job outcome.

Branch on the state you actually find. Do not assume cold.

### 2. Ask for the data, plainly

Say: **"Give me your LinkedIn data."**

If they do not have the export yet, hand the exact steps and stop - do not pretend you can proceed without it:

> LinkedIn -> Settings -> Data privacy -> Get a copy of your data ->
> **Download larger data archive** (it bundles Connections, messages, and
> invitations) -> Request archive. LinkedIn emails a link, usually within 24
> hours. Point me at the .zip when it lands - no need to unzip.

Use the larger archive, not the quick select-files route (the quick route is unreliable for Connections). Offer to continue the moment the file arrives. The most you need is the path to the file and their confirmation that it is their own export.

### 3. One honest disclaimer

Before routing, say one true thing and only one:

> I can rank your whole network, but the ranking is only as good as knowing
> what you want from it - more clients, a better job, a louder brand, or a
> healthier network. Tell me which and I will aim it there. Not sure? I will
> show all four lightly so you can choose with your numbers in front of you.

Never imply the scan already knows their intent. It does not. The choice is what aims it.

### 4. Run the one-input entrypoint

Once the user names the outcome, run:

```text
python skills/linkedin-start/run.py <export.zip-or-folder> --outcome <leads|job|brand|network|revival>
```

The runner supplies today's analysis date internally, creates a private temporary workspace,
unwraps nested exports, drafts the ICP from `core/identity.md` and buyer language when those
files are available, runs both deterministic engines, writes the action-ready bundle under
`~/FounderOS/outputs/linkedin/<date>/`, refreshes
`~/.founder-os/linkedin-pack-state.json`, removes the temporary export, and opens the
anonymized report when a browser is available.

The user may edit `draft-icp.json` and rerun, but never starts from a blank file and never
needs to see stakeholder taxonomy keys.

### 5. Route to the outcome

- **Leads** -> use the auto-drafted sales lens and deliver `lead-worklist.md`, including ranked contacts, reason, next action, and a draft opener. The same run surfaces pending **inbound invitations** in `inbound-invites.csv`.
- **A better job** (first-class, not a footnote) -> `linkedin-network-scan` with `icp.career.example.yaml`. Auto-select the career ICP; do not make the user discover it. This lane finds recruiters, hiring managers, and target-company leaders who can refer or hire them.
- **A louder brand** -> `linkedin-power-audit` first (it reads the network composition and writes `audit.json`), then `linkedin-brand-direction` (it turns that plus their goal plus the algorithm reference into a defined content direction).
- **A healthier network** -> `linkedin-power-audit` and surface its network-gap read (over and under-representation of the roles your goal needs).
- **Show me all lightly** -> run the scan first (cheapest, most immediately useful), summarise the baseline, then name in one line each what the brand audit and the gap read would add. Let them pick the next one.

Follow the skill you route to for the actual run. This skill hands off; it does not re-implement the engine.

### 6. Deliver the roadmap, not a file dump

When the routed skill finishes, frame the result as the path from where they are to the outcome they chose. Not "here is network-scan.md" but "here is your network as it stands, here are the people worth acting on first, here is the next move." Read only the compact digest the routed skill tells you to read (for the scan, that is `network-scan.md` - never the raw CSV).

### 7. Offer more than they asked

After delivering, name the outcomes they did not pick, in one line each, and the full OS in plain terms. Invite, never gate. "You came for leads. The same file can also tell you which content lane your network rewards, and where your network is thin for the clients you want. Want either of those? And if you want the OS to hold this and the rest of your week, I can set that up." If they say no, stop cleanly.

### 8. No hallucination, by design

This is not a hope, it is a rule the routed engine already enforces and you must not break:

- Never claim a seniority, buying power, headcount, or location the export does not hold. A LinkedIn export has **no location field** - region is only ever inferred from tokens the user set, and "region unknown" means kept, not confirmed.
- Every person you surface must trace to a real row in the user's export. Do not invent names, titles, or companies to round out a list.
- Carry the engine's honest-limits line into your summary every time: title-only and point-in-time, no firmographics, email mostly blank, no engagement data on others. Seniority is inferred from one title string and is a strong first cut, not a verdict.

If the user asks for something the data cannot answer (their connections' email open rates, who is hiring right now, a stranger's profile), say plainly that the export does not carry it and, where a paid tool genuinely would, name that honestly.

### 9. One breadcrumb, only on accept

If - and only if - the user accepts full setup, write the single fact learned (the outcome they chose and the ICP seed) as one line to `brain/.linkedin.md` so the next session opens already knowing their LinkedIn goal. Tell them it is one small file they can delete. If they decline setup, write nothing. They walk away and nothing is left behind to clean up.

## Honest positioning (say this, do not oversell)

Lead with the defensible truth: free, local, and within LinkedIn's terms (no scraper, no auto-actions, no account-ban risk), private (the raw export stays on the machine, only a compact digest reaches the Claude session, and message content is never read), and goal-conditioned (it aims at clients, a job, or a brand, which off-the-shelf tools do not).

Be honest where paid tools genuinely win: enriching stale title-only data, finding net-new strangers (Sales Navigator), sending at scale, and live job-change or intent signals. The export is a strong read of the network you already have, not a prospecting database of people you do not.

## When NOT to use

- To analyse an export the user did not personally download. Refuse on consent grounds.
- When the user already named a specific job ("scan my network", "write me a post") - route straight to that skill; the front door is for the open-ended ask.

## Files this skill routes to

- `skills/linkedin-network-scan/SKILL.md` - Leads and Job lanes (the scoring engine).
- `skills/linkedin-power-audit/SKILL.md` - Brand and Network-health lanes (deep network read, writes `audit.json`).
- `skills/linkedin-brand-direction/SKILL.md` - turns the audit into a content direction.
- `skills/linkedin-warm-revival/SKILL.md` - dormant-contact revival (needs `audit.json` first).
- `skills/linkedin-pack-references/linkedin-algorithm.md` - the shared algorithm reference the brand skills read.
- `skills/linkedin-start/run.py` - the one-input local entrypoint and action-bundle writer.
