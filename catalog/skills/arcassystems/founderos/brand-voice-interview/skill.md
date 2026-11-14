---
name: brand-voice-interview
description: >
  Capture a brand's writing voice and positioning. Say "set up a brand voice", "capture our brand voice", "add a brand", "set up brand voice for <name>", or run /founder-os:brand-voice-interview. Different from voice-interview, which captures the OPERATOR's personal voice. This skill captures how a brand the operator runs speaks - separate from how the operator speaks. Writes brands/<slug>/voice.yml and brands/<slug>/positioning.yml. Supports operators who run an ecosystem of brands - this skill can be run once per brand.
why: "An operator can run multiple brands. The operator's personal voice and a brand's voice are not the same. Without a brand voice layer, every output sounds like the operator, which is wrong for any branded communication (customer comms, brand social, customer service, ads). Brand voice is the file every brand-coupled writing skill reads."
enhance: "Capture brand voice AFTER you have 3 to 5 real brand samples - existing captions, product copy, customer emails the brand has actually sent. The samples are the ground truth. A brand voice profile without samples is a stereotype."
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob"]
mcp_requirements: []
---

# Brand Voice Interview

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

You are running an interactive interview to capture a single brand's voice and positioning. Output is two files under `brands/<slug>/`:

- `brands/<slug>/voice.yml` - how the brand writes
- `brands/<slug>/positioning.yml` - who the brand serves, what it sells, how it differentiates

This skill is for BRAND voice, not OPERATOR voice. The operator's personal voice lives at `core/voice-profile.yml` and is captured by the `voice-interview` skill. If the user is asking about their own personal voice, point them to `voice-interview` instead and stop.

Internal phase numbers in markdown H2 headers are for the maintainer; the operator sees a three-part frame (Part 1 of 3 - Positioning, Part 2 of 3 - Brand voice, Part 3 of 3 - Confirm and save) inside model utterances. Setup (Phase 1), Visual capture (Phase 5, optional), and Final message (Phase 6) sit outside the three-part frame.

Cross-skill asymmetry note: this skill has 6 phases. The sibling `voice-interview` has 5 because it does not need a positioning phase - operator positioning lives in `core/identity.md` (captured by `founder-os-setup`). Brand positioning (who-the-brand-sells-to) has no equivalent file, so it gets captured here before voice. Do not collapse positioning into voice when editing this skill.

<Instruction-gate>
Do not write `brands/<slug>/voice.yml` until you have collected at least 2 reference samples published BY THE BRAND (or written by the operator in the brand's voice for the brand) AND walked the shaping questions, including buyer-language and anti-example questions. Samples are the ground truth.

Do not write `brands/<slug>/positioning.yml` until the user has named the offer, the primary audience segment, and at least one proof point.

Do not invent answers. If the user skips a field, leave it as `[NOT SET]` and tell them they can re-run later.
</Instruction-gate>

## Phase map - load the reference when you reach the phase

Run the phases in order. When you reach a heavy phase, read its reference file for the full question set, then execute it. Load only the phase you are in.

| Phase | What it does | Load |
|-------|--------------|------|
| 1 | Setup - clarify scope, pick slug (inline below) | - |
| 2 | Brand positioning - Q1 to Q13 (offer, audience, promise, competitors, channels, archetype) | `references/positioning.md` |
| 3 | Brand voice - samples + V1 to V10 shaping questions | `references/voice.md` |
| 4 | Confirm and save - the recap block + file output | `references/confirm-and-save.md` |
| 5 | Visual capture (optional, inline below) | - |
| 6 | Final message (inline below) | - |

---

## Phase 1 - Setup (clarify scope, pick slug)

Before anything else, confirm the speaker.

Say exactly:

> Quick check before we start. There are two voices in this OS:
>
> 1. **Your personal voice** - how you write as a person. Personal LinkedIn, your own emails, your CV.
> 2. **A brand voice** - how a brand you run writes. Customer captions, brand social, customer service replies, ads.
>
> They are not the same. If you are running a single founder-led brand, they may overlap, but the brand voice should still be captured separately because it has to survive after you stop writing every word yourself.
>
> Is this for a brand you run, or for you personally? (brand / personal)

If they say "personal", stop and route to `voice-interview` instead.

If they say "brand", continue.

If unclear, ask once: "Whose name goes on the customer-facing output - yours, or a brand name?"

Then ask:

> What is the brand called? Use the customer-facing name as written on packaging, web, social.

Capture as `display_name`.

Generate a kebab-case slug from the name:
- Lowercase
- Replace spaces with hyphens
- Strip punctuation and articles ("the ", "a ", "an ")
- If two words feel redundant, keep the distinctive one

Show the user the suggested slug and ask:

> I will save this under `brands/<slug>/`. Confirm or give me a different slug.

If `brands/<slug>/` already exists, ask:

> A brand profile already exists at `brands/<slug>/`. Want to update it, start over for the same brand, or pick a different slug? (update / start-over / new-slug)

If `update`, ask which fields, then walk only those questions.
If `start-over`, run the full interview and overwrite.
If `new-slug`, ask for the new one.

Create the directory `brands/<slug>/` if it does not exist. Also create `brands/<slug>/assets/` for logo files.

---

## Phase 2 - Brand positioning (Q1-Q13)

Positioning gates voice. Read `references/positioning.md` and walk Q1 to Q13. Open with "Part 1 of 3 - Positioning."

---

## Phase 3 - Brand voice (samples + shaping)

Read `references/voice.md`. Scan for existing brand artifacts first, run the paste flow for samples, then walk the 10 voice shaping questions (V1 to V10). Open with "Part 2 of 3 - Brand voice."

---

## Phase 4 - Confirm and save

Read `references/confirm-and-save.md`. Show the recap block (Part 3 of 3), then on a "yes" write `brands/<slug>/voice.yml` and `brands/<slug>/positioning.yml` from the templates.

---

## Phase 5 - Visual capture (optional)

After both files are written, ask:

> Optional - Visual identity.
>
> Brand voice and positioning are saved. Want to capture the visual identity too (logo, colors, fonts)? It takes 5 to 10 minutes and gives you branded visual outputs (proposals, decks, one-pagers in this brand's look).
>
> Options: yes-now / yes-later / not-needed.

If `yes-now`, dispatch to `brand-interview` and instruct it to write to `brands/<slug>/visual.yml` instead of `core/brand-profile.yml`.

If `yes-later`, say: "Run `/founder-os:brand-interview` later and I will save it under this brand."

If `not-needed`, stop here.

---

## Phase 6 - Final message

Say exactly:

> Brand voice and positioning saved under `brands/<slug>/`. Brand-coupled writing skills (linkedin-post, content-repurposer, email-drafter, review-responder, campaign-from-theme) can now write in this brand's voice. To use, say "write an Instagram caption for `<display_name>`" or "draft a campaign for `<display_name>`".
>
> Your personal voice at `core/voice-profile.yml` is unchanged. Personal posts and emails still use that.

Stop. Do not do anything else.

---

## Rules

- One question at a time. Wait for answer.
- Real operators ramble. Extract intent. Never ask them to be structured.
- Never invent samples or vocabulary.
- Plain language. Operators are not linguists or brand strategists.
- If the operator describes the brand voice as identical to their personal voice, ask one clarifying question: "When the brand has employees other than you writing for it, will they speak in your personal voice, or a brand voice that has its own character?" If they say brand voice has to survive their absence, the two voices are different and capture them separately.
- Slug must be unique under `brands/`. If a collision happens, append a disambiguator (e.g. `brown-co-uk` vs `brown-co-us`).
