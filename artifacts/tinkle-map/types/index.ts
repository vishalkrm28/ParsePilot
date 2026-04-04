export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ToiletTag {
  id: string;
  toilet_id: string;
  tag: string;
}

export interface ToiletReview {
  id: string;
  toilet_id: string;
  user_id?: string;
  cleanliness_score: number;
  accessibility_score: number;
  safety_score: number;
  facilities_score: number;
  overall_score: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ToiletStatusVote {
  id: string;
  toilet_id: string;
  user_id?: string;
  is_open: boolean;
  created_at: string;
}

export interface Photo {
  id: string;
  toilet_id: string;
  user_id?: string;
  url: string;
  created_at: string;
}

export interface Toilet {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  is_free: boolean;
  price?: number;
  requires_key: boolean;
  key_info?: string;
  accessible: boolean;
  has_baby_change: boolean;
  has_shower: boolean;
  opening_hours?: string;
  overall_trust_score: number;
  cleanliness_avg: number;
  accessibility_avg: number;
  safety_avg: number;
  facilities_avg: number;
  confidence_level: ConfidenceLevel;
  review_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  tags?: ToiletTag[];
  reviews?: ToiletReview[];
  status_votes?: ToiletStatusVote[];
  photos?: Photo[];
  distance?: number;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  toilet_id: string;
  note?: string;
  created_at: string;
  toilet?: Toilet;
}

export interface Report {
  id: string;
  toilet_id: string;
  user_id?: string;
  reason: string;
  description?: string;
  created_at: string;
}

export type ToiletFilter = {
  isFree?: boolean;
  accessible?: boolean;
  hasBabyChange?: boolean;
  hasShower?: boolean;
  trustLevel?: ConfidenceLevel;
  maxDistance?: number;
  tags?: string[];
};

export type SortOption = "distance" | "rating" | "trust" | "newest";

export interface NearbyToiletsQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  filters?: ToiletFilter;
  sort?: SortOption;
  limit?: number;
}

export interface TrustScoreComponents {
  baseScore: number;
  reviewCount: number;
  recencyBonus: number;
  voteBonus: number;
  verifiedBonus: number;
  finalScore: number;
  confidenceLevel: ConfidenceLevel;
}
