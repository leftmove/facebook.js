"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { use$ } from "@legendapp/state/react";
import { Moon, Sun } from "lucide-react";
import { preferences$ } from "state/preferences";

export default function Toggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useTheme();
  const theme = use$(preferences$.theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  const toggleTheme = () => {
    preferences$.theme.set(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-900 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
