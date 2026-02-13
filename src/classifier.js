const PATTERNS = [
  { category: "import",     regex: /ModuleNotFoundError|ImportError|Cannot find module|no module named/i },
  { category: "syntax",     regex: /SyntaxError|unexpected token|parsing error/i },
  { category: "type",       regex: /TypeError|type mismatch|cannot read prop/i },
  { category: "network",    regex: /ECONNREFUSED|CORS|fetch failed|timeout|ConnectionError|502|503/i },
  { category: "permission", regex: /EACCES|permission denied|forbidden|401|403/i },
  { category: "not_found",  regex: /ENOENT|FileNotFoundError|no such file|404|not found/i },
  { category: "build",      regex: /compilation failed|build error|linker error|undefined reference/i },
  { category: "memory",     regex: /out of memory|OOM|heap|segfault|SIGSEGV/i },
  { category: "config",     regex: /missing.*config|env.*not set|invalid.*option/i },
  { category: "dependency", regex: /version conflict|peer dep|incompatible|requires.*version/i },
];

export function classify(errorText) {
  for (const { category, regex } of PATTERNS) {
    if (regex.test(errorText)) return category;
  }
  return "unknown";
}
