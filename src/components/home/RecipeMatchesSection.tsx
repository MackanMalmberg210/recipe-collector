"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RecipeCard from "../RecipeCard";
import GroceryListPreview from "../GroceryListPreview";
import type { RecipeMatchResult, RecipeSortMode } from "../../lib/types";

type GroceryItem = {
  name: string;
  bought: boolean;
};

type RecipeMatchesSectionProps = {
  filteredRecipes: RecipeMatchResult[];
  selectedIngredients: string[];
  hideZeroMatches: boolean;
  onHideZeroMatchesChange: (checked: boolean) => void;
  sortMode: RecipeSortMode;
  onSortModeChange: (mode: RecipeSortMode) => void;
  groceryList: GroceryItem[];
  onToggleBought: (name: string) => void;
  onRemoveGroceryItem: (name: string) => void;
  onClearGroceryList: () => void;
};

const DEFAULT_VISIBLE_MATCHES = 6;

export default function RecipeMatchesSection({
  filteredRecipes,
  selectedIngredients,
  hideZeroMatches,
  onHideZeroMatchesChange,
  sortMode,
  onSortModeChange,
  groceryList,
  onToggleBought,
  onRemoveGroceryItem,
  onClearGroceryList,
}: RecipeMatchesSectionProps) {
  const [showAllMatches, setShowAllMatches] = useState(false);

  const featuredRecipe =
    filteredRecipes.length > 0 && selectedIngredients.length > 0
      ? filteredRecipes[0]
      : null;

  const allMatches = featuredRecipe
    ? filteredRecipes.slice(1)
    : filteredRecipes;

  const hasMoreMatches = allMatches.length > DEFAULT_VISIBLE_MATCHES;

  const visibleMatches = useMemo(() => {
    if (showAllMatches) return allMatches;
    return allMatches.slice(0, DEFAULT_VISIBLE_MATCHES);
  }, [allMatches, showAllMatches]);

  return (
    <section
      id="recipe-matches"
      className="mb-12 scroll-mt-28 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="min-w-0">
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Recommendations
            </p>
            <h2 className="text-3xl font-semibold text-stone-50">
              Recipe matches
            </h2>
            <p className="mt-3 max-w-2xl text-stone-400">
              Discover recipes based on what you already have at home and focus
              on the strongest options first.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/8 bg-stone-900/80 px-4 py-3 backdrop-blur-sm">
              <label className="flex items-center gap-2 text-sm text-stone-300">
                <input
                  type="checkbox"
                  checked={hideZeroMatches}
                  onChange={(e) => onHideZeroMatchesChange(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Hide recipes with no ingredient matches
              </label>
            </div>

            <div className="rounded-2xl border border-white/8 bg-stone-900/80 px-4 py-3 backdrop-blur-sm">
              <label className="flex items-center gap-3 text-sm text-stone-300">
                <span className="whitespace-nowrap text-stone-400">
                  Sort by
                </span>
                <select
                  value={sortMode}
                  onChange={(e) =>
                    onSortModeChange(e.target.value as RecipeSortMode)
                  }
                  className="rounded-xl border border-stone-700 bg-[#151311] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="best-match">Best match</option>
                  <option value="cook-time">Shortest cook time</option>
                  <option value="calories">Lowest calories</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {featuredRecipe && (
          <section className="mb-6 overflow-hidden rounded-4xl border border-white/8 bg-[linear-gradient(135deg,#171411_0%,#12100d_100%)] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Featured match
                  </span>

                  {featuredRecipe.origin === "imported" && (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Imported
                    </span>
                  )}

                  {featuredRecipe.origin === "user" && (
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-stone-200">
                      Your recipe
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  {featuredRecipe.title}
                </h3>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-400">
                  {featuredRecipe.cookTime !== undefined && (
                    <span>⏱ {featuredRecipe.cookTime} min</span>
                  )}
                  {featuredRecipe.calories !== undefined && (
                    <span>🔥 {featuredRecipe.calories} kcal</span>
                  )}
                  <span>
                    🥕 {featuredRecipe.matchedIngredients} /{" "}
                    {featuredRecipe.totalIngredients} ingredients matched
                  </span>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-400">
                  This is currently your strongest match based on the
                  ingredients you’ve added to your pantry.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/recipes/${featuredRecipe.id}${
                      selectedIngredients.length
                        ? `?ingredients=${selectedIngredients.join(",")}`
                        : ""
                    }`}
                    className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-emerald-400"
                  >
                    Open featured recipe
                  </Link>

                  {allMatches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById("all-matches-grid")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                    >
                      Jump to matches
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/8 bg-[#151311]">
                <img
                  src={featuredRecipe.image}
                  alt={featuredRecipe.title}
                  className="h-60 w-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-stone-50">
              {featuredRecipe ? "More matches" : "All matches"}
            </h3>
            <p className="mt-1 text-sm text-stone-400">
              {filteredRecipes.length} result
              {filteredRecipes.length !== 1 ? "s" : ""}
              {sortMode === "best-match" &&
                selectedIngredients.length > 0 &&
                " sorted by best match"}
              {sortMode === "cook-time" && " sorted by shortest cook time"}
              {sortMode === "calories" && " sorted by lowest calories"}
              {sortMode === "alphabetical" && " sorted alphabetically"}
            </p>
          </div>

          {hasMoreMatches && (
            <button
              type="button"
              onClick={() => setShowAllMatches((prev) => !prev)}
              className="w-fit rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
            >
              {showAllMatches
                ? "Show fewer matches"
                : `Show all ${allMatches.length} matches`}
            </button>
          )}
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
            <p className="text-stone-400">
              No recipes found. Try another search or remove some filters.
            </p>
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
            <p className="text-stone-400">
              You only have one featured recipe match right now.
            </p>
          </div>
        ) : (
          <div
            id="all-matches-grid"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3"
          >
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
                selectedIngredients={selectedIngredients}
                isBestMatch={false}
                origin={recipe.origin}
                ingredients={recipe.ingredients}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="xl:sticky xl:top-8 xl:self-start">
        <GroceryListPreview
          items={groceryList}
          onToggleBought={onToggleBought}
          onRemove={onRemoveGroceryItem}
          onClear={onClearGroceryList}
        />
      </aside>
    </section>
  );
}
