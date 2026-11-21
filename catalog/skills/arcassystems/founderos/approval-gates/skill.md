---
name: approval-gates
description: Check whether an action needs approval before doing it. Say "do I need approval for this" or "should I ask first". Triggers when you are about to send, publish, pay, sign, delete, or push something public. Reads `rules/approval-gates.md` and classifies the action as auto-runnable, ask-first, or refused. Other skills call this internally.
why: "Prevents irreversible or public actions from happening silently - sends, pushes, deletes, and payments need a human yes first."
enhance: "Fill rules/approval-gates.md with your own thresholds - the default table is a fallback; your custom gates are what actually protect your workflow."
allowed-tools: ["Read", "Write"]
mcp_requirements: []
---

# Approval Gates

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

## Pre-Read

Read `rules/approval-gates.md`. If the installed OS has no customized copy, read `templates/rules/approval-gates.md` as the fallback.

If neither file exists, default to ask-first for any external, financial, public, destructive, or data-sensitive action.

## Action Classes

Classify the requested action into one of these groups:

| Class | Default Gate |
|---|---|
| Internal note, log entry, or draft | Auto-runnable |
| Read-only scan or local analysis | Auto-runnable |
| Edit to operating files with user data | Ask first |
| External send, publish, payment, contract, invoice, or proposal | Ask first |
| Public repo push, public release, or public package update | Ask first |
| Delete, hard reset, force push, secret exposure, or AI attribution in commit history | Refuse unless the user explicitly owns the risk and the action is allowed by repo rules |

The local `rules/approval-gates.md` wins over this default table.

## Procedure

1. State the action in one sentence.
2. Classify the action type.
3. Read the relevant gate from `rules/approval-gates.md`. If that file is absent, fall back to `templates/rules/approval-gates.md`. If neither exists, use the default table above.
4. Return one of three calls:
   - `AUTO-RUN` - proceed and log if the action changes state.
   - `ASK FIRST` - show the exact action and wait for yes.
   - `REFUSE` - explain the blocked action and the safer path.
5. If the gate is ambiguous, choose `ASK FIRST`.

## Approval Artifact

For ask-first actions, present:

```text
Approval needed: <action>
Gate: <rule name or section>
Why approval is needed: <one sentence>
What will change: <files, external party, public surface, money, or data>
Rollback path: <how to undo, or none>
Question: Proceed? yes / no
```

## Logging

If an action changes state after approval, log the outcome to the right file:

- `brain/log.md` for operating actions.
- `context/decisions.md` for resolved decisions.
- `context/clients.md` for revenue or client state.

If the user rejects the action, log only if the decision affects future behavior.

## Rules

- Do not auto-approve because a similar action happened before.
- Do not ask for approval on actions clearly below threshold.
- Do not proceed silently on partial approval.
