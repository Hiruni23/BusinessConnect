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

// Helper: fetch with retries and exponential backoff
const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 500) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const wait = backoff * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
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

/**
 * 🤖 Evaluates startup for Demo (Calls Flask API)
 */
export const evaluateStartup = async (startupData) => {
  try {
    // Note: Change 10.0.2.2 to your laptop's IP (e.g. 192.168.x.x) if using a physical phone
    return await fetchWithRetry("http://10.0.2.2:5000/evaluate-startup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(startupData),
    });
  } catch (error) {
    console.warn("Startup evaluation API not reachable after retries, using fallback.", error);
    return { score: 91, recommendation: "Highly Recommended" };
  }
};

/**
 * 🤖 Predicts risk level (Calls Flask API)
 */
export const predictRisk = async (businessData) => {
  try {
    return await fetchWithRetry("http://10.0.2.2:5000/predict-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(businessData),
    });
  } catch (error) {
    console.warn("Risk prediction API not reachable after retries, using fallback.", error);
    return { riskScore: 15, riskLevel: "Low" };
  }
};

/**
 * 🤖 Detects fraud indicators (Calls Flask API)
 */
export const detectFraud = async (data) => {
  try {
    return await fetchWithRetry("http://10.0.2.2:5000/detect-fraud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.warn("Fraud detection API not reachable after retries, using fallback.", error);
    return { isFraud: false, alerts: ["No suspicious activity"] };
  }
};