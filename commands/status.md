---
description: Show claude-err database statistics and recent captures
disable-model-invocation: true
---

# /status

Call the `claude_err_stats` tool from the `claude-err` MCP server. It takes no arguments.

Display the results as a readable summary:
- Total errors captured
- Total solutions recorded
- Number of projects tracked
- The 5 most recent error captures (show error text truncated to one line, project name, and date)

If the tool is not available, tell the user the claude-err MCP server may not be running and suggest restarting Claude Code.
