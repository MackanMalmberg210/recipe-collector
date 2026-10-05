"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import RecipeCard from "../RecipeCard";
import RecipeShelf from "./RecipeShelf";
import type { AppRecipe, RecipeMatchResult, RecipeSortMode } from "../../lib/types";
import type { TasteVibe } from "./HomeHero";

type RecipeMatchesSectionProps = {
  filteredRecipes: RecipeMatchResult[];
  allRecipes?: (AppRecipe | RecipeMatchResult)[];
  sortMode: RecipeSortMode;
  onSortModeChange: (mode: RecipeSortMode) => void;
  activeVibe: TasteVibe;
  onVibeChange?: (vibe: TasteVibe) => void;
  searchTerm: string;
};

const DEFAULT_VISIBLE_MATCHES = 12;

const SORT_OPTIONS: { id: RecipeSortMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "alphabetical",
    label: "A – Z",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h6" />
      </svg>
    ),
  },
  {
    id: "cook-time",
    label: "Cook Time",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    id: "calories",
    label: "Calories",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    id: "highest-rated",
    label: "Rating",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

function getSectionHeading(
  searchTerm: string,
  activeVibe: TasteVibe,
  count: number,
) {
  if (searchTerm.trim()) {
    return {
      title: `Results for "${searchTerm.trim()}"`,
      subtitle: `Showing ${count} recipe${count === 1 ? "" : "s"} matching your search query.`,
    };
  }

  switch (activeVibe) {
    case "quick":
      return {
        title: `Quick & Easy Dinners (${count})`,
        subtitle: `Fast weeknight meals ready in 25 minutes or less.`,
      };
    case "protein":
      return {
        title: `High Protein Meals (${count})`,
        subtitle: `Protein-packed recipes with salmon, chicken, steak and eggs.`,
      };
    case "family":
      return {
        title: `Family Favorites (${count})`,
        subtitle: `Wholesome, crowd-pleasing meals everyone loves.`,
      };
    case "vegetarian":
      return {
        title: `Vegetarian & Green (${count})`,
        subtitle: `Fresh, vibrant meals loaded with vegetables, grains, and wholesome flavor.`,
      };
    case "budget":
      return {
        title: `Budget & Pantry Staples (${count})`,
        subtitle: `Delicious, wallet-friendly meals made with everyday staples.`,
      };
    case "all":
    default:
      return {
        title: `Explore Recipes (${count})`,
        subtitle: `Curated collections and hand-crafted recipes ready to cook tonight.`,
      };
  }
}

export default function RecipeMatchesSection({
  filteredRecipes,
  allRecipes,
  sortMode,
  onSortModeChange,
  activeVibe,
  onVibeChange,
  searchTerm,
}: RecipeMatchesSectionProps) {
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const sourceRecipes: RecipeMatchResult[] = useMemo(() => {
    if (!allRecipes) return filteredRecipes;
    return allRecipes.map((recipe) => {
      if ("totalIngredients" in recipe) return recipe as RecipeMatchResult;
      return {
        ...recipe,
        matchedIngredients: 0,
        totalIngredients: recipe.ingredients.length,
        matchesSearch: true,
      } as RecipeMatchResult;
    });
  }, [allRecipes, filteredRecipes]);

  // Curated Shelf collections
  const quickRecipes = useMemo(
    () => sourceRecipes.filter((r) => r.cookTime !== undefined && r.cookTime <= 25),
    [sourceRecipes],
  );

  const proteinRecipes = useMemo(() => {
    const keywords = ["chicken", "beef", "salmon", "egg", "tuna", "pork", "steak", "turkey", "shrimp"];
    return sourceRecipes.filter((r) =>
      r.ingredients.some((ing) => keywords.some((kw) => ing.toLowerCase().includes(kw))),
    );
  }, [sourceRecipes]);

  const plantRecipes = useMemo(() => {
    const meat = ["chicken", "beef", "pork", "bacon", "salmon", "shrimp", "steak", "tuna", "meat"];
    return sourceRecipes.filter(
      (r) => !r.ingredients.some((ing) => meat.some((m) => ing.toLowerCase().includes(m))),
    );
  }, [sourceRecipes]);

  const familyRecipes = useMemo(
    () =>
      sourceRecipes.filter(
        (r) => (r.servings ?? 0) >= 4 || r.category === "main-course" || r.category === "pasta",
      ),
    [sourceRecipes],
  );

  const isBrowsingAll = activeVibe === "all" && !searchTerm.trim();

  const visibleMatches = useMemo(() => {
    if (showAllMatches) return filteredRecipes;
    return filteredRecipes.slice(0, DEFAULT_VISIBLE_MATCHES);
  }, [filteredRecipes, showAllMatches]);

  const hasMoreMatches = filteredRecipes.length > DEFAULT_VISIBLE_MATCHES;

  const heading = getSectionHeading(
    searchTerm,
    activeVibe,
    filteredRecipes.length,
  );

  // Close custom sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSortOption = SORT_OPTIONS.find((o) => o.id === sortMode) || SORT_OPTIONS[0];

  // If in default browsing mode without a query, display Curated Editorial Shelves!
  if (isBrowsingAll) {
    return (
      <section id="recipe-matches" className="mb-16 space-y-12 sm:space-y-14">
        {/* SHELF 1: QUICK & EASY */}
        <RecipeShelf
          title="Quick Weeknight Dinners"
          subtitle="Fast, flavorful meals on the table in 25 minutes or less."
          recipes={quickRecipes}
          onSeeAll={onVibeChange ? () => onVibeChange("quick") : undefined}
        />

        {/* SHELF 2: HIGH PROTEIN */}
        <RecipeShelf
          title="High-Protein Power Meals"
          subtitle="Nutrient-dense fuel packed with steak, salmon, chicken, and eggs."
          recipes={proteinRecipes}
          onSeeAll={onVibeChange ? () => onVibeChange("protein") : undefined}
        />

        {/* SHELF 3: VEGETARIAN DINNERS */}
        <RecipeShelf
          title="Fresh Vegetarian Dinners"
          subtitle="Vibrant, nutrient-rich vegetarian recipes brimming with color and wholesome ingredients."
          recipes={plantRecipes}
          onSeeAll={onVibeChange ? () => onVibeChange("vegetarian") : undefined}
        />

        {/* SHELF 4: FAMILY FAVORITES */}
        <RecipeShelf
          title="Family Favorites & Comfort Food"
          subtitle="Hearty, crowd-pleasing meals that make everyone smile."
          recipes={familyRecipes}
          onSeeAll={onVibeChange ? () => onVibeChange("family") : undefined}
        />

        {/* ALL RECIPES GRID AT BOTTOM OF EXPLORE */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.08]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-100">
                All Featured Recipes ({filteredRecipes.length})
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-stone-400 font-normal">
                Browse our entire culinary catalog from top home chefs and editorial picks.
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div ref={sortRef} className="relative min-w-[200px]">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#151311] px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-stone-200 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 font-normal shrink-0 text-xs uppercase tracking-wider">Sort:</span>
                    <span className="font-semibold text-slate-900 dark:text-stone-100 flex items-center gap-2 truncate text-sm">
                      <span className="text-amber-500 shrink-0">{activeSortOption.icon}</span>
                      <span className="truncate">{activeSortOption.label}</span>
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${
                      isSortOpen ? "rotate-180 text-slate-700 dark:text-white" : "rotate-0 group-hover:text-slate-600 dark:group-hover:text-stone-200"
                    }`}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 left-0 top-[calc(100%+4px)] z-30 min-w-[200px] rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#1c1a17] p-1 shadow-xl">
                    <ul className="space-y-0.5">
                      {SORT_OPTIONS.map((option) => {
                        const isSelected = sortMode === option.id;
                        return (
                          <li key={option.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onSortModeChange(option.id);
                                setIsSortOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-slate-900 text-white dark:bg-white/10 dark:text-white font-semibold"
                                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 text-center shrink-0 text-sm flex items-center justify-center text-amber-500">
                                  {option.icon}
                                </span>
                                <span className="truncate">{option.label}</span>
                              </div>
                              {isSelected && (
                                <svg className="h-4 w-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleMatches.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                image={recipe.image}
                cookTime={recipe.cookTime}
                calories={recipe.calories}
                matchedIngredients={recipe.matchedIngredients}
                totalIngredients={recipe.totalIngredients}
                selectedIngredients={[]}
                origin={recipe.origin}
                ingredients={recipe.ingredients}
                priority={index < 8}
                isPublic={recipe.isPublic}
                authorName={recipe.authorName}
              />
            ))}
          </div>

          {hasMoreMatches && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllMatches(!showAllMatches)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 dark:border-white/[0.08] dark:bg-[#151311] dark:text-stone-200 dark:hover:border-white/20 dark:hover:text-white dark:hover:bg-[#1a1715] cursor-pointer"
              >
                <span>
                  {showAllMatches
                    ? "Show Less"
                    : `View All ${filteredRecipes.length} Recipes`}
                </span>
                <span>{showAllMatches ? "↑" : "↓"}</span>
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="recipe-matches" className="mb-16">
      {/* SECTION HEADER & CONTROLS */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 suppressHydrationWarning className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-100">
            {heading.title}
          </h2>
          <p suppressHydrationWarning className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-stone-400 font-normal">
            {heading.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* PROFESSIONAL CLEAN SORT DROPDOWN */}
          <div ref={sortRef} className="relative min-w-[220px]">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#151311] px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-stone-200 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-400 font-normal shrink-0 text-xs uppercase tracking-wider">Sort:</span>
                <span className="font-semibold text-slate-900 dark:text-stone-100 flex items-center gap-2 truncate text-sm">
                  <span className="text-amber-500 shrink-0">{activeSortOption.icon}</span>
                  <span className="truncate">{activeSortOption.label}</span>
                </span>
              </div>

              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${
                  isSortOpen ? "rotate-180 text-slate-700 dark:text-white" : "rotate-0 group-hover:text-slate-600 dark:group-hover:text-stone-200"
                }`}
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>

            {/* PROFESSIONAL DROPDOWN POPOVER (INSTANT MOUNT, PERFECT ALIGNMENT) */}
            {isSortOpen && (
              <div className="absolute right-0 left-0 top-[calc(100%+4px)] z-30 min-w-[220px] rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#1c1a17] p-1 shadow-xl">
                <ul className="space-y-0.5">
                  {SORT_OPTIONS.map((option) => {
                    const isSelected = sortMode === option.id;
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSortModeChange(option.id);
                            setIsSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white dark:bg-white/10 dark:text-white font-semibold"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 text-center shrink-0 text-sm flex items-center justify-center text-amber-500">
                              {option.icon}
                            </span>
                            <span className="truncate">{option.label}</span>
                          </div>

                          {isSelected && (
                            <svg className="h-4 w-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredRecipes.length === 0 ? (
        <div className="rounded-[28px] border border-slate-100 bg-white dark:border-white/[0.08] dark:bg-[#151311] p-12 text-center text-slate-500 dark:text-stone-400 shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100">
            No recipes found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-stone-400">
            Try searching for another dish or selecting a different vibe above.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleMatches.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                image={recipe.image}
                cookTime={recipe.cookTime}
                calories={recipe.calories}
                matchedIngredients={recipe.matchedIngredients}
                totalIngredients={recipe.totalIngredients}
                selectedIngredients={[]}
                origin={recipe.origin}
                ingredients={recipe.ingredients}
                priority={index < 12}
                isPublic={recipe.isPublic}
                authorName={recipe.authorName}
              />
            ))}
          </div>

          {/* LOAD MORE / VIEW ALL BUTTON */}
          {hasMoreMatches && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllMatches(!showAllMatches)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 dark:border-white/[0.08] dark:bg-[#151311] dark:text-stone-200 dark:hover:border-white/20 dark:hover:text-white dark:hover:bg-[#1a1715] cursor-pointer"
              >
                <span>
                  {showAllMatches
                    ? "Show Less"
                    : `View All ${filteredRecipes.length} Recipes`}
                </span>
                <span>{showAllMatches ? "↑" : "↓"}</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
