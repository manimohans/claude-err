# claude-err

> **Beta** — This plugin is under active testing. It works, but expect rough edges and breaking changes.

A [Claude Code](https://code.claude.com) plugin that builds a local database of errors and their solutions across all your projects. When you hit an error Claude has fixed before — in any project — it recalls the fix automatically.

## Install

```
/plugin marketplace add manimohans/claude-err
/plugin install claude-err@manimohans-claude-err
```

No config needed. Dependencies install automatically on first run.

> **Local development:**
> ```bash
> git clone https://github.com/manimohans/claude-err.git
> claude --plugin-dir /path/to/claude-err
> ```

## How it works

claude-err hooks into Claude Code's lifecycle events and runs in the background:

1. **Error capture** (`PostToolUseFailure` hook) — When a Bash command fails, the error output, command, and project name are saved to a local SQLite database. The error is classified into one of 26 categories (import, syntax, type, network, build, etc.).

2. **Solution capture** (`Stop` hook) — When a session ends, claude-err checks if there were unresolved errors. If so, it reads the session transcript, extracts the fix actions (file edits, commands run after the error), and stores them linked to the original error.

3. **Recall** (skill + session context) — On session start, error/solution counts are injected into context. When Claude encounters an error, the `error-lookup` skill searches the database for matching past errors and surfaces their solutions.

All data stays in `~/.claude-err/claude-err.db`. Nothing leaves your machine.

## Commands

| Command | Description |
|---------|-------------|
| `/claude-err:status` | Database stats + recent errors with solutions |
| `/claude-err:search <query>` | Search past errors and solutions by keyword |

## Error categories

Errors are classified by regex matching into these categories:

`import` `syntax` `type` `null` `borrow` `network` `permission` `not_found` `database` `build` `memory` `dependency` `bounds` `name` `key` `attribute` `value` `assertion` `runtime` `io` `config` `concurrency` `http` `infra` `security` `unknown`

Covers Python, JavaScript/TypeScript, Rust, Go, Java, C/C++, Ruby, PHP, Elixir, Swift, and anything else that prints to stderr.

## Architecture

```
PostToolUseFailure → capture-error.sh → classifier.js → ingest.js → sqlite
Stop               → capture-solution.sh → extract-solution.js → sqlite
SessionStart       → inject-context.sh → reads stats from sqlite → injects into context
```

Key files:
- `hooks/hooks.json` — Hook event registrations
- `scripts/` — Bash entry points for each hook
- `src/db.js` — Schema and SQLite setup (WAL mode, FTS indexing)
- `src/classifier.js` — 26-category regex classifier
- `src/ingest.js` — Writes errors to DB
- `src/extract-solution.js` — Parses transcript, extracts fix actions, writes solutions to DB
- `skills/error-lookup/SKILL.md` — Proactive error search skill

## Data

```
~/.claude-err/claude-err.db
```

Single SQLite file. Two tables: `errors` (with FTS index) and `solutions`. Delete to start fresh.

## Requirements

- [Claude Code](https://code.claude.com) with plugin support
- Node.js 18+
- `jq` (pre-installed on macOS; `sudo apt install jq` on Linux)

## License

MIT
