// utils/trendingLogic.js

/**
 * Calculates a "Market Heat" score for a pitch.
 * This helps the Investor see what's popular right now.
 */
export const calculateTrendingScore = (pitch) => {
  const viewWeight = 1;      // Views are common
  const interestWeight = 15; // "Interested" clicks are very valuable
  const chatWeight = 10;      // Starting a conversation is high intent

  const score = 
    (pitch.views || 0) * viewWeight + 
    (pitch.interested || 0) * interestWeight +
    (pitch.chatCount || 0) * chatWeight;

  return score;
};