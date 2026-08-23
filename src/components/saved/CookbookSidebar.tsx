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
  icon: string;
};

type MealTypeCount = {
  mealType: MealType;
  label: string;
  count: number;
  icon: string;
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
    <aside className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">
      
      {/* MOBILE / TABLET HORIZONTAL QUICK BAR (lg:hidden) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none overscroll-contain">
        <button
          type="button"
          onClick={() => handleFilterClick({ type: "all" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "all" })
              ? "bg-amber-500 text-stone-950 shadow-xs font-black"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <span className="w-4 text-center shrink-0">📚</span>
          <span>All</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick({ type: "my_recipes" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "my_recipes" })
              ? "bg-amber-500 text-stone-950 shadow-xs font-black"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <span className="w-4 text-center shrink-0">🍳</span>
          <span>My Recipes</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{myRecipesCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick({ type: "favorites" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "favorites" })
              ? "bg-amber-500 text-stone-950 shadow-xs font-black"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <span className="w-4 text-center shrink-0">⭐</span>
          <span>Favorites</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{favoritesCount}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick({ type: "quick" })}
          className={`shrink-0 flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            isSelected({ type: "quick" })
              ? "bg-amber-500 text-stone-950 shadow-xs font-black"
              : "bg-white text-stone-700 border border-stone-200/90 dark:bg-[#181412] dark:border-white/10 dark:text-stone-300"
          }`}
        >
          <span className="w-4 text-center shrink-0">⚡</span>
          <span>Quick</span>
          <span suppressHydrationWarning className="rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px]">{quickCount}</span>
        </button>
      </div>

      {/* DESKTOP SIDEBAR CONTAINER */}
      <div className="hidden lg:block relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        
        {/* Sidebar Header & Action Button */}
        <div className="mb-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 text-center shrink-0 text-lg">📖</span>
              <h2 className="text-sm font-bold tracking-tight text-stone-950 dark:text-stone-50">
                My Cookbook
              </h2>
            </div>
            <span suppressHydrationWarning className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-extrabold text-stone-600 dark:bg-white/8 dark:text-stone-300">
              {totalCount}
            </span>
          </div>

          {/* Elevated Sleek Action Button */}
          {onOpenAddRecipeModal && (
            <button
              type="button"
              onClick={onOpenAddRecipeModal}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 py-3 px-4 text-xs font-bold text-stone-950 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <span className="text-sm font-black transition-transform duration-200 group-hover:scale-110">+</span>
              <span>Add Recipe</span>
            </button>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-stone-100 dark:bg-white/6 my-4" />

        {/* NAVIGATION GROUPS (All with razor-sharp fixed-width icon column alignment) */}
        <div className="space-y-5">
          
          {/* Main Collections */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2.5">
              Collections
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => handleFilterClick({ type: "all" })}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "all" })
                    ? "bg-amber-500 text-stone-950 font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-950"
                    : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center shrink-0 text-base">📚</span>
                  <span className="truncate text-left">All Recipes</span>
                </div>
                <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "all" }) ? "text-stone-950" : "text-stone-400 dark:text-stone-500"}`}>
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick({ type: "my_recipes" })}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "my_recipes" })
                    ? "bg-amber-500 text-stone-950 font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-950"
                    : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center shrink-0 text-base">🍳</span>
                  <span className="truncate text-left">My Recipes</span>
                </div>
                <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "my_recipes" }) ? "text-stone-950" : "text-stone-400 dark:text-stone-500"}`}>
                  {myRecipesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick({ type: "favorites" })}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "favorites" })
                    ? "bg-amber-500 text-stone-950 font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-950"
                    : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center shrink-0 text-base">⭐</span>
                  <span className="truncate text-left">Favorites</span>
                </div>
                <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "favorites" }) ? "text-stone-950" : "text-stone-400 dark:text-stone-500"}`}>
                  {favoritesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick({ type: "quick" })}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isSelected({ type: "quick" })
                    ? "bg-amber-500 text-stone-950 font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-950"
                    : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center shrink-0 text-base">⚡</span>
                  <span className="truncate text-left">Quick (&lt;25 min)</span>
                </div>
                <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "quick" }) ? "text-stone-950" : "text-stone-400 dark:text-stone-500"}`}>
                  {quickCount}
                </span>
              </button>
            </nav>
          </div>

          {/* Meal Types */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2.5">
              Meal Types
            </p>
            <nav className="space-y-1">
              {mealTypeCounts.map(({ mealType, label, count, icon }) => (
                <button
                  key={mealType}
                  type="button"
                  onClick={() => handleFilterClick({ type: "mealType", value: mealType })}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    isSelected({ type: "mealType", value: mealType })
                      ? "bg-amber-500 text-stone-950 font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-950"
                      : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-5 text-center shrink-0 text-base">{icon}</span>
                    <span className="truncate text-left">{label}</span>
                  </div>
                  <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "mealType", value: mealType }) ? "text-stone-950" : "text-stone-400 dark:text-stone-500"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Categories with Satisfying Animated Expand */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2.5">
              Categories
            </p>
            <nav className="space-y-1">
              {visibleCategories.map(({ category, label, count, icon }, idx) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleFilterClick({ type: "category", value: category })}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    idx >= 4 ? "animate-in fade-in slide-in-from-top-1 duration-200" : ""
                  } ${
                    isSelected({ type: "category", value: category })
                      ? "bg-amber-500 text-stone-950 font-bold shadow-2xs dark:bg-amber-500 dark:text-stone-950"
                      : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-5 text-center shrink-0 text-base">{icon}</span>
                    <span className="truncate text-left">{label}</span>
                  </div>
                  <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "category", value: category }) ? "text-stone-950" : "text-stone-400 dark:text-stone-500"}`}>
                    {count}
                  </span>
                </button>
              ))}

              {categoryCounts.length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/8 hover:bg-amber-500/15 dark:bg-amber-400/8 dark:hover:bg-amber-400/15 transition-all duration-200 active:scale-95 cursor-pointer mt-2"
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${isCategoriesExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{isCategoriesExpanded ? "Show Less" : `Show ${categoryCounts.length - 4} More Categories`}</span>
                </button>
              )}
            </nav>
          </div>

          {/* Trash */}
          <div className="pt-2 border-t border-stone-100 dark:border-white/6">
            <button
              type="button"
              onClick={() => handleFilterClick({ type: "trash" })}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                isSelected({ type: "trash" })
                  ? "bg-rose-500 text-white font-bold shadow-2xs"
                  : "text-stone-500 hover:bg-rose-50 hover:text-rose-700 dark:text-stone-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-5 text-center shrink-0 text-base">🗑️</span>
                <span className="truncate text-left">Trash Bin</span>
              </div>
              {trashCount > 0 && (
                <span suppressHydrationWarning className={`text-[11px] font-bold shrink-0 ${isSelected({ type: "trash" }) ? "text-white" : "text-rose-500"}`}>
                  {trashCount}
                </span>
              )}
            </button>
          </div>

        </div>

      </div>
    </aside>
  );
}
