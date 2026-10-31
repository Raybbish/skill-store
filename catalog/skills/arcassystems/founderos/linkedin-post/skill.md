---
name: linkedin-post
description: >
  Write a LinkedIn post in the founder's voice. Trigger on "write a LinkedIn post", "draft a post", "post about this", "make this a LinkedIn post", "turn this into a post", "I want to share this on LinkedIn", or any mention of "LinkedIn" in the context of creating content. Also fires when the user shares an idea, insight, or experience and wants it shaped into a post. Covers founder stories, leadership insights, hiring perspectives, AI commentary, systems thinking, and business-related content. Reads `core/voice-profile.yml`.
why: "Produces posts that sound like you wrote them rather than like a content tool did - voice profile plus brain context means the post is grounded in your actual situation this week."
enhance: "Fill brain/log.md regularly so brain-pass can suggest angles you have not posted recently and flag theme repetition before you draft - a rich log means fresher, non-repetitive content."
allowed-tools: ["Read", "Write", "Edit", "Bash"]
mcp_requirements: []
---

# LinkedIn Post

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

Every post must apply the voice profile in `core/voice-profile.yml`. Before drafting, read `skills/your-voice/SKILL.md` and apply its universal rules in full. The post format, the five post structures, hook priority, closings, the brain-dump workflow, and posting strategy live in `references/post-craft.md` - load it at draft time (after the routing and brain steps below). Then pass the LinkedIn-specific self-check at the bottom of this file.

## Voice routing (operator or brand?)

Before any gate or draft, decide which voice this post uses. Apply the routing rules in `skills/your-voice/SKILL.md` "Voice routing - operator or brand?" section.

- If the user asked for a personal LinkedIn post (default for this skill), use operator voice from `core/voice-profile.yml`.
- If the user named a brand they run (e.g. "post for `<brand>` on LinkedIn"), use brand voice from `brands/<slug>/voice.yml`.

If `brands/` does not exist or has no entries, this section is a no-op and the skill proceeds as today.

## Before you write

If using operator voice, run: `python scripts/check-voice-ready.py`

If using brand voice, run: `python scripts/check-brand-voice-ready.py --brand <slug>`

If exit code is 1, read the output line and surface it to the user verbatim. Do not produce any draft. Stop.

If the user explicitly chooses to proceed with defaults after seeing that message, draft the post using the universal anti-AI baseline from `your-voice` and clearly label that the voice profile was not applied. Do not pretend the post is voice-coupled.

Then read the chosen voice profile (`core/voice-profile.yml` for operator, `brands/<slug>/voice.yml` + `brands/<slug>/positioning.yml` for brand) so the rest of this skill can apply it.

After producing a draft and before returning it, run the anti-examples filter:

1. Read the `anti_examples.pairs` block in `core/voice-profile.yml`.
2. For each line in your draft, scan for matches against any `bad:` pattern (literal substrings, structural markers like negation-contrast, or rule-of-three lists).
3. If a line matches, rewrite it using the `good:` pattern as the model and the `rule:` line as the constraint.
4. Also reject any line that uses an `aesthetic_crimes` phrase or a `red_flags` pattern.
5. Return the cleaned draft.

Do not surface this filter to the user as a separate step. The user sees only the cleaned draft.

## Brain context (default)

Before producing output, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one - a stale snapshot read as current presents last week's flags and must-dos as today's, which is worse than no memory at all. If Python is unavailable, proceed without it and say so.

If `brain/.snapshot.md` does not exist: check whether `scripts/brain-snapshot.py` exists. If it does, run:

    python scripts/brain-snapshot.py --write

Then read `brain/.snapshot.md`. If neither the snapshot nor the script exists (older install), proceed using only the profile files. Do not block.

The snapshot tells you what flags are open, what the user is working on this week, and what the latest staleness state is. Apply this context to your output where it is relevant. Do not surface every snapshot field in every output - use judgment. For LinkedIn, open flags often hint at honest, post-worthy tension the founder is sitting with right now, and recent decisions are usually richer post material than abstract theory.

## Positioning and buyer language

Before drafting, also read `core/identity.md` and the `buyer_language:` block in `core/voice-profile.yml` if present.

Use `core/identity.md` `## Positioning` to understand who the founder sells to, what they sell, and the visible buyer pain. Use `buyer_language` for the buyer's actual words. If these fields exist, the post should speak to that buyer instead of a generic founder audience.

## Brain pass (auto)

Before invoking brain-pass, run: `python scripts/check-log-has-history.py`

