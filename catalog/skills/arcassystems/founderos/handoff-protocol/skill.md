---
name: handoff-protocol
description: Build a handoff doc when work moves to someone else. Say "hand this off to <person>", "build a handoff", "delegate this", or "package this for the next person". Creates a structured artifact with ownership, done state, deadline, constraints, open questions, and source links.
why: "Turns a verbal delegation into a structured artifact the receiver can act on without a follow-up call - context dropped in chat alone disappears."
enhance: "Provide all nine required fields explicitly, especially the definition of done and known constraints - the artifact is only as useful as the specificity of what you give it."
allowed-tools: ["Read", "Write", "Edit"]
mcp_requirements: ["optional: knowledge_base", "optional: project_management"]
---

# Handoff Protocol

Runs on: local-writes - creates or edits files in your OS folder; needs an agent with write access.

Work drops when context moves through chat alone. A handoff artifact gives the receiver the task, the reason, the constraints, and the source trail without asking the sender to repeat everything.

## When To Run

- The founder says to pass, assign, hand off, delegate, or transfer work.
- A session is ending and another person or future session owns the next step.
- A client conversation is moving to another team member.
- A task is complete but follow-up belongs to someone else.

## Required Fields

Every handoff captures:

1. What is being handed off.
2. Sender name and role.
3. Receiver name and role.
4. Why ownership changes now.
5. Definition of done.
6. Deadline with date and time if known.
7. Known constraints.
8. Open questions.
9. Reference links or file paths.

If any field is unknown, mark it `MISSING` and ask only for that field.

## Procedure

1. Search current files and recent context for the nine fields.
2. Draft the handoff artifact.
3. Show it to the sender for confirmation.
4. After confirmation, write it to the user's chosen shared place:
   - `brain/handoffs/<YYYY-MM-DD>-<topic>.md` if the folder exists.
   - `brain/log.md` as a shorter entry if no handoff folder exists.
   - `{knowledge_base}` if the user has configured one.
5. Notify or draft the receiver message only after the artifact is confirmed.

## Artifact Format

```markdown
# Handoff: <topic>
Date: <YYYY-MM-DD>
From: <sender>
To: <receiver>

## What is being handed off
<one sentence>

## Why now
<what changed>

## Definition of done
<finished state>

## Deadline
<date and time, or MISSING>

## Constraints
- <constraint>

## Open questions
- <question or none>

## References
- <file, link, or source>

## Next action for receiver
<one concrete action>
```

## Customer Handoffs

When a customer is involved:

- Name who is taking over.
- Reference the exact issue or outcome already discussed.
- Do not ask the customer to repeat context that is already in the artifact.

## Rules

- A chat message alone is not a handoff.
- The sender confirms before the receiver is notified.
- Do not bury open questions.
- Keep the artifact under 800 words unless the work is legally or financially complex.
