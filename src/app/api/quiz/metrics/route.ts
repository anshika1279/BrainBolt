import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/request";
import { fetchDifficultyHistogram, getUserState } from "@/lib/db/quiz";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getUserState(userId);
  if (!state) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const histogram = await fetchDifficultyHistogram(userId);

  return NextResponse.json({
    currentDifficulty: state.currentDifficulty,
    streak: state.streak,
    maxStreak: state.maxStreak,
    totalScore: state.totalScore,
    accuracy: state.accuracy,
    difficultyHistogram: histogram,
    recentPerformance: state.recentPerformance,
  });
}
