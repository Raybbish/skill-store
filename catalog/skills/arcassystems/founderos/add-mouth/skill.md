---
name: add-mouth
description: >
  Give your Founder OS a mouth - have it read an answer out loud or render it to an audio
  file, from any skill, without the full conversational voice loop. Trigger on "add a mouth",
  "add mouth", "read this out loud", "let it speak", "give it a voice out", or "set up
  text-to-speech". The default holds the accessibility floor: your operating system's
  built-in speech (Windows SAPI, macOS say, Linux espeak), NO extra key and NO paid service.
  A free fully-local upgrade (Piper) gives a better voice offline; a premium mouth
  (ElevenLabs) is an opt-in paid choice, never the default. This is the swappable "mouth"
  from the brain / mouth / hands scaffold - it plugs into the same brain as text or voice.
why: "The mouth is separate from the full voice loop on purpose: a founder often wants an answer read aloud (a brief while driving, a draft heard back) without holding a conversation. Shipping it as its own tiered skill keeps the accessibility floor - a real, keyless, local default - and makes the better and premium voices clean opt-in upgrades with their cost stated up front."
enhance: "Want a better voice that still never leaves your machine? Add the free Piper upgrade in references/mouth-options.md. Want broadcast quality for something you publish? ElevenLabs is the paid mouth - a deliberate spend, stated before you commit, never on by default."
summary: "Have your OS read an answer out loud - default needs no key."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# Add a mouth

Runs on: local-exec - the happy path runs a local Python setup that writes a gitignored `voice/` config and a `say` helper, then speaks through your machine. On a read-only or cloud surface, explain the options but do NOT claim the mouth is wired or that anything spoke - it has not until the user runs it locally.

The OS ships complete as text. This adds a mouth: it can speak an answer out loud or render it to an audio file you keep. It is the voice-OUT half of the sensory layer, and it is deliberately separate from `add-voice` (the full talk-and-listen loop). You can have a mouth without ever holding a conversation - useful when you want a brief read back while your hands are busy, or a draft heard aloud before you send it.

This is the swappable **mouth** from the brain / mouth / hands scaffold. The brain (your files and answers) stays the same; the mouth is how it speaks. Nothing here is required.

## The accessibility floor (the rule that governs the default)

The default mouth is your operating system's own built-in speech - Windows SAPI, macOS `say`, Linux `espeak` or `spd-say`. **No extra key, no paid service, no pip install, no model download.** It speaks on the subscription-free tools your machine already has. Everything past that is opt-in and disclosed.

## The options

| Option | What it adds | Needs | Default? |
| --- | --- | --- | --- |
| **OS-native** | Speak through your machine's built-in voice; render to a file | nothing extra | YES |
| **Piper** | A noticeably better voice that still runs fully offline | one download + Piper on PATH | no - opt-in, free |
| **ElevenLabs** | Broadcast-quality voice for something you publish | a paid API key | no - opt-in, paid |
| **Browser** | The voice the `add-voice` page already uses, inside that loop | the `add-voice` skill | no - that is the voice loop |

Full detail, the exact install per option, and the cost-and-locality trade are in [references/mouth-options.md](references/mouth-options.md). The trade is load-bearing: the engine you pick changes voice quality, whether your text leaves the machine, and whether it costs anything. State it before they commit, never after.

## Pre-flight

- A mouth needs something to say. It reads text you pass it or pipe in; it does not generate content. If the user wants the OS to "read today's brief", they run the brief skill and pipe its text to the mouth.
- Confirm a local runtime: this skill runs Python and your machine's speech tools. On a web-only surface, walk the options and stop - do not claim it spoke.

## The flow

### 1. Confirm the option (default to OS-native)

Say one line: **"I'll wire the OS-native mouth - it speaks through your machine, no key needed. Want the better offline voice (Piper, free, one download) or a premium one (ElevenLabs, paid) instead, or shall I wire the default?"** Default to OS-native unless they ask otherwise. One recommendation, the upgrades named, no open menu.

### 2. Run the setup

```
python skills/add-mouth/setup.py
```

It detects which mouths your machine can use right now (OS-native is almost always available; it checks whether Piper is on PATH and whether an ElevenLabs key is present in `.env`), writes `voice/mouth-config.json` bound to this machine, and copies a `say` helper into the gitignored `voice/`. It installs nothing and needs no key. Pass `--engine piper` or `--engine elevenlabs` to pick an upgrade you have already set up; pass `--voice <name>` to choose a voice the engine offers.

Read its output back honestly: which engine it wired, and which upgrades are available versus not yet set up.

### 3. Speak something and prove it

```
python voice/say.py "Your three priorities today are ..."
echo "read this back to me" | python voice/say.py
python voice/say.py --out brief.wav "render this to a file instead of speaking"
```

The OS-native and Piper mouths write a `.wav` file (an `.aiff` on macOS); only the ElevenLabs mouth writes `.mp3`. Use the extension the chosen engine produces. A clean proof is: a line you pass comes back as speech through your machine, and `--out` writes a playable audio file. Do not say "the mouth works" until that has happened on the user's machine.

## What it does and does not do

- **Does:** speak text through a free, keyless, local mouth by default; render to an audio file; let any skill pipe its output to the mouth; swap to a better free voice (Piper) or a premium one (ElevenLabs) on request, with the trade stated first; degrade honestly when an engine is not present.
- **Does not:** generate content (it speaks what it is given), send or publish the audio anywhere, or claim to be local when ElevenLabs is the chosen engine (that sends your text to ElevenLabs to synthesize). Sending or posting the audio is an action - that belongs to `add-hands`, behind its confirm gate, not here.

## The guardrails this skill is built against

1. **A silent paid charge.** ElevenLabs is never the default and never auto-selected; it is wired only when the user asks for it and only after the cost note. The default mouth cannot bill you.
2. **A false "local" claim.** OS-native and Piper are fully local; ElevenLabs is not. The config records which engine is active and `say.py` prints the locality of the engine it used, so a user is never misled about where their text went.
3. **A dead end when an engine is missing.** No Piper on PATH or no key present falls back to the OS-native mouth with a plain message, never a traceback.

## Runtime honesty

This skill needs a local runtime. On a web-only agent that cannot run Python or your machine's speech tools, do not claim a mouth is installed. Walk the user through the same options and say plainly the setup and the speaking have to run in Claude Code (or any local-runtime agent pointed at the folder).

No em dashes or en dashes in anything you write here. Hyphens only.
