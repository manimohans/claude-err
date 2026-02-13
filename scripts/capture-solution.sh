#!/usr/bin/env bash
set -euo pipefail

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
  node "${CLAUDE_PLUGIN_ROOT}/src/ingest.js" \
    --type "solution" \
    --error-id "$PENDING" \
    --solution "$SOLUTION"
fi
