// utils/matchAlgorithm.js

export const calculateMatchScore = (pitch, investorPrefs) => {
  let score = 0;
  let reasons = [];

  // 1. Category Match (High Weight)
  if (investorPrefs.interests?.includes(pitch.category)) {
    score += 50;
    reasons.push("Sector");
  }

  // 2. Funding Goal Alignment
  if (pitch.fundingGoal <= (investorPrefs.maxInvestment || Number.MAX_SAFE_INTEGER)) {
    score += 30;
    reasons.push("Goal");
  }

  // 3. Momentum (Social Proof)
  if (pitch.views > 50) {
    score += 10;
    reasons.push("Traction");
  }
  if (pitch.interested > 5) {
    score += 10;
    reasons.push("Momentum");
  }

  const matchReason = reasons.length > 0 ? `Matched by: ${reasons.join(" + ")}` : "Discovered for you";
  return { score, matchReason };
};

export default function matchAlgorithm(currentUser, targetUsers) {
  return targetUsers
    .filter(u => u.id !== currentUser.id)
    .map(u => {
      let score = 0;
      let reasons = [];

      // Determine the current user's industry/categories
      const myCategories = currentUser.categories || [];
      if (currentUser.industry && !myCategories.includes(currentUser.industry)) {
        myCategories.push(currentUser.industry);
      }

      const theirInterests = u.interests || [];
      
      const hasOverlap = myCategories.some(cat => theirInterests.includes(cat));
      if (hasOverlap) {
        score += 50;
        reasons.push("Industry");
      }

      if (u.location && currentUser.location && u.location === currentUser.location) {
        score += 20;
        reasons.push("Location");
      }

      if (u.rating && u.rating > 4.0) {
        score += 20;
        reasons.push("Top Rated");
      }

      // Add a baseline if no strong match, just to show the UI working
      if (score === 0) {
        score = Math.floor(Math.random() * 20) + 40; 
      }
      
      const matchReason = reasons.length > 0 ? `Matched by: ${reasons.join(" + ")}` : "Discovered for you";

      return { ...u, score: Math.min(score, 99), matchReason };
    })
    .sort((a, b) => b.score - a.score);
}