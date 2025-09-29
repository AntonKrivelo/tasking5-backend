const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { SQLITE_PATH } = require('../config');

async function createTables() {
  const db = await open({
    filename: SQLITE_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      lastSeen TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.close();
  console.log('✅ Tables created');
}

module.exports = { createTables };
