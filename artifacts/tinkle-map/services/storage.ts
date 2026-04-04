import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Toilet, SavedPlace, ToiletReview, Report } from "@/types";
import { generateSeedToilets } from "./seedData";

const KEYS = {
  TOILETS: "tinkle_map_toilets",
  SAVED: "tinkle_map_saved",
  REPORTS: "tinkle_map_reports",
  USER_REVIEWS: "tinkle_map_user_reviews",
  INITIALIZED: "tinkle_map_initialized",
};

export async function initializeStorage(): Promise<void> {
  const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
  if (initialized) return;

  const seedToilets = generateSeedToilets();
  await AsyncStorage.setItem(KEYS.TOILETS, JSON.stringify(seedToilets));
  await AsyncStorage.setItem(KEYS.SAVED, JSON.stringify([]));
  await AsyncStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
  await AsyncStorage.setItem(KEYS.USER_REVIEWS, JSON.stringify([]));
  await AsyncStorage.setItem(KEYS.INITIALIZED, "true");
}

export async function getAllToilets(): Promise<Toilet[]> {
  const raw = await AsyncStorage.getItem(KEYS.TOILETS);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function getToiletById(id: string): Promise<Toilet | null> {
  const toilets = await getAllToilets();
  return toilets.find((t) => t.id === id) ?? null;
}

export async function getNearbyToilets(
  latitude: number,
  longitude: number,
  radiusKm = 5
): Promise<Toilet[]> {
  const toilets = await getAllToilets();
  return toilets
    .map((t) => ({
      ...t,
      distance: haversineKm(latitude, longitude, t.latitude, t.longitude),
    }))
    .filter((t) => t.distance <= radiusKm)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

export async function getSavedPlaces(userId = "demo"): Promise<SavedPlace[]> {
  const raw = await AsyncStorage.getItem(KEYS.SAVED);
  if (!raw) return [];
  const all: SavedPlace[] = JSON.parse(raw);
  const filtered = all.filter((s) => s.user_id === userId);
  const toilets = await getAllToilets();
  return filtered.map((s) => ({
    ...s,
    toilet: toilets.find((t) => t.id === s.toilet_id),
  }));
}

export async function saveToilet(toiletId: string, userId = "demo", note?: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.SAVED);
  const all: SavedPlace[] = raw ? JSON.parse(raw) : [];
  const exists = all.find((s) => s.user_id === userId && s.toilet_id === toiletId);
  if (exists) return;
  all.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    toilet_id: toiletId,
    note,
    created_at: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEYS.SAVED, JSON.stringify(all));
}

export async function unsaveToilet(toiletId: string, userId = "demo"): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.SAVED);
  const all: SavedPlace[] = raw ? JSON.parse(raw) : [];
  const updated = all.filter((s) => !(s.user_id === userId && s.toilet_id === toiletId));
  await AsyncStorage.setItem(KEYS.SAVED, JSON.stringify(updated));
}

export async function isToiletSaved(toiletId: string, userId = "demo"): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.SAVED);
  const all: SavedPlace[] = raw ? JSON.parse(raw) : [];
  return all.some((s) => s.user_id === userId && s.toilet_id === toiletId);
}

export async function addReview(review: Omit<ToiletReview, "id" | "created_at" | "updated_at">): Promise<void> {
  const toilets = await getAllToilets();
  const idx = toilets.findIndex((t) => t.id === review.toilet_id);
  if (idx < 0) return;

  const newReview: ToiletReview = {
    ...review,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = toilets[idx].reviews ?? [];
  const updated = [newReview, ...existing];
  const newCount = updated.length;

  const clAvg = updated.reduce((s, r) => s + r.cleanliness_score, 0) / newCount;
  const acAvg = updated.reduce((s, r) => s + r.accessibility_score, 0) / newCount;
  const saAvg = updated.reduce((s, r) => s + r.safety_score, 0) / newCount;
  const faAvg = updated.reduce((s, r) => s + r.facilities_score, 0) / newCount;
  const newOverall = (clAvg + acAvg + saAvg + faAvg) / 4;

  toilets[idx] = {
    ...toilets[idx],
    reviews: updated,
    review_count: newCount,
    cleanliness_avg: clAvg,
    accessibility_avg: acAvg,
    safety_avg: saAvg,
    facilities_avg: faAvg,
    overall_trust_score: newOverall,
    updated_at: new Date().toISOString(),
  };

  await AsyncStorage.setItem(KEYS.TOILETS, JSON.stringify(toilets));
}

export async function addReport(report: Omit<Report, "id" | "created_at">): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.REPORTS);
  const all: Report[] = raw ? JSON.parse(raw) : [];
  all.push({
    ...report,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEYS.REPORTS, JSON.stringify(all));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
