const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'models', 'chat.db');
const schemaPath = path.join(__dirname, 'models', 'schema.sql');

const db = new Database(databasePath);
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);
module.exports = db;
