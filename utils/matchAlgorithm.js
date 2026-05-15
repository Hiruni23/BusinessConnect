// utils/matchAlgorithm.js

const buildMatchResult = (score, matchReason) => ({
  score,
  matchReason,
});

const normalizeRole = (role) => String(role || "").toLowerCase();

const getProfileInterests = (profile) => {
  if (Array.isArray(profile?.interests) && profile.interests.length > 0) {
    return profile.interests;
  }

  return [profile?.category, profile?.industry].filter(Boolean);
};

const getFundingCapacity = (profile) => Number(profile?.maxInvestment || profile?.budget || Number.MAX_SAFE_INTEGER);

const getFundingGoal = (profile) => Number(profile?.fundingGoal || profile?.targetFunding || profile?.requestedAmount || 0);

export const calculateMatchScore = (pitch, investorPrefs) => {
  let score = 0;
  const reasons = [];

  if (investorPrefs.interests?.includes(pitch.category)) {
    score += 50;
    reasons.push("Strong category alignment");
  }

  if (pitch.fundingGoal <= (investorPrefs.maxInvestment || Number.MAX_SAFE_INTEGER)) {
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
  const role = normalizeRole(entrepreneur?.role);
  const sourceInterests = getProfileInterests(entrepreneur);
  const sourceFundingGoal = getFundingGoal(entrepreneur);
  const sourceFundingCapacity = getFundingCapacity(entrepreneur);

  return investorsList
    .map((investor) => {
      let score = 0;
      const reasons = [];
      const targetInterests = getProfileInterests(investor);
      const targetFundingCapacity = getFundingCapacity(investor);
      const targetFundingGoal = getFundingGoal(investor);

      if (sourceInterests.length > 0 && targetInterests.some((interest) => sourceInterests.includes(interest))) {
        score += 50;
        reasons.push(role === "investor" ? "Shares your business focus" : "Shares your industry focus");
      }

      if (role === "investor") {
        if (sourceFundingCapacity && targetFundingGoal && sourceFundingCapacity >= targetFundingGoal) {
          score += 30;
          reasons.push("Fits your budget range");
        }

        if (investor.location && entrepreneur.location && investor.location === entrepreneur.location) {
          score += 10;
          reasons.push("Located in your market");
        }

        if (investor.experience || investor.stageFocus) {
          score += 10;
          reasons.push("Relevant business profile");
        }
      } else if (targetFundingCapacity >= sourceFundingGoal && sourceFundingGoal > 0) {
        score += 30;
        reasons.push("Can support your funding goal");
      }

      if (investor.location && entrepreneur.location && investor.location === entrepreneur.location) {
        score += 10;
        reasons.push("Located in your market");
      }

      if (investor.experience || investor.stageFocus) {
        score += 10;
        reasons.push(role === "investor" ? "Relevant business profile" : "Relevant investor profile");
      }

      if (investor.rating) {
        score += investor.rating * 3;
      }

      return {
        ...investor,
        score,
        matchPercent: Math.min(score, 100),
        matchReason: reasons[0] || "Potential match",
      };
    })
    .sort((a, b) => b.score - a.score);
};

export const calculateInvestorMatch = (investor, business) => {
  let score = 0;

  if (investor.industry === business.category) {
    score += 40;
  }

  if (investor.riskLevel === business.riskLevel) {
    score += 30;
  }

  if (investor.budget >= business.fundingNeeded) {
    score += 20;
  }

  if (investor.location === business.location) {
    score += 10;
  }

  return score;
};

export default matchAlgorithm;
