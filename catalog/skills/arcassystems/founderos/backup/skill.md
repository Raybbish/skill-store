---
name: backup
description: >
  Back up the founder's OS to a destination they choose, on command only. Trigger on "back this up", "back up my OS", "set up a backup", "push this somewhere safe", "mirror this offsite", or any plain request to keep an offsite copy. Destination-agnostic: GitHub is the recommended default for long-term durability, but OneDrive, Notion, or staying purely local are all first-class. Never forces a GitHub account or a new tool. Local version control already works fully without this; backup is the next level, not a requirement.
why: "Owning your files means choosing where the safety net lives. Forcing one destination (a GitHub account, a new tool) would break the autonomy-over-lock-in promise. The founder picks; the OS does the wiring or hands them the steps."
enhance: "Once a backup destination is set, run a backup after any big work session. The GitHub path can re-push with one ask; the file-copy paths take one command."
allowed-tools: ["Bash", "Read"]
mcp_requirements: []
---

# Backup

Runs on: local-exec - runs a local script; on a cloud surface I read the results, I do not run it.

Keep an offsite copy of the founder's OS, to a destination they choose. On command only. Opt-in. Local version control (save, history, restore) already works fully without any of this; backup is the next level.

## Pre-flight

- If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`
- Make clear up front: nothing here is required. Their files and full version history live on their machine already. This adds an offsite copy.

## Step 1: pick a destination

Offer these, with the honest trade-off, and let the founder choose. Do not force one.

- **GitHub (recommended for long-term durability).** A private repo they own. Best for keeping full version history offsite and restoring on a new machine. Needs a free GitHub account and the `gh` CLI.
- **OneDrive, Dropbox, or iCloud.** Simplest if they already use one. The folder syncs as files; version history rides along inside the `.git` folder.
- **Notion.** A reference mirror only, not a live restore target. Useful if Notion is their home base, but it does not preserve git history. Be honest about that limit.
- **Stay local.** A valid choice. Their work is already saved and undoable locally. Offer to revisit backup later.

## Step 2: wire the chosen destination

### GitHub
Do NOT re-implement gh auth or repo creation here. Use the `github-ops` skill (read `skills/github-ops/SKILL.md`).
1. Check `gh auth status`. If not authenticated, give the founder the exact step (`gh auth login`) and stop until done. Do not pretend it is connected.
2. Create a PRIVATE repo they own: `gh repo create <name> --private --source . --remote origin` (confirm the name with them first).
3. Push: `git push -u origin <current-branch>`. Only on the founder's explicit yes. Never force push.
4. Confirm the push landed (`gh repo view --web` or report the repo URL). Do not claim it pushed until `git push` returned success.

### OneDrive / Dropbox / iCloud
If the OS folder is already inside the synced folder, it is already backing up; confirm the path and say so. If not, give the founder the move: copy the whole OS folder (including the hidden `.git` folder, which holds the version history) into their synced folder, then open it from there. Offer to do the copy if they give a destination path.

### Notion
Be explicit that this is a reference mirror, not a restore point. If they want it, hand them the manual export step (or use a Notion MCP only if one is connected and they ask). Do not claim history is preserved.

### Local copy
Copy the whole OS folder, including the `.git` folder, to the path they name. One command, plain confirmation of where it landed.

## Step 3: degrade honestly

If the chosen tool is missing or unauthenticated (no `gh`, not logged in, no synced folder), do NOT fake success. Print the exact steps the founder needs and stop. Say plainly what is and is not done.

## Runtime honesty

This verb runs local commands (git, gh, file copy). On a surface that cannot run them, say so and hand the founder the steps for their chosen destination; do not claim a backup ran.

## Rules

- On command only. Never back up on your own.
- Never force a GitHub account or any single destination.
- The GitHub path reuses `github-ops`. Do not duplicate gh logic here.
- Never force push. Never push without an explicit yes.
- Never claim a backup happened until the command returned success.
- No em dashes or en dashes. Hyphens only.
