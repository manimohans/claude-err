#!/usr/bin/env node

import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import path from "path";
import { classify } from "./classifier.js";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");

// Read JSON payload from stdin (avoids shell injection from CLI args)
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error(`Invalid JSON on stdin: ${err.message}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

const args = await readStdin();

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
    args.projectDir || "",
    args.session || ""
  );

  // FTS is updated automatically via triggers in db.js

  // Write the error ID to stdout so capture-solution can reference it
  process.stdout.write(id);
} else if (args.type === "solution") {
  const id = randomUUID();

  db.prepare(
    `INSERT INTO solutions (id, error_id, solution_text, files_changed, commands_run)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    args.errorId || "",
    args.solution || "",
    args.filesChanged || "[]",
    args.commandsRun || "[]"
  );

  // Mark the error as resolved
  db.prepare(`UPDATE errors SET resolved = 1 WHERE id = ?`).run(
    args.errorId || ""
  );
}
