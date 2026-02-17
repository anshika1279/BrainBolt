import { randomUUID } from "crypto";
import type { Difficulty, UserState } from "@/lib/types";
import { query, withTransaction, type PoolClient } from "@/lib/db";

const DEFAULT_DIFFICULTY: Difficulty = 1;

export async function ensureUser(client: PoolClient, userId: string) {
  await client.query(
    "INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
    [userId]
  );
}

export async function getOrCreateState(client: PoolClient, userId: string) {
  const stateResult = await client.query<UserState>(
    "SELECT user_id as \"userId\", session_id as \"sessionId\", current_difficulty as \"currentDifficulty\", streak, wrong_streak as \"wrongStreak\", max_streak as \"maxStreak\", total_score as \"totalScore\", confidence, confidence_raw as \"confidenceRaw\", accuracy, answers_count as \"answersCount\", last_question_id as \"lastQuestionId\", cycle_position as \"cyclePosition\", queue_difficulty as \"queueDifficulty\", difficulty_question_queue as \"difficultyQuestionQueue\", recent_question_ids as \"recentQuestionIds\", last_answer_at as \"lastAnswerAt\", recent_performance as \"recentPerformance\", state_version as \"stateVersion\" FROM user_state WHERE user_id = $1",
    [userId]
  );

  if (stateResult.rows.length) return stateResult.rows[0];

  const sessionId = randomUUID();
  const initial: UserState = {
    userId,
    sessionId,
    currentDifficulty: DEFAULT_DIFFICULTY,
    streak: 0,
    wrongStreak: 0,
    maxStreak: 0,
    totalScore: 0,
    confidence: 0,
    confidenceRaw: 0,
    accuracy: 0,
    answersCount: 0,
    lastQuestionId: null,
    cyclePosition: 0,
    queueDifficulty: null,
    difficultyQuestionQueue: [],
    recentQuestionIds: [],
    lastAnswerAt: null,
    recentPerformance: [],
    stateVersion: 0,
  };

  await client.query(
    "INSERT INTO user_state (user_id, session_id, current_difficulty, streak, wrong_streak, max_streak, total_score, confidence, confidence_raw, accuracy, answers_count, last_question_id, cycle_position, queue_difficulty, difficulty_question_queue, recent_question_ids, last_answer_at, recent_performance, state_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)",
    [
      initial.userId,
      initial.sessionId,
      initial.currentDifficulty,
      initial.streak,
      initial.wrongStreak,
      initial.maxStreak,
      initial.totalScore,
      initial.confidence,
      initial.confidenceRaw,
      initial.accuracy,
      initial.answersCount,
      initial.lastQuestionId,
      initial.cyclePosition,
      initial.queueDifficulty,
      JSON.stringify(initial.difficultyQuestionQueue),
      JSON.stringify(initial.recentQuestionIds),
      initial.lastAnswerAt,
      JSON.stringify(initial.recentPerformance),
      initial.stateVersion,
    ]
  );

  return initial;
}

