#!/usr/bin/env node

import path from "path";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");
process.env.DB_PATH = DB_PATH;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    args[key] = argv[i + 1] || "";
  }
  return args;
}

const args = parseArgs(process.argv);
const { getDb } = await import("./db.js");
const db = getDb();

// Find the most recent unresolved error for this session
const pending = db
  .prepare(
    `SELECT id FROM errors
     WHERE session_id = ? AND resolved = 0
     ORDER BY created_at DESC LIMIT 1`
  )
  .get(args.session || "");

process.stdout.write(pending ? pending.id : "none");
