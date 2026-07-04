#!/usr/bin/env python3
"""
Strict validation for skill folders.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
OPENAI_FIELDS = ("display_name", "short_description", "default_prompt")


def _parse_simple_yaml_block(block: str) -> dict[str, str]:
    data: dict[str, str] = {}
    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Invalid YAML line: {raw_line}")
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
            value = value[1:-1]
        data[key] = value
    return data


def validate_skill(skill_path: str | Path) -> tuple[bool, str]:
    """Validate a skill directory."""
    skill_dir = Path(skill_path)

    if not skill_dir.exists() or not skill_dir.is_dir():
        return False, f"Skill directory not found: {skill_dir}"

    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return False, "SKILL.md not found"

    try:
        content = skill_md.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return False, "SKILL.md must be valid UTF-8"

    match = FRONTMATTER_RE.match(content)
    if not match:
        return False, "SKILL.md must start with YAML frontmatter"

    try:
        frontmatter = _parse_simple_yaml_block(match.group(1))
    except ValueError as exc:
        return False, str(exc)

    keys = set(frontmatter.keys())
    if keys != {"name", "description"}:
        extra = sorted(keys - {"name", "description"})
        missing = sorted({"name", "description"} - keys)
        if extra:
            return False, f"Unexpected frontmatter keys: {', '.join(extra)}"
        return False, f"Missing frontmatter keys: {', '.join(missing)}"

    name = frontmatter["name"]
    description = frontmatter["description"]

    if not NAME_RE.match(name):
        return False, "Frontmatter name must be hyphen-case lowercase"
    if name != skill_dir.name:
        return False, f"Frontmatter name '{name}' must match directory name '{skill_dir.name}'"
    if not description or len(description) > 200:
        return False, "Description must be present and 200 characters or fewer"
    if "<" in description or ">" in description:
        return False, "Description cannot contain angle brackets"

    agents_yaml = skill_dir / "agents" / "openai.yaml"
    if not agents_yaml.exists():
        return False, "agents/openai.yaml not found"

    try:
        agent_fields = _parse_simple_yaml_block(agents_yaml.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        return False, "agents/openai.yaml must be valid UTF-8"
    except ValueError as exc:
        return False, f"Invalid agents/openai.yaml: {exc}"

    missing_fields = [field for field in OPENAI_FIELDS if not agent_fields.get(field)]
    if missing_fields:
        return False, f"agents/openai.yaml missing required fields: {', '.join(missing_fields)}"

    scripts_dir = skill_dir / "scripts"
    if scripts_dir.exists():
        python_files = [path for path in scripts_dir.rglob("*.py") if path.is_file()]
        if python_files and not (scripts_dir / "requirements.txt").exists():
            return False, "scripts/requirements.txt required when Python scripts are present"

    return True, "Skill is valid!"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        return 1

    valid, message = validate_skill(sys.argv[1])
    print(message)
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
