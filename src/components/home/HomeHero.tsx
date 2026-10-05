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
  onOpenImport?: (url?: string) => void;
  onOpenScanCookbook?: () => void;
  onOpenSnapPlate?: () => void;
};

const VIBE_OPTIONS: { id: TasteVibe; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: "all",
    label: "All Recipes",
    desc: "Full library",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "quick",
    label: "Quick (<25m)",
    desc: "Under 25 mins",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    desc: "Green & fresh",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    id: "budget",
    label: "Budget Friendly",
    desc: "Everyday staples",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

function isLikelyUrl(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("www.") ||
    (trimmed.includes(".") &&
      (trimmed.includes("tiktok.com") ||
        trimmed.includes("instagram.com") ||
        trimmed.includes("arla.se") ||
        trimmed.includes("ica.se") ||
        trimmed.includes("food") ||
        trimmed.includes("recipe") ||
        trimmed.includes("cooking")))
  );
}

export default function HomeHero({
  activeVibe,
  onVibeChange,
  searchTerm,
  onSearchChange,
  totalRecipes,
  filteredCount,
  onOpenImport,
  onOpenScanCookbook,
  onOpenSnapPlate,
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

  const handleOmniSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLikelyUrl(searchTerm) && onOpenImport) {
      onOpenImport(searchTerm.trim());
      onSearchChange("");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const isUrl = isLikelyUrl(searchTerm);

  return (
    <header className="mb-8 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 1. PERSONALIZED GREETING & PRIMARY ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-950 dark:from-white dark:to-white">
            {user ? `${getGreeting()}, ${displayName?.split(" ")[0] || "Chef"}!` : "Start Building Your Menu."}
          </h1>
          <p className="text-sm text-slate-600 dark:text-stone-400 mt-1 font-normal">
            {user ? "What are we cooking today?" : "Get started by importing a recipe from the web, scanning your physical cookbook, or browsing our collection of high-quality meals."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            title="Create recipe from scratch"
          >
            <svg className="h-4 w-4 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Recipe</span>
          </Link>
        </div>
      </div>

      {/* 2. UNIFIED OMNI-BAR (Search + URL Import in One Clean Place) */}
      <form
        onSubmit={handleOmniSubmit}
        className="group relative flex items-center w-full rounded-2xl border border-slate-200/90 bg-white dark:border-white/[0.08] dark:bg-[#151311] shadow-xs transition-all focus-within:border-slate-400 focus-within:shadow-md dark:focus-within:border-white/25 p-1.5 sm:p-2"
      >
        <div className="flex items-center pl-3 pr-2 text-slate-400 dark:text-stone-500 shrink-0">
          {isUrl ? (
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${totalRecipes || 37} recipes, or paste any recipe link (TikTok, Instagram, NYT)...`}
          className="w-full bg-transparent py-2 px-1 text-sm font-medium text-slate-950 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 focus:outline-none"
        />

        <div className="flex items-center gap-2 shrink-0 pr-1">
          {isUrl ? (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold px-4 py-2 text-xs sm:text-sm shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <span>Import</span>
              <span>→</span>
            </button>
          ) : searchTerm ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-white/10 dark:hover:bg-white/20 dark:text-stone-400 transition cursor-pointer"
              aria-label="Clear search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-stone-500">
              /
            </span>
          )}
        </div>
      </form>

      {/* AI QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 mt-4">
        {onOpenScanCookbook && (
          <button onClick={onOpenScanCookbook} className="group relative flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-white to-slate-50/50 dark:from-white/[0.06] dark:to-white/[0.02] border border-slate-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4)] hover:border-amber-400 dark:hover:border-amber-500/50 hover:-translate-y-[2px] transition-all duration-300 text-left cursor-pointer w-full overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-stone-50 to-stone-100 dark:from-white/5 dark:to-white/[0.02] text-amber-600 dark:text-amber-500 shadow-sm border border-stone-200/50 dark:border-white/10 group-hover:scale-105 group-hover:shadow-amber-500/20 transition-all duration-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">Scan Cookbook</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-stone-400 mt-0.5 truncate">Extract recipes via AI OCR.</p>
            </div>
            <svg className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-amber-500 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {onOpenSnapPlate && (
          <button onClick={onOpenSnapPlate} className="group relative flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-white to-slate-50/50 dark:from-white/[0.06] dark:to-white/[0.02] border border-slate-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4)] hover:border-amber-400 dark:hover:border-amber-500/50 hover:-translate-y-[2px] transition-all duration-300 text-left cursor-pointer w-full overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-stone-50 to-stone-100 dark:from-white/5 dark:to-white/[0.02] text-amber-600 dark:text-amber-500 shadow-sm border border-stone-200/50 dark:border-white/10 group-hover:scale-105 group-hover:shadow-amber-500/20 transition-all duration-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">Snap &amp; Analyze</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-stone-400 mt-0.5 truncate">Detect macros from a photo.</p>
            </div>
            <svg className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-amber-500 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {onOpenImport && (
          <button onClick={() => onOpenImport()} className="group relative flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-white to-slate-50/50 dark:from-white/[0.06] dark:to-white/[0.02] border border-slate-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4)] hover:border-amber-400 dark:hover:border-amber-500/50 hover:-translate-y-[2px] transition-all duration-300 text-left cursor-pointer w-full overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-stone-50 to-stone-100 dark:from-white/5 dark:to-white/[0.02] text-amber-600 dark:text-amber-500 shadow-sm border border-stone-200/50 dark:border-white/10 group-hover:scale-105 group-hover:shadow-amber-500/20 transition-all duration-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">Import Link</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-stone-400 mt-0.5 truncate">Clean recipe from any URL.</p>
            </div>
            <svg className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-amber-500 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* 3. TASTE VIBES (SCROLLING PILLS) */}
      <div className="flex items-center justify-between">

        <div className="flex overflow-x-auto pb-2 -mb-2 gap-2 sm:gap-2.5 scrollbar-hide w-full mask-linear-fade">
          {VIBE_OPTIONS.map((option) => {
            const isActive = activeVibe === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onVibeChange(option.id)}
                className={`group flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-white text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:bg-[#151311] dark:border-white/[0.08] dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200 font-semibold"
                }`}
              >
                <span className={`flex items-center justify-center mt-[1px] ${isActive ? "text-stone-900" : "text-slate-400 group-hover:text-slate-600 dark:text-stone-400 dark:group-hover:text-stone-200 transition-colors"}`}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
    </header>
  );
}







