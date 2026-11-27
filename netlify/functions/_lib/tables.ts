import type { Client } from "@libsql/client/web";

/**
 * Idempotent schema bootstrap for tables that predate the Turso migration.
 * Safe to call on every request; the work is cached per function instance.
 */
let ensured: Promise<void> | null = null;

async function run(db: Client): Promise<void> {
  // inventions (created early with a basic shape; make sure all columns exist)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inventions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      status TEXT NOT NULL DEFAULT 'concept',
      location TEXT,
      technical_details TEXT,
      use_case TEXT,
      industrial_application TEXT,
      patent_status TEXT,
      current_milestone TEXT,
      cover_image_url TEXT,
      video_url TEXT,
      gallery_urls TEXT,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `);

  const inventionCols = [
    ["location", "TEXT"],
    ["technical_details", "TEXT"],
    ["use_case", "TEXT"],
    ["industrial_application", "TEXT"],
    ["patent_status", "TEXT"],
    ["current_milestone", "TEXT"],
    ["cover_image_url", "TEXT"],
    ["video_url", "TEXT"],
    ["gallery_urls", "TEXT"],
    ["views", "INTEGER NOT NULL DEFAULT 0"],
  ] as const;
  for (const [col, type] of inventionCols) {
    try {
      await db.execute(`ALTER TABLE inventions ADD COLUMN ${col} ${type}`);
    } catch {
      /* column already exists */
    }
  }

  // votes for Spark Arena
  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      invention_id TEXT NOT NULL,
      opponent_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      UNIQUE(user_id, invention_id, opponent_id)
    )
  `);

  // extra profile columns used by the profile editor
  const profileCols = [
    ["bio", "TEXT"],
    ["location", "TEXT"],
    ["website", "TEXT"],
    ["twitter", "TEXT"],
    ["whatsapp", "TEXT"],
    ["avatar_url", "TEXT"],
  ] as const;
  for (const [col, type] of profileCols) {
    try {
      await db.execute(`ALTER TABLE profiles ADD COLUMN ${col} ${type}`);
    } catch {
      /* column already exists */
    }
  }
}

export function ensureTables(db: Client): Promise<void> {
  if (!ensured) {
    ensured = run(db).catch((err) => {
      ensured = null; // retry on next request
      throw err;
    });
  }
  return ensured;
}
