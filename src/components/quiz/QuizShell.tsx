"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardPanel } from "@/components/quiz/LeaderboardPanel";

const MetricsPanel = dynamic(() => import("@/components/quiz/MetricsPanel").then((mod) => mod.MetricsPanel), {
  ssr: false,
  loading: () => <div className="text-sm text-muted">Loading metrics...</div>,
});

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

type QuestionState = {
  questionId: string;
  difficulty: number;
  prompt: string;
  choices: string[];
  sessionId: string;
  stateVersion: number;
  currentScore: number;
  currentStreak: number;
};

type AnswerResponse = {
  correct: boolean;
  newDifficulty: number;
  newStreak: number;
  scoreDelta: number;
  totalScore: number;
  stateVersion: number;
  leaderboardRankScore: number;
  leaderboardRankStreak: number;
};

type MetricsState = {
  accuracy: number;
  maxStreak: number;
  recentPerformance: number[];
};

export function QuizShell() {
  const { token, ready } = useAuth();
  const { state: leaderboard, refresh: refreshLeaderboard } = useLeaderboard(token);
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [metrics, setMetrics] = useState<MetricsState>({
    accuracy: 0,
    maxStreak: 0,
    recentPerformance: [],
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Abort controller refs for cleanup on unmount or token change
  const abortControllerRef = useRef<AbortController | null>(null);
  const nextQuestionAbortRef = useRef<AbortController | null>(null);
  const nextQuestionCounterRef = useRef(0); // Track request sequence for race prevention

  const headers = useMemo(() => {
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, [token]);

  // Cleanup function to abort in-flight requests
  const abortInflightRequests = useCallback(() => {
    abortControllerRef.current?.abort();
    nextQuestionAbortRef.current?.abort();
  }, []);

  const loadNext = useCallback(async () => {
    if (!headers) return;

    // Create new abort controller for this request
    // Prevents previous request from updating state after new one completes
    nextQuestionAbortRef.current?.abort();
    nextQuestionAbortRef.current = new AbortController();
    const currentRequestId = ++nextQuestionCounterRef.current;
    const signal = nextQuestionAbortRef.current.signal;

    // Show loading state by clearing old question
    setQuestion(null);

    try {
      const url = question?.sessionId
        ? `/api/quiz/next?sessionId=${question.sessionId}`
        : "/api/quiz/next";
      const response = await fetch(url, {
        headers,
        signal,
      });

      // Abort if a newer request was issued
      if (currentRequestId !== nextQuestionCounterRef.current) return;

      if (!response.ok) {
        setFeedback("Failed to load next question");
        return;
      }

      const data = (await response.json()) as QuestionState;

      // Only update if this is still the latest request
      if (currentRequestId === nextQuestionCounterRef.current) {
        setQuestion(data);
        setFeedback(null);
      }
    } catch (err) {
      // Ignore abort errors (user navigated away or newer request issued)
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error loading next question:", err);
        setFeedback("Connection error, please retry");
      }
    }
  }, [headers, question?.sessionId]);

  const loadMetrics = useCallback(async () => {
    if (!headers) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const response = await fetch("/api/quiz/metrics", {
        headers,
        signal,
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        accuracy: number;
        maxStreak: number;
        recentPerformance: number[];
      };
      setMetrics({
        accuracy: data.accuracy || 0,
        maxStreak: data.maxStreak || 0,
        recentPerformance: data.recentPerformance || [],
      });
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error loading metrics:", err);
      }
    }
  }, [headers]);

  // Abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortInflightRequests();
    };
  }, [abortInflightRequests]);

  // Initial load (only on auth ready)
  // Note: Do NOT include loadNext/loadMetrics in dependencies - they change when question updates,
  // which would create an infinite re-fetch loop causing flickering
  useEffect(() => {
    if (!ready || !headers) return;
    loadNext();
    loadMetrics();
  }, [ready, headers]);

  const submitAnswer = async (choice: string) => {
    if (!headers || !question) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Find the index of the chosen answer (cleaner than string comparison)
      const answerIndex = question.choices.indexOf(choice);
      if (answerIndex === -1) {
        setFeedback("Invalid answer");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/quiz/answer", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId: question.sessionId,
          questionId: question.questionId,
          answerIndex,
          stateVersion: question.stateVersion,
          answerIdempotencyKey: generateUUID(),
        }),
      });

      // Handle empty responses
      const responseText = await response.text();
      if (!responseText) {
        console.error("Empty response from /api/quiz/answer:", {
          status: response.status,
          statusText: response.statusText,
        });
        setFeedback("Server error, please retry");
        setIsSubmitting(false);
        return;
      }

      let data: AnswerResponse | { error?: string };
      try {
        data = JSON.parse(responseText) as AnswerResponse | { error?: string };
      } catch (parseErr) {
        console.error("Failed to parse response JSON:", {
          status: response.status,
          responseText: responseText.substring(0, 100),
          error: parseErr,
        });
        setFeedback("Invalid server response, please retry");
        setIsSubmitting(false);
        return;
      }

      if (response.ok) {
        const answerData = data as AnswerResponse;
        setFeedback(answerData.correct ? "Correct" : "Not quite");
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                currentScore: answerData.totalScore,
                currentStreak: answerData.newStreak,
                difficulty: answerData.newDifficulty,
                stateVersion: answerData.stateVersion,
              }
            : prev
        );
        await loadMetrics();
        await refreshLeaderboard();

        // Delay next question to let user see feedback
        // Improves perceived UX and gives time for metrics to update
        setTimeout(() => loadNext(), 800);
        setIsSubmitting(false);
      } else if (response.status === 409) {
        // Version conflict: state was modified server-side (optimistic locking)
        // Force full sync to ensure client is up-to-date
        setFeedback("State mismatch, resyncing...");
        await Promise.all([loadMetrics(), loadNext()]);
        setIsSubmitting(false);
      } else {
        setFeedback((data as { error?: string }).error || "Failed to submit answer, please retry");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setFeedback("Connection error, please retry");
      setIsSubmitting(false);
    }
  };

  if (!question) {
    return <div className="text-sm text-muted">Preparing your quiz...</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <Stack gap="6">
        <Card className="animate-rise-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Adaptive Quiz</CardTitle>
              <Badge tone="default">Difficulty {question.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <Stack gap="5">
              {/* Content from backend is implicitly sanitized by React's default escaping.
                  If this ever changes to dangerouslySetInnerHTML, ensure backend sanitization. */}
              <p className="text-lg font-semibold">{question.prompt}</p>
              <div className="grid gap-3">
                {question.choices.map((choice) => (
                  <Button
                    key={choice}
                    variant="outline"
                    onClick={() => submitAnswer(choice)}
                    disabled={isSubmitting}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>Total score: {question.currentScore}</span>
                <span>Streak: {question.currentStreak}</span>
                {feedback && <span className="text-foreground font-medium">{feedback}</span>}
              </div>
            </Stack>
          </CardBody>
        </Card>

        <MetricsPanel
          accuracy={metrics.accuracy}
          maxStreak={metrics.maxStreak}
          recentPerformance={metrics.recentPerformance}
        />
      </Stack>

      <LeaderboardPanel
        scoreEntries={leaderboard.score}
        streakEntries={leaderboard.streak}
        rankScore={leaderboard.rankScore}
        rankStreak={leaderboard.rankStreak}
      />
    </div>
  );
}
