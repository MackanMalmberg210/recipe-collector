"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export type TasteVibe =
  | "all"
  | "quick"
  | "protein"
  | "family"
  | "vegetarian"
  | "budget";

type HomeHeroProps = {
  activeVibe: TasteVibe;
  onVibeChange: (vibe: TasteVibe) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalRecipes: number;
  filteredCount: number;
  onOpenImport?: () => void;
};

const VIBE_OPTIONS: { id: TasteVibe; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: "all",
    label: "All Recipes",
    desc: "Full library",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "quick",
    label: "Quick (<25m)",
    desc: "Under 25 mins",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="13" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l2.5 2.5M12 5V2m-3 1h6" />
      </svg>
    ),
  },
  {
    id: "protein",
    label: "High Protein",
    desc: "Meat & fish",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    id: "family",
    label: "Family Meals",
    desc: "Crowd-pleasers",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "vegetarian",
    label: "Plant-Forward",
    desc: "Meatless",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6m0 0c0 0-4-3-8 1s3 8 8 8m0-9c0 0 4-3 8 1s-3 8-8 8" />
      </svg>
    ),
  },
  {
    id: "budget",
    label: "Budget Friendly",
    desc: "Everyday staples",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

const VIBE_COLORS: Record<TasteVibe, string> = {
  all: "text-slate-700 dark:text-amber-400",
  quick: "text-slate-700 dark:text-amber-400",
  protein: "text-slate-700 dark:text-amber-400",
  family: "text-slate-700 dark:text-amber-400",
  vegetarian: "text-slate-700 dark:text-amber-400",
  budget: "text-slate-700 dark:text-amber-400",
};

export default function HomeHero({
  activeVibe,
  onVibeChange,
  searchTerm,
  onSearchChange,
  totalRecipes,
  filteredCount,
  onOpenImport,
}: HomeHeroProps) {
  const { user, displayName } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global / and Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputActive = activeTag === "input" || activeTag === "textarea";

      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        return;
      }

      if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) && !isInputActive) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="mb-8">
      <div className="relative overflow-hidden rounded-4xl border border-slate-200/90 bg-white p-6 text-slate-900 shadow-xl transition duration-300 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_40%),linear-gradient(135deg,#1c1815_0%,#13100e_55%,#0f0d0b_100%)] dark:text-white md:p-8 lg:p-10">
        
        {/* TOP BRAND BADGE & ACTION CTAS */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700 dark:bg-amber-500 animate-pulse" />
              {user ? "Recipe Collection" : "Distraction-Free Cooking"}
            </div>

            {user ? (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-[#fff8ef] sm:text-4xl md:text-5xl md:leading-[1.15]">
                  Discover &amp; cook{" "}
                  <span className="font-serif italic font-normal text-slate-950 dark:text-amber-300">
                    your next favorite dish
                  </span>
                  .
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-stone-300 sm:text-base">
                  Find inspiration for tonight&apos;s dinner, plan your weekly menu, or import new recipes from anywhere.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-[#fff8ef] sm:text-4xl md:text-5xl md:leading-[1.15]">
                  A cleaner, smarter home for{" "}
                  <span className="font-serif italic font-normal text-slate-950 dark:text-amber-300">
                    all your recipes
                  </span>
                  .
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-stone-300 sm:text-base">
                  Save recipes from any website, plan weekly meals without ads or clutter, and take your cookbook wherever you go.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
            {user ? (
              <>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 px-4.5 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <svg className="h-4 w-4 shrink-0 text-white dark:text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Recipe</span>
                </Link>

                {onOpenImport && (
                  <button
                    type="button"
                    onClick={onOpenImport}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-[#2e2722] dark:bg-[#1a1715] dark:text-[#d6d3d1] dark:hover:bg-[#24201c] dark:hover:text-[#fafaf9] px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Import Recipe</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <span className="font-black">→</span>
                </Link>

                {onOpenImport && (
                  <button
                    type="button"
                    onClick={onOpenImport}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-[#2e2722] dark:bg-[#1a1715] dark:text-[#d6d3d1] dark:hover:bg-[#24201c] dark:hover:text-[#fafaf9] px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Try Instant Import</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* FULL-WIDTH PROMINENT SEARCH BAR */}
        <div className="mt-8">
          <div className="relative flex items-center">
            <svg
              className="pointer-events-none absolute left-4.5 h-5 w-5 text-slate-400 dark:text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by recipe title, cuisine, or ingredients (e.g. Salmon, Pasta, Garlic, Tacos)..."
              className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-24 text-sm sm:text-base font-medium text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-white/15 dark:bg-[#201813] dark:text-stone-50 dark:placeholder:text-stone-500 shadow-xs"
            />

            {/* SHORTCUT BADGE / CLEAR BUTTON */}
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/15 dark:text-stone-200 dark:hover:bg-white/25 cursor-pointer transition"
              >
                ✕
              </button>
            ) : (
              <div className="pointer-events-none absolute right-4 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5 px-2.5 py-1 text-xs font-mono font-bold text-slate-600 dark:text-stone-400">
                <span className="text-[11px] text-slate-500 font-sans">Press</span>
                <span className="text-slate-900 dark:text-amber-300">/</span>
              </div>
            )}
          </div>

          {searchTerm && (
            <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-stone-400">
              <span>
                Found <strong className="text-slate-900 dark:text-amber-300 font-bold">{filteredCount}</strong> recipe{filteredCount === 1 ? "" : "s"} for &ldquo;{searchTerm}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-slate-800 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* TASTE VIBES / MOOD SWITCHER (FRONT & CENTER) */}
        <div className="mt-6 border-t border-slate-200/90 pt-5 dark:border-white/8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-stone-400">
              Browse Categories
            </span>
            <span suppressHydrationWarning className="text-xs font-semibold text-slate-600 dark:text-stone-400">
              {filteredCount} of {totalRecipes} recipes
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {VIBE_OPTIONS.map((option) => {
              const isActive = activeVibe === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onVibeChange(option.id)}
                  className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white border-2 border-slate-900 shadow-md font-bold dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/50"
                      : "border border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8 dark:hover:border-white/15"
                  }`}
                >
                  <span className={`mb-1 transition-colors ${isActive ? "text-white dark:text-stone-950" : (VIBE_COLORS[option.id] || "text-slate-700 dark:text-amber-400")}`}>
                    {option.icon}
                  </span>
                  <span className="mt-1 text-xs font-bold leading-tight">
                    {option.label}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isActive ? "text-slate-300 dark:text-stone-900/80 font-medium" : "text-slate-500 dark:text-stone-400"}`}>
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </header>
  );
}
