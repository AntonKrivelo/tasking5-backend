const Database = require('better-sqlite3');

const db = new Database('mydb.sqlite');

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'unverified',
    last_login TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

module.exports = db;
