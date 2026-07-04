#!/usr/bin/env python3
"""
Initialize a skill with optional resource folders and agent metadata.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from generate_openai_yaml import write_openai_yaml


SKILL_TEMPLATE = """---
name: {skill_name}
description: {description}
---

# {skill_title}

## Overview

Describe what this skill enables and when to use it.

## Workflow

1. Define the concrete user requests this skill should handle.
2. Add only the scripts, references, or assets that make execution more reliable.
3. Keep instructions concise and move deep detail into `references/` when needed.
4. Validate the skill before packaging or publishing it.
"""


EXAMPLE_SCRIPT = """#!/usr/bin/env python3
\"\"\"
Example helper for {skill_name}.
\"\"\"


def main() -> None:
    print("Replace this example with a real script or delete it.")


if __name__ == "__main__":
    main()
"""


EXAMPLE_REFERENCE = """# Reference Notes

Keep long-form details here instead of bloating `SKILL.md`.
"""


def title_case(skill_name: str) -> str:
    return " ".join(part.capitalize() for part in skill_name.split("-"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize a skill")
    parser.add_argument("skill_name", help="Hyphen-case skill name")
    parser.add_argument("--path", required=True, help="Output directory")
    parser.add_argument(
        "--resources",
        default="scripts,references,assets",
        help="Comma-separated resource folders to create",
    )
    parser.add_argument(
        "--examples",
        action="store_true",
        help="Create example files in resource folders",
    )
    parser.add_argument(
        "--interface",
        action="append",
        default=[],
        help="Agent metadata values in key=value form",
    )
    return parser.parse_args()


def parse_interface(values: list[str], skill_name: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for item in values:
        if "=" not in item:
            raise SystemExit(f"Invalid --interface value: {item}")
        key, value = item.split("=", 1)
        parsed[key.strip()] = value.strip()
    return {
        "display_name": parsed.get("display_name", title_case(skill_name)),
        "short_description": parsed.get(
            "short_description", "Add a concise human-facing summary."
        ),
        "default_prompt": parsed.get(
            "default_prompt", f"Help me use the {skill_name} skill."
        ),
    }


def init_skill(args: argparse.Namespace) -> Path:
    skill_dir = Path(args.path).resolve() / args.skill_name
    if skill_dir.exists():
        raise SystemExit(f"Skill directory already exists: {skill_dir}")

    skill_dir.mkdir(parents=True, exist_ok=False)
    description = "Replace with a concise description of what the skill does and when to use it."
    (skill_dir / "SKILL.md").write_text(
        SKILL_TEMPLATE.format(
            skill_name=args.skill_name,
            description=description,
            skill_title=title_case(args.skill_name),
        ),
        encoding="utf-8",
    )

    resources = {item.strip() for item in args.resources.split(",") if item.strip()}
    if "scripts" in resources:
        scripts_dir = skill_dir / "scripts"
        scripts_dir.mkdir()
        (scripts_dir / "requirements.txt").write_text("", encoding="utf-8")
        if args.examples:
            example = scripts_dir / "example.py"
            example.write_text(EXAMPLE_SCRIPT.format(skill_name=args.skill_name), encoding="utf-8")
            example.chmod(0o755)
    if "references" in resources:
        references_dir = skill_dir / "references"
        references_dir.mkdir()
        if args.examples:
            (references_dir / "notes.md").write_text(EXAMPLE_REFERENCE, encoding="utf-8")
    if "assets" in resources:
        (skill_dir / "assets").mkdir()

    write_openai_yaml(skill_dir, parse_interface(args.interface, args.skill_name))
    return skill_dir


def main() -> int:
    args = parse_args()
    result = init_skill(args)
    print(f"Initialized skill at {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
