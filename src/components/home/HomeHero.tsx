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
    label: "Plant-Forward",
    desc: "Meatless",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6m0 0c0 0-4-3-8 1s3 8 8 8m0-9c0 0 4-3 8 1s-3 8-8 8" />
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="mb-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 1. PERSONALIZED HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Greeting */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            {user ? `${getGreeting()}, ${displayName?.split(" ")[0] || "Chef"}!` : "Your Cookbook, Reimagined."}
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-stone-300 mt-1.5 font-medium">
            {user ? "What are we cooking today?" : "Save, organize, and discover beautiful recipes."}
          </p>
        </div>

        {/* Global Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          
          <div className="relative flex-1 md:w-80 group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-slate-900 dark:group-focus-within:text-amber-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search recipes, ingredients..."
              className="w-full bg-white dark:bg-[#16120f] border border-slate-300/90 dark:border-white/10 rounded-2xl py-3 pl-11 pr-12 text-sm font-semibold text-slate-950 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 transition-all"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-stone-400 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center h-6 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-stone-400 pointer-events-none">
                /
              </div>
            )}
          </div>

          <Link
            href="/create"
            className="flex shrink-0 items-center justify-center h-11 w-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 shadow-[0_8px_16px_rgb(0,0,0,0.1)] transition-all active:scale-95 cursor-pointer"
            title="Create new recipe"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>

        </div>
      </div>

      {/* 2. TASTE VIBES (SCROLLING PILLS) */}
      <div className="flex items-center justify-between">
        <div className="flex overflow-x-auto pb-2 -mb-2 gap-2.5 sm:gap-3 scrollbar-hide w-full mask-linear-fade">
          {VIBE_OPTIONS.map((option) => {
            const isActive = activeVibe === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onVibeChange(option.id)}
                className={`group flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-md dark:bg-amber-500 dark:text-stone-950"
                    : "bg-white text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:bg-[#16120f] dark:border-white/10 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200"
                }`}
              >
                <span className={isActive ? "text-white dark:text-stone-950" : "text-slate-500 group-hover:text-slate-700 dark:text-stone-400 dark:group-hover:text-stone-300 transition-colors"}>
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
