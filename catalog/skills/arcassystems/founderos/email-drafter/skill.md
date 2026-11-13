---
name: email-drafter
description: >
  Draft an email in the founder's voice. Trigger on "write an email", "draft a reply", "send a message", "follow up with", "reach out to", "respond to this email", "compose an email", or any variation. Also fires when the user pastes email content and asks for a response, or when they describe a situation that clearly needs an email. Covers client emails, partnership outreach, investor updates, team communications, cold outreach, and personal correspondence. Reads `core/voice-profile.yml`.
why: "Writes emails that sound like you sent them instead of like a marketing tool did - especially useful for cold outreach and difficult conversations where tone matters."
enhance: "Fill core/voice-profile.yml and set stack.json email_platform so the skill mirrors your actual send environment and applies your exact voice rules to every draft."
allowed-tools: ["Read", "Write", "Edit", "Bash"]
mcp_requirements: [optional: gmail]
---

# Email Drafter

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

Apply the voice and writing rules from `core/identity.md`, `rules/writing-style.md`, and `core/voice-profile.yml` (via the `your-voice` skill). Emails are conversations, not content pieces. The anti-AI self-check is relaxed here, but the voice rules still apply.

## Voice routing (operator or brand?)

Apply the routing rules in `skills/your-voice/SKILL.md` "Voice routing - operator or brand?" section. Default to operator voice for personal emails. If the user names a brand they run (e.g. "draft an email from `<brand>` to a customer"), use brand voice from `brands/<slug>/voice.yml`.

## Voice profile

If using operator voice, run: `python scripts/check-voice-ready.py`
If using brand voice, run: `python scripts/check-brand-voice-ready.py --brand <slug>`
If neither operator nor brand voice is explicitly named, default to operator voice and run `python scripts/check-voice-ready.py`. Stop on exit code 1.

If exit code is 1, read the output line and surface it to the user verbatim. Do not produce any draft. Stop.

If the user explicitly chooses to proceed with defaults after seeing that message, draft the email using the universal anti-AI baseline from `your-voice` and clearly label that the voice profile was not applied. Do not pretend the email is voice-coupled.

Then read the chosen voice profile so the rest of this skill can apply it.

After producing a draft and before returning it, run the anti-examples filter:

1. Read the `anti_examples.pairs` block in `core/voice-profile.yml`.
2. For each line in your draft, scan for matches against any `bad:` pattern (literal substrings, structural markers like negation-contrast, or rule-of-three lists).
3. If a line matches, rewrite it using the `good:` pattern as the model and the `rule:` line as the constraint.
4. Also reject any line that uses an `aesthetic_crimes` phrase or a `red_flags` pattern.
5. Return the cleaned draft.

Do not surface this filter to the user as a separate step. The user sees only the cleaned draft.

## Runtime context

Before drafting, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one - a stale snapshot read as current presents last week's flags and must-dos as today's, which is worse than no memory at all. If Python is unavailable, proceed without it and say so. Use the open-flags block to avoid topics that contradict current operator stance. Use the must-do block to lean the draft toward what the operator is actively working on. Use the voice and brand blocks (if present) to set tone. The freshness check above is not optional: skipping the regeneration and reading a week-old snapshot is the one way this block makes output worse.

## Stack-aware sending

Read `stack.json`. The `email_platform` field is one of `gmail`, `outlook`, `apple_mail`, or `null`.

- `gmail`: if a Gmail MCP is connected, offer to read the inbound thread for context. Otherwise ask the user to paste the prior message.
- `outlook`: same pattern via Outlook MCP. Do not assume Gmail.
- `apple_mail` or `null`: prompt the user to paste the prior message. No MCP integration available.

Do not hardcode "Gmail" in instructions to the user. Mirror their actual platform.

## Core Principles

**Lead with the point.** No warm-up paragraphs. No "I hope this email finds you well." No "I wanted to reach out regarding." Just say why you're writing in the first sentence.

**One email, one ask.** If you need three things, make the most important one the clear ask. The others can be mentioned but don't bury multiple action items in prose.

**Write short.** Most emails should be 3-8 sentences. If it's longer than a screen, it should probably be a meeting or a doc.

**Sign off simply.** Use the founder's first name from `core/identity.md`. For first-contact or formal situations, use a full block:

```
[Founder Name]
[Title] - [Company]
```

No inspirational quotes in signatures. No "sent from my iPhone" disclaimers.

## Email Types and Structure

### Reply to an Email
1. Acknowledge the specific thing they said (not generic "thanks for your email")
2. Answer their question or address their point directly
3. State your next step or ask
4. Close

### Cold Outreach
1. One line that shows you know who they are (specific, not flattery)
2. Why you're reaching out (the value proposition, not about you)
3. One clear ask (a call, a reply, a look at something)
4. Close

### Client Update
1. Status in one sentence
2. What changed or what's new
3. What you need from them (if anything)
4. Timeline for next touchpoint

### Follow-up
1. Reference the last interaction specifically
2. New information or the thing you promised
3. Next step
4. Close

### Difficult Conversations (delays, scope changes, bad news)
1. State the situation directly - no softening preamble
2. What happened and why (briefly)
3. What you're doing about it
4. What you need from them
5. Close with commitment, not apology

## Formatting Rules

- Use simple hyphens (-) not em dashes or en dashes
- Contractions always ("don't" not "do not")
- Short paragraphs, often single sentences
- No bullet points in emails unless listing 3+ specific items
- Bold sparingly - only for dates, deadlines, or critical action items
- No emoji unless the relationship is very casual and the user asks for it

## What to Ask the User

If the user gives you a vague "write an email to X", ask:
1. What's the context? (Who is this person, what's the relationship?)
2. What's the goal? (What do you want them to do after reading this?)
3. Any specific details to include?

If the user gives you enough context, just write it. Don't over-ask.

## Examples

**Bad (AI email):**
"I hope this email finds you well. I wanted to reach out to discuss the potential for collaboration between our organizations. I believe there could be significant synergies..."

**Good:**
"Ahmed - saw your post about the ops bottleneck at scale. We solved something similar for a 40-person services company in Abu Dhabi last quarter. Worth a 15-minute call? I can share what worked."

**Bad (AI follow-up):**
"I hope you're doing well. I'm following up on our previous conversation regarding the proposal I sent over. Please let me know if you have any questions or concerns."

**Good:**
"Quick follow-up on the proposal from Tuesday. Two things changed since we spoke - updated the timeline on the systems audit and added the team structure review you mentioned. Let me know if you want to walk through it."
