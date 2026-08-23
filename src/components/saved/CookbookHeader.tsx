"use client";

import { useState, useRef, useEffect } from "react";
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

const SORT_OPTIONS: { value: SortMode; label: string; icon: string }[] = [
  { value: "newest", label: "Newest Added", icon: "✨" },
  { value: "oldest", label: "Oldest First", icon: "⏳" },
  { value: "alphabetical", label: "A – Z (Title)", icon: "🔤" },
  { value: "cookTime", label: "Cook Time", icon: "⏱" },
  { value: "rating", label: "Top Rated", icon: "⭐" },
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
    <div className="relative overflow-visible rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-sm transition dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Title & Count */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
            {title}
          </h1>
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
            {resultCount}
          </span>
        </div>

        {/* Search & Action Controls (Increased Spacing across elements) */}
        <div className="flex flex-1 max-w-3xl flex-wrap items-center gap-3 sm:gap-4 justify-start lg:justify-end">
          
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
              placeholder="Search recipes, tags..."
              className="h-10 w-full rounded-2xl border border-stone-300 bg-stone-50/50 py-2 pl-10 pr-8 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/12 dark:bg-[#1f1a17] dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus:border-amber-400 dark:focus:bg-[#1f1a17]"
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

          {/* CUSTOM FLOATING POPOVER SORT DROPDOWN */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex h-10 items-center gap-2 rounded-2xl border border-stone-300/90 bg-stone-50 hover:bg-stone-100 px-3.5 text-xs sm:text-sm font-bold text-stone-800 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-2xs"
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

            {/* FLOATING MENU POPUP (Properly aligned with fixed-width icon column) */}
            {isSortOpen && (
              <div
                role="listbox"
                className="absolute right-0 top-12 z-30 min-w-[210px] overflow-hidden rounded-2xl border border-stone-200/90 bg-white/98 p-1.5 shadow-xl backdrop-blur-md dark:border-white/12 dark:bg-[#181412]/98 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-150"
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
                      className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300 font-extrabold"
                          : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-5 text-center shrink-0 text-sm">{opt.icon}</span>
                        <span className="truncate text-left font-bold">{opt.label}</span>
                      </div>
                      {isSelected && <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex h-10 items-center gap-1 rounded-2xl border border-stone-300/90 bg-stone-50 p-1 dark:border-white/10 dark:bg-[#1c1815]">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-stone-950 shadow-xs dark:bg-amber-500 dark:text-stone-950 font-bold"
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
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-stone-950 shadow-xs dark:bg-amber-500 dark:text-stone-950 font-bold"
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

          {/* Reset Filters */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 rounded-2xl border border-stone-300 bg-white px-3.5 text-xs font-bold text-stone-700 shadow-2xs transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 cursor-pointer"
            >
              Reset
            </button>
          )}

          {/* Prominent + Add Recipe Action */}
          {onOpenAddRecipeModal && (
            <button
              type="button"
              onClick={onOpenAddRecipeModal}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-4.5 text-xs font-bold text-stone-950 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span className="text-sm font-black">+</span>
              <span>Add Recipe</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
