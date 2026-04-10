const { getDatabase } = require("./database");

function runMigrations() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS colleges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      streams_json TEXT NOT NULL,
      fees_inr_per_year INTEGER NOT NULL,
      application_deadline TEXT NOT NULL,
      application_mode TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      website TEXT NOT NULL,
      highlights_json TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      phone_number TEXT PRIMARY KEY,
      full_name TEXT,
      age TEXT,
      dob TEXT,
      preferred_stream TEXT,
      preferred_location TEXT,
      budget_tier TEXT,
      future_plan TEXT,
      last_interaction_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  runMigrations
};
