import type { Difficulty, QuizQuestion } from "@/lib/types";
import { difficultyBuckets } from "@/lib/data/questions";

const MIN_DIFFICULTY: Difficulty = 1;
const MAX_DIFFICULTY: Difficulty = 10;

export function pickQuestion(
  difficulty: Difficulty,
  lastQuestionId: string | null,
  recentQuestionIds: string[] = []
): QuizQuestion {
  const pool = getBestAvailableBucket(difficulty);

  if (!pool.length) {
    throw new Error("No questions available in any difficulty bucket");
  }

  // Avoid immediate + recent repetition
  const filtered = pool.filter(
    (q) => q.id !== lastQuestionId && !recentQuestionIds.includes(q.id)
  );

  const source = filtered.length ? filtered : pool;

  const index = Math.floor(Math.random() * source.length);
  return source[index];
}

/**
 * Returns the closest non-empty difficulty bucket.
 * Prefers exact difficulty.
 * Then searches symmetrically outward.
 */
function getBestAvailableBucket(difficulty: Difficulty): QuizQuestion[] {
  if (difficultyBuckets[difficulty]?.length) {
    return difficultyBuckets[difficulty];
  }

  for (let delta = 1; delta <= MAX_DIFFICULTY; delta++) {
    const up = difficulty + delta;
    const down = difficulty - delta;

    if (
      up <= MAX_DIFFICULTY &&
      difficultyBuckets[up as Difficulty]?.length
    ) {
      return difficultyBuckets[up as Difficulty];
    }

    if (
      down >= MIN_DIFFICULTY &&
      difficultyBuckets[down as Difficulty]?.length
    ) {
      return difficultyBuckets[down as Difficulty];
    }
  }

  return [];
}
