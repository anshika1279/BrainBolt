"use client";

import { useEffect, useState } from "react";

const USER_ID_KEY = "bb-user-id";
const TOKEN_KEY = "bb-token";

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

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = window.localStorage.getItem(USER_ID_KEY);
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    if (storedUser && storedToken) {
      setUserId(storedUser);
      setToken(storedToken);
      return;
    }

    const freshUserId = storedUser || generateUUID();
    const fetchToken = async () => {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: freshUserId }),
      });
      const data = (await response.json()) as { token?: string };
      if (!data.token) return;
      window.localStorage.setItem(USER_ID_KEY, freshUserId);
      window.localStorage.setItem(TOKEN_KEY, data.token);
      setUserId(freshUserId);
      setToken(data.token);
    };

    fetchToken().catch(() => null);
  }, []);

  return { token, userId, ready: Boolean(token && userId) };
}
