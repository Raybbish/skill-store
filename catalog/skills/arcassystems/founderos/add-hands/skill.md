---
name: add-hands
description: >
  Give your Founder OS hands - let it DO things, not just answer. Trigger on "add hands",
  "let it do things", "give it hands", "let it take actions", or "set up actions". The
  default ships only SAFE, reversible, local actions (open a file, folder, app, or link;
  save a note to your log) that run with no confirmation. Anything irreversible or
  outward-facing - running a command, and later sending or posting - passes a confirm gate
  and is OFF until you turn it on. Computer control (driving your screen) is NOT shipped; it
  is named as a later capability, gated when it lands. This is the swappable "hands" from the
  brain / mouth / hands scaffold, and the confirm gate is the whole point: the OS never takes
  an action you cannot undo without asking you first.
why: "Hands are where an assistant stops being safe by default. The honest design is a gate, not a feature list: safe and reversible actions run freely so the OS is useful, and every irreversible or outward-facing action stops for an explicit yes. Shipping the gate as the core - with sending, posting, and computer-use named as not-yet rather than implied - keeps the people-first line and never promises an action the OS cannot take safely."
enhance: "The default hands open things and save notes - reversible, local, no confirmation. To let the OS run commands for you, turn that on in voice/hands-config.json; it then stops for an explicit yes every time and shows you exactly what it will run. Sending, posting, and computer control are not built yet - when they are, they arrive behind the same gate."
summary: "Let your OS open things and save notes; risky actions ask first."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# Add hands

Runs on: local-exec - the happy path runs a local Python setup and a local action dispatcher. On a read-only or cloud surface, explain the actions and the gate but do NOT take any action or claim one ran - it has not until the user runs it locally.

The OS ships complete as a brain that reads and answers. This adds hands: the ability to act on what it decides. It is the swappable **hands** from the brain / mouth / hands scaffold. The brain stays the same; the hands are how it reaches out and does something. Nothing here is required, and nothing irreversible happens without you saying yes.

## The rule that governs everything here: the confirm gate

Every action is one of three classes, and the class decides what happens:

- **Auto (safe, reversible, local):** runs with no confirmation. Open a file, a folder, an app, or a link. Save a note to your log (an append you can delete). These cannot lose work or reach outside your machine, so stopping for a yes would only annoy you.
- **Confirm (irreversible or outward-facing):** stops for an explicit yes every time, and shows you exactly what it will do first. Running a command is the shipped example. It is OFF by default - you turn it on deliberately in `voice/hands-config.json`.
- **Blocked / not built:** sending, posting, and computer control. They are named honestly as not yet built. When they are added, they arrive in the Confirm class, behind this same gate. The OS says plainly it cannot do them yet rather than pretending or stalling.

This mirrors the OS's existing approval-gates rule for irreversible actions. Hands do not invent a new safety model; they apply the one the OS already has to real actions.

## The accessibility floor

The default hands need NO key, NO paid service, and NO pip install. Opening things and saving notes use tools your machine already has. Everything past that is opt-in.

## Pre-flight

- Confirm a local runtime: this skill runs Python and your machine's file/app openers. On a web-only surface, walk the actions and the gate and stop - do not take any action or claim one ran.
- A note action appends to `brain/log.md`. If that file does not exist yet, the dispatcher creates it; say so plainly rather than failing.

## The flow

### 1. Wire the default hands

```
python skills/add-hands/setup.py
```

It writes `voice/hands-config.json` (the action classes and which are enabled) and copies the action dispatcher into the gitignored `voice/`. By default only the Auto handlers (open, note) are enabled; the Confirm handler (run) is wired but OFF. It installs nothing and needs no key.

Read its output back honestly: which actions are on, and that running commands is off until the user turns it on.

### 2. Use the safe hands and prove it

```
python voice/hands.py open .                          # open the OS folder in your file manager
python voice/hands.py open https://example.com        # open a link in your browser
python voice/hands.py note "called the supplier, waiting on a quote"   # append to brain/log.md
```

A clean proof is: `open` brings up the folder or link, and `note` lands a dated line in `brain/log.md`. Both are reversible. Do not say "hands work" until that has happened on the user's machine.

### 3. (Optional) turn on the gated command runner

Only if the user asks. Set `handlers.run.enabled` to `true` in `voice/hands-config.json`. Then:

```
python voice/hands.py run "git status"          # prints what it will run, then refuses without --yes
python voice/hands.py run "git status" --yes    # runs it - the explicit yes is the gate
```

Without `--yes`, the dispatcher shows the exact command and stops. The `--yes` is the confirmation; the OS never supplies it on its own. This is the gate working on a genuinely irreversible action. The command runs through your shell, exactly as shown, so pipes and operators (`|`, `&&`, `;`) work - which is also why you confirm only commands you understand.

## What it does and does not do

- **Does:** open files, folders, apps, and links; append a note to your log; optionally run a command you have enabled and confirmed; refuse, with a plain message, any action that is off or not built; keep every confirm-class action behind an explicit yes that shows the action first.
- **Honors the `<private>` exclusion tag.** A note can carry a `<private>...</private>` block you do not want saved; the dispatcher strips every such block before it writes to `brain/log.md`, and if the whole note is tagged private it writes nothing and says so. Same filter the brain-log, dream, and rant surfaces use.

<!-- private-tag: not applicable to open/run: those take no free-text user content; the note action above honors the <private> filter in code (see runtime/hands.py strip_private). -->

- **Does not:** send a message, post anything, push to a remote, delete or overwrite a file, or control your screen. Those are not built. The dispatcher says so rather than improvising. When sending or computer-use are added, they enter the Confirm class behind this gate, never auto-run.

## The guardrails this skill is built against

1. **An irreversible action with no ask.** The gate is the design, not a wrapper. Confirm-class actions cannot run without an explicit `--yes`, and the dispatcher prints the action before it asks, so a yes is informed.
2. **A promised action the OS cannot take.** Sending, posting, and computer control are named as not built. The dispatcher refuses them with a clear message instead of half-doing or pretending.
3. **Silent scope creep.** Enabling the command runner is a deliberate edit to `hands-config.json` by the user, not a default and not something a skill flips on. Off stays off until the owner turns it on.

## Runtime honesty

This skill needs a local runtime. On a web-only agent that cannot run Python or open local apps, do not claim hands are installed or that any action ran. Walk the user through the actions and the gate and say plainly the setup and the actions have to run in Claude Code (or any local-runtime agent pointed at the folder).

No em dashes or en dashes in anything you write here. Hyphens only.
