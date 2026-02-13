# claude-err

Cross-project error intelligence for Claude Code. Passively captures error-solution pairs across all your projects and automatically surfaces relevant past solutions when similar errors appear.

## Install

```bash
# Direct from local directory
claude --plugin-dir ./claude-err

# Or from GitHub
/plugin install https://github.com/youruser/claude-err
```

## How it works

1. **Capture** — After every Bash command, a hook checks the output for error patterns. Detected errors are stored in a local SQLite database with FTS5 indexing.
2. **Pair** — When Claude finishes responding, a Stop hook checks if there was an unresolved error in the session and pairs it with the fix actions.
3. **Surface** — A skill instructs Claude to proactively search past errors via MCP when it encounters a new error. Solutions from any project are returned.

## Commands

- `/claude-err:oracle-status` — Show database stats and recent captures
- `/claude-err:oracle-search <query>` — Search past errors manually

## Data

All data is stored locally at `~/.claude-err/claude-err.db`. No data leaves your machine.

## Requirements

- Claude Code 1.0.33+
- Node.js 18+
- `jq` (for hook scripts)
