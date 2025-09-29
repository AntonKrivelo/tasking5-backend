const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbInstance = null;

async function initDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await open({
    filename: process.env.SQLITE_PATH || './db.db',
    driver: sqlite3.Database,
  });
  return dbInstance;
}

module.exports = { initDB };
