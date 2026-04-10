const assert = require("node:assert/strict");
const { inferBudgetTier, recommendColleges } = require("../src/services/recommendationEngine");
const { getProvider, isAiEnabled } = require("../src/services/aiAdvisor");
const { runMigrations } = require("../src/db/migrate");
const { upsertCollege } = require("../src/repositories/collegeRepository");

runMigrations();
upsertCollege({
  id: "vit-vellore",
  name: "VIT Vellore",
  location: "Vellore, Tamil Nadu",
  streams: ["engineering", "computer-science", "business"],
  feesInrPerYear: 198000,
  applicationDeadline: "2026-05-31",
  applicationMode: "Online entrance exam and counseling",
  eligibility: "Class 12 with PCM for engineering-focused programs",
  website: "https://vit.ac.in",
  highlights: ["Strong placement network", "Industry-linked programs", "Hostel and campus facilities"]
});
upsertCollege({
  id: "loyola",
  name: "Loyola College",
  location: "Chennai, Tamil Nadu",
  streams: ["arts", "commerce", "science", "media"],
  feesInrPerYear: 76000,
  applicationDeadline: "2026-05-15",
  applicationMode: "Online application and merit-based admission",
  eligibility: "Class 12 completion",
  website: "https://www.loyolacollege.edu",
  highlights: ["Affordable fees", "Strong reputation for UG programs", "Good alumni network"]
});
upsertCollege({
  id: "manipal",
  name: "Manipal Institute of Technology",
  location: "Manipal, Karnataka",
  streams: ["engineering", "computer-science", "design"],
  feesInrPerYear: 325000,
  applicationDeadline: "2026-04-30",
  applicationMode: "MET entrance exam",
  eligibility: "Class 12 with PCM and entrance score",
  website: "https://www.manipal.edu",
  highlights: ["Flexible electives", "Global exposure", "Well-known private campus"]
});

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

run("inferBudgetTier classifies fee ranges", () => {
  assert.equal(inferBudgetTier(70000), "budget");
  assert.equal(inferBudgetTier(180000), "mid");
  assert.equal(inferBudgetTier(400000), "premium");
});

run("recommendColleges sorts engineering matches", () => {
  const results = recommendColleges({
    preferredStream: "engineering",
    budgetTier: "mid",
    preferredLocation: "tamil nadu",
    futurePlan: "placements"
  });

  assert.equal(results.length, 3);
  assert.equal(results[0].name, "VIT Vellore");
});

run("AI stays disabled without API key", () => {
  assert.equal(isAiEnabled(), false);
});

run("default provider is openai", () => {
  assert.equal(getProvider(), "openai");
});

if (process.exitCode > 0) {
  process.exit(process.exitCode);
}

console.log("All tests passed.");
