---
description: Manually search the claude-err database for past errors and solutions
disable-model-invocation: true
---

# /search

Call the `search_errors` tool from the `claude-err` MCP server with the query set to "$ARGUMENTS".

Display each result as a readable summary:
- Error message (truncated to 2 lines)
- Project it came from
- When it was captured
- The solution if one exists

If no results are found, say so. If the tool is not available, tell the user the claude-err MCP server may not be running and suggest restarting Claude Code.
