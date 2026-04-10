require("dotenv").config();

const { colleges } = require("../data/colleges");
const { runMigrations } = require("../db/migrate");
const { upsertCollege } = require("../repositories/collegeRepository");
const { databasePath, closeDatabase } = require("../db/database");

runMigrations();

for (const college of colleges) {
  upsertCollege(college);
}

console.log(`Seeded ${colleges.length} colleges into ${databasePath}`);
closeDatabase();
