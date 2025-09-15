"use client";

import { usePreferences } from "components/preferences";
import type { Theme } from "components/preferences";

const ThemeIcon = ({ theme }: { theme: Theme }) => {
  if (theme === "light") {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Default to dark theme icon
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
};

const themes: Array<Theme> = ["light", "dark"];
const nextTheme = (theme: Theme) => {
  const currentIndex = themes.indexOf(theme);
  return themes[(currentIndex + 1) % themes.length];
};

export default function ThemeToggle() {
  const { theme, setTheme, isHydrated } = usePreferences();

  if (!isHydrated) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
    );
  }

  const handleToggle = () => {
    const next = nextTheme(theme);
    setTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      className="w-8 h-8 rounded-lg  hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
      title={`Switch to ${nextTheme(theme)}`}
    >
      <ThemeIcon theme={nextTheme(theme)} />
    </button>
  );
}
