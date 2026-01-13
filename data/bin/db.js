const sqlite3 = require('sqlite3').verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

db.serialize(() => {
    
    db.run(`
       CREATE TABLE IF NOT EXISTS users(
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       email TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL,
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
       ) `);


    db.run(`
        CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            train_data TEXT DEFAULT '{}',
            profile_data TEXT DEFAULT '{}',
            weight_history TEXT DEFAULT '[]',
            exercise_history TEXT DEFAULT '[]',
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
});

console.log("database start");

module.exports = db;