#!/usr/bin/env bash
set -euo pipefail

# Derive plugin root from script location if not set
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"

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

# Get quick stats via sqlite3 (no Node.js needed for reads)
ERROR_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM errors;")
SOLUTION_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM solutions;")
PROJECT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(DISTINCT project_name) FROM errors;")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "claude-err active: ${ERROR_COUNT} errors tracked, ${SOLUTION_COUNT} solutions captured across ${PROJECT_COUNT} projects. When encountering errors, search ~/.claude-err/claude-err.db for past solutions."
  }
}
EOF
