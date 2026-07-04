#!/usr/bin/env bash
# Discover all Claude Code project-local settings files
# Usage: ./discover-settings.sh
#
# Output: One file path per line

# Use fd to find .claude directories
# --max-depth 5 covers ~/Code/project/.claude and similar structures
fd -t d '^\.claude$' ~ --hidden --no-ignore --max-depth 5 \
  --exclude Library \
  --exclude .Trash \
  --exclude node_modules \
  --exclude .git \
  --exclude venv \
  --exclude .venv \
  --exclude __pycache__ \
  --exclude target \
  --exclude .cache \
  2>/dev/null | while IFS= read -r dir; do
  settings="$dir/settings.local.json"
  [[ -f "$settings" ]] && echo "$settings"
done
