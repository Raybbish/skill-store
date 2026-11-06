---
name: add-voice
description: >
  Give your Founder OS a voice - talk to it out loud and hear it answer. Trigger on "add
  voice", "let me talk to my OS", "voice mode", "talk to it out loud", or "set up voice
  mode". This is SPEAKING and LISTENING; if they mean how their WRITING sounds, that is
  voice-interview, not this. Installs the Tier-0 loop by default: your browser's built-in
  speech (ears and mouth) plus the reasoning CLI you already run the OS in (brain), with NO
  extra API key and NO paid service - the accessibility floor. Realtime voice (Gemini Live,
  free Google AI Studio key) and a premium mouth (ElevenLabs) are opt-in upgrades, never the
  default. Honest disclaimer up front: in Chrome/Edge the browser sends your audio to its
  vendor to transcribe (no key, no cost, not fully local); faster-whisper makes it fully
  local. Your files stay on your disk, and anything the voice reads aloud went through the model first.
why: "Voice is the most-asked extension and the easiest place to either silently bill the user or mishear them. Shipping it as a tiered skill - default that needs no key, upgrades that are opt-in and disclosed - holds the accessibility floor and keeps the honesty note load-bearing instead of buried."
enhance: "Use Chrome or Edge for built-in speech input. Want speech that never leaves your machine? Add the faster-whisper upgrade in references/tiers.md. Want sub-second realtime conversation? That is Tier 1 - a free Google AI Studio key, with the cost-and-accuracy trade stated plainly before you commit."
summary: "Talk to your OS and hear it back - default needs no key."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# Add voice

Runs on: local-exec - the happy path runs a local Python setup that writes a gitignored `voice/` runtime and serves a local page. On a read-only or cloud surface, explain the steps and the tiers but do NOT claim the install ran or the loop works - it has not until the user runs it locally.

This turns the documented "voice is a DIY mouth and ears" direction ([docs/voice-extension.md](../../docs/voice-extension.md)) into a wired capability the user installs by asking. The OS ships as a complete text brain; this adds a sensory layer on top of the same brain. Nothing here is required.

## Check you are in the right skill (say this first if the ask was ambiguous)

"Voice" means two different things in this OS, and "set up my voice" can mean either:

- **This skill (add-voice)** - SPEAKING and LISTENING. You talk to the OS out loud and hear it answer.
- **`voice-interview`** - your WRITING voice. It captures how you write so every email, post, and draft sounds like you. Nothing is spoken or heard.

If the user asked with a phrase that could be either ("set up my voice", "voice setup"), say one line before installing anything: **"Quick check - do you mean talking to your OS out loud (this), or how your writing sounds (that is `voice-interview`)?"** Do not install a runtime the user did not ask for.

## The accessibility floor (the rule that governs the default)

The default install - Tier 0 - must work end-to-end on the **one subscription the user already runs the OS in**, with **no extra API key and no paid service**. That is non-negotiable. The brain answers through the reasoning CLI the OS already uses (`claude -p` by default - no API key, it uses the existing subscription); the browser hears and speaks. Everything past Tier 0 is opt-in and disclosed.

## The tiers

| Tier | What it adds | Needs | State | Default? |
| --- | --- | --- | --- | --- |
| **0** | Browser speech-in + speech-out + brain on your one subscription | nothing extra | wired | YES |
| **0-local ears** | faster-whisper transcribes on this machine, so speech never reaches a browser vendor | `pip install faster-whisper` + a model download | wired | no - opt-in |
| **0-local mouth** | Piper speaks locally instead of the browser | the Piper binary + a voice file | wired | no - opt-in |
| **1** | Realtime, sub-second spoken conversation (Gemini Live front) | a FREE Google AI Studio key | wired, last run 2026-08-05 | no - opt-in |
| **2** | A premium, higher-quality mouth (ElevenLabs) | a paid key | documented, not built | no - opt-in |

