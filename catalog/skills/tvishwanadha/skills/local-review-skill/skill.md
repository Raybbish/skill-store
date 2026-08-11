---
name: local-review-skill
description: Project-specific skill review rules.
user-invocable: false
---

# Local Review: skill

These rules extend the default skill review rules.

## Rules

- Load `skills-guide` for marketplace-specific skill conventions before reviewing
- Do not flag missing `disable-model-invocation` on orchestration or review skills (e.g., `self-review`, `review-*`)
- Judge every finding by its impact on the agent executing the skill, not by human-maintainer values:
  - Discard "DRY / two places to keep in sync", unless the copies can contradict
  - Discard "a maintainer cannot verify this"
  - Keep execution-correctness bugs, contradiction risk between instructions, and context bloat
- Do not flag an `allowed-tools` entry as unused just because no procedure step names it; flag only tools the skill could not plausibly need
