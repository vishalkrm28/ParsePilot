import type { Toilet, ToiletReview, ToiletStatusVote } from "@/types";
import { computeTrustScore, computeAverages } from "@/utils/trustScore";

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeReview(toiletId: string, options: {
  cleanliness: number;
  accessibility: number;
  safety: number;
  facilities: number;
  comment?: string;
  daysAgoN?: number;
}): ToiletReview {
  const overall = (options.cleanliness + options.accessibility + options.safety + options.facilities) / 4;
  return {
    id: makeId(),
    toilet_id: toiletId,
    cleanliness_score: options.cleanliness,
    accessibility_score: options.accessibility,
    safety_score: options.safety,
    facilities_score: options.facilities,
    overall_score: overall,
    comment: options.comment,
    created_at: daysAgo(options.daysAgoN ?? 0),
    updated_at: daysAgo(options.daysAgoN ?? 0),
  };
}

function makeVote(toiletId: string, isOpen: boolean, daysAgoN = 0): ToiletStatusVote {
  return {
    id: makeId(),
    toilet_id: toiletId,
    is_open: isOpen,
    created_at: daysAgo(daysAgoN),
  };
}

function buildToilet(partial: Omit<Toilet, "overall_trust_score" | "cleanliness_avg" | "accessibility_avg" | "safety_avg" | "facilities_avg" | "confidence_level" | "review_count">, reviews: ToiletReview[], votes: ToiletStatusVote[]): Toilet {
  const trust = computeTrustScore(reviews, votes, partial.is_verified);
  const avgs = computeAverages(reviews);
  return {
    ...partial,
    ...avgs,
    overall_trust_score: trust.finalScore,
    confidence_level: trust.confidenceLevel,
    review_count: reviews.length,
    reviews,
    status_votes: votes,
  };
}

