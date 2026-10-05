"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    const currentTheme = isLight ? "light" : "dark";
    setTheme(currentTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("recipe_theme", nextTheme);

    const root = document.documentElement;
    if (nextTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle color theme"
    >

      {/* THE SUN: RISES from below when light mode activates, SETS downward when dark mode activates */}
      <span
        className={`absolute inset-0 flex items-center justify-center transform-gpu transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          !isDark
            ? "translate-y-0 rotate-0 scale-100 opacity-100 text-slate-900"
            : "translate-y-7 rotate-90 scale-50 opacity-0 text-slate-400"
        }`}
      >
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </span>

      {/* THE MOON: RISES into place when dark mode activates, DIPS below horizon when light mode activates */}
      <span
        className={`absolute inset-0 flex items-center justify-center transform-gpu transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark
            ? "translate-y-0 rotate-0 scale-100 opacity-100 text-amber-300"
            : "-translate-y-7 -rotate-90 scale-50 opacity-0 text-slate-400"
        }`}
      >
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>
    </button>
  );
}
