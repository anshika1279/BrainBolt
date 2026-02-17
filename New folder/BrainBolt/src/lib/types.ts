// -----------------------------
// Core Domain Types
// -----------------------------

export type Difficulty =
  | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10;

export type QuizQuestion = {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  choices: string[];
  correctIndex: number;
  tags: string[];
};

// -----------------------------
// Persistent User State (Redis / DB)
// -----------------------------

export type UserState = {
  userId: string;
  sessionId: string;

  currentDifficulty: Difficulty;

  streak: number;
  maxStreak: number;
  wrongStreak: number;

  totalScore: number;

  /**
   * 0–1 confidence metric for display (clamped)
   */
  confidence: number;

  /**
   * Raw confidence for algorithm [-3, 3]
   */
  confidenceRaw: number;

  /**
   * 0–1 rolling accuracy
   */
  accuracy: number;

  answersCount: number;

  /**
   * Last served question ID
   */
  lastQuestionId: string | null;

  /**
   * Current position in circular queue for difficulty level
   */
  cyclePosition: number;

  /**
   * Difficulty level that the current queue belongs to
   */
  queueDifficulty: Difficulty | null;

  /**
   * Shuffled question IDs for current difficulty (circular queue)
   */
  difficultyQuestionQueue: string[];

  /**
   * Recent question IDs to avoid repetition (bounded, e.g., last 10)
   */
  recentQuestionIds: string[];

  /**
   * ISO timestamp string
   */
  lastAnswerAt: string | null;

  /**
   * Rolling recent results (0/1), bounded (e.g. last 10)
   */
  recentPerformance: number[];

  /**
   * Optimistic concurrency control
   */
  stateVersion: number;
};

// -----------------------------
// Derived Metrics (Client/UI)
// -----------------------------

export type DifficultyHistogram = {
  [K in Difficulty]: number;
};

export type QuizMetrics = {
  currentDifficulty: Difficulty;
  streak: number;
  maxStreak: number;
  totalScore: number;

  /**
   * 0–1 accuracy
   */
  accuracy: number;

  difficultyHistogram: DifficultyHistogram;

  /**
   * Recent rolling results (0/1)
   */
  recentPerformance: number[];
};

// -----------------------------
// Leaderboard
// -----------------------------

export type LeaderboardEntry = {
  userId: string;
  score: number;
  rank: number;
};

// -----------------------------
// Answer API Response
// -----------------------------

export type AnswerResult = {
  correct: boolean;

  newDifficulty: Difficulty;
  newStreak: number;

  scoreDelta: number;
  totalScore: number;

  stateVersion: number;

  leaderboardRankScore: number;
  leaderboardRankStreak: number;
};
