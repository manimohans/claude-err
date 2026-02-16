---
description: Manually search the claude-err database for past errors and solutions
disable-model-invocation: true
---

# /search

Run this Bash command, replacing QUERY with `$ARGUMENTS` (wrap each search term in double quotes for FTS5 phrase matching, and escape any double quotes by doubling them: `"` → `""`):
```
sqlite3 -json ~/.claude-err/claude-err.db "SELECT e.command, substr(e.error_output,1,200) as error_output, e.error_category, e.project_name, e.created_at, s.solution_text FROM errors_fts JOIN errors e ON e.rowid = errors_fts.rowid LEFT JOIN solutions s ON s.error_id = e.id WHERE errors_fts MATCH '\"QUERY\"' ORDER BY rank LIMIT 5;"
```

**IMPORTANT**: Before inserting `$ARGUMENTS` into the MATCH clause:
- Wrap each search term in double quotes: `cv2` → `"cv2"`, `cannot find module` → `"cannot find module"`
- Escape any literal double quotes in the query by doubling them: `"` → `""`
- Example: if the user searches for `can't find`, use `"can't find"` in the MATCH clause

If `~/.claude-err/claude-err.db` does not exist, tell the user no errors have been captured yet.

Display each result as a readable summary:
- Error message (truncated to 2 lines)
- Project it came from
- When it was captured
- The solution if one exists

If no results are found, say so.
