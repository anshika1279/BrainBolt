import { query, type PoolClient } from "@/lib/db";
import { redis } from "@/lib/cache/redis";

const SCORE_SET = "leaderboard:score";
const STREAK_SET = "leaderboard:streak";
const PUBSUB_CHANNEL = "leaderboard:updates";

export async function updateLeaderboardRows(
  client: PoolClient,
  payload: { userId: string; totalScore: number; maxStreak: number }
) {
  await client.query(
    "INSERT INTO leaderboard_score (user_id, total_score) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET total_score = EXCLUDED.total_score, updated_at = NOW()",
    [payload.userId, payload.totalScore]
  );
  await client.query(
    "INSERT INTO leaderboard_streak (user_id, max_streak) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET max_streak = EXCLUDED.max_streak, updated_at = NOW()",
    [payload.userId, payload.maxStreak]
  );
}

export async function updateLeaderboardCache(payload: {
  userId: string;
  totalScore: number;
  maxStreak: number;
}) {
  await redis.zadd(SCORE_SET, String(payload.totalScore), payload.userId);
  await redis.zadd(STREAK_SET, String(payload.maxStreak), payload.userId);

  await redis.publish(
    PUBSUB_CHANNEL,
    JSON.stringify({
      userId: payload.userId,
      totalScore: payload.totalScore,
      maxStreak: payload.maxStreak,
    })
  );
}

export async function getLeaderboard(setKey: "score" | "streak", limit = 10) {
  const key = setKey === "score" ? SCORE_SET : STREAK_SET;
  const raw = await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");
  const entries = [] as { userId: string; score: number; rank: number }[];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({
      userId: raw[i],
      score: Number(raw[i + 1]),
      rank: i / 2 + 1,
    });
  }
  return entries;
}

export async function getUserRank(userId: string, setKey: "score" | "streak") {
  const key = setKey === "score" ? SCORE_SET : STREAK_SET;
  const rank = await redis.zrevrank(key, userId);
  return rank === null ? null : rank + 1;
}

export async function hydrateLeaderboardCache() {
  const tmpScore = `${SCORE_SET}:tmp`;
  const tmpStreak = `${STREAK_SET}:tmp`;

  try {
    await redis.del(tmpScore);
    await redis.del(tmpStreak);

    const scoreRows = await query<{ user_id: string; total_score: number }>(
      "SELECT user_id, total_score FROM leaderboard_score ORDER BY total_score DESC LIMIT 200"
    );
    if (scoreRows.rows.length) {
      const args: string[] = [];
      scoreRows.rows.forEach((row) => {
        args.push(String(row.total_score), row.user_id);
      });
      await redis.zadd(tmpScore, ...args);
    }

    const streakRows = await query<{ user_id: string; max_streak: number }>(
      "SELECT user_id, max_streak FROM leaderboard_streak ORDER BY max_streak DESC LIMIT 200"
    );
    if (streakRows.rows.length) {
      const args: string[] = [];
      streakRows.rows.forEach((row) => {
        args.push(String(row.max_streak), row.user_id);
      });
      await redis.zadd(tmpStreak, ...args);
    }

    await redis.rename(tmpScore, SCORE_SET);
    await redis.rename(tmpStreak, STREAK_SET);
  } catch (err) {
    console.error("Atomic leaderboard hydration failed", err);
  }
}

export const leaderboardChannel = PUBSUB_CHANNEL;

export async function getScoreRankFromDb(
  client: PoolClient,
  totalScore: number
) {
  const result = await client.query<{ rank: number }>(
    "SELECT 1 + COUNT(*) as rank FROM leaderboard_score WHERE total_score > $1",
    [totalScore]
  );
  return Number(result.rows[0]?.rank ?? 1);
}

export async function getStreakRankFromDb(
  client: PoolClient,
  maxStreak: number
) {
  const result = await client.query<{ rank: number }>(
    "SELECT 1 + COUNT(*) as rank FROM leaderboard_streak WHERE max_streak > $1",
    [maxStreak]
  );
  return Number(result.rows[0]?.rank ?? 1);
}