export function generateSeedToilets(): Toilet[] {
  const toilets: Toilet[] = [];

  // ── London ──────────────────────────────────────────────────────────
  const lnd1Id = makeId();
  const lnd1Reviews = [
    makeReview(lnd1Id, { cleanliness: 8.5, accessibility: 9, safety: 9, facilities: 8, comment: "Very clean, well maintained. Attendant on site.", daysAgoN: 2 }),
    makeReview(lnd1Id, { cleanliness: 9, accessibility: 9, safety: 9, facilities: 9, comment: "Spotless. Best public loo in London.", daysAgoN: 7 }),
    makeReview(lnd1Id, { cleanliness: 8, accessibility: 8.5, safety: 8.5, facilities: 7.5, daysAgoN: 14 }),
    makeReview(lnd1Id, { cleanliness: 7.5, accessibility: 9, safety: 8, facilities: 7, comment: "Usually good, slightly busy on weekends.", daysAgoN: 30 }),
    makeReview(lnd1Id, { cleanliness: 8, accessibility: 9, safety: 9, facilities: 8, daysAgoN: 45 }),
  ];
  const lnd1Votes = [makeVote(lnd1Id, true, 0), makeVote(lnd1Id, true, 1), makeVote(lnd1Id, true, 2)];
  toilets.push(buildToilet({
    id: lnd1Id, name: "Covent Garden Public Convenience", address: "James Street, Covent Garden",
    city: "London", country: "UK", latitude: 51.5126, longitude: -0.1245,
    is_free: false, price: 0.5, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: false, opening_hours: "08:00-22:00",
    is_verified: true, created_at: daysAgo(180), updated_at: daysAgo(2),
    tags: [{ id: makeId(), toilet_id: lnd1Id, tag: "attended" }, { id: makeId(), toilet_id: lnd1Id, tag: "accessible" }],
  }, lnd1Reviews, lnd1Votes));

  const lnd2Id = makeId();
  const lnd2Reviews = [
    makeReview(lnd2Id, { cleanliness: 7, accessibility: 7, safety: 7.5, facilities: 6.5, comment: "Decent for the area. Sometimes a queue.", daysAgoN: 5 }),
    makeReview(lnd2Id, { cleanliness: 6.5, accessibility: 7, safety: 7, facilities: 6, daysAgoN: 20 }),
    makeReview(lnd2Id, { cleanliness: 8, accessibility: 7, safety: 8, facilities: 7, comment: "Was clean this morning.", daysAgoN: 35 }),
  ];
  const lnd2Votes = [makeVote(lnd2Id, true, 0), makeVote(lnd2Id, true, 3), makeVote(lnd2Id, false, 4)];
  toilets.push(buildToilet({
    id: lnd2Id, name: "Hyde Park Serpentine Lido Toilets", address: "Hyde Park, W2 2UH",
    city: "London", country: "UK", latitude: 51.5055, longitude: -0.1666,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: true, opening_hours: "06:00-21:00",
    is_verified: false, created_at: daysAgo(200), updated_at: daysAgo(5),
    tags: [{ id: makeId(), toilet_id: lnd2Id, tag: "park" }, { id: makeId(), toilet_id: lnd2Id, tag: "shower" }],
  }, lnd2Reviews, lnd2Votes));

  const lnd3Id = makeId();
  const lnd3Reviews = [
    makeReview(lnd3Id, { cleanliness: 5.5, accessibility: 5, safety: 5, facilities: 4.5, comment: "Could be cleaner. Needs more maintenance.", daysAgoN: 10 }),
    makeReview(lnd3Id, { cleanliness: 4, accessibility: 4.5, safety: 4, facilities: 3.5, comment: "Avoid if possible.", daysAgoN: 40 }),
  ];
  const lnd3Votes = [makeVote(lnd3Id, true, 1), makeVote(lnd3Id, false, 2)];
  toilets.push(buildToilet({
    id: lnd3Id, name: "Shoreditch High Street Station WC", address: "Shoreditch High Street, E1 6JE",
    city: "London", country: "UK", latitude: 51.5230, longitude: -0.0779,
    is_free: true, requires_key: false, accessible: false,
    has_baby_change: false, has_shower: false, opening_hours: "07:00-23:00",
    is_verified: false, created_at: daysAgo(150), updated_at: daysAgo(10),
    tags: [{ id: makeId(), toilet_id: lnd3Id, tag: "station" }],
  }, lnd3Reviews, lnd3Votes));

  // ── Amsterdam ────────────────────────────────────────────────────────
  const ams1Id = makeId();
  const ams1Reviews = [
    makeReview(ams1Id, { cleanliness: 9, accessibility: 8, safety: 9, facilities: 9, comment: "Prachtig schoon. Highly recommended.", daysAgoN: 1 }),
    makeReview(ams1Id, { cleanliness: 9, accessibility: 8, safety: 9, facilities: 8.5, daysAgoN: 8 }),
    makeReview(ams1Id, { cleanliness: 8.5, accessibility: 8, safety: 8.5, facilities: 8, comment: "Very clean. Good for the Museumplein area.", daysAgoN: 15 }),
    makeReview(ams1Id, { cleanliness: 8, accessibility: 8, safety: 8, facilities: 7.5, daysAgoN: 25 }),
  ];
  const ams1Votes = [makeVote(ams1Id, true, 0), makeVote(ams1Id, true, 1), makeVote(ams1Id, true, 2)];
  toilets.push(buildToilet({
    id: ams1Id, name: "Museumplein Openbaar Toilet", address: "Museumplein, Amsterdam",
    city: "Amsterdam", country: "Netherlands", latitude: 52.3577, longitude: 4.8812,
    is_free: false, price: 0.5, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: false, opening_hours: "09:00-21:00",
    is_verified: true, created_at: daysAgo(300), updated_at: daysAgo(1),
    tags: [{ id: makeId(), toilet_id: ams1Id, tag: "tourist-area" }, { id: makeId(), toilet_id: ams1Id, tag: "accessible" }],
  }, ams1Reviews, ams1Votes));

  const ams2Id = makeId();
  const ams2Reviews = [
    makeReview(ams2Id, { cleanliness: 7, accessibility: 6, safety: 7, facilities: 6, comment: "Central but busy.", daysAgoN: 3 }),
    makeReview(ams2Id, { cleanliness: 6, accessibility: 6, safety: 6.5, facilities: 5.5, daysAgoN: 18 }),
    makeReview(ams2Id, { cleanliness: 7.5, accessibility: 6, safety: 7, facilities: 6.5, daysAgoN: 50 }),
  ];
  const ams2Votes = [makeVote(ams2Id, true, 0), makeVote(ams2Id, true, 2)];
  toilets.push(buildToilet({
    id: ams2Id, name: "Centraal Station Toiletten", address: "Amsterdam Centraal Station",
    city: "Amsterdam", country: "Netherlands", latitude: 52.3791, longitude: 4.8997,
    is_free: false, price: 0.7, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: false, opening_hours: "06:00-00:00",
    is_verified: true, created_at: daysAgo(400), updated_at: daysAgo(3),
    tags: [{ id: makeId(), toilet_id: ams2Id, tag: "station" }, { id: makeId(), toilet_id: ams2Id, tag: "accessible" }],
  }, ams2Reviews, ams2Votes));

  // ── Barcelona ────────────────────────────────────────────────────────
  const bcn1Id = makeId();
  const bcn1Reviews = [
    makeReview(bcn1Id, { cleanliness: 8, accessibility: 7, safety: 8, facilities: 7.5, comment: "Good for Las Ramblas area. Clean.", daysAgoN: 4 }),
    makeReview(bcn1Id, { cleanliness: 7.5, accessibility: 7, safety: 7.5, facilities: 7, daysAgoN: 12 }),
    makeReview(bcn1Id, { cleanliness: 8.5, accessibility: 7, safety: 8, facilities: 7.5, comment: "Surprisingly good!", daysAgoN: 22 }),
    makeReview(bcn1Id, { cleanliness: 7, accessibility: 7, safety: 7.5, facilities: 7, daysAgoN: 60 }),
  ];
  const bcn1Votes = [makeVote(bcn1Id, true, 0), makeVote(bcn1Id, true, 1)];
  toilets.push(buildToilet({
    id: bcn1Id, name: "WC La Rambla - Boqueria", address: "La Rambla, 91, Barcelona",
    city: "Barcelona", country: "Spain", latitude: 41.3818, longitude: 2.1729,
    is_free: false, price: 0.5, requires_key: false, accessible: false,
    has_baby_change: false, has_shower: false, opening_hours: "09:00-21:00",
    is_verified: false, created_at: daysAgo(250), updated_at: daysAgo(4),
    tags: [{ id: makeId(), toilet_id: bcn1Id, tag: "tourist-area" }],
  }, bcn1Reviews, bcn1Votes));

  const bcn2Id = makeId();
  const bcn2Reviews = [
    makeReview(bcn2Id, { cleanliness: 9, accessibility: 9, safety: 9.5, facilities: 9, comment: "Excellent. Best public toilet in Barcelona.", daysAgoN: 6 }),
    makeReview(bcn2Id, { cleanliness: 9, accessibility: 9, safety: 9, facilities: 8.5, daysAgoN: 20 }),
    makeReview(bcn2Id, { cleanliness: 8.5, accessibility: 9, safety: 9, facilities: 8.5, daysAgoN: 45 }),
    makeReview(bcn2Id, { cleanliness: 9, accessibility: 9, safety: 9, facilities: 9, daysAgoN: 90 }),
  ];
  const bcn2Votes = [makeVote(bcn2Id, true, 0), makeVote(bcn2Id, true, 1), makeVote(bcn2Id, true, 3)];
  toilets.push(buildToilet({
    id: bcn2Id, name: "Parc de la Ciutadella WC", address: "Passeig de Picasso, Barcelona",
    city: "Barcelona", country: "Spain", latitude: 41.3887, longitude: 2.1862,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: false, opening_hours: "08:00-22:00",
    is_verified: true, created_at: daysAgo(350), updated_at: daysAgo(6),
    tags: [{ id: makeId(), toilet_id: bcn2Id, tag: "park" }, { id: makeId(), toilet_id: bcn2Id, tag: "accessible" }],
  }, bcn2Reviews, bcn2Votes));

  // ── Paris ────────────────────────────────────────────────────────────
  const par1Id = makeId();
  const par1Reviews = [
    makeReview(par1Id, { cleanliness: 8, accessibility: 8.5, safety: 8, facilities: 7.5, comment: "Sanisette automatique. Bien entretenu.", daysAgoN: 2 }),
    makeReview(par1Id, { cleanliness: 7.5, accessibility: 8.5, safety: 8, facilities: 7, daysAgoN: 10 }),
    makeReview(par1Id, { cleanliness: 8, accessibility: 8.5, safety: 7.5, facilities: 7.5, daysAgoN: 30 }),
  ];
  const par1Votes = [makeVote(par1Id, true, 0), makeVote(par1Id, true, 2)];
  toilets.push(buildToilet({
    id: par1Id, name: "Sanisette - Tour Eiffel Nord", address: "Avenue Gustave Eiffel, Paris",
    city: "Paris", country: "France", latitude: 48.8604, longitude: 2.2941,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: false, has_shower: false, opening_hours: "00:00-24:00",
    is_verified: true, created_at: daysAgo(500), updated_at: daysAgo(2),
    tags: [{ id: makeId(), toilet_id: par1Id, tag: "sanisette" }, { id: makeId(), toilet_id: par1Id, tag: "accessible" }, { id: makeId(), toilet_id: par1Id, tag: "tourist-area" }],
  }, par1Reviews, par1Votes));

  const par2Id = makeId();
  const par2Reviews = [
    makeReview(par2Id, { cleanliness: 7, accessibility: 7.5, safety: 7, facilities: 6.5, comment: "Standard Paris sanisette. Does the job.", daysAgoN: 8 }),
    makeReview(par2Id, { cleanliness: 6.5, accessibility: 7.5, safety: 7, facilities: 6, daysAgoN: 25 }),
    makeReview(par2Id, { cleanliness: 7, accessibility: 7.5, safety: 7.5, facilities: 6.5, daysAgoN: 55 }),
  ];
  const par2Votes = [makeVote(par2Id, true, 0), makeVote(par2Id, false, 1)];
  toilets.push(buildToilet({
    id: par2Id, name: "Sanisette - Marais Rue de Bretagne", address: "Rue de Bretagne, Paris 3e",
    city: "Paris", country: "France", latitude: 48.8613, longitude: 2.3618,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: false, has_shower: false, opening_hours: "00:00-24:00",
    is_verified: false, created_at: daysAgo(400), updated_at: daysAgo(8),
    tags: [{ id: makeId(), toilet_id: par2Id, tag: "sanisette" }],
  }, par2Reviews, par2Votes));

  // ── New York ─────────────────────────────────────────────────────────
  const nyc1Id = makeId();
  const nyc1Reviews = [
    makeReview(nyc1Id, { cleanliness: 7.5, accessibility: 8, safety: 8, facilities: 7, comment: "Clean for Central Park. Well staffed.", daysAgoN: 3 }),
    makeReview(nyc1Id, { cleanliness: 7, accessibility: 8, safety: 8, facilities: 6.5, daysAgoN: 15 }),
    makeReview(nyc1Id, { cleanliness: 8, accessibility: 8, safety: 8, facilities: 7, comment: "Good option near Bethesda Fountain.", daysAgoN: 28 }),
    makeReview(nyc1Id, { cleanliness: 7.5, accessibility: 8, safety: 7.5, facilities: 7, daysAgoN: 60 }),
  ];
  const nyc1Votes = [makeVote(nyc1Id, true, 0), makeVote(nyc1Id, true, 2), makeVote(nyc1Id, true, 4)];
  toilets.push(buildToilet({
    id: nyc1Id, name: "Central Park - Bethesda Terrace Restrooms", address: "Bethesda Terrace, Central Park, NY",
    city: "New York", country: "USA", latitude: 40.7736, longitude: -73.9711,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: false, opening_hours: "08:00-20:00",
    is_verified: true, created_at: daysAgo(600), updated_at: daysAgo(3),
    tags: [{ id: makeId(), toilet_id: nyc1Id, tag: "park" }, { id: makeId(), toilet_id: nyc1Id, tag: "accessible" }],
  }, nyc1Reviews, nyc1Votes));

  const nyc2Id = makeId();
  const nyc2Reviews = [
    makeReview(nyc2Id, { cleanliness: 6, accessibility: 5, safety: 5.5, facilities: 5, comment: "Busy subway bathroom. Use if desperate.", daysAgoN: 1 }),
    makeReview(nyc2Id, { cleanliness: 5, accessibility: 5, safety: 5, facilities: 4.5, comment: "Not great but it's NYC subway.", daysAgoN: 12 }),
    makeReview(nyc2Id, { cleanliness: 5.5, accessibility: 5, safety: 5, facilities: 4.5, daysAgoN: 40 }),
  ];
  const nyc2Votes = [makeVote(nyc2Id, true, 0), makeVote(nyc2Id, true, 1), makeVote(nyc2Id, false, 3)];
  toilets.push(buildToilet({
    id: nyc2Id, name: "Times Square - 42nd St Subway Restroom", address: "42nd St-Port Authority, Times Square, NY",
    city: "New York", country: "USA", latitude: 40.7580, longitude: -73.9855,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: false, has_shower: false, opening_hours: "00:00-24:00",
    is_verified: false, created_at: daysAgo(300), updated_at: daysAgo(1),
    tags: [{ id: makeId(), toilet_id: nyc2Id, tag: "subway" }, { id: makeId(), toilet_id: nyc2Id, tag: "24h" }],
  }, nyc2Reviews, nyc2Votes));

  const nyc3Id = makeId();
  const nyc3Reviews = [
    makeReview(nyc3Id, { cleanliness: 8.5, accessibility: 8, safety: 8.5, facilities: 8, comment: "Best free bathroom in Midtown. Clean and spacious.", daysAgoN: 5 }),
    makeReview(nyc3Id, { cleanliness: 8, accessibility: 8, safety: 8, facilities: 7.5, daysAgoN: 20 }),
    makeReview(nyc3Id, { cleanliness: 9, accessibility: 8, safety: 9, facilities: 8.5, comment: "Bryant Park takes great care of this.", daysAgoN: 35 }),
    makeReview(nyc3Id, { cleanliness: 8.5, accessibility: 8, safety: 8.5, facilities: 8, daysAgoN: 70 }),
  ];
  const nyc3Votes = [makeVote(nyc3Id, true, 0), makeVote(nyc3Id, true, 1), makeVote(nyc3Id, true, 2)];
  toilets.push(buildToilet({
    id: nyc3Id, name: "Bryant Park Restroom", address: "Bryant Park, 42nd Street, NY",
    city: "New York", country: "USA", latitude: 40.7536, longitude: -73.9832,
    is_free: true, requires_key: false, accessible: true,
    has_baby_change: true, has_shower: false, opening_hours: "07:00-22:00",
    is_verified: true, created_at: daysAgo(450), updated_at: daysAgo(5),
    tags: [{ id: makeId(), toilet_id: nyc3Id, tag: "park" }, { id: makeId(), toilet_id: nyc3Id, tag: "accessible" }, { id: makeId(), toilet_id: nyc3Id, tag: "highly-rated" }],
  }, nyc3Reviews, nyc3Votes));

  return toilets;
}
