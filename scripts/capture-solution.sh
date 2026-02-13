#!/usr/bin/env bash
set -euo pipefail

# Derive plugin root from script location if not set
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# Brief pause so any in-flight PostToolUseFailure hook can finish writing
sleep 1

node "${CLAUDE_PLUGIN_ROOT}/src/extract-solution.js" \
  --session "$SESSION_ID" \
  --transcript "$TRANSCRIPT"
