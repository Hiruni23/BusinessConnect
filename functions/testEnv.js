const { onCall } = require("firebase-functions/v2/https");

exports.testEnv = onCall((request) => {
  return { key: process.env.GEMINI_API_KEY };
});
