const sessions = new Map();

function getSession(phoneNumber) {
  if (!sessions.has(phoneNumber)) {
    sessions.set(phoneNumber, {
      step: "welcome",
      profile: {},
      chatHistory: [],
      latestMatches: []
    });
  }

  return sessions.get(phoneNumber);
}

function resetSession(phoneNumber) {
  sessions.set(phoneNumber, {
    step: "welcome",
    profile: {},
    chatHistory: [],
    latestMatches: []
  });

  return sessions.get(phoneNumber);
}

module.exports = {
  getSession,
  resetSession
};
