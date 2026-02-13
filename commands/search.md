---
description: Manually search the claude-err database for past errors and solutions
disable-model-invocation: true
---

# /search

Run this Bash command, replacing QUERY with `$ARGUMENTS`:
```
sqlite3 -json ~/.claude-err/claude-err.db "SELECT e.command, substr(e.error_output,1,200) as error_output, e.error_category, e.project_name, e.created_at, s.solution_text FROM errors e LEFT JOIN solutions s ON s.error_id = e.id WHERE e.error_output LIKE '%QUERY%' OR e.command LIKE '%QUERY%' ORDER BY e.created_at DESC LIMIT 5;"
```

If `~/.claude-err/claude-err.db` does not exist, tell the user no errors have been captured yet.

Display each result as a readable summary:
- Error message (truncated to 2 lines)
- Project it came from
- When it was captured
- The solution if one exists

If no results are found, say so.
