import { AppShell } from "@/components/layout/AppShell";
import { Container } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Badge } from "@/components/ui/Badge";
import { getLeaderboard, hydrateLeaderboardCache } from "@/lib/db/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  let score = [] as Awaited<ReturnType<typeof getLeaderboard>>;
  let streak = [] as Awaited<ReturnType<typeof getLeaderboard>>;

  try {
    await hydrateLeaderboardCache();
    [score, streak] = await Promise.all([
      getLeaderboard("score", 10),
      getLeaderboard("streak", 10),
    ]);
  } catch {
    score = [];
    streak = [];
  }

  return (
    <AppShell>
      <Container>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Scores</CardTitle>
            </CardHeader>
            <CardBody>
              <Stack gap="3">
                {score.length === 0 && (
                  <p className="text-sm text-muted">No scores yet.</p>
                )}
                {score.map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between rounded-md border border-border bg-surfaceRaised px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{entry.userId}</div>
                      <div className="text-xs text-muted">{entry.score}</div>
                    </div>
                    <Badge>#{entry.rank}</Badge>
                  </div>
                ))}
              </Stack>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Streaks</CardTitle>
            </CardHeader>
            <CardBody>
              <Stack gap="3">
                {streak.length === 0 && (
                  <p className="text-sm text-muted">No streaks yet.</p>
                )}
                {streak.map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between rounded-md border border-border bg-surfaceRaised px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{entry.userId}</div>
                      <div className="text-xs text-muted">{entry.score}</div>
                    </div>
                    <Badge>#{entry.rank}</Badge>
                  </div>
                ))}
              </Stack>
            </CardBody>
          </Card>
        </div>
      </Container>
    </AppShell>
  );
}
