import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/request";
import { decayStreakForInactivity } from "@/lib/quiz/engine";
import { pickQuestionCircular } from "@/lib/quiz/circularQuestionPicker";
import { rateLimit } from "@/lib/cache/rateLimit";
import { getClientIp } from "@/lib/utils/ip";
import { withUserState, updateState } from "@/lib/db/quiz";
import type { UserState } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Dual-layer rate limiting: per-user + per-IP (abuse resistance)
  // Note: In development, all requests from localhost use 127.0.0.1, so IP limits are lenient (1000/min)
  const [userRateLimit, ipRateLimit] = await Promise.all([
    rateLimit({
      key: `quiz-next:user:${userId}`,
      max: 600, // 10 req/sec per user (development-friendly)
      windowSeconds: 60,
    }),
    rateLimit({
      key: `quiz-next:ip:${getClientIp(request)}`,
      max: 1000, // Very lenient for local development where all requests = 127.0.0.1
      windowSeconds: 60,
    }),
  ]);

  if (!userRateLimit.allowed || !ipRateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const url = new URL(request.url);
  const requestedSession = url.searchParams.get("sessionId");

  let result: { question: ReturnType<typeof pickQuestionCircular>['question']; state: UserState } | null = null;
  try {
    result = await withUserState(userId, async (client, state) => {
    const now = new Date();
    const decayedStreak = decayStreakForInactivity(state.streak, state.lastAnswerAt, now);
    if (decayedStreak !== state.streak) {
      state.streak = decayedStreak;
      state.wrongStreak = 0; // Reset wrong streak on inactivity decay
    }

    if (requestedSession && requestedSession !== state.sessionId) {
      state.sessionId = requestedSession;
    }

    // Pick question using circular queue (guarantees no repeats within cycle)
    const { question, updatedState } = pickQuestionCircular(state, state.currentDifficulty);
    
    // Apply state updates from circular picker
    state.cyclePosition = updatedState.cyclePosition;
    state.queueDifficulty = updatedState.queueDifficulty;
    state.difficultyQuestionQueue = updatedState.difficultyQuestionQueue;
    state.lastQuestionId = question.id;

    // Maintain bounded list of recent questions (last 10) for fallback
    state.recentQuestionIds = [question.id, ...state.recentQuestionIds].slice(0, 10);

    await updateState(client, state);

    return {
      question,
      state,
    };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "State version conflict") {
      return NextResponse.json({ error: "State version conflict" }, { status: 409 });
    }
    throw error;
  }

  if (!result) {
    return NextResponse.json({ error: "Unable to load question" }, { status: 500 });
  }

  console.log(`[quiz/next] Returning question: difficulty=${result.question.difficulty}, state.currentDifficulty=${result.state.currentDifficulty}, questionId=${result.question.id}`);

  return NextResponse.json({
    questionId: result.question.id,
    difficulty: result.state.currentDifficulty, // Return state's current difficulty, not question's difficulty
    prompt: result.question.prompt,
    choices: result.question.choices,
    sessionId: result.state.sessionId,
    stateVersion: result.state.stateVersion,
    currentScore: result.state.totalScore,
    currentStreak: result.state.streak,
  });
}
