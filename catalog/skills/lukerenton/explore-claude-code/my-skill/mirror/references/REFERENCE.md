# references/ - Detailed Documentation

This directory contains additional documentation that Claude reads only when it needs deeper context. This is part of the [progressive disclosure](^Load a little upfront, load more only when needed. SKILL.md stays focused, and detailed material lives here) model.

## What Goes Here

- Detailed technical reference (API specs, protocol docs)
- Domain-specific knowledge (finance rules, legal requirements)
- Extended examples and edge case documentation
- Form templates or structured data formats

## How It Works

1. SKILL.md references this file: "See [references/REFERENCE.md](references/REFERENCE.md) for details"
2. Claude reads SKILL.md first (the main instructions)
3. When Claude needs more detail, it follows the link and reads this file
4. This keeps context usage efficient. Not everything loads at once

## Best Practices

- Keep individual reference files focused on one topic
- Smaller files mean less context usage when loaded
- Use descriptive filenames: `api-spec.md`, `error-codes.md`, `migration-guide.md`
- Keep file references one level deep from SKILL.md. Avoid deeply nested chains