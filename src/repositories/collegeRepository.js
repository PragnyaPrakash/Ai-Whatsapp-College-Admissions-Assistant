const { getDatabase } = require("../db/database");

function mapCollege(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    streams: JSON.parse(row.streams_json),
    feesInrPerYear: row.fees_inr_per_year,
    applicationDeadline: row.application_deadline,
    applicationMode: row.application_mode,
    eligibility: row.eligibility,
    website: row.website,
    highlights: JSON.parse(row.highlights_json),
    isActive: Boolean(row.is_active)
  };
}

function getAllColleges({ includeInactive = false } = {}) {
  const db = getDatabase();
  const rows = includeInactive
    ? db.prepare("SELECT * FROM colleges ORDER BY name ASC").all()
    : db.prepare("SELECT * FROM colleges WHERE is_active = 1 ORDER BY name ASC").all();

  return rows.map(mapCollege);
}

function getCollegeById(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM colleges WHERE id = ?").get(id);
  return row ? mapCollege(row) : null;
}

function upsertCollege(college) {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO colleges (
      id, name, location, streams_json, fees_inr_per_year, application_deadline,
      application_mode, eligibility, website, highlights_json, is_active, updated_at
    ) VALUES (
      @id, @name, @location, @streams_json, @fees_inr_per_year, @application_deadline,
      @application_mode, @eligibility, @website, @highlights_json, @is_active, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      location = excluded.location,
      streams_json = excluded.streams_json,
      fees_inr_per_year = excluded.fees_inr_per_year,
      application_deadline = excluded.application_deadline,
      application_mode = excluded.application_mode,
      eligibility = excluded.eligibility,
      website = excluded.website,
      highlights_json = excluded.highlights_json,
      is_active = excluded.is_active,
      updated_at = CURRENT_TIMESTAMP
  `).run({
    id: college.id,
    name: college.name,
    location: college.location,
    streams_json: JSON.stringify(college.streams || []),
    fees_inr_per_year: college.feesInrPerYear,
    application_deadline: college.applicationDeadline,
    application_mode: college.applicationMode,
    eligibility: college.eligibility,
    website: college.website,
    highlights_json: JSON.stringify(college.highlights || []),
    is_active: college.isActive === false ? 0 : 1
  });

  return getCollegeById(college.id);
}

function deactivateCollege(id) {
  const db = getDatabase();
  db.prepare("UPDATE colleges SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
}

module.exports = {
  getAllColleges,
  getCollegeById,
  upsertCollege,
  deactivateCollege
};
