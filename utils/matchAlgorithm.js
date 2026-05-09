// utils/matchAlgorithm.js

const buildMatchResult = (score, matchReason) => ({
  score,
  matchReason,
});

export const calculateMatchScore = (pitch, investorPrefs) => {
  let score = 0;
  const reasons = [];

  if (investorPrefs.interests?.includes(pitch.category)) {
    score += 50;
    reasons.push("Strong category alignment");
  }

  if (pitch.fundingGoal <= investorPrefs.maxInvestment) {
    score += 30;
    reasons.push("Within preferred investment range");
  }

  if (pitch.views > 50) {
    score += 10;
    reasons.push("Good traction and visibility");
  }

  if (pitch.interested > 5) {
    score += 10;
    reasons.push("Healthy investor interest");
  }

  return buildMatchResult(score, reasons[0] || "Potential match");
};

const matchAlgorithm = (entrepreneur, investorsList) => {
  const entrepreneurInterests = entrepreneur?.interests || [entrepreneur?.category].filter(Boolean);
  const entrepreneurFundingGoal = Number(entrepreneur?.fundingGoal || entrepreneur?.targetFunding || entrepreneur?.requestedAmount || 0);

  return investorsList
    .map((investor) => {
      let score = 0;
      const reasons = [];

      if (entrepreneurInterests.length > 0 && investor.interests?.some((interest) => entrepreneurInterests.includes(interest))) {
        score += 50;
        reasons.push("Shares your industry focus");
      }

      const maxInvestment = Number(investor.maxInvestment || investor.budget || 0);
      if (entrepreneurFundingGoal && maxInvestment >= entrepreneurFundingGoal) {
        score += 30;
        reasons.push("Can support your funding goal");
      }

      if (investor.location && entrepreneur.location && investor.location === entrepreneur.location) {
        score += 10;
        reasons.push("Located in your market");
      }

      if (investor.experience || investor.stageFocus) {
        score += 10;
        reasons.push("Relevant investor profile");
      }

      return {
        ...investor,
        score,
        matchReason: reasons[0] || "Potential match",
      };
    })
    .sort((a, b) => b.score - a.score);
};

export default matchAlgorithm;