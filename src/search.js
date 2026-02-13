import { getDb } from "./db.js";

function sanitizeFtsQuery(query) {
  // Remove FTS5 operators (AND, OR, NOT, NEAR) and special chars
  const cleaned = query
    .replace(/[()":*^{}[\]]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !["AND", "OR", "NOT", "NEAR"].includes(w.toUpperCase()))
    .join(" ");
  // Use OR for better recall — any matching term surfaces results
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `"${w}"`)
    .join(" OR ");
}

export async function search(query, project = null, limit = 5) {
  const db = getDb();

  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery) return [];

  let sql = `
    SELECT
      e.id,
      e.command,
      e.error_output,
      e.error_category,
      e.project_name,
      e.created_at,
      s.solution_text,
      s.files_changed,
      s.commands_run,
      rank
    FROM errors_fts
    JOIN errors e ON errors_fts.rowid = e.rowid
    LEFT JOIN solutions s ON s.error_id = e.id
    WHERE errors_fts MATCH ?
  `;

  const params = [ftsQuery];

  if (project) {
    sql += ` AND e.project_name = ?`;
    params.push(project);
  }

  sql += ` ORDER BY rank LIMIT ?`;
  params.push(limit);

  return db.prepare(sql).all(...params);
}

export async function getSolution(errorId) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT e.*, s.solution_text, s.files_changed, s.commands_run
    FROM errors e
    LEFT JOIN solutions s ON s.error_id = e.id
    WHERE e.id = ?
  `
    )
    .get(errorId);
}

export async function getStats() {
  const db = getDb();
  return {
    error_count: db.prepare("SELECT COUNT(*) as c FROM errors").get().c,
    solution_count: db.prepare("SELECT COUNT(*) as c FROM solutions").get().c,
    project_count: db
      .prepare("SELECT COUNT(DISTINCT project_name) as c FROM errors")
      .get().c,
    recent: db
      .prepare(
        `SELECT error_output, project_name, created_at
         FROM errors ORDER BY created_at DESC LIMIT 5`
      )
      .all(),
  };
}
