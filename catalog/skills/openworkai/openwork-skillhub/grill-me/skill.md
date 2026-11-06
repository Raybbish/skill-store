---
name: grill-me
description: Relentlessly interview the user about a plan or design until every decision branch is resolved and you share a common understanding.
description_en: "Relentless interview to stress-test your plan, resolving each decision branch one by one"
version: 1.0.0
display_name: "Grill Me (方案深挖)"
tags:
  - planning
  - interview
  - decision-making
visibility: public
---

# Grill Me

## What it does
Interrogate a plan or design mercilessly until you and the user reach a shared understanding. Walk the whole decision tree branch by branch, resolving dependencies one at a time.

**Each question follows this shape:**
1. Give your recommended answer first.
2. Ask the question.
3. Wait for the user's reply before moving on.

If a question can be answered by looking at the code, use Read/Grep yourself — don't push it back to the user.

**How to run the session:**
1. Open by listing the top-level decision branches you see (3–6).
2. Take the most foundational branch first (others usually hang off it).
3. Finish one branch completely before starting the next.
4. Inside a branch, resolve sub-decisions in dependency order.

**When to stop:** all branches resolved, no lingering "it depends" answers. Close with a one-paragraph summary of the key decisions.

## When to use
- The user wants to stress-test a plan or design.
- The user says "grill me" / "challenge my thinking".
- You need to surface hidden assumptions or unresolved trade-offs before building.
- The project has **no** established domain model yet (if it does, anchor the interrogation to its glossary/ADRs instead).

## Tools
- **Read** — open existing code, specs, or docs to answer a question yourself.
- **Grep** — search the codebase for facts about current behavior.
