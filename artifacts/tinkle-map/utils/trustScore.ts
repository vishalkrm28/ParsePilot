import type { ConfidenceLevel, Toilet, ToiletReview, ToiletStatusVote, TrustScoreComponents } from "@/types";

const SCORE_WEIGHTS = {
  cleanliness: 0.35,
  accessibility: 0.20,
  safety: 0.25,
  facilities: 0.20,
};

const DECAY_HALF_LIFE_DAYS = 90;

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function decayWeight(ageInDays: number): number {
  return Math.pow(0.5, ageInDays / DECAY_HALF_LIFE_DAYS);
}

function getConfidenceLevel(reviewCount: number, voteCount: number): ConfidenceLevel {
  const signals = reviewCount + voteCount * 0.5;
  if (signals >= 10) return "High";
  if (signals >= 3) return "Medium";
  return "Low";
}

export function computeTrustScore(
  reviews: ToiletReview[],
  statusVotes: ToiletStatusVote[],
  isVerified: boolean
): TrustScoreComponents {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const review of reviews) {
    const age = daysSince(review.created_at);
    const weight = decayWeight(age);
    const reviewScore =
      review.cleanliness_score * SCORE_WEIGHTS.cleanliness +
      review.accessibility_score * SCORE_WEIGHTS.accessibility +
      review.safety_score * SCORE_WEIGHTS.safety +
      review.facilities_score * SCORE_WEIGHTS.facilities;

    weightedSum += reviewScore * weight;
    totalWeight += weight;
  }

  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  const recentVotes = statusVotes.filter((v) => daysSince(v.created_at) <= 7);
  const openVotes = recentVotes.filter((v) => v.is_open).length;
  const voteBonus = recentVotes.length > 0 ? (openVotes / recentVotes.length) * 0.5 : 0;

  const recencyBonus = reviews.length > 0 ? Math.max(0, (30 - daysSince(reviews[0].created_at)) / 30) * 0.3 : 0;
  const verifiedBonus = isVerified ? 0.5 : 0;

  const rawFinal = baseScore + voteBonus + recencyBonus + verifiedBonus;
  const finalScore = Math.min(10, Math.max(0, rawFinal));

  return {
    baseScore,
    reviewCount: reviews.length,
    recencyBonus,
    voteBonus,
    verifiedBonus,
    finalScore,
    confidenceLevel: getConfidenceLevel(reviews.length, statusVotes.length),
  };
}

export function computeAverages(reviews: ToiletReview[]) {
  if (reviews.length === 0) {
    return { cleanliness_avg: 0, accessibility_avg: 0, safety_avg: 0, facilities_avg: 0 };
  }

  const sum = reviews.reduce(
    (acc, r) => ({
      cleanliness: acc.cleanliness + r.cleanliness_score,
      accessibility: acc.accessibility + r.accessibility_score,
      safety: acc.safety + r.safety_score,
      facilities: acc.facilities + r.facilities_score,
    }),
    { cleanliness: 0, accessibility: 0, safety: 0, facilities: 0 }
  );

  const count = reviews.length;
  return {
    cleanliness_avg: sum.cleanliness / count,
    accessibility_avg: sum.accessibility / count,
    safety_avg: sum.safety / count,
    facilities_avg: sum.facilities / count,
  };
}

export function formatTrustScore(score: number): string {
  return score.toFixed(1);
}

export function getTrustColor(level: ConfidenceLevel, colors: { trustHigh: string; trustMedium: string; trustLow: string }) {
  switch (level) {
    case "High":
      return colors.trustHigh;
    case "Medium":
      return colors.trustMedium;
    case "Low":
      return colors.trustLow;
  }
}

export function getScoreColor(score: number, colors: { trustHigh: string; trustMedium: string; trustLow: string }) {
  if (score >= 7) return colors.trustHigh;
  if (score >= 4) return colors.trustMedium;
  return colors.trustLow;
}
