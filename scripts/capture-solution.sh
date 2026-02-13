#!/usr/bin/env bash
set -euo pipefail

# Derive plugin root from script location if not set
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# Check if there are pending (unresolved) errors for this session
PENDING=$(node "${CLAUDE_PLUGIN_ROOT}/src/check-pending.js" --session "$SESSION_ID")

if [ "$PENDING" = "none" ]; then
  exit 0
fi

# Loop over all unresolved error IDs and capture solutions for each
while IFS= read -r ERROR_ID; do
  [ -z "$ERROR_ID" ] && continue

  SOLUTION=$(node "${CLAUDE_PLUGIN_ROOT}/src/extract-solution.js" \
    --session "$SESSION_ID" \
    --transcript "$TRANSCRIPT" \
    --error-id "$ERROR_ID")

  if [ -n "$SOLUTION" ]; then
    jq -nc \
      --arg type "solution" \
      --arg errorId "$ERROR_ID" \
      --arg solution "$SOLUTION" \
      '{type: $type, errorId: $errorId, solution: $solution}' \
      | node "${CLAUDE_PLUGIN_ROOT}/src/ingest.js"
  fi
done <<< "$PENDING"
