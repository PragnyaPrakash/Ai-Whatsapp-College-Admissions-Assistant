const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");

const provider = String(process.env.LLM_PROVIDER || "openai").trim().toLowerCase();
const openAiModel = process.env.OPENAI_MODEL || "gpt-5-mini";
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let openAiClient = null;
let geminiClient = null;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAiEnabled() {
  if (provider === "gemini") {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  return Boolean(process.env.OPENAI_API_KEY);
}

function getProvider() {
  return provider;
}

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openAiClient;
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return geminiClient;
}

function truncateForWhatsApp(text, limit = 1500) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 3).trim()}...`;
}

function isTemporaryProviderError(error) {
  const status = error?.status || error?.code;
  const message = String(error?.message || "").toLowerCase();

  return (
    status === 429 ||
    status === 503 ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes("overloaded")
  );
}

function buildKnowledgeBlock(profile, matches) {
  const studentProfile = [
    `Name: ${profile.fullName || "Unknown"}`,
    `Age: ${profile.age || "Unknown"}`,
    `DOB: ${profile.dob || "Unknown"}`,
    `Preferred stream: ${profile.preferredStream || "Unknown"}`,
    `Preferred location: ${profile.preferredLocation || "Unknown"}`,
    `Budget tier: ${profile.budgetTier || "Unknown"}`,
    `Future plan: ${profile.futurePlan || "Unknown"}`
  ].join("\n");

  const collegeBlock = matches
    .map((college, index) => {
      return [
        `${index + 1}. ${college.name}`,
        `Location: ${college.location}`,
        `Streams: ${college.streams.join(", ")}`,
        `Fees per year: INR ${college.feesInrPerYear}`,
        `Deadline: ${college.applicationDeadline}`,
        `Application mode: ${college.applicationMode}`,
        `Eligibility: ${college.eligibility}`,
        `Highlights: ${college.highlights.join("; ")}`,
        `Website: ${college.website}`
      ].join("\n");
    })
    .join("\n\n");

  return `Student profile:\n${studentProfile}\n\nAvailable college data:\n${collegeBlock}`;
}

async function getAiCollegeReply({ profile, matches, question, chatHistory = [], mode }) {
  if (!isAiEnabled()) {
    return null;
  }

  const developerMessage = [
    "You are CollegeBridge, a WhatsApp admissions assistant for graduation colleges in India.",
    "Answer only using the student profile and college data provided.",
    "Do not invent deadlines, fees, scholarships, approvals, rankings, or eligibility details.",
    "If data is missing, say it is not available in the current database.",
    "Keep replies concise, WhatsApp-friendly, and easy for students to understand.",
    "Prefer bullet-like short lines without markdown tables.",
    "If giving recommendations, explain why the colleges fit the student."
  ].join(" ");

  const userPrompt = [
    buildKnowledgeBlock(profile, matches),
    "",
    `Mode: ${mode}`,
    chatHistory.length
      ? `Recent conversation:\n${chatHistory.map((item) => `${item.role}: ${item.content}`).join("\n")}`
      : "",
    "",
    `Student request: ${question}`
  ]
    .filter(Boolean)
    .join("\n");

  if (provider === "gemini") {
    const gemini = getGeminiClient();
    if (!gemini) {
      return null;
    }

    let response;

    try {
      response = await gemini.models.generateContent({
        model: geminiModel,
        contents: userPrompt,
        config: {
          systemInstruction: developerMessage
        }
      });
    } catch (error) {
      if (!isTemporaryProviderError(error)) {
        throw error;
      }

      await sleep(1200);

      response = await gemini.models.generateContent({
        model: geminiModel,
        contents: userPrompt,
        config: {
          systemInstruction: developerMessage
        }
      });
    }

    return truncateForWhatsApp((response.text || "").trim());
  }

  const openai = getOpenAiClient();
  if (!openai) {
    return null;
  }

  const response = await openai.responses.create({
    model: openAiModel,
    reasoning: {
      effort: "minimal"
    },
    input: [
      {
        role: "developer",
        content: [
          {
            type: "input_text",
            text: developerMessage
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: userPrompt
          }
        ]
      }
    ]
  });

  return truncateForWhatsApp((response.output_text || "").trim());
}

module.exports = {
  getAiCollegeReply,
  getProvider,
  isAiEnabled,
  isTemporaryProviderError
};
