---
name: brand-interview
description: >
  Set up the visual brand profile. Say "set up my brand profile", "set up my brand", "brand interview", or "capture my brand" (or run /founder-os:brand-interview). Interactive interview that captures colors, fonts, logos, footer text, and writes the result to `core/brand-profile.yml`. Adapts to existing brand kit, partial brand, or starting from zero. Extracts intent from messy input, never asks the user to be more structured.
why: "Creates the visual identity file that every branded document inherits - without it proposals, CVs, and decks default to generic styling that does not look like you."
enhance: "Have your logo file and hex codes ready before starting - the interview can suggest defaults but real brand assets in core/brand-assets/ are what make output look professional."
allowed-tools: ["Read", "Write", "Edit", "Bash"]
mcp_requirements: []
---

# Brand Interview

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

You are running an interactive interview to capture VISUAL brand identity - colors, fonts, logos, footer. This skill does NOT capture brand voice (how the brand writes). Brand voice is a separate file at `brands/<slug>/voice.yml` and captured by `brand-voice-interview`. The two layers are independent.

By default, output is `core/brand-profile.yml` (the operator's default visual brand). If the user names a specific brand they run, output is `brands/<slug>/visual.yml` instead. The schema is the same.

The brand-profile feeds the `your-deliverable-template` skill, which then produces all visual outputs (CV, proposals, decks, one-pagers) in the user's brand.

<Instruction-gate>
Three branches at the start: (1) they have a brand kit already, (2) they have partial brand (a logo, or some colors, but not a full kit), (3) they are starting from zero. Detect which one and run the matching path. Don't force a user with no brand to invent one cold - help them pick defaults that look good and can evolve.

Do not invent values. If the user skips a question, leave the field as `[NOT SET]` and tell them they can re-run the interview later. Do not generate `core/brand-profile.yml` until the required fields (display_name, primary color, primary font, logomark path) are answered.
</Instruction-gate>

---

## Phase 0 - Welcome and detect starting point

Say exactly:

> Brand interview. About 5 to 10 minutes. The output is a brand profile that produces all your visual outputs - CVs, proposals, decks, one-pagers - in a consistent visual identity. To start: do you have a brand kit already (with a logo, colors, and fonts you've chosen), or are we starting fresh? (have-kit / partial / fresh-start)

Map the answer:
- `have-kit`: user has a logo + colors + font picked. Run the **Existing Kit** path.
- `partial`: user has some elements (a logo OR some colors OR a font, but not all). Run the **Partial Kit** path.
- `fresh-start`: user has nothing. Run the **Fresh Start** path.

If the answer is unclear, ask one clarifying question: "Do you have a logo file you'd want on your CV?"

## Phase 0.5 - Existing visual proof

Ask once before running the selected path:

> Do you have any existing visual proof I should look at later - a deck, website, logo folder, proposal, or style guide? If yes, where is it? If no, say no.

Capture the answer as `existing_assets`. This does not replace the logo fields. It tells `your-deliverable-template` where to look when it needs a real visual reference instead of making a fresh layout from mood words alone.

---

## Path A - Existing Kit

The user has a brand kit. Capture it.

### Q1. Display name + tagline

Ask:

> What's the name that goes on the cover of your documents? Just your name (e.g. "Jane Smith"), or a brand name (e.g. "Smith Studio"). And a one-line tagline if you use one - skip if you don't.

Capture `display_name` and `tagline`.

### Q2. Support contact

Ask:

> What's the contact line that appears on the footer? Usually an email or your portfolio URL.

Capture `support_contact`.

### Q3. Colors

Ask:

> Paste your 5 brand colors as hex codes. If you have fewer than 5, paste what you have - I'll suggest neutrals for the rest.

Map each hex to one of: primary, secondary, dark, light, accent. If unclear, ask: "Which one is your headline color (primary), and which is your accent?"

If they have fewer than 5, fill the remaining slots from a sensible neutral palette:
- `dark` defaults to `#1A1A1A` if missing
- `light` defaults to `#F5F5F5` if missing
- `accent` defaults to a softened version of `secondary` if missing

### Q4. Fonts

Ask:

> What fonts do you use? Primary first, secondary if you have one. Tell me where they come from - Google Fonts, a local file you have, or a system font.

Capture `fonts.primary` and `fonts.secondary`. Default font weight mapping uses the standard weights (Bold, Medium, Light, Regular). The user only changes them if they want to.

### Q5. Logo

Ask:

> Where are your logo files? Three versions are useful: the icon-only logomark, the full logo with your name, and a white version for dark backgrounds. Drop the file paths or copy them into `core/brand-assets/` and tell me the filenames.

Capture `logo.logomark.path`, `logo.full.path`, `logo.white.path`. If the user has only one logo, use it for `logomark` and leave the others blank with a note in the profile.

### Q6. Footer text

Ask:

> What footer text do you want on your documents? Default is `<display_name> | <support_contact>` - confirm or give me a custom line.

Capture `footer.text`.

Skip to **Phase 3 - Confirm and save**.

---

## Path B - Partial Kit

The user has some elements. Capture what they have, then help them pick the rest.

### Step 1. Inventory what they have

Ask:

> What do you have already? Tell me everything: logo file, colors you like, font you've used before, even if it's incomplete. I'll fill the gaps.

Listen. Capture each element to its slot.

### Step 2. Fill the missing pieces

For each missing element, run the matching mini-question:

**Missing colors:** Ask "What's a brand mood you're going for? Calm and minimal, bold and energetic, warm and inviting, technical and clean, or something else?" Suggest a 5-color palette that matches the mood. Show them the hex codes and ask: "These look right?"

**Missing fonts:** Ask "What's the vibe - friendly (Inter, Open Sans), professional (Source Sans Pro, Roboto), elegant (Playfair Display + a sans-serif), technical (JetBrains Mono for accents), or something else?" Suggest a font and ask if they like it.

**Missing logo:** Ask "Do you want me to use just text (your name in the primary font) as a wordmark for now? You can add a real logo later." If yes, set `logo.logomark.path` to `text-only` and the deliverable template handles it.

### Step 3. Display name, support contact, footer

Run Q1, Q2, Q6 from Path A.

Skip to **Phase 3 - Confirm and save**.

---

## Path C - Fresh Start

The user has nothing. Help them pick something good in 5 minutes.

### Step 1. Display name

Ask:

> Let's start with the name on your documents. Just your name, or a brand name?

Capture `display_name`. Ask for `tagline` and `support_contact` (Q1 + Q2 from Path A).

### Step 2. Mood

Ask:

> Pick a mood for your visual brand. I'll suggest colors and fonts. Choose one:
> 1. Calm and minimal (lots of white, simple type)
> 2. Bold and energetic (strong colors, confident type)
> 3. Warm and inviting (earthy colors, friendly type)
> 4. Technical and clean (cool colors, geometric type)
> 5. Elegant and refined (muted colors, serif accents)

Map the mood to a default palette and font:

- **Calm and minimal:** primary `#2C3E50`, secondary `#3498DB`, dark `#1A1A1A`, light `#ECF0F1`, accent `#E74C3C`. Font: Inter.
- **Bold and energetic:** primary `#FF4757`, secondary `#FFA502`, dark `#2F3542`, light `#F1F2F6`, accent `#3742FA`. Font: Poppins.
- **Warm and inviting:** primary `#D4A373`, secondary `#A98467`, dark `#3D2817`, light `#FAEDCD`, accent `#CD5C5C`. Font: Source Sans Pro.
- **Technical and clean:** primary `#0F4C81`, secondary `#06B6D4`, dark `#1E293B`, light `#F1F5F9`, accent `#84CC16`. Font: Inter.
- **Elegant and refined:** primary `#1A1A2E`, secondary `#9B7EBD`, dark `#1A1A1A`, light `#F8F4E3`, accent `#C9A961`. Font: Playfair Display (headings) + Source Sans Pro (body).

Show the user the chosen palette as hex codes and the font name. Ask: "These look right? You can change any of them now or later."

### Step 3. Logo

Ask:

> Do you have a logo file? If yes, put it in `core/brand-assets/` and tell me the filename. If no, I'll set the brand to use your name in the primary font as a wordmark - you can add a real logo later.

Capture `logo.logomark.path` or set to `text-only`.

### Step 4. Footer

Run Q6 from Path A.

Skip to **Phase 3 - Confirm and save**.

---

## Phase 3 - Confirm and save

Show this exact block (filled with captured values):

> Here's your brand profile. Confirm or correct any line.
>
> - Display name: <value>
> - Tagline: <value or "none">
> - Support contact: <value>
> - Colors:
>   - Primary: <hex>
>   - Secondary: <hex>
>   - Dark: <hex>
>   - Light: <hex>
>   - Accent: <hex>
> - Primary font: <name> (<source>)
> - Secondary font: <name or "none">
> - Logo:
>   - Logomark: <path or "text-only">
>   - Full logo: <path or "not set">
>   - White logo: <path or "not set">
> - Existing visual proof: <deck, website, logo folder, style guide, or "none">
> - Footer text: <value>
>
> Looks right? (yes / change X)

If yes, write `core/brand-profile.yml` from the captured values.

If they want to change something, edit and re-confirm.

---

## File output

Branch on whether the user named a specific brand in Phase 1 (Q1 / display name):

- If the user named a specific brand (not the operator default, i.e. not just their personal name): derive a slug from the brand name and write `brands/<slug>/visual.yml` using `templates/brand-visual.yml.template`. Create the `brands/<slug>/` directory if absent.
- Else (operator default, the personal brand): write `core/brand-profile.yml` using `templates/brand-profile.yml.template`.

**Slug rule:** lowercase, kebab-case, alpha-numeric and hyphens only, derived from the brand display_name. Strip punctuation, replace spaces with hyphens, collapse repeated hyphens. Example: "Smith Studio" becomes `smith-studio`. "Brown & Co." becomes `brown-co`.

Use the exact structure from the chosen template, including the `existing_assets:` block. Replace every `[BRACKETED]` placeholder with the captured value or `[NOT SET]` if the user skipped it.

Also create the `core/brand-assets/` directory if it doesn't exist (or `brands/<slug>/brand-assets/` for a named brand, if logo paths point there). If the user gave logo file paths that don't exist yet, leave them in the profile and tell the user:

> Your brand profile points to <path>. Place the file at that path before generating any branded document, or update the profile to point to where the file actually lives.

---

## Phase 4 - Final message

Say exactly:

> Brand profile saved. From now on, when you ask me to make a CV, proposal, deck, or any branded output, I'll use this brand. If something looks off, tell me and we'll refine the profile.
>
> If you want to test it, try: "make a one-pager that introduces me." I'll use your brand and your voice (if you've completed the voice interview) to draft it.

Then offer the voice chain:

> One more thing. This profile is VISUAL only - colors, fonts, logos. If this brand has a distinct WRITING voice that should not be your personal voice (most brands do), capture it with `/founder-os:brand-voice-interview`. The two layers stay independent: visual + voice.

Stop. Do not do anything else.

---

## Re-run behavior

If the user runs this skill and `core/brand-profile.yml` already has real values (not template placeholders), ask:

> A brand profile already exists. Want to start over from scratch, or just update specific fields? (start-over / update)

If `update`, ask which fields, then walk only those questions.
If `start-over`, run the full interview from Path detection.

---

## Rules

- One question at a time. Wait for answer.
- Real users don't know branding terms. "Primary color" is fine, "tertiary palette" is not.
- When suggesting defaults (Path C mood-based), show the hex codes so the user can visualize.
- Never tell the user to be more concise. The volume is the thinking.
- Plain language. The user is not a designer.
