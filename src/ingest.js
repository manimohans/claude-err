#!/usr/bin/env node

import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import path from "path";
import { classify } from "./classifier.js";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    args[key] = argv[i + 1] || "";
  }
  return args;
}

const args = parseArgs(process.argv);

// Ensure DB directory exists
mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Dynamic import to set env before db.js reads it
process.env.DB_PATH = DB_PATH;
const { getDb } = await import("./db.js");
const db = getDb();

if (args.type === "error") {
  const id = randomUUID();
  const category = classify(args.output || "");

  db.prepare(
    `INSERT INTO errors (id, command, error_output, error_category, project_name, project_dir, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    args.command || "",
    args.output || "",
    category,
    args.project || "unknown",
    args["project-dir"] || "",
    args.session || ""
  );

  // Update FTS index
  db.prepare(
    `INSERT INTO errors_fts (rowid, error_output, command)
     SELECT rowid, error_output, command FROM errors WHERE id = ?`
  ).run(id);

  // Write the error ID to stdout so capture-solution can reference it
  process.stdout.write(id);
} else if (args.type === "solution") {
  const id = randomUUID();

  db.prepare(
    `INSERT INTO solutions (id, error_id, solution_text, files_changed, commands_run)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    args["error-id"] || "",
    args.solution || "",
    args["files-changed"] || "[]",
    args["commands-run"] || "[]"
  );

  // Mark the error as resolved
  db.prepare(`UPDATE errors SET resolved = 1 WHERE id = ?`).run(
    args["error-id"] || ""
  );
}
