const { getDatabase } = require("../db/database");

function saveStudentProfile(phoneNumber, profile) {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO student_profiles (
      phone_number, full_name, age, dob, preferred_stream, preferred_location,
      budget_tier, future_plan, last_interaction_at, updated_at
    ) VALUES (
      @phone_number, @full_name, @age, @dob, @preferred_stream, @preferred_location,
      @budget_tier, @future_plan, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT(phone_number) DO UPDATE SET
      full_name = excluded.full_name,
      age = excluded.age,
      dob = excluded.dob,
      preferred_stream = excluded.preferred_stream,
      preferred_location = excluded.preferred_location,
      budget_tier = excluded.budget_tier,
      future_plan = excluded.future_plan,
      last_interaction_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `).run({
    phone_number: phoneNumber,
    full_name: profile.fullName || null,
    age: profile.age || null,
    dob: profile.dob || null,
    preferred_stream: profile.preferredStream || null,
    preferred_location: profile.preferredLocation || null,
    budget_tier: profile.budgetTier || null,
    future_plan: profile.futurePlan || null
  });
}

function logInquiry(phoneNumber, role, message) {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO student_inquiries (phone_number, role, message)
    VALUES (?, ?, ?)
  `).run(phoneNumber, role, message);
}

function getStudentProfile(phoneNumber) {
  const db = getDatabase();
  return db.prepare("SELECT * FROM student_profiles WHERE phone_number = ?").get(phoneNumber) || null;
}

module.exports = {
  saveStudentProfile,
  logInquiry,
  getStudentProfile
};
