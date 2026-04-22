// services/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBiqJK_PY_oOjc07pF-HbkvFzfiuOcL3Fc";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateAIPitch = async (keywords) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const prompt = `Write a professional 3-paragraph investor pitch for: ${keywords}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    if (error.message.includes("404")) {
      throw new Error("API URL mismatch. Check if your SDK is updated to the latest version.");
    }
    throw new Error("AI Service Error. Please try again.");
  }
};

/**
 * 🤖 Analyzes a pitch to provide a score and feedback.
 */
export const analyzePitchContent = async (title, description, goal, category) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Act as a strict Venture Capitalist. Analyze the following startup pitch:
      Title: ${title}
      Category: ${category}
      Funding Goal: $${goal}
      Description: ${description}

      Return your analysis as a plain JSON object with the following fields:
      "score": (a number from 0-100),
      "feedback": (a short list of 3-4 specific bullet points for improvement),
      "verdict": (a single sentence overall vibe check)
      Do not include any markdown formatting or prefix the response with anything.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean potential markdown code blocks if the AI includes them anyway
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};

/**
 * 🤖 Generates a punchy TL;DR summary for investors.
 */
export const generatePitchSummary = async (description) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Summarize this startup pitch into exactly 2 punchy, professional sentences for a busy investor: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "No AI summary available.";
  }
};