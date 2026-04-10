const { colleges } = require("../data/colleges");
const { getAllColleges, upsertCollege } = require("../repositories/collegeRepository");

function ensureSeedData() {
  const existing = getAllColleges({ includeInactive: true });

  if (existing.length > 0) {
    return {
      seeded: false,
      count: existing.length
    };
  }

  for (const college of colleges) {
    upsertCollege(college);
  }

  return {
    seeded: true,
    count: colleges.length
  };
}

module.exports = {
  ensureSeedData
};
