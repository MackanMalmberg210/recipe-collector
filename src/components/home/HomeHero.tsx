"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

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

const VIBE_OPTIONS: { id: TasteVibe; label: string; icon: string; desc: string }[] = [
  { id: "all", label: "All Recipes", icon: "✨", desc: "Full library" },
  { id: "quick", label: "Quick (<25m)", icon: "⚡", desc: "Under 25 mins" },
  { id: "protein", label: "High Protein", icon: "🥩", desc: "Meat & fish" },
  { id: "family", label: "Family Meals", icon: "👨‍👩‍👧", desc: "Crowd-pleasers" },
  { id: "vegetarian", label: "Plant-Forward", icon: "🥗", desc: "Meatless" },
  { id: "budget", label: "Budget Friendly", icon: "💰", desc: "Everyday staples" },
];

export default function HomeHero({
  activeVibe,
  onVibeChange,
  searchTerm,
  onSearchChange,
  totalRecipes,
  filteredCount,
  onOpenImport,
}: HomeHeroProps) {
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
      <div className="relative overflow-hidden rounded-4xl border border-stone-200/80 bg-white p-6 text-stone-900 shadow-xl transition duration-300 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_40%),linear-gradient(135deg,#1c1815_0%,#13100e_55%,#0f0d0b_100%)] dark:text-white md:p-8 lg:p-10">
        
        {/* TOP BRAND BADGE & ACTION CTAS */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Discover &amp; Cook
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-stone-950 dark:text-[#fff8ef] sm:text-4xl md:text-5xl md:leading-[1.15]">
              A smarter home for{" "}
              <span className="font-serif italic font-normal text-amber-700 dark:text-amber-300">
                recipes
              </span>
              , meal planning &amp; cooking.
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300 sm:text-base">
              Collect your favorite recipes, plan your weekly meals, and manage groceries effortlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-4.5 py-2.5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Recipe</span>
            </Link>

            {onOpenImport ? (
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300/90 bg-stone-50 hover:bg-stone-100 text-stone-800 dark:border-[#2e2722] dark:bg-[#1a1715] dark:text-[#d6d3d1] dark:hover:bg-[#24201c] dark:hover:text-[#fafaf9] px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Import Recipe</span>
              </button>
            ) : (
              <Link
                href="/saved?import=true"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300/90 bg-stone-50 hover:bg-stone-100 text-stone-800 dark:border-[#2e2722] dark:bg-[#1a1715] dark:text-[#d6d3d1] dark:hover:bg-[#24201c] dark:hover:text-[#fafaf9] px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Import Recipe</span>
              </Link>
            )}
          </div>
        </div>

        {/* FULL-WIDTH PROMINENT SEARCH BAR */}
        <div className="mt-8">
          <div className="relative flex items-center">
            <svg
              className="pointer-events-none absolute left-4.5 h-5 w-5 text-stone-400 dark:text-stone-400"
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
              className="w-full rounded-2xl border border-stone-300 bg-white py-3.5 pl-12 pr-24 text-sm sm:text-base font-medium text-stone-950 placeholder:text-stone-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-white/15 dark:bg-[#201813] dark:text-stone-50 dark:placeholder:text-stone-500 shadow-inner"
            />

            {/* SHORTCUT BADGE / CLEAR BUTTON */}
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-300 dark:bg-white/15 dark:text-stone-200 dark:hover:bg-white/25 cursor-pointer transition"
              >
                ✕
              </button>
            ) : (
              <div className="pointer-events-none absolute right-4 flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono font-bold text-stone-400">
                <span className="text-[11px] text-stone-500 font-sans">Press</span>
                <span className="text-amber-300">/</span>
              </div>
            )}
          </div>

          {searchTerm && (
            <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-stone-500 dark:text-stone-400">
              <span>
                Found <strong className="text-amber-300 font-bold">{filteredCount}</strong> recipe{filteredCount === 1 ? "" : "s"} for &ldquo;{searchTerm}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* TASTE VIBES / MOOD SWITCHER (FRONT & CENTER) */}
        <div className="mt-6 border-t border-stone-200/80 pt-5 dark:border-white/8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Browse Categories
            </span>
            <span suppressHydrationWarning className="text-xs font-semibold text-stone-500 dark:text-stone-400">
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
                      ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 shadow-md shadow-black/20 font-bold"
                      : "border border-stone-200/90 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8 dark:hover:border-white/15"
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="mt-1 text-xs font-bold leading-tight">
                    {option.label}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isActive ? "text-stone-900/80 font-semibold" : "text-stone-500 dark:text-stone-400"}`}>
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
