---
name: founder-os-setup
description: >
  Set up Founder OS from scratch, or adopt it into an existing notes folder. Fires on any natural-language onboarding ask, including: "set up Founder OS", "set up my second brain", "help me set up my second brain", "help me onboard", "onboard me", "what do I do", "where do I start", "how does this work", "I'm new", "get me started", "run the setup wizard", "install Founder OS" - and the adopt path: "I already have notes", "I already have an Obsidian vault", "set up inside my vault", "adopt my existing notes" (or run /founder-os:setup). Walks the operator through identity, tool stack, work style, brain system, cadence, roles, and the first project as an interactive wizard - it adapts to your role, founder or employee, rather than assuming you own the company. Pass "reset" to reconfigure an existing setup.
argument-hint: "[reset] - run with 'reset' to reconfigure an existing setup"
why: "Creates the full operating environment in one guided session so skills have the files they need to produce personalized output from day one instead of returning generic defaults."
enhance: "Answer the positioning questions in Phase 0.2.5 as specifically as possible - who the business sells to, what it sells, and the buyer pain feed directly into proposal-writer, linkedin-post, and client-update."
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
mcp_requirements: []
---

# Founder OS Setup Wizard

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

## Surface check - do this first, before Phase 0.0

Setup writes real files. Before you frame anything, confirm the surface you are on can write to the operator's OS folder:

- **Claude Code (local, write access):** full setup. Proceed normally.
- **Any surface that cannot write to a folder on the founder's machine** (claude.ai chat, Claude Code on the web, Cowork without a connected folder and the desktop app open, or any read-only surface): do NOT pretend setup ran. Say so in one sentence, then offer the honest path: "Setup writes files to a folder on your machine and this surface can't do that. I can still walk you through every question and draft each file here for you to paste in, or you can run this in Claude Code for full automation - your call." Then either draft-and-hand-off, or stop. Never claim a file was written, git was wired, or a hook was installed when it was not.

If you are unsure whether you can write, attempt one small write to the OS folder and check it landed. If it did not, you are on a degraded surface - take the path above.

You are running an interactive setup wizard that builds a complete operating environment for one person using Claude Code - a founder, or an employee running a role inside a company. Follow the phases IN ORDER. Ask ONE question at a time. Wait for the answer before moving on.

This file is the router. Each phase's full procedure lives in a `references/` file. **Load the reference for the phase you are in, when you reach it - not all at once.** Carrying every phase's detail up front is exactly the context waste this product tells founders to avoid. The references hold the verbatim procedure; nothing about what setup produces changes - only when the detail loads.

## Rules

- Ask ONE question at a time. Wait for the answer.
- When a step requires user input, show what you'll create BEFORE creating it. Get a "yes" or adjustment.
- When creating folders, check what already exists first. Don't overwrite. Don't duplicate.
- Keep CLAUDE.md files LEAN. Global under 80 lines. Company under 60. Project under 40. Bootloader under 120.
- Track everything skipped or deferred in a BACKLOG at the end of the setup.
- After each phase, show a quick status: what's done, what's next.
- If the user says "skip" or "later", log it and move on. Don't push back.

## Handling Real Human Input

People don't answer questions like a form. They ramble, go on tangents, answer three questions at once, skip ahead, circle back, and think out loud. This is expected. Handle it:

- **If they answer multiple questions in one response:** Extract all the answers. Mark those questions as answered. Move to the next unanswered question. Don't re-ask what they already told you.
- **If they go on a tangent:** Extract anything useful from the tangent (business context, priorities, pain points, tool preferences). Log it. Gently return to the current question without making them feel corrected.
- **If they skip a question:** Move on. Come back to it later if the answer becomes important for file generation. If it never matters, leave it blank.
- **If they give a partial answer:** Use what you got. Only ask for the specific missing piece, not the whole question again.
- **If they contradict themselves:** Use the most recent answer. Don't flag contradictions unless they materially affect the setup.
- **If they dump everything at once:** Great. Parse it all, map answers to phases, and skip ahead to wherever you have enough info to start building. Show them what you captured and what's still missing.
- **Never ask the user to be more structured.** Adapt to them. That's the whole point of this system.

