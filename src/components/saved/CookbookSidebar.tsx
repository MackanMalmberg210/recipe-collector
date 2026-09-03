"use client";

import { useState } from "react";
import type { RecipeCategory, MealType } from "../../lib/types";

export type SidebarFilter =
  | { type: "all" }
  | { type: "my_recipes" }
  | { type: "favorites" }
  | { type: "quick" }
  | { type: "trash" }
  | { type: "mealType"; value: MealType }
  | { type: "category"; value: RecipeCategory };

type CategoryCount = {
  category: RecipeCategory;
  label: string;
  count: number;
};

type MealTypeCount = {
  mealType: MealType;
  label: string;
  count: number;
};

type CookbookSidebarProps = {
  activeFilter: SidebarFilter;
  onSelectFilter: (filter: SidebarFilter) => void;
  onOpenAddRecipeModal?: () => void;
  totalCount: number;
  myRecipesCount: number;
  favoritesCount: number;
  quickCount: number;
  trashCount: number;
  mealTypeCounts: MealTypeCount[];
  categoryCounts: CategoryCount[];
};

export default function CookbookSidebar({
  activeFilter,
  onSelectFilter,
  onOpenAddRecipeModal,
  totalCount,
  myRecipesCount,
  favoritesCount,
  quickCount,
  trashCount,
  mealTypeCounts,
  categoryCounts,
}: CookbookSidebarProps) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  const isSelected = (filter: SidebarFilter) => {
    if (activeFilter.type !== filter.type) return false;
    if (filter.type === "category" && activeFilter.type === "category") {
      return filter.value === activeFilter.value;
    }
    if (filter.type === "mealType" && activeFilter.type === "mealType") {
      return filter.value === activeFilter.value;
    }
    return true;
  };

  const handleFilterClick = (filter: SidebarFilter) => {
    if (isSelected(filter) && filter.type !== "all") {
      onSelectFilter({ type: "all" });
    } else {
      onSelectFilter(filter);
    }
  };

  const visibleCategories = isCategoriesExpanded ? categoryCounts : categoryCounts.slice(0, 4);

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
      
      {/* MOBILE / TABLET HORIZONTAL QUICK BAR (lg:hidden) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none overscroll-contain">
        <button
          type="button"
          onClick={() => handleFilterClick({ type: "all" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "all" })
              ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-sm font-black border border-amber-600/60"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>All</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick({ type: "my_recipes" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "my_recipes" })
              ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-sm font-black border border-amber-600/60"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>My Recipes</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{myRecipesCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick({ type: "favorites" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "favorites" })
              ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-sm font-black border border-amber-600/60"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span>Favorites</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{favoritesCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick({ type: "quick" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "quick" })
              ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-sm font-black border border-amber-600/60"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Quick</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{quickCount}</span>
        </button>
      </div>

      {/* DESKTOP SIDEBAR CONTAINER */}
      <div className="hidden lg:block relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        
        {/* Sidebar Header & Action Button */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-base font-bold tracking-tight text-stone-950 dark:text-stone-50">
                My Cookbook
              </h2>
            </div>
            <span suppressHydrationWarning className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600 dark:border-[#2e2722] dark:bg-[#1f1b18] dark:text-[#a8a29e]">
              {totalCount}
            </span>
          </div>

          {/* Elevated Brand Action Button */}
          {onOpenAddRecipeModal && (
            <button
              type="button"
              onClick={onOpenAddRecipeModal}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 py-3 px-4 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <span className="text-base font-black transition-transform duration-200 group-hover:scale-110">+</span>
              <span>Add Recipe</span>
            </button>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-stone-100 dark:bg-white/6 my-5" />

        {/* NAVIGATION GROUPS */}
        <div className="space-y-6">
          
          {/* Main Collections */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2">
              Collections
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => handleFilterClick({ type: "all" })}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "all" })
                    ? "bg-stone-100 text-stone-950 dark:bg-[#221e1b] dark:text-[#fafaf9] border border-stone-300/80 dark:border-[#382f28] font-bold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:bg-white/5 dark:hover:text-[#fafaf9]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isSelected({ type: "all" }) ? "text-amber-500" : "text-stone-400 dark:text-stone-500"}`}>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="truncate text-left font-semibold">All Recipes</span>
                </div>
                <span suppressHydrationWarning className={`text-xs font-bold shrink-0 ${isSelected({ type: "all" }) ? "rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] text-stone-800 dark:bg-[#2e2722] dark:text-[#d6d3d1]" : "text-stone-400 dark:text-stone-500"}`}>
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick({ type: "my_recipes" })}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "my_recipes" })
                    ? "bg-stone-100 text-stone-950 dark:bg-[#221e1b] dark:text-[#fafaf9] border border-stone-300/80 dark:border-[#382f28] font-bold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:bg-white/5 dark:hover:text-[#fafaf9]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isSelected({ type: "my_recipes" }) ? "text-amber-500" : "text-stone-400 dark:text-stone-500"}`}>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="truncate text-left font-semibold">My Recipes</span>
                </div>
                <span suppressHydrationWarning className={`text-xs font-bold shrink-0 ${isSelected({ type: "my_recipes" }) ? "rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] text-stone-800 dark:bg-[#2e2722] dark:text-[#d6d3d1]" : "text-stone-400 dark:text-stone-500"}`}>
                  {myRecipesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick({ type: "favorites" })}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "favorites" })
                    ? "bg-stone-100 text-stone-950 dark:bg-[#221e1b] dark:text-[#fafaf9] border border-stone-300/80 dark:border-[#382f28] font-bold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:bg-white/5 dark:hover:text-[#fafaf9]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isSelected({ type: "favorites" }) ? "text-amber-500" : "text-stone-400 dark:text-stone-500"}`}>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="truncate text-left font-semibold">Favorites</span>
                </div>
                <span suppressHydrationWarning className={`text-xs font-bold shrink-0 ${isSelected({ type: "favorites" }) ? "rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] text-stone-800 dark:bg-[#2e2722] dark:text-[#d6d3d1]" : "text-stone-400 dark:text-stone-500"}`}>
                  {favoritesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick({ type: "quick" })}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "quick" })
                    ? "bg-stone-100 text-stone-950 dark:bg-[#221e1b] dark:text-[#fafaf9] border border-stone-300/80 dark:border-[#382f28] font-bold shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:bg-white/5 dark:hover:text-[#fafaf9]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isSelected({ type: "quick" }) ? "text-amber-500" : "text-stone-400 dark:text-stone-500"}`}>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="truncate text-left font-semibold">Quick (&lt;25 min)</span>
                </div>
                <span suppressHydrationWarning className={`text-xs font-bold shrink-0 ${isSelected({ type: "quick" }) ? "rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] text-stone-800 dark:bg-[#2e2722] dark:text-[#d6d3d1]" : "text-stone-400 dark:text-stone-500"}`}>
                  {quickCount}
                </span>
              </button>
            </nav>
          </div>

          {/* Meal Types */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2">
              Meal Types
            </p>
            <nav className="space-y-1">
              {mealTypeCounts.map((meal) => {
                const isItemActive = isSelected({ type: "mealType", value: meal.mealType });
                return (
                  <button
                    key={meal.mealType}
                    type="button"
                    onClick={() => handleFilterClick({ type: "mealType", value: meal.mealType })}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                      isItemActive
                        ? "bg-stone-100 text-stone-950 dark:bg-[#221e1b] dark:text-[#fafaf9] border border-stone-300/80 dark:border-[#382f28] font-bold shadow-2xs"
                        : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:bg-white/5 dark:hover:text-[#fafaf9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <svg
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isItemActive
                            ? "text-amber-500"
                            : "text-stone-400 dark:text-stone-500"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate text-left font-semibold">{meal.label}</span>
                    </div>
                    <span suppressHydrationWarning className={`text-xs font-bold shrink-0 ${isItemActive ? "rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] text-stone-800 dark:bg-[#2e2722] dark:text-[#d6d3d1]" : "text-stone-400 dark:text-stone-500"}`}>
                      {meal.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Categories */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2">
              Categories
            </p>
            <nav className="space-y-1">
              {visibleCategories.map((cat) => {
                const isCatActive = isSelected({ type: "category", value: cat.category });
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => handleFilterClick({ type: "category", value: cat.category })}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                      isCatActive
                        ? "bg-stone-100 text-stone-950 dark:bg-[#221e1b] dark:text-[#fafaf9] border border-stone-300/80 dark:border-[#382f28] font-bold shadow-2xs"
                        : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:bg-white/5 dark:hover:text-[#fafaf9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <svg
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isCatActive
                            ? "text-amber-500"
                            : "text-stone-400 dark:text-stone-500"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="truncate text-left font-semibold">{cat.label}</span>
                    </div>
                    <span suppressHydrationWarning className={`text-xs font-bold shrink-0 ${isCatActive ? "rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] text-stone-800 dark:bg-[#2e2722] dark:text-[#d6d3d1]" : "text-stone-400 dark:text-stone-500"}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {categoryCounts.length > 4 && (
              <button
                type="button"
                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                className="mt-2.5 flex w-full items-center justify-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline py-1 cursor-pointer"
              >
                <span>{isCategoriesExpanded ? "Show fewer categories" : `View all (${categoryCounts.length})`}</span>
                <span className="text-[10px]">{isCategoriesExpanded ? "▲" : "▼"}</span>
              </button>
            )}
          </div>

          {/* Trash */}
          {trashCount > 0 && (
            <div className="pt-2 border-t border-stone-100 dark:border-white/6">
              <button
                type="button"
                onClick={() => handleFilterClick({ type: "trash" })}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "trash" })
                    ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/40 font-bold shadow-xs"
                    : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-rose-500">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <span className="truncate text-left font-semibold">Trash</span>
                </div>
                <span suppressHydrationWarning className="text-xs font-bold shrink-0 text-stone-400 dark:text-stone-500">
                  {trashCount}
                </span>
              </button>
            </div>
          )}

        </div>
      </div>
    </aside>
  );
}
