#!/usr/bin/env bash
set -euo pipefail

# Derive plugin root from script location if not set
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# Check if there's a pending (unresolved) error for this session
PENDING=$(node "${CLAUDE_PLUGIN_ROOT}/src/check-pending.js" --session "$SESSION_ID")

if [ "$PENDING" = "none" ]; then
  exit 0
fi

# Extract Claude's recent actions from the transcript
SOLUTION=$(node "${CLAUDE_PLUGIN_ROOT}/src/extract-solution.js" \
  --session "$SESSION_ID" \
  --transcript "$TRANSCRIPT" \
  --error-id "$PENDING")

if [ -n "$SOLUTION" ]; then
  jq -nc \
    --arg type "solution" \
    --arg errorId "$PENDING" \
    --arg solution "$SOLUTION" \
    '{type: $type, errorId: $errorId, solution: $solution}' \
    | node "${CLAUDE_PLUGIN_ROOT}/src/ingest.js"
fi
