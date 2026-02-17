import type { Difficulty, UserState } from "@/lib/types";

const MIN_DIFFICULTY: Difficulty = 1;
const MAX_DIFFICULTY: Difficulty = 10;
const MIN_STREAK_TO_RISE = 2;
const MIN_WRONG_STREAK_TO_DROP = 2;

export function clampDifficulty(value: number): Difficulty {
  const rounded = Math.round(value);
  if (rounded < MIN_DIFFICULTY) return MIN_DIFFICULTY;
  if (rounded > MAX_DIFFICULTY) return MAX_DIFFICULTY;
  return rounded as Difficulty;
}

export function decayStreakForInactivity(
  streak: number,
  lastAnswerAt: string | null,
  now: Date,
  decayMinutes = 10
) {
  if (!lastAnswerAt) return streak;
  const last = new Date(lastAnswerAt).getTime();
  const diffMinutes = (now.getTime() - last) / 60000;
  if (diffMinutes < decayMinutes) return streak;
  return Math.max(0, streak - 1);
}

export function updateAdaptiveState(state: UserState, correct: boolean) {
  // Update user streak: increment on correct, decrease by 1 on wrong (min 0)
  let nextStreak = correct ? state.streak + 1 : Math.max(0, state.streak - 1);
  
  // Update wrong streak counter for difficulty control only
  let nextWrongStreak = correct ? 0 : state.wrongStreak + 1;

  let nextDifficulty = state.currentDifficulty;

  // Increase difficulty if 2+ consecutive correct answers at current difficulty level
  if (
    nextStreak >= MIN_STREAK_TO_RISE &&
    nextDifficulty < MAX_DIFFICULTY
  ) {
    nextDifficulty = clampDifficulty(nextDifficulty + 1);
    // Keep streak going - don't reset on correct answers
  }

  // Decrease difficulty if 2+ consecutive wrong answers at current difficulty level
  else if (
    nextWrongStreak >= MIN_WRONG_STREAK_TO_DROP &&
    nextDifficulty > MIN_DIFFICULTY
  ) {
    nextDifficulty = clampDifficulty(nextDifficulty - 1);
    // Reset wrong streak when difficulty decreases (wrongStreak is specific to difficulty level)
    nextWrongStreak = 0;
  }

  return {
    nextDifficulty,
    nextStreak,
    nextWrongStreak,
  };
}
