---
name: content-start
description: >
  The front door to the Content pack: turn one idea into a week of content. Trigger on "turn this idea into content", "one idea into a week of content", "help me with content", "make content from this", "plan my content", "I have a topic, help me post it", "what should I post", or any open-ended content request where the user has something to say but has not picked a format. You bring one idea; the OS checks whether it knows your voice, then routes you to the outcome you want: a single post, the same idea across every channel, a sequenced campaign, or a reply to something incoming. One honest disclaimer, no full onboarding, and it never publishes for you. Routes to linkedin-post, content-repurposer, campaign-from-theme, review-responder, voice-interview, or brand-voice-interview depending on the outcome chosen.
why: "A founder doing their own marketing has the idea but not the patience to learn six content skills. This is the one entry that turns one idea into the format they actually need and makes sure it sounds like them, not like generic AI."
enhance: "Set your voice profile first (say 'set up my voice profile'). With it, every draft sounds like you wrote it; without it, the writing falls back to safe anti-AI defaults that read clean but generic."
summary: "Bring one idea; the OS makes it sound like you and aims it at the channel you want."
allowed-tools: ["Read", "Bash"]
mcp_requirements: []
---

# Content Start

Runs on: reasoning - this skill reads whether the OS knows your voice and routes you to the writing skill that produces the content. It does not write the content itself and it never publishes. On a read-only or cloud surface, it explains the same route without claiming a draft was saved.

This is the front door to content. You have one idea: a lesson, a story, an opinion, a customer message that needs answering. Underneath that one idea sit several outcomes: a single post, that idea stretched across LinkedIn, Instagram, YouTube and email, a full campaign, or a reply to something a customer sent you. This skill makes sure the OS knows your voice, then aims the idea at the outcome you want.

The principle: do more for you than you asked, and never publish a word in a voice that is not yours. If the OS does not yet hold your voice, it says so and offers to capture it before it drafts, because a draft in the wrong voice is worse than no draft.

## The outcomes behind one idea

| You want | What it means | Where it routes |
| --- | --- | --- |
| **One post** | a single strong post in your voice | `linkedin-post` |
| **A week of it** | the same idea adapted across your channels | `content-repurposer` |
| **A campaign** | a sequenced, funnel-aware run of posts toward one goal | `campaign-from-theme` |
| **A reply** | answer an incoming review, DM, or message in the right voice | `review-responder` |

Not sure which? Say "just make the post" and the OS runs `linkedin-post` first (the cheapest, most immediately useful), then names what repurposing and a full campaign would add, so you choose with a real draft in front of you.

## Read the state before routing

The route is only as good as what it knows. Before choosing, read `brain/.snapshot.md`. If it is missing, or its `date:` line is more than 3 days old, run `python scripts/brain-snapshot.py --write` first and read the fresh one. The open-flags block tells you what is stuck, the must-do block tells you what this week is actually about, and the patterns block tells you what keeps happening - a front door that routes without them is a cold start at the exact moment the user is deciding whether this OS knows them. If Python is unavailable, route from the files you can read and say so.

## The flow

### 1. Check the voice first

Before drafting anything, check whether the OS holds your voice:

- Does `core/voice-profile.yml` exist with real values, not template placeholders? Are you writing for yourself or for a brand you run (is there a `brands/<slug>/voice.yml`)?
- **No voice profile**: say so plainly and offer to set it up first (`voice-interview`, about ten minutes). If they want to proceed without it, the writing skills fall back to anti-AI defaults: clean, but not yet theirs. Be honest about the trade.
- **Brand content**: if the idea is for one of their brands rather than their personal voice, route the voice through `brand-voice-interview` output instead.

Branch on what you actually find. Do not assume the voice is set.

### 2. One honest disclaimer

Before routing, say one true thing and only one:

> I can draft this in your voice and aim it at any channel, but I do not publish it for you, and without your voice profile it will read clean but generic. Tell me the outcome you want, one post, a week of content, a full campaign, or a reply, and I will draft it. Publishing stays your hand on the button.

Never imply the OS posts on your behalf or already knows your voice when it does not.

### 3. Route to the outcome

- **One post** -> `linkedin-post`, which writes algorithm-aware in your voice and reads recent themes from your brain layer.
- **A week of it** -> `content-repurposer`, which takes one piece and adapts it across LinkedIn, Instagram, YouTube, email, and more, each in the right shape for the channel.
- **A campaign** -> `campaign-from-theme`, which gates on five funnel questions (speaker, objective, audience, channels, success metric) before drafting a sequenced run. It will not draft until those are answered, by design.
- **A reply** -> `review-responder`, which asks whose voice (yours or a brand's) and drafts the reply with the right channel and posture.

Follow the skill you route to for the actual run. This skill hands off; it does not write the content itself. Every writing skill calls `your-voice` internally to hold the line on tone, so you do not invoke it separately.

### 4. Deliver the path, not a file dump

When the routed skill finishes, frame the result as the path from one idea to a week of presence: here is the post, here is the same idea on your other channels, here is the next one. Do not just hand over a draft and stop.

### 5. Offer more than they asked

After delivering, name the outcomes they did not pick, in one line each. "You came for one post. The same idea is a week of content across your channels, and a campaign if you want it to build to something. Want either?" Invite, never gate. If they say no, stop cleanly.

### 6. No voice in a vacuum

This is a rule, not a preference: do not ship content in a fabricated voice. If the voice profile is missing or template-filled, either set it up first or state clearly in the handoff that the draft uses generic defaults and will improve once the voice is captured. A founder's content is their reputation; a wrong-voice draft costs more than a missing one.

## Honest positioning (say this, do not oversell)

Lead with the defensible truth: the content is drafted in your voice from your own ideas, with no extra service or key, and you publish it yourself so nothing goes out that you did not approve. The voice profile is what makes it yours rather than generic.

Be honest about the limits: the OS drafts, it does not schedule or auto-post, it does not run analytics on what performed, and it does not invent engagement numbers. It turns your idea into channel-ready drafts. The publishing, the timing, and the reading of results stay with you.

## When NOT to use

- When the user already named the format ("write me a LinkedIn post", "repurpose this for Instagram", "reply to this review") - route straight to that skill; the front door is for the open-ended "I have an idea, help me post it".
- To auto-publish or schedule. The OS drafts; it does not post.

## Files this skill routes to

- `skills/linkedin-post/SKILL.md` - a single algorithm-aware post in your voice.
- `skills/content-repurposer/SKILL.md` - one piece adapted across every channel.
- `skills/campaign-from-theme/SKILL.md` - a sequenced, funnel-gated campaign.
- `skills/review-responder/SKILL.md` - replies to incoming reviews, DMs, and messages.
- `skills/voice-interview/SKILL.md` - capture your personal writing voice into `core/voice-profile.yml`.
- `skills/brand-voice-interview/SKILL.md` - capture a brand's voice for brand content.
- `skills/your-voice/SKILL.md` - the voice rules every writing skill applies internally.
- `skills/content-pack.md` - the pack manifest, with the full member map.
