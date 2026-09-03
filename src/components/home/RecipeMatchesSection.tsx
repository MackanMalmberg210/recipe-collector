"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import RecipeCard from "../RecipeCard";
import type { RecipeMatchResult, RecipeSortMode } from "../../lib/types";
import type { TasteVibe } from "./HomeHero";

type RecipeMatchesSectionProps = {
  filteredRecipes: RecipeMatchResult[];
  sortMode: RecipeSortMode;
  onSortModeChange: (mode: RecipeSortMode) => void;
  activeVibe: TasteVibe;
  searchTerm: string;
};

const DEFAULT_VISIBLE_MATCHES = 12;

const SORT_OPTIONS: { id: RecipeSortMode; label: string; icon: string }[] = [
  { id: "alphabetical", label: "A – Z", icon: "🔤" },
  { id: "cook-time", label: "Cook Time", icon: "⏱" },
  { id: "calories", label: "Calories", icon: "🔥" },
  { id: "highest-rated", label: "Rating", icon: "⭐" },
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
        title: `⚡ Quick & Easy Dinners (${count})`,
        subtitle: `Fast weeknight meals ready in 25 minutes or less.`,
      };
    case "protein":
      return {
        title: `🥩 High Protein Meals (${count})`,
        subtitle: `Protein-packed recipes with salmon, chicken, steak and eggs.`,
      };
    case "family":
      return {
        title: `👨‍👩‍👧 Family Favorites (${count})`,
        subtitle: `Wholesome, crowd-pleasing meals everyone loves.`,
      };
    case "vegetarian":
      return {
        title: `🥗 Plant-Forward & Vegetarian (${count})`,
        subtitle: `Fresh, vibrant meals loaded with vegetables, grains and legumes.`,
      };
    case "budget":
      return {
        title: `💰 Budget & Pantry Staples (${count})`,
        subtitle: `Delicious, wallet-friendly meals made with everyday staples.`,
      };
    case "all":
    default:
      return {
        title: `Featured Recipes (${count})`,
        subtitle: `Discover chef-crafted meals ready to cook tonight.`,
      };
  }
}

export default function RecipeMatchesSection({
  filteredRecipes,
  sortMode,
  onSortModeChange,
  activeVibe,
  searchTerm,
}: RecipeMatchesSectionProps) {
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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

  return (
    <section id="recipe-matches" className="mb-16">
      {/* SECTION HEADER & CONTROLS */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 suppressHydrationWarning className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#fff8ef]">
            {heading.title}
          </h2>
          <p suppressHydrationWarning className="mt-1 text-xs sm:text-sm text-stone-400">
            {heading.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* PROFESSIONAL CLEAN SORT DROPDOWN */}
          <div ref={sortRef} className="relative min-w-[220px]">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#171310] px-3.5 py-2 text-sm font-medium text-stone-200 shadow-xs hover:border-amber-400/40 hover:text-white transition cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-stone-400 font-normal shrink-0 text-xs uppercase tracking-wider">Sort:</span>
                <span className="font-semibold text-stone-100 flex items-center gap-2 truncate text-sm">
                  <span>{activeSortOption.icon}</span>
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
                className={`h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform duration-150 ${
                  isSortOpen ? "rotate-180 text-amber-400" : "rotate-0 group-hover:text-stone-200"
                }`}
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>

            {/* PROFESSIONAL DROPDOWN POPOVER (INSTANT MOUNT, PERFECT ALIGNMENT) */}
            {isSortOpen && (
              <div className="absolute right-0 left-0 top-[calc(100%+4px)] z-30 min-w-[220px] rounded-xl border border-white/12 bg-[#1c1612] p-1 shadow-xl">
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
                              ? "bg-white/10 text-white font-semibold"
                              : "text-stone-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 text-center shrink-0 text-sm">
                              {option.icon}
                            </span>
                            <span className="truncate">{option.label}</span>
                          </div>

                          {isSelected && (
                            <svg className="h-4 w-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
        <div className="rounded-3xl border border-white/8 bg-[#16120f] p-12 text-center text-stone-400 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-2xl">
            🥣
          </div>
          <h3 className="text-lg font-bold text-stone-100">
            No recipes found
          </h3>
          <p className="mt-1 text-sm text-stone-500">
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
              />
            ))}
          </div>

          {/* LOAD MORE / VIEW ALL BUTTON */}
          {hasMoreMatches && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllMatches(!showAllMatches)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#16120f] px-8 py-3 text-sm font-bold text-stone-100 shadow-sm transition hover:border-amber-400 hover:text-amber-300 cursor-pointer"
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
