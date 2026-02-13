#!/usr/bin/env node

import { readFileSync } from "fs";
import path from "path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    session:    { type: "string", default: "" },
    transcript: { type: "string", default: "" },
    "error-id": { type: "string", default: "" },
  },
  strict: false,
});

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");
process.env.DB_PATH = DB_PATH;

const { getDb } = await import("./db.js");
const db = getDb();

// Get the error's timestamp so we only look at actions after it
const error = db
  .prepare("SELECT created_at FROM errors WHERE id = ?")
  .get(args["error-id"] || "");

if (!error) {
  process.exit(0);
}

// Read the transcript if available
const transcriptPath = args.transcript;
if (!transcriptPath) {
  process.exit(0);
}

let lines;
try {
  lines = readFileSync(transcriptPath, "utf-8").trim().split("\n");
} catch {
  process.exit(0);
}

// Extract tool uses that look like fixes (edits, writes, successful commands)
const fixActions = [];
const fixTools = new Set(["Edit", "Write", "Bash", "edit_file", "create_file"]);
const errorTime = new Date(error.created_at).getTime();

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.tool && fixTools.has(entry.tool) && new Date(entry.timestamp).getTime() > errorTime) {
      fixActions.push({
        tool: entry.tool,
        input: typeof entry.input === "string" ? entry.input.slice(0, 500) : JSON.stringify(entry.input).slice(0, 500),
      });
    }
  } catch {
    // Skip malformed lines
  }
}

if (fixActions.length === 0) {
  process.exit(0);
}

// Build a concise solution summary
const filesChanged = [];
const commandsRun = [];

for (const action of fixActions) {
  if (action.tool === "Edit" || action.tool === "Write" || action.tool === "edit_file" || action.tool === "create_file") {
    filesChanged.push(action.input);
  } else if (action.tool === "Bash") {
    commandsRun.push(action.input);
  }
}

const solution = fixActions
  .map((a) => `[${a.tool}] ${a.input}`)
  .join("\n")
  .slice(0, 3000);

process.stdout.write(solution);
