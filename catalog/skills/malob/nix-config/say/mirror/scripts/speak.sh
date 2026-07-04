#!/usr/bin/env bash
# TTS script: Transform and speak Claude's last response
#
# The Stop hook writes every response to a temp file, so this script
# just reads from it. Uses claude CLI to transform for audio, then speaks via macOS say.

set -euo pipefail

# Check dependencies
if ! command -v say &>/dev/null; then
  echo "Error: 'say' command not found (this plugin requires macOS)" >&2
  exit 1
fi

if ! command -v claude &>/dev/null; then
  echo "Error: 'claude' CLI not found (install from: https://claude.ai/code)" >&2
  exit 1
fi

# Arguments
SESSION_ID="${1:-}"
RATE="${2:-400}"  # Words per minute (default: 300)

if [[ -z "$SESSION_ID" ]]; then
  echo "Error: Could not determine session ID" >&2
  exit 1
fi

# Read response from temp file (written by Stop hook on every response)
TTS_RESPONSE_FILE="${TMPDIR:-/tmp}/tts-response-${SESSION_ID}.txt"

if [[ ! -f "$TTS_RESPONSE_FILE" ]]; then
  echo "No response available to speak (temp file not found)" >&2
  exit 0
fi

LAST_RESPONSE=$(cat "$TTS_RESPONSE_FILE")

if [[ -z "$LAST_RESPONSE" ]]; then
  echo "No assistant response found to speak" >&2
  exit 0
fi

# Transformation prompt for claude CLI
PROMPT='Transform this Claude Code response for text-to-speech. Output ONLY the spoken text - no preamble, no commentary. Your entire response will be fed directly to TTS.

GOAL: Preserve the full content, just make it pleasant to listen to.

TRANSFORM for audio:
- Code snippets → describe what the code does (code cannot be read aloud)
- File paths → mention the filename naturally
- Technical formatting (bullets, headers) → natural spoken flow

KEEP as-is:
- Explanations, reasoning, details - do not compress these
- The substance of what was said

STYLE:
- First person, natural speech
- Spell out abbreviations (API → "A P I")
- Numbers sound natural (8080 → "eighty eighty")

Response to transform:

'"$LAST_RESPONSE"

# Call claude CLI for transformation
# --print for non-interactive single-response mode
# Run from /tmp so session history doesn't pollute project conversations
# TTS_SUBPROCESS=1 prevents the Stop hook from triggering recursively
# Unset CLAUDECODE to allow nested claude CLI invocation
SPOKEN_TEXT=$(cd "${TMPDIR:-/tmp}" && echo "$PROMPT" | TTS_SUBPROCESS=1 CLAUDECODE='' command claude --print --model haiku 2>/dev/null) || true

# Check if transformation failed
if [[ -z "$SPOKEN_TEXT" ]]; then
  echo "Error: Transformation failed (is Claude CLI authenticated?)" >&2
  exit 1
fi

# Speak the transformed text via macOS text-to-speech
# Using temp file + -f flag instead of pipe to avoid choppy audio/dropouts
SPOKEN_TEXT_FILE=$(mktemp)
trap 'rm -f "$SPOKEN_TEXT_FILE"' EXIT
echo "$SPOKEN_TEXT" > "$SPOKEN_TEXT_FILE"
say -r "$RATE" -f "$SPOKEN_TEXT_FILE"
