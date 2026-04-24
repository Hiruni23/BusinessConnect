// services/aiService.js
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

/**
 * 🤖 Generates a pitch using the server-side AI suite
 */
export const generateAIPitch = async (keywords) => {
  try {
    const aiFunc = httpsCallable(functions, "generateAIPitch");
    const result = await aiFunc({ keywords });
    return result.data.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("AI Service currently unavailable.");
  }
};

/**
 * 🤖 Analyzes pitch content using server-side AI suite
 */
export const analyzePitchContent = async (title, description, goal, category) => {
  try {
    const aiFunc = httpsCallable(functions, "analyzePitch");
    const result = await aiFunc({ title, description, goal, category });
    return result.data;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("AI Service currently unavailable.");
  }
};

/**
 * 🤖 Generates a summary (TL;DR) for investors
 */
export const generatePitchSummary = async (description) => {
  try {
    const aiFunc = httpsCallable(functions, "askBusinessAI");
    const result = await aiFunc({ 
      prompt: `Summarize this pitch into 2 punchy sentences: ${description}` 
    });
    return result.data.text;
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "No AI summary available.";
  }
};

/**
 * 🤖 Performs risk audit on milestones
 */
export const analyzeMilestoneRisk = async (milestoneTitle, description, amount) => {
  try {
    const aiFunc = httpsCallable(functions, "askBusinessAI");
    const prompt = `Perform a risk audit for milestone: ${milestoneTitle} ($${amount}). Work description: ${description}. Return JSON: {riskScore: 1-10, redFlags: [], auditQuestions: [], analysis: ""}`;
    const result = await aiFunc({ prompt });
    
    // Clean JSON response from AI
    const text = result.data.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Milestone AI Error:", error);
    throw new Error("Manual audit required.");
  }
};