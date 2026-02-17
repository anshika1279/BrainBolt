import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Stat, StatLabel, StatMeta, StatValue } from "@/components/ui/Stat";

export function MetricsPanel({
  accuracy,
  maxStreak,
  recentPerformance,
}: {
  accuracy: number;
  maxStreak: number;
  recentPerformance: number[];
}) {
  // 1. Clamp accuracy to [0, 100] to prevent UI overflow from backend bugs
  const accuracyPct = Math.min(100, Math.max(0, Math.round(accuracy * 100)));

  return (
    <Card className="animate-rise-in">
      <CardHeader>
        <CardTitle>Session Metrics</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="4">
          <div className="grid gap-4 md:grid-cols-2">
            <Stat>
              <StatLabel>Accuracy</StatLabel>
              <StatValue>{accuracyPct}%</StatValue>
              <StatMeta>Rolling accuracy</StatMeta>
            </Stat>
            <Stat>
              <StatLabel>Max streak</StatLabel>
              <StatValue>{maxStreak}</StatValue>
              <StatMeta>Best run so far</StatMeta>
            </Stat>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Recent answers</p>
            {/* 4. Reserve space to prevent layout shift when recentPerformance populates */}
            <div className="mt-2 flex gap-2 min-h-[1rem]">
              {recentPerformance.length === 0 && (
                <span className="text-sm text-muted">No answers yet.</span>
              )}
              {/* 2. & 3. Accessibility: add aria-label + title for screen readers and color-blind users */}
              {recentPerformance.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  // 2. Describe visual bar for screen readers
                  role="img"
                  aria-label={value ? "Correct answer" : "Incorrect answer"}
                  // 3. Tooltip for color-blind users (reveal text on hover)
                  title={value ? "Correct" : "Incorrect"}
                  className={`h-3 w-6 rounded-pill transition-opacity hover:opacity-80 ${
                    value ? "bg-success" : "bg-danger"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* 5. Note: recentPerformance currently stores ~10-20 items (efficient).
              If scaling to 100+ items, consider windowing or virtualization. */}
        </Stack>
      </CardBody>
    </Card>
  );
}
