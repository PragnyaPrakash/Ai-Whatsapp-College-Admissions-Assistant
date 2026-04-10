const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dataDir = path.join(process.cwd(), "data");
const databasePath = path.join(dataDir, "college-bridge.db");

let databaseInstance = null;

function getDatabase() {
  if (!databaseInstance) {
    fs.mkdirSync(dataDir, { recursive: true });
    databaseInstance = new Database(databasePath);
    databaseInstance.pragma("journal_mode = WAL");
  }

  return databaseInstance;
}

function closeDatabase() {
  if (databaseInstance) {
    databaseInstance.close();
    databaseInstance = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase,
  databasePath
};
