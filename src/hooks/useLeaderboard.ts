"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import { useSse } from "@/hooks/useSse";

type LeaderboardState = {
  score: LeaderboardEntry[];
  streak: LeaderboardEntry[];
  rankScore: number;
  rankStreak: number;
};

export function useLeaderboard(token: string | null) {
  const [state, setState] = useState<LeaderboardState>({
    score: [],
    streak: [],
    rankScore: 0,
    rankStreak: 0,
  });

  const refresh = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [scoreRes, streakRes] = await Promise.all([
      fetch("/api/leaderboard/score", { headers }),
      fetch("/api/leaderboard/streak", { headers }),
    ]);
    const scoreData = (await scoreRes.json()) as {
      entries: LeaderboardEntry[];
      userRank: number;
    };
    const streakData = (await streakRes.json()) as {
      entries: LeaderboardEntry[];
      userRank: number;
    };
    setState({
      score: scoreData.entries,
      streak: streakData.entries,
      rankScore: scoreData.userRank,
      rankStreak: streakData.userRank,
    });
  }, [token]);

  useEffect(() => {
    refresh().catch(() => null);
  }, [refresh]);

  const handleEvent = useCallback(() => {
    refresh().catch(() => null);
  }, [refresh]);

  useSse(token ? `/api/leaderboard/stream?token=${token}` : null, handleEvent);

  return { state, refresh };
}
