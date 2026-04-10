const { getAllColleges } = require("../repositories/collegeRepository");

function inferBudgetTier(feesInrPerYear) {
  if (feesInrPerYear <= 100000) return "budget";
  if (feesInrPerYear <= 220000) return "mid";
  return "premium";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function scoreCollege(college, profile) {
  let score = 0;
  const studentStream = normalize(profile.preferredStream);
  const studentBudget = normalize(profile.budgetTier);
  const studentLocation = normalize(profile.preferredLocation);
  const futurePlan = normalize(profile.futurePlan);

  if (college.streams.some((stream) => normalize(stream) === studentStream)) {
    score += 4;
  }

  if (studentBudget && inferBudgetTier(college.feesInrPerYear) === studentBudget) {
    score += 2;
  }

  if (studentLocation && normalize(college.location).includes(studentLocation)) {
    score += 2;
  }

  if (futurePlan.includes("placement") || futurePlan.includes("job")) {
    if (college.highlights.some((item) => normalize(item).includes("placement"))) {
      score += 2;
    }
  }

  if (futurePlan.includes("research") || futurePlan.includes("higher")) {
    if (college.highlights.some((item) => normalize(item).includes("curriculum"))) {
      score += 1;
    }
  }

  return score;
}

function recommendColleges(profile, limit = 3, colleges = getAllColleges()) {
  return colleges
    .map((college) => ({
      ...college,
      score: scoreCollege(college, profile)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = {
  inferBudgetTier,
  recommendColleges
};
