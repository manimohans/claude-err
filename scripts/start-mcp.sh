#!/usr/bin/env bash
set -euo pipefail

bash "${CLAUDE_PLUGIN_ROOT}/scripts/ensure-deps.sh"
exec node "${CLAUDE_PLUGIN_ROOT}/scripts/mcp-server.js"
