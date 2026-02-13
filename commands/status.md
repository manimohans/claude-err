---
description: Show claude-err database statistics and recent captures
disable-model-invocation: true
---

# /status

Run this Bash command:
```
sqlite3 -json ~/.claude-err/claude-err.db "SELECT (SELECT COUNT(*) FROM errors) as error_count, (SELECT COUNT(*) FROM solutions) as solution_count, (SELECT COUNT(DISTINCT project_name) FROM errors) as project_count; SELECT substr(e.error_output,1,120) as error_preview, e.error_category, e.project_name, e.created_at, e.resolved, substr(s.solution_text,1,200) as solution_preview FROM errors e LEFT JOIN solutions s ON s.error_id = e.id ORDER BY e.created_at DESC LIMIT 5;"
```

If `~/.claude-err/claude-err.db` does not exist, tell the user no errors have been captured yet.

Display the results as a readable summary:
- Total errors captured
- Total solutions recorded
- Number of projects tracked
- The 5 most recent error captures (show error text truncated to one line, project name, date, resolved status, and solution preview if available)
