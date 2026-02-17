import type { Difficulty } from "@/lib/types";

const STREAK_CAP = 8;
const STREAK_MULTIPLIER_CAP = 1.8;
const MIN_ACCURACY_MULTIPLIER = 0.6;
const MAX_ACCURACY_MULTIPLIER = 1.1;
const RECENT_BONUS_RANGE = 0.1; // ±10%
const WRONG_PENALTY_FACTOR = 0.25; // small penalty

export function computeStreakMultiplier(streak: number): number {
  const capped = Math.min(Math.max(streak, 0), STREAK_CAP);
  const eased = Math.sqrt(capped / STREAK_CAP); 
  return 1 + eased * (STREAK_MULTIPLIER_CAP - 1);
}

export function computeAccuracy(accuracy: number): number {
  return Math.min(1, Math.max(0, accuracy));
}

export function computeAccuracyMultiplier(accuracy: number): number {
  const normalized = computeAccuracy(accuracy);
  return (
    MIN_ACCURACY_MULTIPLIER +
    normalized * (MAX_ACCURACY_MULTIPLIER - MIN_ACCURACY_MULTIPLIER)
  );
}

export function computeRecentBonus(recentPerformance: number[]): number {
  if (!recentPerformance.length) return 1;

  const avg =
    recentPerformance.reduce((sum, value) => sum + value, 0) /
    recentPerformance.length;

  const nudged = 1 + (avg - 0.5) * (RECENT_BONUS_RANGE * 2);

  return Math.min(1 + RECENT_BONUS_RANGE, Math.max(1 - RECENT_BONUS_RANGE, nudged));
}

export function computeScoreDelta({
  difficulty,
  streak,
  accuracy,
  recentPerformance,
  correct,
}: {
  difficulty: Difficulty;
  streak: number;
  accuracy: number;
  recentPerformance: number[];
  correct: boolean;
}): number {
  const base = difficulty * 10;

  const streakMultiplier = computeStreakMultiplier(streak);
  const accuracyMultiplier = computeAccuracyMultiplier(accuracy);
  const recentBonus = computeRecentBonus(recentPerformance);

  const raw = base * streakMultiplier * accuracyMultiplier * recentBonus;

  if (!correct) {
    return -Math.round(base * WRONG_PENALTY_FACTOR);
  }

  return Math.round(raw);
}
