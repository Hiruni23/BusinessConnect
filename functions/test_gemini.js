const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/GEMINI_API_KEY="([^"]+)"/);
const apiKey = match ? match[1] : null;

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello");
    console.log(result.response.text());
  } catch (error) {
    console.error("Gemini test error:", error);
  }
}
test();
