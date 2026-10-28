---
name: campaign-from-theme
description: >
  Turn one theme into a structured marketing campaign. Say "build a campaign", "campaign for <topic>", "plan a campaign", "draft a launch campaign", or run /founder-os:campaign-from-theme. The skill REFUSES to generate content until the user has answered five funnel-gating questions: speaker (operator or brand), objective (awareness / consideration / conversion / retention / advocacy), audience segment + temperature (cold / warm / customer), channel-fit logic, and success metric. Output is a campaign brief with sequencing rationale, then 3 to 7 content drafts in the right voice. Reads brands/<slug>/voice.yml + positioning.yml if a brand is named, else core/voice-profile.yml + core/identity.md.
why: "Industry-standard campaign generators output a calendar without knowing who the campaign is for, where the audience is in the funnel, or why one piece comes before another. That produces slop that the operator has to throw away. The gate is the value - it forces audience and objective clarity before any draft, which is what makes the output usable on first attempt."
enhance: "Run brand-voice-interview for the relevant brand first - a campaign in operator voice for a brand the operator runs will sound off-brand. The skill works either way but produces sharper output when the brand layer is captured."
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob"]
mcp_requirements: []
---

# Campaign from Theme

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

You are turning a theme into a sequenced, funnel-aware campaign brief plus content drafts. The output is NOT a content calendar from an industry template. It is a brief that names what the campaign is supposed to accomplish, who it is for, where they are in the funnel, why each piece comes before the next, and what success looks like - followed by drafts that survive on first attempt because the inputs were forced clear up front.

<Instruction-gate>
Do not produce a single content draft until ALL FIVE gate questions are answered:

1. Speaker - operator voice or a specific brand voice
2. Objective - awareness / consideration / conversion / retention / advocacy
3. Audience - segment AND temperature (cold / warm / customer)
4. Channel-fit - which channels survive the speaker + audience + objective intersection
5. Success metric - one number that tells the operator if the campaign worked

If the user pushes for drafts without answering, say:

> I can produce drafts after the five gate questions. Industry-standard campaign generators skip these and the output gets thrown away. Five questions, then drafts.

Then ask the questions ONE at a time. Do not bundle.
</Instruction-gate>

## Phase map - load the reference when you reach the phase

This file is the router. The full procedure lives in two reference files. Load the gates file when you start; load the sequencing-and-draft file only once all five gates plus constraints are answered.

| Phase | What it does | Load |
|-------|--------------|------|
| 0-6 | Theme capture, then the five gates (speaker, objective, audience, channel-fit, success metric) and constraints (timeline, CTAs) | `references/gates.md` |
| 7-9 | Sequencing logic and rationale, drafting each piece in the output format, saving the brief, re-run behavior | `references/sequencing-and-draft.md` |

Walk Phases 0-6 from `references/gates.md` first, ONE question at a time. Only after all five gates plus the constraints are captured do you read `references/sequencing-and-draft.md` and produce the sequence and drafts.

---

## Rules

- The five gates are non-negotiable. Refuse to draft without all five.
- One question at a time. Wait for answer.
- If the user gives a multi-channel answer for objective ("I want awareness AND conversion"), push back once and force a single primary.
- Anti-AI rules from `your-voice` apply to every draft.
- Buyer language from positioning takes priority over invented hooks. If the audience says "I want something that lasts", use that line - do not clean it up.
- Never suggest a channel that is on the brand's `channels.off_limits` list.
- Never invent a CTA that is not in the operator's `available_ctas` list.
- If the operator says the audience is everyone, push back: "Everyone is no one. Pick the segment most likely to convert. The campaign can speak to adjacent segments without optimizing for them."
- If the operator picks 5+ channels, push back: "A campaign that runs on 5+ channels well requires more execution capacity than most solo operators have. Pick 1 primary and up to 2 support. We can repeat the model on other channels later."

---

## Failure modes to watch

- **Generating without gating.** The whole point of this skill is the gate. Skipping it produces slop. Always ask the five questions, even if the user says "just give me ideas".
- **Industry-standard sequencing.** "Hook, story, CTA" is not a sequencing rationale - it is a single-post pattern. A campaign sequence is about how piece 1 earns piece 2, not about each piece's internal structure.
- **Channel-stuffing.** More channels = more risk of misfit. Default to 1 primary + 1 support. Only add more when the operator has documented capacity.
- **Vanity metric pick.** "More followers" is rarely a success metric for a campaign. Push toward something tied to the objective.
- **Hook-temperature mismatch.** A cold-audience hook that assumes brand knowledge will fail silently. Check temperature before writing each hook.
- **Forgetting the audience pain language.** If positioning has buyer_language, lead with it. Operators are convinced their hooks are sharper than what the buyer actually says. They are usually wrong.
