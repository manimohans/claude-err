#!/usr/bin/env bash
set -euo pipefail

# Derive plugin root from script location if not set
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$SCRIPT_DIR")}"

if [ -d "$ROOT/node_modules" ]; then
  exit 0
fi

export npm_config_cache="${HOME}/.claude-err/npm-cache"
export npm_config_update_notifier=false

mkdir -p "${HOME}/.claude-err"

if [ -f "$ROOT/package-lock.json" ]; then
  npm ci --prefix "$ROOT" --omit=dev --no-audit --no-fund >&2
else
  npm install --prefix "$ROOT" --omit=dev --no-audit --no-fund >&2
fi
