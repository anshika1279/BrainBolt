import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getUserIdFromRequest } from "@/lib/auth/request";
import { rateLimit } from "@/lib/cache/rateLimit";
import { getClientIp } from "@/lib/utils/ip";
import { questionMap } from "@/lib/data/questions";
import { updateAdaptiveState, decayStreakForInactivity } from "@/lib/quiz/engine";
import { computeScoreDelta } from "@/lib/quiz/scoring";
import {
  fetchIdempotentResponse,
  updateState,
  withUserState,
  writeAnswerLog,
} from "@/lib/db/quiz";
import {
  getScoreRankFromDb,
  getStreakRankFromDb,
  updateLeaderboardCache,
  updateLeaderboardRows,
} from "@/lib/db/leaderboard";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().min(8),
  questionId: z.string().min(1),
  answerIndex: z.number().int().nonnegative().max(3),  // 0-3 for 4 choices
  stateVersion: z.number().int().nonnegative(),
  answerIdempotencyKey: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { sessionId, questionId, answerIndex, stateVersion, answerIdempotencyKey } = parsed.data;

    // Check idempotency BEFORE rate limiting
    // This ensures retries due to timeouts don't consume rate quota
    const existing = await fetchIdempotentResponse(userId, answerIdempotencyKey);
    if (existing) {
      return NextResponse.json(existing);
    }

    // Only apply rate limiting for NEW requests (not idempotent replays)
    // Note: In development, all requests from localhost use 127.0.0.1, so IP limits are lenient (500/min)
    const [userRateLimit, ipRateLimit] = await Promise.all([
      rateLimit({
        key: `quiz-answer:user:${userId}`,
        max: 300, // 5 req/sec per user (development-friendly)
        windowSeconds: 60,
      }),
      rateLimit({
        key: `quiz-answer:ip:${getClientIp(request)}`,
        max: 500, // Very lenient for local development where all requests = 127.0.0.1
        windowSeconds: 60,
      }),
    ]);

    if (!userRateLimit.allowed || !ipRateLimit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const question = questionMap.get(questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Validate answerIndex is within bounds
    if (answerIndex >= question.choices.length) {
      return NextResponse.json({ error: "Invalid answer index" }, { status: 400 });
    }

    const correct = question.correctIndex === answerIndex;

    let result:
      | {
          response: NextResponse;
          responsePayload: {
            correct: boolean;
            newDifficulty: number;
            newStreak: number;
            scoreDelta: number;
            totalScore: number;
            stateVersion: number;
            leaderboardRankScore: number;
            leaderboardRankStreak: number;
          };
          cachePayload: { totalScore: number; maxStreak: number };
        }
      | NextResponse;

    try {
      result = await withUserState(userId, async (client, state) => {
      const now = new Date();
      const decayedStreak = decayStreakForInactivity(state.streak, state.lastAnswerAt, now);
      if (decayedStreak !== state.streak) {
        state.streak = decayedStreak;
        state.wrongStreak = 0; // Reset wrong streak on inactivity decay
      }

      if (sessionId !== state.sessionId) {
        return NextResponse.json({ error: "Session mismatch" }, { status: 409 });
      }

      if (stateVersion !== state.stateVersion) {
        return NextResponse.json({ error: "State version mismatch" }, { status: 409 });
      }

      console.log(`[quiz/answer] BEFORE algorithm: difficulty=${state.currentDifficulty}, streak=${state.streak}, wrongStreak=${state.wrongStreak}, answer=${correct ? 'CORRECT' : 'WRONG'}`);
      
      const { nextDifficulty, nextStreak, nextWrongStreak } = updateAdaptiveState(state, correct);
      
      console.log(`[quiz/answer] AFTER algorithm: nextDifficulty=${nextDifficulty}, nextStreak=${nextStreak}, nextWrongStreak=${nextWrongStreak}`);

      const recentWindow = 10;
      const recentPerformance = [...state.recentPerformance, correct ? 1 : 0].slice(
        -recentWindow
      );

      const nextAnswersCount = state.answersCount + 1;
      const nextAccuracy =
        (state.accuracy * state.answersCount + (correct ? 1 : 0)) / nextAnswersCount;

      const scoreDelta = computeScoreDelta({
        difficulty: state.currentDifficulty,
        streak: nextStreak,
        accuracy: nextAccuracy,
        recentPerformance,
        correct,
      });

      state.currentDifficulty = nextDifficulty;
      state.streak = nextStreak;
      state.wrongStreak = nextWrongStreak;
      state.maxStreak = Math.max(state.maxStreak, nextStreak);
      state.totalScore += scoreDelta;
      state.accuracy = nextAccuracy;
      state.answersCount = nextAnswersCount;
      state.lastAnswerAt = now.toISOString();
      state.recentPerformance = recentPerformance;

      // Log difficulty changes
      if (nextDifficulty !== state.currentDifficulty) {
        console.log(`[quiz/answer] Difficulty changed: ${state.currentDifficulty} → ${nextDifficulty}, streak: ${nextStreak}, wrongStreak: ${nextWrongStreak}`);
      }
      console.log(`[quiz/answer] Answer: ${correct ? 'CORRECT' : 'WRONG'}, streak: ${nextStreak}, wrongStreak: ${nextWrongStreak}, difficulty: ${nextDifficulty}`);
      console.log("[quiz/answer] Updating state...");
      await updateState(client, state);

      console.log("[quiz/answer] Updating leaderboard rows...");
      await updateLeaderboardRows(client, {
        userId,
        totalScore: state.totalScore,
        maxStreak: state.maxStreak,
      });

      console.log("[quiz/answer] Getting leaderboard ranks...");
      const leaderboardRankScore = await getScoreRankFromDb(client, state.totalScore);
      const leaderboardRankStreak = await getStreakRankFromDb(client, state.maxStreak);

      const responsePayload = {
        correct,
        newDifficulty: state.currentDifficulty,
        newStreak: state.streak,
        scoreDelta,
        totalScore: state.totalScore,
        stateVersion: state.stateVersion,
        leaderboardRankScore,
        leaderboardRankStreak,
      };

      // Log the answer text (for audit/analysis), but validation uses index
      const answerText = question.choices[answerIndex];

      console.log("[quiz/answer] Writing answer log...");
      await writeAnswerLog(client, {
        id: randomUUID(),
        userId,
        questionId,
        difficulty: question.difficulty,
        answer: answerText,
        correct,
        scoreDelta,
        streakAtAnswer: nextStreak,
        answerIdempotencyKey,
        responsePayload,
      });

      console.log("[quiz/answer] Transaction complete, returning response");
      return {
        response: NextResponse.json(responsePayload),
        responsePayload,
        cachePayload: {
          totalScore: state.totalScore,
          maxStreak: state.maxStreak,
        },
      };
      });
    } catch (error) {
      if (error instanceof Error && error.message === "State version conflict") {
        return NextResponse.json({ error: "State version conflict" }, { status: 409 });
      }
      console.error("[quiz/answer] Error in withUserState:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    if (result instanceof NextResponse) {
      return result;
    }

    await updateLeaderboardCache({
      userId,
      totalScore: result.cachePayload.totalScore,
      maxStreak: result.cachePayload.maxStreak,
    });

    return result.response;
  } catch (error) {
    console.error("[POST /api/quiz/answer] Unhandled error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
