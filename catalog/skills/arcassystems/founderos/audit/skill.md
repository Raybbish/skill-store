---
name: audit
description: Audit the OS in one composite report. Say "audit the OS", "check OS health", "full audit", or "is the OS healthy" (or run /founder-os:audit). Runs readiness, lint, wiki graph state, brain staleness, and voice completeness together. Read-only.
why: "Gives you one honest number for OS health so you know what to fix instead of guessing which layer is causing bad output."
enhance: "Run after a sprint roll so cadence files are fresh - stale daily-anchors and empty brain log are the two checks most likely to drag your score down."
allowed-tools: ["Read", "Glob", "Grep", "Bash", "Agent"]
mcp_requirements: []
---

# Audit

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

This skill returns one Founder OS health report. It composes five checks that can also run on their own.

## Pre-Flight

If `core/identity.md` does not exist, stop with: `Founder OS not set up here. Run /founder-os:setup first.`

## Checks

Run all five checks. Sequential by default; parallel only if explicitly available.

**Parallel path (preferred when the Agent tool is exposed in this Claude Code build):** dispatch five sub-agents in a single message, one per check, each with a focused prompt that names the check and the expected output shape. Then merge the five results into the composite block.

**Sequential path (fallback - applies if the Agent tool is not available, if a sub-agent fails, or if you are unsure):** read `skills/<check>/SKILL.md` for each of the five checks below and apply its logic inline against the live OS. Mark the report `parallel: unavailable`.

For checks 4 and 5 there is no separate skill file - apply the rules below inline regardless of path.

1. **readiness-check** - read `skills/readiness-check/SKILL.md` and apply. Returns score and next 3 moves.
2. **lint** - read `skills/lint/SKILL.md` and apply. Returns broken links, orphans, stale content, provenance gaps, possible contradictions.
3. **wiki-build state** - read `brain/relations.yaml` and report counts of curated edges and auto-generated wikilinks. Do NOT run wiki-build itself unless the user has approved the write at the gate above. If `brain/relations.yaml` does not exist, return `wiki: not initialised - run /founder-os:wiki-build to create it`.
4. **Brain staleness** - count entries past `Decay after`, flags older than Week 3, and rants in `brain/rants/` older than 30 days where `processed: false`.
5. **Voice completeness** - check whether `core/voice-profile.yml` and `core/brand-profile.yml` exist and have been filled past their template defaults.

## Wiki Write Gate

Audit is read-only by default. `wiki-build` writes to `brain/relations.yaml`, so ask before running it:

`Audit can refresh the wiki graph before scoring. This writes only to brain/relations.yaml. Run wiki-build first? yes / no`

If the user says no, read the existing graph and mark wiki freshness as not refreshed.

## Composite Output

Render only the composite report. Do not paste raw sub-check outputs.

```text
FOUNDER OS HEALTH - <YYYY-MM-DD>
---
Readiness: <score>/100 - <one-line headline>
Wiki: <links count>, <orphans count>, <broken refs count>
Brain: <decay-due count>, <Week 3+ flags>, <stale rants>
Voice: <state>
Parallel: available | unavailable
---
Top 3 actions to lift health:
1. <action>
2. <action>
3. <action>
```

## Brain Staleness Rules

- `Decay after:` date in the past counts as decay-due.
- Any flag marked Week 3, Week 3+, or older than 21 days counts as Week 3+.
- Any file in `brain/rants/` older than 30 days with `processed: false` counts as stale.

## Voice Completeness Rules

Voice is incomplete if:

- `core/voice-profile.yml` is missing.
- It still contains placeholder brackets or template examples.
- It has fewer than 2 writing samples referenced.

Brand is incomplete if:

- `core/brand-profile.yml` is missing.
- Colors, fonts, logo, or document style are still blank placeholders.

## Rules

- Read-only unless the user approves wiki-build.
- The composite report is the only output.

<!-- private-tag: not applicable: audit reads and reports; any brain/ reference is to files being read, not user-speech writes -->
