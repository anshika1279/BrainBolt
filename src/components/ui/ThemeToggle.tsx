"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <Toggle pressed={theme === "dark"} onClick={toggleTheme}>
      {theme === "dark" ? "Dark" : "Light"}
    </Toggle>
  );
}