export async function getUserState(userId: string) {
  const result = await query<UserState>(
    "SELECT user_id as \"userId\", session_id as \"sessionId\", current_difficulty as \"currentDifficulty\", streak, wrong_streak as \"wrongStreak\", max_streak as \"maxStreak\", total_score as \"totalScore\", confidence, confidence_raw as \"confidenceRaw\", accuracy, answers_count as \"answersCount\", last_question_id as \"lastQuestionId\", cycle_position as \"cyclePosition\", queue_difficulty as \"queueDifficulty\", difficulty_question_queue as \"difficultyQuestionQueue\", recent_question_ids as \"recentQuestionIds\", last_answer_at as \"lastAnswerAt\", recent_performance as \"recentPerformance\", state_version as \"stateVersion\" FROM user_state WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function updateState(
  client: PoolClient,
  state: UserState
): Promise<UserState> {
  const nextVersion = state.stateVersion + 1;
  const result = await client.query(
    "UPDATE user_state SET session_id = $2, current_difficulty = $3, streak = $4, wrong_streak = $5, max_streak = $6, total_score = $7, confidence = $8, confidence_raw = $9, accuracy = $10, answers_count = $11, last_question_id = $12, cycle_position = $13, queue_difficulty = $14, difficulty_question_queue = $15, recent_question_ids = $16, last_answer_at = $17, recent_performance = $18, state_version = $19, updated_at = NOW() WHERE user_id = $1 AND state_version = $20",
    [
      state.userId,
      state.sessionId,
      state.currentDifficulty,
      state.streak,
      state.wrongStreak,
      state.maxStreak,
      state.totalScore,
      state.confidence,
      state.confidenceRaw,
      state.accuracy,
      state.answersCount,
      state.lastQuestionId,
      state.cyclePosition,
      state.queueDifficulty,
      JSON.stringify(state.difficultyQuestionQueue),
      JSON.stringify(state.recentQuestionIds),
      state.lastAnswerAt,
      JSON.stringify(state.recentPerformance),
      nextVersion,
      state.stateVersion,
    ]
  );

  if (result.rowCount !== 1) {
    throw new Error("State version conflict");
  }

  state.stateVersion = nextVersion;
  return state;
}

export async function withUserState<T>(
  userId: string,
  handler: (client: PoolClient, state: UserState) => Promise<T>
) {
  return withTransaction(async (client) => {
    await ensureUser(client, userId);
    const locked = await client.query<UserState>(
      "SELECT user_id as \"userId\", session_id as \"sessionId\", current_difficulty as \"currentDifficulty\", streak, wrong_streak as \"wrongStreak\", max_streak as \"maxStreak\", total_score as \"totalScore\", confidence, confidence_raw as \"confidenceRaw\", accuracy, answers_count as \"answersCount\", last_question_id as \"lastQuestionId\", cycle_position as \"cyclePosition\", queue_difficulty as \"queueDifficulty\", difficulty_question_queue as \"difficultyQuestionQueue\", recent_question_ids as \"recentQuestionIds\", last_answer_at as \"lastAnswerAt\", recent_performance as \"recentPerformance\", state_version as \"stateVersion\" FROM user_state WHERE user_id = $1 FOR UPDATE",
      [userId]
    );

    const state = locked.rows[0] ?? (await getOrCreateState(client, userId));
    return handler(client, state);
  });
}

export async function writeAnswerLog(
  client: PoolClient,
  payload: {
    id: string;
    userId: string;
    questionId: string;
    difficulty: Difficulty;
    answer: string;
    correct: boolean;
    scoreDelta: number;
    streakAtAnswer: number;
    answerIdempotencyKey: string;
    responsePayload: unknown;
  }
) {
  try {
    await client.query(
      "INSERT INTO answer_log (id, user_id, question_id, difficulty, answer, correct, score_delta, streak_at_answer, answer_idempotency_key, response_payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        payload.id,
        payload.userId,
        payload.questionId,
        payload.difficulty,
        payload.answer,
        payload.correct,
        payload.scoreDelta,
        payload.streakAtAnswer,
        payload.answerIdempotencyKey,
        JSON.stringify(payload.responsePayload), // Explicitly stringify for JSONB
      ]
    );
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error
      ? (error as { code?: string }).code
      : undefined;
    if (code === "23505") {
      const existing = await fetchIdempotentResponse(
        payload.userId,
        payload.answerIdempotencyKey
      );
      if (existing) {
        return;
      }
    }
    throw error;
  }
}

export async function fetchIdempotentResponse(userId: string, key: string) {
  const result = await query<{ response_payload: unknown }>(
    "SELECT response_payload FROM answer_log WHERE user_id = $1 AND answer_idempotency_key = $2",
    [userId, key]
  );
  return result.rows[0]?.response_payload ?? null;
}

export async function fetchDifficultyHistogram(userId: string) {
  const result = await query<{ difficulty: number; count: number }>(
    "SELECT difficulty, COUNT(*) as count FROM answer_log WHERE user_id = $1 GROUP BY difficulty",
    [userId]
  );
  const histogram: Record<Difficulty, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
  };
  result.rows.forEach((row) => {
    histogram[row.difficulty as Difficulty] = Number(row.count);
  });
  return histogram;
}
