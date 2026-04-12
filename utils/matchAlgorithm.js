// utils/matchAlgorithm.js

export const calculateMatchScore = (pitch, investorPrefs) => {
  let score = 0;

  // 1. Category Match (High Weight)
  if (investorPrefs.interests?.includes(pitch.category)) {
    score += 50;
  }

  // 2. Funding Goal Alignment
  // If pitch goal is within investor's preferred range
  if (pitch.fundingGoal <= investorPrefs.maxInvestment) {
    score += 30;
  }

  // 3. Momentum (Social Proof)
  if (pitch.views > 50) score += 10;
  if (pitch.interested > 5) score += 10;

  return score; // Returns a value out of 100
};