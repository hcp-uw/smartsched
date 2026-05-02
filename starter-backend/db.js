const Database = require('better-sqlite3');
const db = new Database('smartsched.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    time_estimate_minutes INTEGER,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending'
  );
`);

module.exports = db;