import type { Difficulty, QuizQuestion, UserState } from "@/lib/types";
import { difficultyBuckets, questionMap } from "@/lib/data/questions";

/**
 * Fisher-Yates shuffle algorithm with seed for deterministic results
 */
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let random = seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pseudo-random number generator (deterministic)
    random = (random * 9301 + 49297) % 233280;
    const j = Math.floor((random / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Pick next question in circular queue
 * Each question appears exactly once per cycle before repeating
 */
export function pickQuestionCircular(
  state: UserState,
  difficulty: Difficulty
): { question: QuizQuestion; updatedState: UserState } {
  const pool = difficultyBuckets[difficulty];

  if (!pool.length) {
    throw new Error("No questions available in difficulty bucket");
  }

  const stateUpdate = { ...state };

  // Reset queue if: (1) queue is empty, (2) difficulty changed, or (3) queue belongs to different difficulty
  const needsReset = state.difficultyQuestionQueue.length === 0 || 
                     state.queueDifficulty !== difficulty;

  if (needsReset) {
    // Create a new shuffled queue for this difficulty
    const shuffled = shuffleWithSeed(
      pool.map(q => q.id),
      difficulty * 1000 + Date.now() % 1000
    );
    stateUpdate.difficultyQuestionQueue = shuffled;
    stateUpdate.cyclePosition = 0;
    stateUpdate.queueDifficulty = difficulty;
    console.log(`[circularQuestionPicker] Reset queue for difficulty ${difficulty}, shuffled ${shuffled.length} questions`);
  }

  // Handle cycle position overflow
  if (stateUpdate.cyclePosition >= stateUpdate.difficultyQuestionQueue.length) {
    stateUpdate.cyclePosition = 0;
  }

  // Get question ID from current position in queue
  const questionId = stateUpdate.difficultyQuestionQueue[stateUpdate.cyclePosition];
  const question = questionMap.get(questionId);

  if (!question) {
    throw new Error(`Question ${questionId} not found`);
  }

  // Move to next position in cycle (wraps around automatically)
  stateUpdate.cyclePosition = (stateUpdate.cyclePosition + 1) % stateUpdate.difficultyQuestionQueue.length;

  return {
    question,
    updatedState: stateUpdate,
  };
}
