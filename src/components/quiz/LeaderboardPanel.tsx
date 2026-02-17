import type { LeaderboardEntry } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stack } from "@/components/ui/Stack";

function LeaderboardList({
  entries,
  highlightRank,
  label,
}: {
  entries: LeaderboardEntry[];
  highlightRank: number;
  label: string;
}) {
  return (
    <Stack gap="3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
        <span>{label}</span>
        <span>Rank</span>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between rounded-md border border-border bg-surfaceRaised px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{entry.userId}</div>
              <div className="text-xs text-muted">{entry.score}</div>
            </div>
            <Badge tone={entry.rank === highlightRank ? "success" : "default"}>
              #{entry.rank}
            </Badge>
          </div>
        ))}
      </div>
    </Stack>
  );
}

export function LeaderboardPanel({
  scoreEntries,
  streakEntries,
  rankScore,
  rankStreak,
}: {
  scoreEntries: LeaderboardEntry[];
  streakEntries: LeaderboardEntry[];
  rankScore: number;
  rankStreak: number;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Leaderboards</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Your rank</span>
            <Badge tone="success">Score #{rankScore || "-"}</Badge>
            <Badge tone="warning">Streak #{rankStreak || "-"}</Badge>
          </div>
          <LeaderboardList
            entries={scoreEntries}
            highlightRank={rankScore}
            label="Total score"
          />
          <LeaderboardList
            entries={streakEntries}
            highlightRank={rankStreak}
            label="Max streak"
          />
        </Stack>
      </CardBody>
    </Card>
  );
}
