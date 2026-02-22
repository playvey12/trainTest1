const sqlite3 = require('sqlite3').verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));
db.run("PRAGMA foreign_keys = ON;");

db.serialize(() => {
   
    db.run(`
       CREATE TABLE IF NOT EXISTS users(
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       email TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL,
       is_verified BOOLEAN DEFAULT 0,
       verification_code VARCHAR(6),
       code_expires_at DATETIME,
       telegram_id TEXT UNIQUE, 
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
    

    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_verification ON users(email, verification_code)`);
    

   db.run(`
    CREATE TRIGGER IF NOT EXISTS create_user_data
    AFTER INSERT ON users
    FOR EACH ROW
    BEGIN
        INSERT INTO user_data (user_id, train_data, profile_data, weight_history, exercise_history) 
        VALUES (
            NEW.id, 
            '{"Monday":[],"Tuesday":[],"Wednesday":[],"Thursday":[],"Friday":[],"Saturday":[],"Sunday":[]}', 
            '{"userName":"Пользователь","language":"ru","userWeight":0,"totalWorkouts":0,"totalHours":0}', 
            '[]', 
            '[]'
        );
    END
`);


    db.run("PRAGMA journal_mode = WAL;");

});

console.log("Database старт - Структура обновлена");

module.exports = db;