const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.resolve(__dirname, "../../data/users.db");

let _db = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        google_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        avatar_url TEXT NOT NULL DEFAULT '',
        first_seen TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        visit_count INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS profiles (
        google_id TEXT PRIMARY KEY,
        profile_json TEXT NOT NULL,
        schema_version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (google_id) REFERENCES users(google_id) ON DELETE CASCADE
      )
    `);
  }
  return _db;
}

function upsertUser(googleId, email, name, avatarUrl) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (google_id, email, name, avatar_url)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(google_id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      last_seen = datetime('now'),
      visit_count = visit_count + 1
  `);
  stmt.run(googleId, email, name || "", avatarUrl || "");
  return getUserByGoogleId(googleId);
}

function getUserByGoogleId(googleId) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId) || null;
}

function upsertProfileByGoogleId(googleId, profileJson, schemaVersion = 0) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO profiles (google_id, profile_json, schema_version)
    VALUES (?, ?, ?)
    ON CONFLICT(google_id) DO UPDATE SET
      profile_json = excluded.profile_json,
      schema_version = excluded.schema_version,
      updated_at = datetime('now')
  `);
  stmt.run(googleId, String(profileJson || ""), Number(schemaVersion || 0));
  return getProfileByGoogleId(googleId);
}

function getProfileByGoogleId(googleId) {
  const db = getDb();
  return db.prepare("SELECT * FROM profiles WHERE google_id = ?").get(googleId) || null;
}

module.exports = {
  getDb,
  upsertUser,
  getUserByGoogleId,
  upsertProfileByGoogleId,
  getProfileByGoogleId,
};
