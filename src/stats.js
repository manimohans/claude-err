#!/usr/bin/env node

import path from "path";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");
process.env.DB_PATH = DB_PATH;

const { getDb } = await import("./db.js");
const db = getDb();

const stats = {
  error_count: db.prepare("SELECT COUNT(*) as c FROM errors").get().c,
  solution_count: db.prepare("SELECT COUNT(*) as c FROM solutions").get().c,
  project_count: db
    .prepare("SELECT COUNT(DISTINCT project_name) as c FROM errors")
    .get().c,
};

process.stdout.write(JSON.stringify(stats));
