const { MessagingResponse } = require("twilio").twiml;
const { getSession, resetSession } = require("./sessionStore");
const { recommendColleges } = require("./recommendationEngine");
const { getAiCollegeReply, getProvider, isAiEnabled, isTemporaryProviderError } = require("./aiAdvisor");
const { saveStudentProfile, logInquiry } = require("../repositories/studentRepository");

const steps = [
  "fullName",
  "age",
  "dob",
  "preferredStream",
  "preferredLocation",
  "budgetTier",
  "futurePlan"
];

function createReply(message) {
  const twiml = new MessagingResponse();
  twiml.message(message);
  return twiml.toString();
}

function rememberMessage(session, role, content) {
  session.chatHistory.push({ role, content });

  if (session.chatHistory.length > 8) {
    session.chatHistory = session.chatHistory.slice(-8);
  }
}

function promptFor(step) {
  switch (step) {
    case "fullName":
      return "Welcome to CollegeBridge. Tell me your full name.";
    case "age":
      return "What is your age?";
    case "dob":
      return "Share your date of birth in DD-MM-YYYY format.";
    case "preferredStream":
      return "Which stream do you want for graduation? Examples: engineering, commerce, arts, business, computer-science.";
    case "preferredLocation":
      return "Which city or state do you prefer for college?";
    case "budgetTier":
      return "What is your budget range per year? Reply with budget, mid, or premium.";
    case "futurePlan":
      return "What is your future plan after graduation? Examples: placements, startup, higher studies, UPSC.";
    default:
      return "Send hi to start.";
  }
}

function nextStep(currentStep) {
  const currentIndex = steps.indexOf(currentStep);
  return steps[currentIndex + 1] || null;
}

function formatRecommendations(profile) {
  const matches = recommendColleges(profile);

  const intro = `Thanks ${profile.fullName}. Based on your preferences, here are your top college matches:`;
  const lines = matches.map((college, index) => {
    return [
      `${index + 1}. ${college.name} (${college.location})`,
      `Stream fit: ${college.streams.join(", ")}`,
      `Fees/year: INR ${college.feesInrPerYear.toLocaleString("en-IN")}`,
      `Deadline: ${college.applicationDeadline}`,
      `Admission: ${college.applicationMode}`,
      `Eligibility: ${college.eligibility}`,
      `Website: ${college.website}`
    ].join("\n");
  });

  return `${intro}\n\n${lines.join("\n\n")}\n\nReply DETAILS 1, DETAILS 2, or DETAILS 3 for highlights. Reply RESET to start again.`;
}

function formatCollegeDetails(profile, index) {
  const matches = recommendColleges(profile);
  const college = matches[index];

  if (!college) {
    return "I could not find that college number. Reply DETAILS 1, DETAILS 2, or DETAILS 3.";
  }

  return [
    `${college.name} highlights:`,
    ...college.highlights.map((item) => `- ${item}`),
    `Application deadline: ${college.applicationDeadline}`,
    `Website: ${college.website}`,
    "Reply RESET to restart or ask another question."
  ].join("\n");
}

function fallbackAiDisabledMessage(profile) {
  return (
    formatRecommendations(profile) +
    "\n\nAI follow-up is currently off. Configure your selected provider in .env to let students ask free-form questions."
  );
}

async function safelyGetAiReply(args) {
  try {
    return await getAiCollegeReply(args);
  } catch (error) {
    console.error("AI reply generation failed", error);

    if (isTemporaryProviderError(error)) {
      return null;
    }

    throw error;
  }
}

async function buildAiRecommendationReply(session) {
  const matches = recommendColleges(session.profile);
  session.latestMatches = matches;

  if (!isAiEnabled()) {
    return fallbackAiDisabledMessage(session.profile);
  }

  const aiReply = await safelyGetAiReply({
    profile: session.profile,
    matches,
    question:
      "Recommend the best 3 colleges for this student. For each one, mention fit, fees, deadline, admission mode, and website. End by inviting the student to ask follow-up questions.",
    chatHistory: session.chatHistory,
    mode: "initial_recommendation"
  });

  return (
    aiReply ||
    "The AI service is busy right now, so here is the structured result instead.\n\n" +
      formatRecommendations(session.profile)
  );
}

