// services/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBiqJK_PY_oOjc07pF-HbkvFzfiuOcL3Fc";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateAIPitch = async (keywords) => {
  try {
    // 💡 Using 'gemini-1.5-flash-latest' often bypasses the v1beta 404 issue
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    });

    const prompt = `Write a professional 3-paragraph investor pitch for: ${keywords}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    
    // 🕵️ DEBUGGING LOG: This will tell us if it's a model name issue or a key issue
    if (error.message.includes("404")) {
      throw new Error("API URL mismatch. Check if your SDK is updated to the latest version.");
    }
    throw new Error("AI Service Error. Please try again.");
  }
};