const PATTERNS = [
  // Database / SQL (before not_found so "SQLSTATE...table not found" matches here)
  { category: "database",   regex: /SQLSTATE|PDOException|SequelizeDatabaseError|MongoError|MongoServerError|duplicate key|constraint violation|foreign key|unique constraint|relation.*does not exist|table.*not found|column.*not found/i },
  // Import / module resolution
  { category: "import",     regex: /ModuleNotFoundError|ImportError|Cannot find module|no module named|LoadError|ClassNotFoundException|NoClassDefFoundError|Can't locate|module.*not found|UndefVarError|UndefinedFunctionError|require.*error/i },
  // Syntax / parse
  { category: "syntax",     regex: /SyntaxError|unexpected token|parsing error|parse error|unterminated|CompileError|compilation error|Parse error on input/i },
  // Null / nil (before type so "Cannot read properties of null" wins over TypeError)
  { category: "null",       regex: /NullPointerException|NullReferenceException|nullptr|nil pointer|null reference|undefined is not|Cannot read properties of (null|undefined)|use of uninitialized|entry in nil map/i },
  // Type system
  { category: "type",       regex: /TypeError|type mismatch|cannot read prop|is not a function|is not iterable|is not assignable|ClassCastException|TypeLoadException|Kind mismatch|cannot use.*as type|incompatible type/i },
  // Index / bounds
  { category: "bounds",     regex: /IndexError|ArrayIndexOutOfBoundsException|index out of range|slice bounds out of range|BoundsError|RangeError|OutOfRangeException|subscript out of range/i },
  // Name / reference
  { category: "name",       regex: /NameError|ReferenceError|not defined|not declared|undeclared|not in scope|Variable not in scope|undefined reference|undefined symbol|unresolved external|TS[0-9]{4}/i },
  // Key / lookup
  { category: "key",        regex: /KeyError|key not found|no such key|missing key|NoSuchElementException|BadMapError/i },
  // Attribute / method
  { category: "attribute",  regex: /AttributeError|has no attribute|NoMethodError|NoSuchMethodError|no matching function|BadMethodCallException|Undefined subroutine|no member named/i },
  // Value / argument
  { category: "value",      regex: /ValueError|InvalidArgumentException|IllegalArgumentException|ArgumentError|bad argument|invalid argument|FormatException|NumberFormatException|DomainError/i },
  // Assertion / test
  { category: "assertion",  regex: /AssertionError|AssertError|Assertion.*failed|ASSERT|static assertion|test.*fail|expected.*but got/i },
  // Runtime
  { category: "runtime",    regex: /RuntimeError|RuntimeException|InternalError|IllegalStateException|InvalidOperationException|FunctionClauseError|MatchError|CaseClauseError|RecursionError|maximum recursion/i },
  // Borrow checker / Rust (before network so "E0502" doesn't match "502")
  { category: "borrow",     regex: /borrow checker|lifetime|cannot borrow|move occurs|does not implement.*trait|borrowing|borrowed/i },
  // Network / connection (word-boundary on status codes to avoid matching error codes like E0502)
  { category: "network",    regex: /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|CORS|fetch failed|timeout|ConnectionError|ConnectionRefused|\b502\b|\b503\b|\b504\b|BadGateway|ServiceUnavailable|GatewayTimeout|EADDRINUSE|socket hang up/i },
  // Permission / auth (word-boundary on status codes)
  { category: "permission", regex: /EACCES|EPERM|permission denied|forbidden|\b401\b|\b403\b|AccessViolationException|Unauthorized|access denied/i },
  // File not found (word-boundary on 404)
  { category: "not_found",  regex: /ENOENT|FileNotFoundError|no such file|\b404\b|not found|does not exist|FileNotFoundException/i },
  // IO / filesystem
  { category: "io",         regex: /IOError|OSError|ENOSPC|EMFILE|EBADF|EISDIR|ENOTEMPTY|EEXIST|BrokenPipeError|disk full|no space left|too many open files/i },
  // Memory
  { category: "memory",     regex: /out of memory|OOM|heap|segfault|SIGSEGV|SIGABRT|SIGBUS|core dump|stack overflow|bus error|MemoryError|OutOfMemoryError|ENOMEM/i },
  // Build / link / compile
  { category: "build",      regex: /compilation failed|build error|linker error|undefined reference|collect2: error|ld:|make\[|make:|cmake error|msbuild|xcodebuild|clang:|gcc:|g\+\+:|rustc|cargo error|swiftc|could not compile/i },
  // Config / env
  { category: "config",     regex: /missing.*config|env.*not set|invalid.*option|\.env|config.*not found/i },
  // Dependency / package
  { category: "dependency", regex: /version conflict|peer dep|incompatible|requires.*version|npm ERR|yarn error|pnpm ERR|pip.*error|gem.*error|bundler|composer|nuget|EINTEGRITY|could not find a version|no matching distribution/i },
  // Concurrency
  { category: "concurrency", regex: /deadlock|race condition|concurrent map|ConcurrentModificationException|data race|thread.*panic/i },
  // HTTP status
  { category: "http",       regex: /[45][0-9][0-9] |HTTP [45]|status [45]|BadRequest|MethodNotAllowed|RequestTimeout|Conflict|PayloadTooLarge|TooManyRequests|InternalServerError/i },
  // Container / infra
  { category: "infra",      regex: /docker|podman|kubectl|terraform|Dockerfile|container.*error|kubernetes|k8s|helm|OCI runtime/i },
  // SSL / crypto
  { category: "security",   regex: /CERTIFICATE|SSL|TLS|x509|handshake failed|cipher|CERT_|ERR_CERT|self.signed|certificate verify failed/i },
];

export function classify(errorText) {
  for (const { category, regex } of PATTERNS) {
    if (regex.test(errorText)) return category;
  }
  return "unknown";
}
