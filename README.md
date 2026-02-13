# claude-err

**Ever hit the same error twice across different projects?** claude-err remembers so you don't have to.

It's a plugin for [Claude Code](https://code.claude.com) that quietly watches for errors in the background. When something breaks, it saves the error. When Claude fixes it, it saves the fix. Next time a similar error shows up — in *any* project — Claude already knows what to do.

## Why?

- You fix a tricky `CORS` error in one project. Three weeks later, the same thing bites you in another project. Without claude-err, Claude starts from scratch. With it, Claude instantly recalls the fix.
- Works across **every language** — Python, JavaScript, Rust, Go, Java, C/C++, Ruby, PHP, Elixir, Swift, and more. If it prints an error, claude-err catches it.
- Everything stays **local on your machine**. No cloud, no API calls, no data leaving your laptop.

## Install

Open Claude Code and run:
```
/plugin marketplace add manimohans/claude-err
/plugin install claude-err@manimohans-claude-err
```

That's it. No config needed. Dependencies install automatically on first run. It starts working immediately.

> **Local development?** Clone the repo and load it directly:
> ```bash
> git clone https://github.com/manimohans/claude-err.git
> claude --plugin-dir /path/to/claude-err
> ```

## How it works

Once installed, claude-err hooks into Claude Code and runs silently in the background:

1. **Error captured** — Claude runs a command and it fails. claude-err saves the error output, the command that caused it, classifies the error type, and tags it with the project name.
2. **Solution captured** — When Claude's session ends after resolving an error, claude-err records what Claude did to fix it (files changed, commands run) and links it to the original error.
3. **Automatic recall** — Next time a similar error appears in *any* project, Claude automatically searches its error database and surfaces the past solution before trying anything new.

You don't need to do anything. It just works.

## Commands

If you want to interact with it manually:

| Command | What it does |
|---------|-------------|
| `/claude-err:status` | Show how many errors and solutions have been captured, across how many projects, plus the 5 most recent errors |
| `/claude-err:search <query>` | Search past errors and solutions. Example: `/claude-err:search CORS` or `/claude-err:search ModuleNotFoundError` |

## What it catches

claude-err detects errors from all major languages, runtimes, and tools. Each error is classified into one of 26 categories for better matching:

| Category | Examples |
|----------|----------|
| **import** | `ModuleNotFoundError`, `Cannot find module`, `ClassNotFoundException` |
| **syntax** | `SyntaxError`, `unexpected token`, `parse error` |
| **type** | `TypeError`, `type mismatch`, `is not a function` |
| **null** | `NullPointerException`, `nil pointer dereference`, `Cannot read properties of undefined` |
| **borrow** | Rust borrow checker, `cannot borrow`, `move occurs` |
| **network** | `ECONNREFUSED`, `CORS`, `timeout`, `502`/`503`/`504` |
| **permission** | `EACCES`, `permission denied`, `401`/`403` |
| **not_found** | `ENOENT`, `FileNotFoundError`, `404` |
| **database** | `SQLSTATE`, `PDOException`, `duplicate key`, `constraint violation` |
| **build** | `linker error`, `collect2`, `gcc`/`clang` errors, `cargo error` |
| **memory** | `OOM`, `segfault`, `SIGSEGV`, `stack overflow` |
| **dependency** | `npm ERR`, `version conflict`, `peer dep`, `EINTEGRITY` |
| **+ 14 more** | bounds, name, key, attribute, value, assertion, runtime, io, config, concurrency, http, infra, security, unknown |

Errors that don't match a known pattern are still captured and searchable under the `unknown` category.

## Where data is stored

Everything lives in a single SQLite database:
```
~/.claude-err/claude-err.db
```

Nothing is sent anywhere. Delete that file to start fresh.

## Requirements

- [Claude Code](https://code.claude.com) with plugin support (run `/plugin` to check)
- Node.js 18+
- `jq` (pre-installed on macOS; on Linux: `sudo apt install jq`)
- `sqlite3` (pre-installed on macOS and most Linux distros)

## License

MIT