async function handleCompletedConversation(session, message, lower) {
  if (lower.startsWith("details")) {
    const detailIndex = Number(lower.split(" ")[1]) - 1;
    return formatCollegeDetails(session.profile, detailIndex);
  }

  const matches = session.latestMatches.length ? session.latestMatches : recommendColleges(session.profile);
  session.latestMatches = matches;

  if (!isAiEnabled()) {
    return "AI follow-up is off right now. Add your provider API key in .env to enable free-form student questions. You can still use DETAILS 1, DETAILS 2, or DETAILS 3.";
  }

  const aiReply = await safelyGetAiReply({
    profile: session.profile,
    matches,
    question: message,
    chatHistory: session.chatHistory,
    mode: "follow_up_question"
  });

  return (
    aiReply ||
    "The AI service is busy right now. Please try again in a moment, or use DETAILS 1, DETAILS 2, or DETAILS 3."
  );
}

async function handleIncomingMessage(phoneNumber, rawMessage) {
  const message = String(rawMessage || "").trim();
  const lower = message.toLowerCase();

  if (!message) {
    return createReply("I did not receive any text. Send hi to begin.");
  }

  logInquiry(phoneNumber, "user", message);

  if (lower === "reset") {
    resetSession(phoneNumber);
    const session = getSession(phoneNumber);
    session.step = "fullName";
    const reply = "Your session has been reset.\n\n" + promptFor("fullName");
    logInquiry(phoneNumber, "assistant", reply);
    return createReply(reply);
  }

  const session = getSession(phoneNumber);
  rememberMessage(session, "user", message);

  if (lower === "hi" || lower === "hello" || session.step === "welcome") {
    session.step = "fullName";
    const providerLabel = isAiEnabled() ? `AI provider: ${getProvider()}.` : "AI provider not configured yet.";
    const reply = `${promptFor("fullName")}\n\n${providerLabel}`;
    rememberMessage(session, "assistant", reply);
    logInquiry(phoneNumber, "assistant", reply);
    return createReply(reply);
  }

  if (session.step === "completed") {
    const reply = await handleCompletedConversation(session, message, lower);
    rememberMessage(session, "assistant", reply);
    logInquiry(phoneNumber, "assistant", reply);
    return createReply(reply);
  }

  if (lower.startsWith("details")) {
    const detailIndex = Number(lower.split(" ")[1]) - 1;
    const reply = formatCollegeDetails(session.profile, detailIndex);
    rememberMessage(session, "assistant", reply);
    logInquiry(phoneNumber, "assistant", reply);
    return createReply(reply);
  }

  const currentStep = session.step;
  if (!steps.includes(currentStep)) {
    session.step = "fullName";
    const reply = promptFor("fullName");
    rememberMessage(session, "assistant", reply);
    logInquiry(phoneNumber, "assistant", reply);
    return createReply(reply);
  }

  session.profile[currentStep] = message;
  saveStudentProfile(phoneNumber, session.profile);
  const upcoming = nextStep(currentStep);

  if (!upcoming) {
    session.step = "completed";
    const reply = await buildAiRecommendationReply(session);
    rememberMessage(session, "assistant", reply);
    saveStudentProfile(phoneNumber, session.profile);
    logInquiry(phoneNumber, "assistant", reply);
    return createReply(reply);
  }

  session.step = upcoming;
  const reply = promptFor(upcoming);
  rememberMessage(session, "assistant", reply);
  logInquiry(phoneNumber, "assistant", reply);
  return createReply(reply);
}

module.exports = {
  handleIncomingMessage
};
