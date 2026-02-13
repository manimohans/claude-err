#!/usr/bin/env node

import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    session:    { type: "string", default: "" },
    transcript: { type: "string", default: "" },
  },
  strict: false,
});

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");
process.env.DB_PATH = DB_PATH;

const { getDb } = await import("./db.js");
const db = getDb();

const sessionId = args.session || "";
const transcriptPath = args.transcript || "";

if (!sessionId || !transcriptPath) {
  process.exit(0);
}

// 1. Query all unresolved errors for this session, ordered by time
const errors = db
  .prepare(
    `SELECT id, created_at FROM errors
     WHERE session_id = ? AND resolved = 0
     ORDER BY created_at ASC`
  )
  .all(sessionId);

if (errors.length === 0) {
  process.exit(0);
}

// 2. Read transcript once
let lines;
try {
  lines = readFileSync(transcriptPath, "utf-8").trim().split("\n");
} catch {
  process.exit(0);
}

// 3. Parse all fix-related tool uses with timestamps into a sorted array
const fixTools = new Set(["Edit", "Write", "Bash", "edit_file", "create_file"]);
const allActions = [];

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.type !== "assistant" || !entry.message?.content) continue;

    const ts = new Date(entry.timestamp).getTime();
    if (isNaN(ts)) continue;

    const toolUses = Array.isArray(entry.message.content)
      ? entry.message.content.filter((c) => c.type === "tool_use")
      : [];

    for (const tu of toolUses) {
      if (fixTools.has(tu.name)) {
        allActions.push({
          timestamp: ts,
          tool: tu.name,
          input: typeof tu.input === "string"
            ? tu.input.slice(0, 500)
            : JSON.stringify(tu.input).slice(0, 500),
        });
      }
    }
  } catch {
    // Skip malformed lines
  }
}

// 4. For each error, extract fix actions between its timestamp and the next error's timestamp
const insertSolution = db.prepare(
  `INSERT INTO solutions (id, error_id, solution_text, files_changed, commands_run)
   VALUES (?, ?, ?, ?, ?)`
);
const markResolved = db.prepare(
  `UPDATE errors SET resolved = 1 WHERE id = ?`
);

const captureAll = db.transaction(() => {
  const results = [];

  for (let i = 0; i < errors.length; i++) {
    const error = errors[i];
    // SQLite CURRENT_TIMESTAMP stores UTC without Z suffix — append Z so
    // JavaScript parses it as UTC (matching the transcript's ISO-8601 timestamps).
    const errorStart = new Date(error.created_at + "Z").getTime();
    const errorEnd = i + 1 < errors.length
      ? new Date(errors[i + 1].created_at + "Z").getTime()
      : Infinity;

    const fixActions = allActions.filter(
      (a) => a.timestamp > errorStart && a.timestamp <= errorEnd
    );

    if (fixActions.length === 0) continue;

    const solutionText = fixActions
      .map((a) => `[${a.tool}] ${a.input}`)
      .join("\n")
      .slice(0, 3000);

    insertSolution.run(randomUUID(), error.id, solutionText, "[]", "[]");
    markResolved.run(error.id);

    results.push({ errorId: error.id, actions: fixActions.length });
  }

  return results;
});

const results = captureAll();

if (results.length > 0) {
  process.stdout.write(
    results.map((r) => `${r.errorId}: ${r.actions} fix actions`).join("\n")
  );
}
