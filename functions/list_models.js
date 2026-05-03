const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/GEMINI_API_KEY="([^"]+)"/);
const apiKey = match ? match[1] : null;

async function list() {
  try {
    console.log("Listing models with key length:", apiKey?.length);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}
list();
