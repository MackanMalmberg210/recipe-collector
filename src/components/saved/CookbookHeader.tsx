"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import type { SortMode, ViewMode } from "./SavedToolbar";

type CookbookHeaderProps = {
  title: string;
  resultCount: number;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  hasActiveFilter: boolean;
  onResetFilters: () => void;
  onOpenAddRecipeModal?: () => void;
};

type SortOptionConfig = {
  value: SortMode;
  label: string;
  icon: (active: boolean) => ReactNode;
};

const SORT_OPTIONS: SortOptionConfig[] = [
  {
    value: "newest",
    label: "Newest",
    icon: (active) => (
      <svg className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-amber-600 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "oldest",
    label: "Oldest",
    icon: (active) => (
      <svg className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-amber-600 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "alphabetical",
    label: "Alphabetical (A–Z)",
    icon: (active) => (
      <svg className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-amber-600 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ),
  },
  {
    value: "cookTime",
    label: "Cook Time",
    icon: (active) => (
      <svg className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-amber-600 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "rating",
    label: "Rating",
    icon: (active) => (
      <svg className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-amber-600 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

export default function CookbookHeader({
  title,
  resultCount,
  searchQuery,
  onSearchQueryChange,
  sortMode,
  onSortModeChange,
  viewMode,
  onViewModeChange,
  hasActiveFilter,
  onResetFilters,
  onOpenAddRecipeModal,
}: CookbookHeaderProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close sort menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSortOpen) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortOpen]);

  const activeSortLabel = SORT_OPTIONS.find((s) => s.value === sortMode)?.label || "Newest";

  return (
    <div className="relative overflow-visible rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm transition dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left: Title, Count Badge & Subtitle */}
        <div className="space-y-1 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
              {title}
            </h1>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
              {resultCount} {resultCount === 1 ? "recipe" : "recipes"}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
            Your personal culinary collection
          </p>
        </div>

        {/* Right: Search & Action Controls */}
        <div className="flex flex-1 max-w-2xl flex-wrap items-center gap-3 justify-start lg:justify-end">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 dark:text-stone-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search recipes, ingredients..."
              className="h-10.5 w-full rounded-2xl border border-stone-300 bg-stone-50/50 py-2 pl-10 pr-8 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/12 dark:bg-[#1f1a17] dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus:border-amber-400 dark:focus:bg-[#1f1a17]"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex h-10.5 items-center gap-2 rounded-2xl border border-stone-300/90 bg-stone-50 hover:bg-stone-100 px-3.5 text-xs sm:text-sm font-bold text-stone-800 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-2xs"
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 select-none">
                Sort:
              </span>
              <span>{activeSortLabel}</span>
              <svg className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu popup */}
            {isSortOpen && (
              <div
                role="listbox"
                className="absolute right-0 top-12.5 z-30 min-w-[210px] overflow-hidden rounded-2xl border border-stone-200/90 bg-white/98 p-1.5 shadow-xl backdrop-blur-md dark:border-white/12 dark:bg-[#181412]/98 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-150"
              >
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = opt.value === sortMode;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSortModeChange(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/15 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300 font-bold"
                          : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.icon(isSelected)}
                        <span className="truncate text-left">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex h-10.5 items-center gap-1 rounded-2xl border border-stone-300/90 bg-stone-50 p-1 dark:border-white/10 dark:bg-[#1c1815]">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-xs font-bold border border-amber-600/50"
                  : "text-stone-400 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-xs font-bold border border-amber-600/50"
                  : "text-stone-400 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
              }`}
              title="List view"
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Add Recipe Button (Elevated Amber Gradient) */}
          {onOpenAddRecipeModal && (
            <button
              type="button"
              onClick={onOpenAddRecipeModal}
              className="flex h-10.5 items-center gap-1.5 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-4 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-[0.98] cursor-pointer shrink-0"
            >
              <span className="text-base font-black">+</span>
              <span>Add Recipe</span>
            </button>
          )}

        </div>
      </div>

      {/* Filter Active Pill Indicator */}
      {hasActiveFilter && (
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-white/6">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span>Filtered results</span>
            {searchQuery && (
              <span className="font-semibold text-stone-900 dark:text-stone-200">
                matching &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}
