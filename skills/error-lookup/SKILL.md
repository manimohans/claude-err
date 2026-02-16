---
name: error-lookup
description: >
  PROACTIVELY activate when Claude encounters errors, exceptions,
  stack traces, build failures, or unexpected behavior during bash
  commands. Also activate when the user says "I've seen this before",
  "this error again", or asks about recurring issues.
---

# Claude-Err Lookup

When you encounter an error in bash output, terminal logs, or build results:

1. **IMMEDIATELY** search for similar past errors by running:
   ```
   sqlite3 -json ~/.claude-err/claude-err.db "SELECT e.command, substr(e.error_output,1,300) as error_output, e.error_category, e.project_name, e.created_at, s.solution_text FROM errors_fts JOIN errors e ON e.rowid = errors_fts.rowid LEFT JOIN solutions s ON s.error_id = e.id WHERE errors_fts MATCH '\"SEARCH_TERM\"' ORDER BY rank LIMIT 3;"
   ```
   Replace SEARCH_TERM with the key error message (e.g., module name, error code).
   **Wrap in double quotes** for FTS5 phrase matching. Escape any literal `"` in SEARCH_TERM by doubling them (`"` → `""`).
2. If results are found with a solution, present the past solution
   to the user before attempting your own fix
3. If applying a past solution, note which project it came from
4. After fixing ANY error, the capture hooks will automatically
   record the error-solution pair for future reference

## What to search for

- The core error message (not the full stack trace)
- Key identifiers: module names, error codes, file paths
- Example: for "ModuleNotFoundError: No module named 'cv2'"
  search with SEARCH_TERM = "cv2" not the entire traceback

## When NOT to search

- Intentional test failures
- Errors the user explicitly caused for testing
- Lint warnings (not errors)
- If `~/.claude-err/claude-err.db` does not exist yet
