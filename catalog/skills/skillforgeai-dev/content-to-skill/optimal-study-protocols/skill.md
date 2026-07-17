---
name: optimal-study-protocols
description: >
  Guide users through science-based study and learning protocols derived from neuroscience research.
  Use when the user asks "how should I study", "help me learn this material", "study plan",
  "optimize my learning", "prepare for an exam", "improve retention", "memorize this",
  or wants a structured approach to learning new skills or information.
  基于神经科学的最优学习协议：帮助用户制定科学的学习计划，提升记忆力和学习效率。
allowed-tools: Read Write
---

# Optimal Study Protocols

Guide users through evidence-based study sessions using protocols derived from neuroscience research on neuroplasticity, memory consolidation, and optimal learning.

Based on research discussed in Andrew Huberman's "Optimal Protocols for Studying & Learning" (Huberman Lab).

## When to Use

- User wants to learn or memorize new material (textbook, course, skill)
- User is preparing for an exam or certification
- User wants to improve their study habits
- User asks about spaced repetition, active recall, or study techniques
- User is struggling to retain information

## When NOT to Use

- User is looking for motivation or accountability coaching (not a study technique question)
- User wants to learn a physical skill like sports or music (different neuroplasticity pathways)
- User needs help with a specific subject's content (use a subject-specific skill instead)

## Prerequisites

- A timer (phone or app)
- Material to study (notes, textbook, flashcards, or any content)
- A quiet environment with phone in another room or on airplane mode

## Step-by-Step Workflow

### 1. Set the Focus State (5 minutes)

Before studying, prime your focus system:

1. **Mindfulness breath exercise**: Close eyes, focus on a point behind your forehead at eyebrow level. Take slow breaths for 60 seconds. This activates prefrontal circuits for focus.
2. **Remove distractions**: Phone in another room (not just silent — physical distance matters). Close unrelated tabs.
3. **Set a clear goal**: Define what you will cover in this session. Write it down. "Read Chapter 5" is weak; "Understand and be able to explain the 3 types of memory consolidation" is strong.

### 2. Study in Focused Blocks (25-90 minutes)

Engage with the material actively — not passively re-reading:

- **Highlight and annotate sparingly** (max 1-2 highlights per page)
- **Pause to explain concepts aloud** to yourself or an imaginary student
- **Note questions that arise** — these become self-test material in step 3

Session length: match to your focus capacity. Beginners: 25 minutes. Experienced: up to 90 minutes. Never exceed 90 minutes without a break.

### 3. Self-Test Immediately (10-15 minutes)

This is the single most powerful study technique. Testing is NOT assessment — it IS the learning:

1. Close the material
2. Write down or recite everything you can remember (free recall)
3. Then answer specific questions you noted during study
4. Check your answers against the material

**Key insight**: Getting answers WRONG during self-testing is more valuable than passive re-reading. The effort of retrieval — even failed retrieval — strengthens memory encoding.

Do NOT skip this step. Re-reading gives a false sense of mastery. Only retrieval practice creates durable memories.

### 4. Gap Effects and Rest (10-20 minutes)

After self-testing, take a deliberate break:

- **First minute**: Do nothing. Sit quietly. Neuroimaging shows the hippocampus replays learned material during these micro-rest periods at 20x speed.
- **Optional NSDR (Non-Sleep Deep Rest)**: A 10-minute body scan or yoga nidra protocol. Research shows this accelerates memory consolidation by up to 50%.
- **Do NOT check your phone** during this gap. Scrolling introduces novel information that competes with recently learned material.

### 5. Interleave Topics (next study block)

When you return to studying:

- Switch to a different but related topic or subject
- Interleaving (mixing topics) produces worse performance during study but significantly better long-term retention
- Example: if you studied memory in Block 1, study attention or learning theory in Block 2

### 6. Space Your Sessions

For material you need to retain long-term:

- **Same day**: Study + self-test
- **Next day**: Self-test only (no re-reading first)
- **3 days later**: Self-test again
- **1 week later**: Self-test again
- **2 weeks later**: Final self-test

Each successful retrieval at increasing intervals strengthens the memory trace. If you fail a test, reset the interval to 1 day.

### 7. Leverage Emotion and Alertness

Enhance encoding with controlled emotional arousal:

- **Caffeine**: 1-3mg/kg body weight, consumed AFTER study begins (not before). Caffeine during or after learning enhances consolidation.
- **Brief cold exposure**: 1-2 minutes of cold water at the end of a shower after a study session. Elevates adrenaline, which strengthens memory encoding.
- **Sleep**: The actual consolidation happens during sleep. Never sacrifice sleep for more study time. 7-9 hours on the night after learning is non-negotiable.

## Input/Output Spec

- **Input**: Any material the user wants to learn (text, notes, concepts, skills)
- **Output**: A structured study plan with specific sessions, self-tests, and spacing schedule

## Edge Cases & Error Handling

| Scenario | Action |
|---|---|
| User has an exam tomorrow | Skip spacing (steps 5-6), focus on self-testing (step 3) repeatedly |
| Material is extremely boring | Use step 7 (caffeine, cold exposure) to boost alertness; break into 25-min blocks |
| User can't recall anything during self-test | Normal — the struggle IS the learning. Peek at one key fact, close material, try again |
| User has ADHD or focus difficulties | Emphasize step 1 (focus priming), use shorter blocks (15-25 min), more breaks |
| User wants to memorize facts (dates, vocab) | Heavy emphasis on step 3 (self-testing) + step 6 (spaced repetition with flashcards) |

## Examples

### Example 1: Exam Preparation (1 week out)

User: "I have a biology exam in 7 days covering 4 chapters. How should I study?"

Plan:
- Day 1: Study Ch.1 (90min) + self-test. Study Ch.2 (90min) + self-test.
- Day 2: Self-test Ch.1+2 (no re-reading). Study Ch.3 (90min) + self-test.
- Day 3: Self-test Ch.1-3. Study Ch.4 (90min) + self-test.
- Day 4: Self-test all 4 chapters. Review only failed items.
- Day 5: Interleaved self-test (mix questions from all chapters).
- Day 6: Final self-test. NSDR session. Early bedtime.
- Day 7: Light review of weak spots only. Exam day.

### Example 2: Learning a New Programming Language

User: "I want to learn Rust. Where do I start?"

Plan:
- Session structure: 45-min focused study blocks + 15-min self-test + 10-min break
- Week 1: Ownership and borrowing (concepts) — self-test by writing code from memory
- Week 2: Structs and enums — interleave with week 1 concepts
- Week 3: Error handling and traits — interleave with weeks 1-2
- Each session ends with: close docs, write a small program using today's concepts without reference
- Spacing: revisit week 1 concepts via self-test on days 3, 7, and 14
