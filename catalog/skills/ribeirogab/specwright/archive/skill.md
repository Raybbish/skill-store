---
name: archive
user-invocable: false
description: "Use when explicitly invoked to close out a change whose branch has already merged: confirm the merge from git alone, then move the change folder under changes/archive/ with its ship date. Trigger on '/sw:archive', '$sw:archive', 'archive this change', or a request to close out a merged change."
---

# archive — close out a merged change

The one step that happens **after** the maintainer merges. Every other command
stops before that point: `sw:review` ends at `lgtm` and `sw:ship` ends with it,
because merging is never the agent's call. This skill picks up on the other side
and retires the change folder from the working set.

It does not merge, does not push, and does not review. It confirms and files.

**Announce at start:** "Archiving the change."

## Inputs

`$ARGUMENTS` names a change folder or slug → use it. Empty → list the changes in
`.specwright/changes/*/` whose ticket says `status: shipped` and ask which; a
single candidate may be used directly.

A change that is not `shipped` is not archivable. Say which status it carries and
stop — `pending` or `in-progress` means the work is unfinished, and `blocked`
means it needs a decision, not a filing cabinet.

## Confirm the merge from git alone

The change's branch is in its task file's `branch:` frontmatter. Resolve the
default branch, then ask git whether that branch's tip is already an ancestor of
it:

```bash
git fetch --quiet origin
default="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')"
default="${default:-main}"
git merge-base --is-ancestor "<branch>" "origin/$default"
```

Exit 0 means every commit on that branch is contained in the default branch: it
merged, whatever the remote host is and whoever pressed the button. A non-zero
exit means it did not — **stop**, report that the branch is not in
`origin/<default>` yet, and archive nothing.

This check is deliberately host-agnostic. It works on GitHub, GitLab, Gitea, a
bare remote on a colleague's machine, or a squash merge that rewrote the commits,
because it asks git about containment rather than asking a forge about a pull
request.

When the branch no longer exists locally, resolve it from
`origin/<branch>`; when neither exists, the branch was deleted after merging —
say so and ask the maintainer to confirm the merge before continuing.

## File it

```bash
git mv .specwright/changes/<slug> .specwright/changes/archive/<YYYY-MM-DD>-<slug>
```

The date prefix is the ticket's `shipped:` value, not today's. An archived folder
is a historical record: nothing inside it is edited on the way in, and nothing
reads it afterwards except a human looking for how something was decided.

A change folder whose slug already carries its date keeps that date and gains no
second prefix.

Commit the move on its own, with no other change in the same commit.

## Several at once

A backlog of merged changes archives in one pass: confirm each merge separately —
never one confirmation for the batch — and move each folder in its own commit.
One branch failing its merge check stops that change and nothing else.

## Then

Report which changes moved and where, and which were skipped with the reason.

Nothing comes next. This is the end of a change's life.