## Before you write any file

Setup writes from `templates/`, which ships at the install root (resolved by install method: Plugin folder, git-clone repo root, or curl install root). Read each template before you generate the personalized version. The full path-resolution rule and the complete template file list live at the top of `references/identity-and-global.md` - read it before Phase 1.

If the user passed "reset": scan for an existing Founder OS folder, confirm they want to reconfigure, then re-run discovery.

## Phase map - load the reference when you reach the phase

Run the phases in order. When you reach a phase, read its reference file for the full procedure, then execute it. Load only the phase you are in.

| Phase | What it does | Load |
|-------|--------------|------|
| 0.0 + 0 | Python preflight (three probes, stop before the interview if missing), frame the second-brain contract, then run discovery: identity, role, variant read, positioning, the snapshot (Founder or Role - the fields the OS proposes from), workstreams, priorities, tool stack, work style, privacy, observation opt-in. | `references/discovery.md` |
| 1 | Draft `core/identity.md` + `core/profile.md`, write the global `~/.claude/CLAUDE.md`, seed the auto-memory layer, optionally tidy global settings. | `references/identity-and-global.md` |
| 2 | Create the full folder structure (the file tree), copy hooks + scripts byte-for-byte, run every placeholder substitution, seed brain content, init git + wire the privacy guard, set the first weekly sprint. Includes the adopt path: setting up inside an existing notes folder without touching a single existing file. | `references/root-structure.md` |
| 3 | Company folders + business-context file + company `.mcp.json`. | `references/projects.md` |
| 4 | Build the top priority as the reference project, with a live test. | `references/projects.md` |
| 5 | Write `stack.json`, skeleton the remaining workstreams, verify context isolation. | `references/projects.md` |
| 6 | Final commit, run the post-setup tour (reflect the snapshot, run the first in-flow proposal, show the files they now own + three next moves), detect the command prefix, open with the operator's profile, walk the natural-language orientation, run the automatic `verify` health check before the finish line, save the backlog. | `references/orientation.md` |

## After every phase

Show a quick status: what is done, what is next. Track anything skipped or deferred in the backlog (`core/setup-backlog.md`), not scattered across other files. The backlog is shown and saved in Phase 6.3.

**Write the resume marker (mandatory, same moment as the status).** Setup takes 15 to 20 minutes and sessions get closed mid-way. Before these markers, an interrupted setup reopened as an ordinary session with no explanation, because the launchers branched on `core/identity.md` - written in Phase 1, five phases before setup is actually done. Two files fix that:

- **The moment setup starts, before Phase 1 writes anything**, delete `state/setup-complete.json` if it is there. A re-run is an unfinished setup from that instant on, and leaving the old completion marker in place means both markers exist together, completion wins the tie, and an interrupted re-run reopens as an ordinary session with no explanation - the precise failure the markers exist to end.
- After EVERY phase completes, write `state/setup-progress.json` (create `state/` if needed):
  `{"finished_phase": "<the phase that just completed, e.g. 2>", "next_phase": "<the next one>", "updated": "<YYYY-MM-DD>"}`
- After Phase 6's verify health check passes - and not one moment earlier - write `state/setup-complete.json`:
  `{"version": "<the VERSION file's content>", "completed": "<YYYY-MM-DD>"}`
  then delete `state/setup-progress.json`. Completion means the tour ran and verify passed, not that files exist.

**Resuming.** When you are started with a resume instruction, or `state/setup-progress.json` exists without `state/setup-complete.json`, read the marker, say in one plain sentence where setup stopped ("We got through building your folders last time - picking up at your company setup"), and continue from `next_phase`. Do not restart the interview and do not re-ask anything already answered - the files on disk are the record of what was answered. If the marker is unreadable, work out the furthest complete phase from what exists on disk (identity file, folder tree, company folders, first project) and resume after it, saying that is what you did.
