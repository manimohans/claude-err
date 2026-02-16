#!/usr/bin/env bash
set -euo pipefail

# Derive plugin root from script location if not set
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"

# Read JSON payload from stdin
INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')

# Extract command from tool_input
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Extract error message from the failure payload
ERROR_MSG=$(echo "$INPUT" | jq -r '.error // empty')
EXTRA=$(echo "$INPUT" | jq -r 'if .tool_response then (if .tool_response | type == "string" then .tool_response else (.tool_response | tostring) end) else "" end' 2>/dev/null || true)
if [ -n "$EXTRA" ] && [ "$EXTRA" != "null" ]; then
  TOOL_RESPONSE="${ERROR_MSG}
${EXTRA}"
else
  TOOL_RESPONSE="$ERROR_MSG"
fi

# Skip if no meaningful error text was captured
if [ -z "$TOOL_RESPONSE" ] || [ "$TOOL_RESPONSE" = "null" ]; then
  exit 0
fi

# Error detected — store it
DB_PATH="${DB_PATH:-${HOME}/.claude-err/claude-err.db}"
mkdir -p "$(dirname "$DB_PATH")"

# Extract project name from cwd
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Truncate response to first 2000 characters (bash substring is UTF-8 safe)
ERROR_TEXT="${TOOL_RESPONSE:0:2000}"

# Ensure Node.js dependencies are installed (may not be ready if SessionStart
# hook hasn't completed yet or failed)
bash "${CLAUDE_PLUGIN_ROOT}/scripts/ensure-deps.sh"

# Write to SQLite via the Node.js helper (JSON over stdin avoids shell injection)
jq -nc \
  --arg type "error" \
  --arg command "$TOOL_INPUT" \
  --arg output "$ERROR_TEXT" \
  --arg session "$SESSION_ID" \
  --arg project "$PROJECT_NAME" \
  --arg projectDir "$PROJECT_DIR" \
  '{type: $type, command: $command, output: $output, session: $session, project: $project, projectDir: $projectDir}' \
  | node "${CLAUDE_PLUGIN_ROOT}/src/ingest.js"
