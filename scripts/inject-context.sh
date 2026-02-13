#!/usr/bin/env bash
set -euo pipefail

# Read stdin (hook payload) — required even if unused
cat > /dev/null

# Auto-install dependencies if missing
bash "${CLAUDE_PLUGIN_ROOT}/scripts/ensure-deps.sh"

DB_PATH="${DB_PATH:-${HOME}/.claude-err/claude-err.db}"

if [ ! -f "$DB_PATH" ]; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "claude-err: No error history yet. Will begin capturing errors from this session."
  }
}
EOF
  exit 0
fi

# Get quick stats
STATS=$(node "${CLAUDE_PLUGIN_ROOT}/src/stats.js")
ERROR_COUNT=$(echo "$STATS" | jq -r '.error_count')
SOLUTION_COUNT=$(echo "$STATS" | jq -r '.solution_count')
PROJECT_COUNT=$(echo "$STATS" | jq -r '.project_count')

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "claude-err active: ${ERROR_COUNT} errors tracked, ${SOLUTION_COUNT} solutions captured across ${PROJECT_COUNT} projects. Use the search_errors MCP tool when encountering errors to check for past solutions."
  }
}
EOF
