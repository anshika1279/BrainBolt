import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/request";
import { getLeaderboard, getUserRank, hydrateLeaderboardCache } from "@/lib/db/leaderboard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 10;

  let entries = await getLeaderboard("streak", limit);
  if (!entries.length) {
    await hydrateLeaderboardCache();
    entries = await getLeaderboard("streak", limit);
  }
  const userRank = await getUserRank(userId, "streak");

  return NextResponse.json({
    entries,
    userRank: userRank ?? 0,
  });
}
