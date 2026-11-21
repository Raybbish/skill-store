---
name: delivery-start
description: >
  The front door to the Delivery pack: get ready to deliver client work and gate it before it ships. Trigger on "get me ready to deliver this", "help me deliver this client work", "I have client work due", "prep this delivery", "ready this for the client", "is this ready to send to the client", or any open-ended request about doing or shipping client work where the user has not picked a step. You name what you owe a client; the OS reads what it knows, then routes you to the move you need: prep the session, write the update, document the process, build the branded document, or run the ship gate before it goes out. One honest disclaimer, no full onboarding, and it never sends to the client for you. Routes to meeting-prep, client-update, sop-writer, your-deliverable-template, blind-spot-review, pre-send-check, or ship-deliverable depending on the step.
why: "A founder who is also the delivery team does the work and ships it with no one to check it. This is the one entry that turns 'I owe a client something' into the right step, and makes sure a second pair of eyes runs before anything leaves the machine."
enhance: "Set your brand profile (say 'set up my brand profile') so branded documents render in your identity, and keep context/clients.md current so prep and updates read from real history instead of starting blank."
summary: "Name what you owe a client; the OS readies it and checks it before it ships."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# Delivery Start

Runs on: reasoning - this skill reads what the OS knows about the client and the work, then routes you to the member skill that does the step. It does not produce the deliverable itself and it never sends anything to a client. On a read-only or cloud surface, it explains the same route without claiming a file was written.

This is the front door to delivery. You owe a client something: a session you need to be ready for, a status update, a process to hand off, a document to build, or a finished piece that needs checking before it ships. This skill reads what the OS holds, then points you at the step you actually need, and it makes sure the ship gate runs before anything leaves your machine.

The principle: do more for you than you asked, in the order a careful operator would, and never let weak work ship as if it were checked. A solo founder has no one to catch the blind spot; the OS is that check.

## The steps behind one delivery

| You want | What it means | Where it routes |
| --- | --- | --- |
| **Prep the session** | a brief for the client call: what to cover, what to watch for | `meeting-prep` |
| **Write the update** | a client-facing status or milestone report in your voice | `client-update` |
| **Hand off a process** | a delegation-ready SOP someone else can follow | `sop-writer` |
| **Build the document** | a branded proposal, deck, one-pager, or CV in your identity | `your-deliverable-template` |
| **Ship it safely** | the final gate before it goes to the client | `ship-deliverable` (runs blind-spot-review + pre-send-check) |

Not sure which? Say "I have client work due, ready it" and the OS asks the one question that sorts it (are you preparing, producing, or shipping), then routes from your answer.

## Read the state before routing

The route is only as good as what it knows. Before choosing, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one. The open-flags block tells you what is stuck, the must-do block tells you what this week is actually about, and the patterns block tells you what keeps happening - a front door that routes without them is a cold start at the exact moment the user is deciding whether this OS knows them. If Python is unavailable, route from the files you can read and say so.

## The flow

### 1. Read the state first

Before asking anything, check what the OS already knows:

- Is there client history in `context/clients.md`? A company file in `companies/`? A brand profile for branded output (`core/brand-profile.yml` or `brands/<slug>/visual.yml`)?
- **Cold install** (no client context, no brand profile): route to the step they named and note what a brand profile or client history would add later. Do not block a delivery on full onboarding.
- **An OS that knows the client**: prep and updates read from real history instead of a blank page. Use it.

Branch on the state you actually find. Do not assume cold.

### 2. One honest disclaimer

Before routing, say one true thing and only one:

> I can prep, write, and check this, but I do not send it to the client, and the ship gate is a check, not a guarantee, it surfaces risk, it does not remove it. Branded documents need your brand profile to render in your identity. Tell me where this delivery is and I will aim the right step at it.

Never imply the OS contacted the client or that passing the gate makes the work correct. The gate raises what you missed; the judgment stays yours.

### 3. Route to the step

- **Prep the session** -> `meeting-prep`, which builds the brief from client context and your commitments.
- **Write the update** -> `client-update`, which writes the status in your voice (set `core/voice-profile.yml` so it sounds like you).
- **Hand off a process** -> `sop-writer`, which documents the steps so someone unfamiliar can follow them to completion.
- **Build the document** -> `your-deliverable-template`, which inherits your brand colors, fonts, and logo (needs a real brand profile, not placeholders).
- **Ship it safely** -> `ship-deliverable`, the composition gate. It runs `blind-spot-review` (nine risk categories) and `pre-send-check` (seven final checks) and reports every failure in one pass. Run this before anything goes to a client.

Follow the skill you route to for the actual run. This skill hands off; it does not produce the deliverable.

### 4. Always offer the gate

Whatever they came to produce, before it ships, offer `ship-deliverable`. A solo founder is the only reviewer they have. The gate is the single most valuable habit in this pack: it catches the legal exposure, the broken cross-reference, the wrong recipient, the missing asset, before the client sees it. Make the offer every time; never force it.

### 5. Deliver the path, not a file dump

When the routed skill finishes, frame the result as the path from owed-work to shipped-and-checked: here is the prepped session, here is the draft, here is the gate result. Update `context/clients.md` and the log so the next session knows where the engagement stands.

<!-- private-tag: not applicable: delivery-start is a router. It does not capture user speech to write; the member skills it routes to (client-update, meeting-prep) own any write to context/clients.md and carry their own private-tag handling. -->


### 6. Offer more than they asked

After delivering, name the steps they did not pick, in one line each. "You came to write the update. Before it goes out, the ship gate can catch what a second reader would. And the same client file holds your next session's prep." Invite, never gate the offer itself. If they say no, stop cleanly.

## Honest positioning (say this, do not oversell)

Lead with the defensible truth: the OS preps from your real client history, writes in your voice, builds in your brand, and runs a real second-pass check before anything ships. It is the reviewer a solo operator does not have. It needs no extra service, and nothing reaches the client unless you send it.

Be honest about the limits: the ship gate surfaces risk, it does not certify the work; branded rendering needs a brand profile; and the OS does not send, schedule, or track delivery on the client's side. It readies and checks; you ship.

## When NOT to use

- When the user already named the step ("prep my call with <client>", "write the status update", "run the ship checks") - route straight to that skill; the front door is for the open-ended "I owe a client something".
- To send to the client. The OS readies and gates; it does not deliver on your behalf.

## Files this skill routes to

- `skills/meeting-prep/SKILL.md` - the pre-session brief.
- `skills/client-update/SKILL.md` - a status update in your voice.
- `skills/sop-writer/SKILL.md` - a delegation-ready SOP.
- `skills/your-deliverable-template/SKILL.md` - a branded document in your identity.
- `skills/ship-deliverable/SKILL.md` - the final gate (composes blind-spot-review + pre-send-check).
- `skills/blind-spot-review/SKILL.md` - the nine-category risk pass.
- `skills/pre-send-check/SKILL.md` - the seven-check pre-send gate.
- `skills/delivery-pack.md` - the pack manifest, with the full member map.
