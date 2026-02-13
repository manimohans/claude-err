#!/usr/bin/env bash
set -euo pipefail

# Read JSON payload from stdin
INPUT=$(cat)

HOOK_EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')

# Extract command from tool_input
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# For PostToolUse, error text is in tool_response (stringify it if object)
# For PostToolUseFailure, error text is in .error
if [ "$HOOK_EVENT" = "PostToolUseFailure" ]; then
  TOOL_RESPONSE=$(echo "$INPUT" | jq -r '.error // empty')
else
  # tool_response can be string or object — stringify safely
  TOOL_RESPONSE=$(echo "$INPUT" | jq -r 'if .tool_response | type == "string" then .tool_response else (.tool_response | tostring) end // empty')
fi

# Quick regex check: does output look like an error?
# Exit fast if no error detected (keeps overhead near zero)
if ! echo "$TOOL_RESPONSE" | grep -qiE \
  '(error|exception|traceback|failed|fatal|ENOENT|EACCES|segfault|panic|cannot find|not found|permission denied|compilation failed|syntax error|undefined reference|ModuleNotFoundError|ImportError|TypeError|ValueError|ConnectionRefused|CORS|404|500|502|503)'; then
  exit 0
fi

# Error detected. Store it.
DB_PATH="${HOME}/.claude-err/claude-err.db"
mkdir -p "$(dirname "$DB_PATH")"

# Extract project name from cwd
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Truncate response to first 2000 chars to keep DB manageable
ERROR_TEXT=$(echo "$TOOL_RESPONSE" | head -c 2000)

# Write to SQLite via the Node.js helper (handles schema init + FTS indexing)
node "${CLAUDE_PLUGIN_ROOT}/src/ingest.js" \
  --type "error" \
  --command "$TOOL_INPUT" \
  --output "$ERROR_TEXT" \
  --session "$SESSION_ID" \
  --project "$PROJECT_NAME" \
  --project-dir "$PROJECT_DIR"
