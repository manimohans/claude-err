# claude-err

**Ever hit the same error twice across different projects?** claude-err remembers so you don't have to.

It's a plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that quietly watches for errors in the background. When something breaks, it saves the error. When Claude fixes it, it saves the fix. Next time a similar error shows up — in *any* project — Claude already knows what to do.

## Why?

- You fix a tricky `CORS` error in one project. Three weeks later, the same thing bites you in another project. Without claude-err, Claude starts from scratch. With it, Claude instantly recalls the fix.
- Works across **every language** — Python, JavaScript, Rust, Go, Java, C/C++, Ruby, PHP, Elixir, Swift, and more. If it prints an error, claude-err catches it.
- Everything stays **local on your machine**. No cloud, no API calls, no data leaving your laptop.

## Install

**Option 1: From GitHub**

Open Claude Code and run:
```
/plugin install https://github.com/manimohans/claude-err
```

**Option 2: For local development**
```bash
git clone https://github.com/manimohans/claude-err.git
cd claude-err
npm install
claude --plugin-dir ./claude-err
```

That's it. No config needed. It starts working immediately.

## How it works

Once installed, claude-err runs silently in the background:

1. **You hit an error** — Claude runs a command and it fails. claude-err saves the error, the command that caused it, and which project you were in.
2. **Claude fixes it** — When Claude resolves the error, claude-err saves what Claude did to fix it (files changed, commands run).
3. **Same error, different project** — Next time a similar error appears anywhere, Claude automatically searches its memory and finds the past solution before trying anything new.

You don't need to do anything. It just works.

## Commands

If you want to interact with it manually:

- **`/claude-err:status`** — See how many errors have been captured, how many have solutions, and across how many projects.
- **`/claude-err:search <query>`** — Search for a specific error. Example: `/claude-err:search CORS` or `/claude-err:search ModuleNotFoundError`.

## What it catches

claude-err detects errors from all major languages, runtimes, and tools — including but not limited to:

- **Python** — `ImportError`, `TypeError`, `ValueError`, `KeyError`, and all built-in exceptions
- **JavaScript / TypeScript** — `ReferenceError`, `TypeError`, `SyntaxError`, TS error codes, Node.js `ERR_` codes
- **Rust** — Borrow checker errors, type mismatches, `cargo` build failures
- **Go** — `nil pointer dereference`, `index out of range`, `concurrent map` writes
- **Java / Kotlin** — `NullPointerException`, `ClassNotFoundException`, `IllegalArgumentException`
- **C / C++** — Segfaults, linker errors, `gcc`/`clang` compiler errors, `make` failures
- **Ruby** — `LoadError`, `NoMethodError`, `ArgumentError`
- **PHP** — `PDOException`, `SQLSTATE`, Laravel/Symfony errors
- **Elixir** — `FunctionClauseError`, `MatchError`, `UndefinedFunctionError`
- **Swift** — `swiftc` errors, Xcode build failures, CocoaPods issues
- **System** — Permission denied, file not found, out of memory, network timeouts, CORS, SSL/TLS
- **Databases** — SQL constraint violations, MongoDB errors, missing tables/columns
- **Build tools** — `npm`, `pip`, `cargo`, `maven`, `gradle`, `cmake`, `docker`, `kubectl`, `terraform`
- **HTTP** — `4xx`/`5xx` status codes

Errors that don't match a known category are still captured and searchable.

## Where data is stored

Everything lives in a single SQLite database at:
```
~/.claude-err/claude-err.db
```

Nothing is sent anywhere. Delete that file to start fresh.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 1.0.33 or later
- Node.js 18+
- `jq` (usually pre-installed on macOS/Linux — run `jq --version` to check)