**Read the State column before you promise anything.** `wired` means code ships
and runs it. `documented, not built` means the page describes it and nothing
implements it. Until v1.55 both local rungs said the first while meaning the
second: `references/tiers.md` gave build instructions ("capture mic audio with
MediaRecorder, POST it to a small local transcribe endpoint") as though the
endpoint existed, and no endpoint existed. A reader could not tell the two
apart, and that was the actual defect, worse than the missing feature.

Tier 1's own honesty note: the runtime ships and the installer runs, but Gemini
Live model names change often and a retired name fails at the first turn. The
date in the table is the last time it was run end to end against a live free
key, not a promise about today. `python voice/live_server.py --models` lists
what your key exposes right now, and that list is the source of truth.

Full detail, the upgrade commands, and the cost-and-accuracy trade for each are in [references/tiers.md](references/tiers.md) and [references/voice-model-disclaimer.md](references/voice-model-disclaimer.md). The disclaimer is load-bearing: the voice/STT model the user picks changes both how well their speech is received and the cost per turn. State it before they commit, never after.

## Already have voice set up?

`voice/` is your folder, gitignored, copied there once from this skill's
`runtime/` templates. An update refreshes the templates and leaves your copy
alone, because that folder holds your `config.json` and your brain command.

So after an update that changed the runtime, copy the two files across:
`skills/add-voice/runtime/server.py` and `runtime/index.html` over
`voice/server.py` and `voice/index.html`. Leave `config.json` where it is.
Saying "update my voice runtime" does exactly that. Re-running
`python skills/add-voice/setup.py` also works, but it rewrites `config.json`,
so prefer the copy.

How to tell: if the page has no **Local ears** toggle, your copy predates v1.55.

## Pre-flight

- If `core/identity.md` does not exist, voice still installs, but say plainly that with no identity the brain answers from a thin context. Offer `/founder-os:setup` first for richer answers. Do not block on it.
- Confirm a local runtime: this skill runs Python and serves a local page. On a web-only surface, walk the steps and stop - do not claim it ran.

## The flow

### 1. Confirm the tier (default to 0)

Say one line: **"I'll set up Tier 0 - you talk, it answers, no key needed. Want fully-local speech or realtime instead, or shall I wire the default?"** Default to Tier 0 unless they ask otherwise. Do not open a menu - one recommendation, the two upgrades named.

### 2. Run the setup

```
python skills/add-voice/setup.py
```

It checks Python, detects the reasoning CLI on PATH (the no-key brain), creates a gitignored `voice/` folder, copies the page and server into it, and writes `voice/config.json` bound to this machine. It installs nothing and needs no key. Add `--port <n>` to change the port, `--start` to launch the server immediately.

Read its output back to the user honestly: what it wired, and whether a reasoning CLI was found. If none was found, ears and save-to-brain still work; conversational answers wait until a CLI is on PATH.

### 3. Start the loop and prove it

```
python voice/server.py
```

It serves `http://127.0.0.1:8765/` and opens it. The user holds **Talk**, speaks, releases; the OS answers out loud. **Save last to brain** appends what they said to `brain/log.md`. Tell them the one honest thing: in Chrome/Edge the browser sends audio to its vendor to transcribe (no key, no cost, not fully local); the faster-whisper upgrade makes it local.

A clean proof is: server serves the page, a spoken turn comes back as a spoken answer, and a save lands a line in `brain/log.md`. Do not say "voice works" until that round-trip has actually happened on the user's machine.

## Tier 1 - realtime voice (the opt-in upgrade)

Trigger: **"add voice --realtime"**, "add realtime voice", "I want a real conversation", "make it talk back instantly". This is the sub-second streaming loop: a realtime model (Gemini Live) hears you, takes turns with native voice detection, and speaks back in its own voice, while the reasoning CLI you already run stays the back-brain that reads your files. It sits ON TOP of Tier 0; it does not replace it. Two models, two jobs - detail in [references/realtime-architecture.md](references/realtime-architecture.md).

It is NOT zero-cost or zero-install, and you say so BEFORE installing:

1. **Disclaimer first (load-bearing).** A FREE Google AI Studio key has a free daily quota on Flash models; heavy realtime use can move you onto paid per-token rates. Audio streams to Google to run the model. Your files never leave your machine, but anything the front SPEAKS was sent to Google first - including the answer the back-brain read out of your files. The file stays home; the sentence does not. State this before they commit, not after. `setup_realtime.py` prints it at the top; you say it in conversation too. Full trade in [references/voice-model-disclaimer.md](references/voice-model-disclaimer.md).
2. **Get and store your own free key (the OS ships none).** The user creates their own free key at https://aistudio.google.com/apikey, in their own Google account. Setup wires everything else so they only drop the key in. Store it via the connect flow so it lands only in the gitignored `.env`: say "connect gemini" or run `python scripts/connect.py set-secret GEMINI_API_KEY` (pasted on stdin, never an argument). A second key (`GEMINI_API_KEY2`) is optional headroom the front rotates to on quota. Never ship, hardcode, or provide a key.
3. **Run the installer.** `python skills/add-voice/setup_realtime.py` installs two packages (google-genai, websockets - a real install), copies the realtime page and bridge into the gitignored `voice/`, writes `voice/realtime-config.json`, and inherits the Tier-0 brain command. Pick a voice with `--voice <name>` (Aoede default; Puck, Charon, Kore, Fenrir, Leda also work). `python voice/live_server.py --models` lists the Live models your key exposes if the default is unavailable.
4. **Start it and prove it.** `python voice/live_server.py` serves `http://127.0.0.1:8756/live`. Tap the orb, allow the mic, talk. Say "thinking" out loud to take the floor and it waits. Every turn records to `voice/live-log.md` (local-only). A clean proof is a spoken turn answered in the model's own voice, plus a business-fact question that visibly calls the brain. Do not claim realtime works until that has happened on the user's machine with their own key.

The realtime tools READ your OS (today, this week, what changed, query the brain) and make one safe, reversible append (save a note to your log). Sending, posting, and computer control are a SEPARATE gated capability ("add hands"), never in this tier - the front will say plainly it cannot do those yet rather than stall a live conversation.

## What it does and does not do

- **Does:** wire a local voice loop on the user's machine, no key, no paid service; keep the brain (files + answers) local; log each turn to `voice/runtime-log.jsonl` (local-only) so failures are visible; degrade honestly when a reasoning CLI or browser STT is absent.
- **Does not:** send a message, take any irreversible action, or claim to be local when the browser STT is not. Send-power and computer-control are not in this skill. If they are added later, they get an explicit confirm gate first.

## The guardrails this skill is built against

These are the three failure modes the design defends against (see [references/troubleshooting.md](references/troubleshooting.md)):

1. **"The site can't be reached."** The server is a plain local process - if the terminal closed, it is gone. Restart with `python voice/server.py`.
2. **Errors after a long session.** The brain context is kept deliberately lean (a short preamble + a small identity slice, never the whole repo) so a long session does not bloat and fail. If answers degrade, restart the server.
3. **A silent failure.** Every turn is logged and every boundary catches its error and returns a spoken message, never a dead-end.

## Runtime honesty

This skill needs a local runtime. On a web-only agent that cannot run Python or serve a page, do not claim voice is installed. Walk the user through the same steps and say plainly that the setup and the loop have to run in Claude Code (or any local-runtime agent pointed at the folder).

No em dashes or en dashes in anything you write here. Hyphens only.
