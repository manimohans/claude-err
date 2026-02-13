#!/usr/bin/env node

import path from "path";
import { parseArgs } from "node:util";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");
process.env.DB_PATH = DB_PATH;

const { values: args } = parseArgs({
  options: {
    session: { type: "string", default: "" },
  },
  strict: false,
});
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