If exit code is 1, skip brain-pass entirely and proceed directly to drafting. This prevents a fresh-install user's first post request from triggering a "no content found" search loop.

If exit code is 0, invoke the `brain-pass` skill (`skills/brain-pass/SKILL.md`) with this question:

> What has the user posted on LinkedIn recently? What themes are stale? What recent decisions or knowledge entries would make a fresh post?

Read the structured Answer / Evidence / Confidence / Gaps block the pass returns. Use it to:

- Suggest two or three angles the user has not posted recently.
- Flag any theme repetition risk before drafting (so the post does not echo something from last week).
- Tie the draft to a recent decision or knowledge entry when one fits, citing the entry ID at the bottom of the draft as a P.S. or pinned note for the user.

If `skills/brain-pass/SKILL.md` is missing (older install), fall back to `python scripts/query.py "linkedin"` and reason from those raw matches. Do not block.

## Algorithm-aware input (additive - does not replace anything above)

This section adds personalisation and algorithm-awareness on top of the existing voice flow. It never removes or weakens the voice routing, the preflight gates, or the anti-AI self-check. If both inputs below are absent (older install, no LinkedIn pack), this section is a no-op and the skill drafts exactly as before.

1. **Brand direction (personalisation).** First read `~/.founder-os/linkedin-pack-state.json` when it exists and follow its `brand_direction` path. A user-supplied `brand-direction.json` path overrides the pointer. Validate the fixed contract from `skills/linkedin-brand-direction/brand-direction.schema.json`, then consume every field:
   - Use `goal` to keep the post aimed at clients, hiring, or category recognition.
   - Stay inside `topic_lane`.
   - Build the argument from `positioning_angle`.
   - Pick the requested asset from `format_mix`.
   - Return the `cadence` as a publishing note.
   - Use `first_three_posts` when the user has not supplied a specific idea.
   - Use `evidence` to support factual notes and cut any claim it cannot support.

2. **Algorithm reference (format and structure).** Read `skills/linkedin-pack-references/linkedin-algorithm.md` if present. If it is missing, say "algorithm reference not found, using conservative defaults" and continue with format-and-cadence basics only. When present, apply the data-backed facts to the draft:
   - Earn the mobile "see more" tap in the opening roughly 140 characters.
   - Use documents/carousels for explainers, images for reliable engagement, and text when the writing carries the idea. Do not assume video ranks second.
   - Match length to the idea. Current studies disagree on a universal ideal, so do not force every post into one character range.
   - Avoid unsupported fixed link-penalty percentages. Current evidence supports caution with external video links, not a universal 60% body-link claim.
   - Suggest the conservative 2 to 4 posts per week cadence and first-hour reply habit as a note, not as part of the post body.

Carry the algorithm reference's known-limitation line if you assert a specific algorithm fact: these are reverse-engineered and dated.

## Draft

Read `references/post-craft.md` and draft the post: pick the format, build the two-line "See More" hook unit, choose a post structure (Patterns 1-5), apply the hook priority and closing rules. Use the brain-dump workflow if the user gave a raw rant. The posting strategy notes there are for the user, not the draft. When a `brand-direction.json` is in hand, the format and lane it names take priority over a generic pick.

## Before Finalizing

The list below extends `skills/your-voice/SKILL.md`. When updating either file, update both to keep them in sync.

Run the full anti-AI self-check:
1. Banned phrases? Kill them. (Read `skills/your-voice/SKILL.md` for the universal banned phrase list and apply its rules in full.)
2. Banned words? Replace with simpler ones.
3. Em dashes? Replace with simple hyphens. Max two per post.
4. Rule of three? Break the pattern unless the voice profile explicitly enables triplets.
5. Metronome rhythm? Vary sentence length.
6. **"See More" test:** Read ONLY the first two lines. Would you tap? If not, rewrite the second line.
7. Would the founder actually say this across a table?
8. **Negation-contrast check:** Any "It's not X - it's Y" or "That's not X. That's Y" or "Not just X, but Y"? Rewrite as a direct statement. This is the single most common AI pattern that slips through. Catch it every time.
9. **Count check:** If the post says "three things" or any specific number, count the list. Fix before posting.
10. Compare against `voice.samples` from the profile. If it doesn't sound like the samples, rewrite.
11. **Body-link check (additive).** Is there an external link in the post body? Do not quote a fixed penalty. Flag that current evidence is clearest for external video links and let the user decide whether the link is worth the distribution risk.
12. **Lane check (additive).** If a `brand-direction.json` was in hand, does the draft stay in its evidence-backed `topic_lane`? If it drifted to a generic angle, pull it back to the lane the network rewards.
