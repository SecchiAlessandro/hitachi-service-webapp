const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/hitachi_service.db');

// Create database connection
const db = new Database(dbPath);

console.log('Connected to SQLite database:', dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    console.log('Database connection closed.');
    process.exit(0);
});

module.exports = db; 