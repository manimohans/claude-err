#!/usr/bin/env bash
set -euo pipefail

# Read JSON payload from stdin
INPUT=$(cat)

HOOK_EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')

# Extract command from tool_input
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# For PostToolUseFailure, the command already failed — always capture
# For PostToolUse, check error patterns in output
if [ "$HOOK_EVENT" = "PostToolUseFailure" ]; then
  TOOL_RESPONSE=$(echo "$INPUT" | jq -r '.error // empty')
else
  # tool_response can be string or object — stringify safely
  TOOL_RESPONSE=$(echo "$INPUT" | jq -r 'if .tool_response | type == "string" then .tool_response else (.tool_response | tostring) end // empty')

  # Quick regex check: does output look like an error?
  # Exit fast if no error detected (keeps overhead near zero)
  # This covers errors across all major languages and toolchains
  if ! echo "$TOOL_RESPONSE" | grep -qiE \
    '(error[:\[\(s ]|ERROR |exception|traceback|failed|failure|fatal|abort|panic|crash|segfault|SIGSEGV|SIGABRT|SIGBUS|SIGILL|core dump|stack overflow|bus error|killed|terminated|denied|refused|rejected|invalid|illegal|unexpected|unresolved|unrecognized|unhandled|uncaught|undefined|undeclared|cannot|could not|unable to|no such|not found|not recognized|not defined|not declared|not installed|not supported|not compatible|does not exist|is not a|has no|missing|required|unknown|bad |wrong |broken |corrupt|mismatch|conflict|ambiguous|deprecated|obsolete|overflow|underflow|deadlock|race condition|null pointer|nil pointer|NullPointerException|NullReferenceException|nullptr|dangling|use after free|double free|memory leak|out of memory|OOM|heap|ENOMEM|ENOENT|EACCES|EPERM|ENOSPC|EMFILE|EADDRINUSE|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|EEXIST|EISDIR|ENOTDIR|ENOTEMPTY|EBADF|EINVAL|ModuleNotFoundError|ImportError|SyntaxError|TypeError|ValueError|KeyError|IndexError|AttributeError|NameError|RuntimeError|IOError|OSError|FileNotFoundError|PermissionError|ConnectionError|TimeoutError|OverflowError|RecursionError|StopIteration|AssertionError|ZeroDivisionError|UnicodeError|FileExistsError|NotImplementedError|MemoryError|ArithmeticError|LookupError|EOFError|BrokenPipeError|ChildProcessError|ProcessLookupError|BlockingIOError|InterruptedError|IsADirectoryError|NotADirectoryError|ReferenceError|RangeError|URIError|EvalError|AggregateError|InternalError|CompileError|LinkError|WebAssembly|cannot read prop|is not a function|is not defined|is not iterable|is not assignable|is not constructable|CORS|ERR_|TS[0-9]{4}|E[0-9]{4}|CS[0-9]{4}|C[0-9]{4}|warning\[|rustc|cargo error|borrow checker|lifetime|trait.*not implemented|move occurs|borrowing|cannot borrow|does not implement|NullPointerException|ClassNotFoundException|NoSuchMethodError|ArrayIndexOutOfBoundsException|StackOverflowError|OutOfMemoryError|IllegalArgumentException|IllegalStateException|ConcurrentModificationException|ClassCastException|UnsupportedOperationException|NumberFormatException|NoClassDefFoundError|InstantiationException|CloneNotSupportedException|java\.lang\.|java\.io\.|javax\.|kotlin\.|AndroidRuntime|FATAL EXCEPTION|goroutine.*running|runtime error|nil pointer dereference|index out of range|slice bounds out of range|deadlock|concurrent map|assignment to entry in nil map|interface conversion|cannot use.*as type|go build|go vet|govet|invalid memory address|signal SIGSEGV|#include.*error|undefined symbol|multiple definition|collect2: error|ld: |ar: |make\[|make:|cmake error|nmake|msbuild|xcodebuild|clang:|clang\+\+:|gcc:|g\+\+:|cc1:|as: |warning:|In file included from|instantiated from|In member function|no matching function|template argument|no viable|candidate|overload resolution|vtable|pure virtual|redefinition|previous declaration|conflicting types|implicit declaration|incompatible pointer|expected.*before|expected.*after|unterminated|stray|#error|static assertion|concept.*not satisfied|constraint.*not satisfied|swift error|swiftc|xcode|CocoaPods|Carthage|SPM error|dyld:|otool:|codesign|provisioning profile|PhpError|PhpWarning|Parse error|Composer|Artisan|Laravel|Symfony|SQLSTATE|PDOException|Illuminate|Whoops|blade|twig|RuntimeException|LogicException|BadMethodCallException|DomainException|InvalidArgumentException|OutOfRangeException|UnexpectedValueException|LengthException|OverflowException|UnderflowException|dotnet|csc |mcs |nuget|MSB[0-9]|System\.|Microsoft\.|InvalidOperationException|ArgumentException|FormatException|StackOverflowException|AccessViolationException|DivideByZeroException|TypeLoadException|MissingMethodException|MissingFieldException|BadImageFormatException|gem |bundler|rake|rails|rspec|minitest|LoadError|NoMethodError|ArgumentError|StandardError|Errno::|Gem::|Bundler::|ActiveRecord|ActionController|Sprockets|Webpacker|elixir|mix |iex|CompileError|\*\* \(|FunctionClauseError|MatchError|CaseClauseError|WithClauseError|BadMapError|BadStructError|UndefinedFunctionError|Protocol\.UndefinedError|ghc|cabal|stack |hackage|Prelude\.|GHC\.|Could not deduce|No instance for|Ambiguous type|Kind mismatch|Couldn.t match|Not in scope|Variable not in scope|qualified name|Parse error on input|scalac|sbt |mill |Scala\.|java\.lang\.|akka\.|play\.|MatchError|AbstractMethodError|ExceptionInInitializerError|Could not find or load|dart|flutter|pub |DartError|FormatException|StateError|ConcurrentModificationError|UnsupportedError|UnimplementedError|FlutterError|RenderFlex|RenderBox|widget|Lua error|luac|luarocks|stack traceback|attempt to|bad argument|module.*not found|julia|JuliaError|DimensionMismatch|BoundsError|DomainError|InexactError|MethodError|LoadError|UndefVarError|perl|cpan|Can.t locate|Can.t call method|Undefined subroutine|Global symbol|Use of uninitialized|POSIX|BEGIN|exit status|return code|status code|returned [1-9]|exited with|non-zero|terminated with|abnormal|segmentation fault|core dumped|Assertion.*failed|assert|ASSERT|signal [0-9]|exception [0-9]|trap [0-9]|fault|violation|interrupt|[Ww]arning:|[Ee]rror:|WARN[: ]|FATAL[: ]|CRIT[: ]|EMERG[: ]|ALERT[: ]|ERR[: ]|[45][0-9][0-9] |HTTP [45]|status [45]|BadRequest|Unauthorized|Forbidden|NotFound|MethodNotAllowed|RequestTimeout|Conflict|Gone|PayloadTooLarge|UnsupportedMediaType|TooManyRequests|InternalServerError|BadGateway|ServiceUnavailable|GatewayTimeout|npm ERR|yarn error|pnpm ERR|pip |poetry |conda |cargo |maven |gradle |lein |mix |composer |gem |bundler |cabal |stack |pub |nuget |apt |yum |dnf |pacman |brew |pkg |vcpkg |conan |webpack|vite|rollup|esbuild|parcel|turbopack|babel|tsc |eslint|prettier|stylelint|jest |vitest|mocha|pytest|unittest|rspec|junit|phpunit|nunit|xunit|go test|cargo test|dart test|flutter test|ExUnit|docker|podman|kubectl|terraform|ansible|vagrant|compose|Dockerfile|container|kubernetes|k8s|helm|istio|CERTIFICATE|SSL|TLS|x509|handshake|cipher|encryption|decryption|signature|verify|token|auth|credential|login|password|secret|EINTEGRITY|checksum|hash|digest|integrity|verification failed|npm WARN|deprecated|audit|vulnerability|advisory|CVE-)'; then
    exit 0
  fi
fi

# Error detected — store it
DB_PATH="${DB_PATH:-${HOME}/.claude-err/claude-err.db}"
mkdir -p "$(dirname "$DB_PATH")"

# Extract project name from cwd
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Truncate response to first 2000 chars to keep DB manageable
ERROR_TEXT=$(echo "$TOOL_RESPONSE" | head -c 2000)

# Write to SQLite via the Node.js helper (handles schema init + FTS indexing)
node "${CLAUDE_PLUGIN_ROOT}/src/ingest.js" \
  --type "error" \
  --command "$TOOL_INPUT" \
  --output "$ERROR_TEXT" \
  --session "$SESSION_ID" \
  --project "$PROJECT_NAME" \
  --project-dir "$PROJECT_DIR"
