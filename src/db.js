import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.HOME, ".claude-err", "claude-err.db");

let _db = null;

export function getDb() {
  if (_db) return _db;

  mkdirSync(path.dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS errors (
      id TEXT PRIMARY KEY,
      command TEXT,
      error_output TEXT NOT NULL,
      error_category TEXT,
      project_name TEXT NOT NULL,
      project_dir TEXT,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS solutions (
      id TEXT PRIMARY KEY,
      error_id TEXT NOT NULL REFERENCES errors(id),
      solution_text TEXT NOT NULL,
      files_changed TEXT,
      commands_run TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS errors_fts USING fts5(
      error_output,
      command,
      content=errors,
      content_rowid=rowid
    );

    -- Keep FTS index in sync automatically via triggers
    CREATE TRIGGER IF NOT EXISTS errors_fts_ai AFTER INSERT ON errors BEGIN
      INSERT INTO errors_fts(rowid, error_output, command)
      VALUES (new.rowid, new.error_output, new.command);
    END;
    CREATE TRIGGER IF NOT EXISTS errors_fts_ad AFTER DELETE ON errors BEGIN
      INSERT INTO errors_fts(errors_fts, rowid, error_output, command)
      VALUES ('delete', old.rowid, old.error_output, old.command);
    END;
    CREATE TRIGGER IF NOT EXISTS errors_fts_au AFTER UPDATE ON errors BEGIN
      INSERT INTO errors_fts(errors_fts, rowid, error_output, command)
      VALUES ('delete', old.rowid, old.error_output, old.command);
      INSERT INTO errors_fts(rowid, error_output, command)
      VALUES (new.rowid, new.error_output, new.command);
    END;

    CREATE INDEX IF NOT EXISTS idx_errors_project ON errors(project_name);
    CREATE INDEX IF NOT EXISTS idx_errors_category ON errors(error_category);
    CREATE INDEX IF NOT EXISTS idx_errors_session ON errors(session_id);
    CREATE INDEX IF NOT EXISTS idx_solutions_error ON solutions(error_id);
  `);

  return _db;
}
