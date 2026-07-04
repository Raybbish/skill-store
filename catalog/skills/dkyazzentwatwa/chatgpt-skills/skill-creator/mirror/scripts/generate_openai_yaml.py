#!/usr/bin/env python3
"""
Generate agents/openai.yaml for a skill.
"""

from __future__ import annotations

import argparse
from pathlib import Path


REQUIRED_KEYS = ("display_name", "short_description", "default_prompt")


def parse_interface_values(values: list[str]) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for item in values:
        if "=" not in item:
            raise ValueError(f"Invalid --interface value: {item}")
        key, value = item.split("=", 1)
        parsed[key.strip()] = value.strip()
    missing = [key for key in REQUIRED_KEYS if not parsed.get(key)]
    if missing:
        raise ValueError(f"Missing required interface fields: {', '.join(missing)}")
    return parsed


def write_openai_yaml(skill_dir: Path, fields: dict[str, str]) -> Path:
    agents_dir = skill_dir / "agents"
    agents_dir.mkdir(parents=True, exist_ok=True)
    target = agents_dir / "openai.yaml"
    lines = [f"{key}: {fields[key]!r}" for key in REQUIRED_KEYS]
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate agents/openai.yaml")
    parser.add_argument("skill_path", help="Path to the skill directory")
    parser.add_argument(
        "--interface",
        action="append",
        default=[],
        help="Interface values in key=value form; repeat for display_name, short_description, default_prompt",
    )
    args = parser.parse_args()

    skill_dir = Path(args.skill_path).resolve()
    if not skill_dir.exists():
        raise SystemExit(f"Skill directory not found: {skill_dir}")

    try:
        fields = parse_interface_values(args.interface)
    except ValueError as exc:
        raise SystemExit(str(exc))

    path = write_openai_yaml(skill_dir, fields)
    print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
