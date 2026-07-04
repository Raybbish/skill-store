#!/usr/bin/env python3
"""Remove permissions from local settings that are covered by global config.

Usage:
    ./cleanup-redundant.py [--apply] [--global-settings PATH]

Reads local settings files from stdin (one path per line) and identifies
permissions that are already covered by global settings.

By default, runs in dry-run mode showing what would be removed.

Options:
    --apply             Actually modify files (default is dry-run)
    --global-settings   Path to global settings (default: ~/.claude/settings.json)
"""

import json
import re
import sys
from pathlib import Path


def normalize_permission(perm: str) -> str:
    """Normalize legacy colon-wildcard to space-wildcard for comparison.

    Bash(cmd:*) -> Bash(cmd *)
    """
    if perm.endswith(":*)"):
        return perm[:-3] + " *)"
    return perm


def load_global_permissions(global_path: Path) -> list[str]:
    """Load allow list from global settings."""
    try:
        with open(global_path) as f:
            data = json.load(f)
        return data.get("permissions", {}).get("allow", [])
    except (OSError, json.JSONDecodeError) as e:
        print(f"Error reading global settings: {e}", file=sys.stderr)
        sys.exit(1)


def permission_matches(pattern: str, permission: str) -> bool:
    """Check if a global pattern covers a local permission.

    Normalizes both sides before comparison so that colon-syntax and
    space-syntax are treated as equivalent (e.g., global `Bash(sort *)`
    matches local `Bash(sort:*)`).
    """
    pattern = normalize_permission(pattern)
    permission = normalize_permission(permission)

    if pattern == permission:
        return True

    # Handle MCP server wildcards: mcp__server__* matches mcp__server__tool
    if pattern.endswith("__*"):
        prefix = pattern[:-1]  # Remove trailing *, keep mcp__server__
        if permission.startswith(prefix):
            return True

    # Handle " *)" suffix as prefix match, but only when the prefix itself
    # has no wildcards. e.g., "Bash(ls *)" matches "Bash(ls -la)" or "Bash(ls)"
    # but "Bash(* --help *)" should fall through to the regex branch.
    if pattern.endswith(" *)"):
        prefix = pattern[:-3]  # Remove " *)"
        if "*" not in prefix:
            if permission.startswith(prefix) and permission.endswith(")"):
                return True

    # Handle glob wildcards: "Bash(* --version)" matches "Bash(foo --version)"
    if "*" in pattern:
        regex_pattern = re.escape(pattern).replace(r"\*", ".*")
        if re.fullmatch(regex_pattern, permission):
            return True

    return False


def is_covered_by_global(permission: str, global_perms: list[str]) -> bool:
    """Check if a local permission is covered by any global pattern."""
    return any(permission_matches(g, permission) for g in global_perms)


def process_file(
    file_path: Path, global_perms: list[str], dry_run: bool
) -> dict:
    """Process a single settings file and remove redundant permissions.

    Returns dict with stats about what was found/removed.
    """
    try:
        with open(file_path) as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        return {"error": str(e)}

    allow_list = data.get("permissions", {}).get("allow", [])
    if not allow_list:
        return {"skipped": True, "reason": "no permissions"}

    redundant = []
    keep = []

    for perm in allow_list:
        if is_covered_by_global(perm, global_perms):
            redundant.append(perm)
        else:
            keep.append(perm)

    if not redundant:
        return {"skipped": True, "reason": "no redundant permissions"}

    result = {
        "file": str(file_path),
        "removed": redundant,
        "kept": keep,
        "total_before": len(allow_list),
    }

    if not dry_run:
        # Normalize remaining permissions from colon-syntax to space-syntax
        keep = [normalize_permission(p) for p in keep]

        if keep:
            data["permissions"]["allow"] = keep
        else:
            data["permissions"]["allow"] = []

        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")

    return result


def main():
    dry_run = "--apply" not in sys.argv

    # Find global settings path
    global_path = Path.home() / ".claude" / "settings.json"
    for i, arg in enumerate(sys.argv):
        if arg == "--global-settings" and i + 1 < len(sys.argv):
            global_path = Path(sys.argv[i + 1])

    # Resolve symlinks so we read the actual file
    global_path = global_path.resolve()

    global_perms = load_global_permissions(global_path)

    # Read file paths from stdin
    files = [Path(line.strip()) for line in sys.stdin if line.strip()]

    if not files:
        print("No files provided on stdin", file=sys.stderr)
        sys.exit(1)

    results = []
    for file_path in files:
        result = process_file(file_path, global_perms, dry_run)
        if "error" not in result and not result.get("skipped"):
            results.append(result)

    # Output results as JSON
    output = {
        "dry_run": dry_run,
        "global_permissions_count": len(global_perms),
        "files_processed": len(files),
        "files_modified": len(results),
        "changes": results,
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
