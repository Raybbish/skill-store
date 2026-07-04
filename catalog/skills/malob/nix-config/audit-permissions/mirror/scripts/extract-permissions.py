#!/usr/bin/env python3
"""Extract and aggregate permissions from Claude Code settings.local.json files.

Usage:
    ./extract-permissions.py [file1] [file2] ...
    find ... | ./extract-permissions.py

Output: JSON with aggregated permissions, counts, and source projects.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path


def extract_project_name(file_path: str) -> str:
    """Extract project name from settings path (parent of .claude directory)."""
    path = Path(file_path)
    # Path is like /Users/malo/Code/project/.claude/settings.local.json
    # We want "project"
    claude_dir = path.parent  # .claude
    project_dir = claude_dir.parent  # project
    return project_dir.name


def main():
    # Collect files from args or stdin
    if len(sys.argv) > 1:
        files = [f for f in sys.argv[1:] if f.strip()]
    else:
        files = [line.strip() for line in sys.stdin if line.strip()]

    if not files:
        print("No files provided", file=sys.stderr)
        sys.exit(1)

    # Aggregate permissions
    permissions: dict[str, dict] = defaultdict(lambda: {"count": 0, "projects": []})

    for file_path in files:
        try:
            with open(file_path) as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
            continue

        project = extract_project_name(file_path)
        allow_list = data.get("permissions", {}).get("allow", [])

        for perm in allow_list:
            permissions[perm]["count"] += 1
            if project not in permissions[perm]["projects"]:
                permissions[perm]["projects"].append(project)

    # Sort by count descending
    sorted_perms = dict(
        sorted(permissions.items(), key=lambda x: -x[1]["count"])
    )

    print(json.dumps(sorted_perms, indent=2))


if __name__ == "__main__":
    main()
