"use client";

import { useEffect } from "react";

type EventHandler = (data: unknown) => void;

export function useSse(url: string | null, onEvent: EventHandler) {
  useEffect(() => {
    if (!url) return;
    const source = new EventSource(url);
    const handler = (event: MessageEvent) => {
      try {
        onEvent(JSON.parse(event.data));
      } catch {
        onEvent(event.data);
      }
    };

    source.addEventListener("leaderboard", handler);

    return () => {
      source.removeEventListener("leaderboard", handler);
      source.close();
    };
  }, [url, onEvent]);
}
