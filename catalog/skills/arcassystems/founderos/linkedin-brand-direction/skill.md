---
name: linkedin-brand-direction
description: >
  Turn your real LinkedIn network plus your goal into a personalised, algorithm-aware content direction. Trigger on "what should I post on LinkedIn", "what's my content lane", "give me a LinkedIn content direction", "what does my network reward", or after a power audit when the user wants a brand strategy. Reads the network composition from linkedin-power-audit's audit.json (or falls back to the network-scan.json composition), the person's stated goal, and the shared algorithm reference, then writes a defined-schema brand-direction.json that linkedin-post consumes. Every claim traces to a real fact in the user's own network - no generic tips, no invented numbers.
why: "Generic LinkedIn advice ignores the one thing that matters - what THIS person's network actually rewards. Conditioning the direction on real network composition plus the dated algorithm facts turns 'post more carousels' into 'your network is 41% ops leaders, so own the ops-systems lane in document carousels three times a week'."
enhance: "Run linkedin-power-audit first so the direction reads from a full audit.json (network composition, content lanes, brand strengths) instead of the lighter scan composition. The richer the input, the more specific the lane evidence."
summary: "A content direction conditioned on your real network, not generic tips."
allowed-tools: ["Read", "Write", "Bash"]
mcp_requirements: []
---

# LinkedIn Brand Direction

Runs on: local-writes - reads your audit and the algorithm reference, then writes `brand-direction.json` outside the repo and refreshes the local pack-state pointer.

This is the personalisation engine of the LinkedIn pack. It does not give generic advice. It reads the composition of your actual network, your goal, and the dated algorithm facts, and returns a concrete direction tied to evidence from your own data. `linkedin-post` then writes posts from that direction.

Known limitation: Algorithm facts are reverse-engineered and dated. If `skills/linkedin-pack-references/linkedin-algorithm.md`'s `last_verified` stamp is over ~90 days old, re-verify before trusting specifics.

## Inputs (in priority order)

1. **Network composition.** Prefer `audit.json` from `linkedin-power-audit` (richest: role distribution, content lanes, brand signals). If it is absent, fall back to `network-scan.json` from `linkedin-network-scan` (carries the qualified-lead composition, ICP, and totals). If neither exists, stop and tell the user to run `linkedin-power-audit` (best) or at least `linkedin-network-scan` first - do not invent a composition.
2. **The goal.** Ask one question if it is not already known from `core/identity.md` or the prior session: "What is this brand for - winning clients, getting hired, or being known in a space?" The direction aims at that goal.
3. **The algorithm reference.** Read `skills/linkedin-pack-references/linkedin-algorithm.md`. If it is missing, say "algorithm reference not found, using conservative defaults" and use only format-and-cadence basics.

## The output contract (fixed schema - do not invent field names)

Write `brand-direction.json` into the user's scan/audit output folder (the same folder the scan wrote to, OUTSIDE any git repo). The schema is fixed so `linkedin-post` can read it without guessing:

```json
{
  "goal": "clients | job | brand",
  "topic_lane": "the lane the network already rewards, with the evidence (e.g. 'ops and supply-chain - 41% of your qualified network')",
  "positioning_angle": "one line - the angle that lane gives you",
  "format_mix": [
    {"format": "document carousel", "why": "tops the reach ladder; your lane is explainer-friendly"},
    {"format": "native short video", "why": "second on the ladder; good for a face-to-camera take"}
  ],
  "cadence": "e.g. 3x/week",
  "first_three_posts": [
    {"hook": "first line that earns the 'see more' tap", "angle": "what it argues", "format": "document carousel"},
    {"hook": "...", "angle": "...", "format": "text"},
    {"hook": "...", "angle": "...", "format": "native short video"}
  ],
  "evidence": [
    "topic_lane: 41% of the 220 qualified connections hold an ops or supply-chain title (network-scan.json)",
    "format_mix: document carousels lead the reach ladder (linkedin-algorithm.md, data-backed)"
  ]
}
```

The machine-readable contract is `brand-direction.schema.json`. Do not add stable fields without updating that schema and the tracked acceptance test.

### Rules for filling the schema

- **`topic_lane`** must name the lane the data supports and carry the number behind it. Derive it from the role/industry concentration in the composition, not from a guess about the person.
- **`positioning_angle`** is one line, grounded in the lane plus the goal.
- **`format_mix`** follows the current evidence: documents/carousels are strong and underused, images are reliable, strong text can work, and video is not assumed to rank second. Each entry carries a one-line `why`.
- **`cadence`** comes from the algorithm reference's conservative current range of 2 to 4 posts per week. State a specific number.
- **`first_three_posts`** are three concrete starts, each a hook plus angle plus a format from the mix. The hooks must pass the "see more" test (would a reader tap?).
- **`evidence`** is the spine. Every claim in the direction traces to either a real number in the composition file or a labelled fact in the algorithm reference. If you cannot trace a claim, cut it. No invented percentages, no made-up audience.

## No hallucination

The whole value here is that the direction is real. Do not invent a network composition, a percentage, or an audience the data does not show. If the composition is thin (a small or unscored network), say so and give a narrower, honest direction rather than padding it with generic advice. Carry the export's limits forward: title-only, point-in-time, no firmographics, email mostly blank.

## Handoff

Write or refresh `~/.founder-os/linkedin-pack-state.json` with `latest_output` and `brand_direction` pointing to the completed bundle. Tell the user the direction is written to `brand-direction.json` and that `linkedin-post` will read the pointer automatically on the next post request. If they want to act now, route straight to `linkedin-post`.

## Files

- `skills/linkedin-pack-references/linkedin-algorithm.md` - the dated algorithm facts this skill reads.
- `brand-direction.schema.json` - exact output contract.
- `linkedin-power-audit` - produces the `audit.json` this skill prefers as input.
- `linkedin-network-scan` - produces the `network-scan.json` fallback composition.
- `linkedin-post` - the consumer of `brand-direction.json`.
