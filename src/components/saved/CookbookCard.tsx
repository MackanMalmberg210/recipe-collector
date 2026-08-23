"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";
import { getRecipeRating, type RecipeRating } from "../../lib/ratings";
import StarRating from "../StarRating";

type CookbookCardProps = {
  recipe: AppRecipe;
  isSaved: boolean;
  onRemoveSaved: (id: number) => void;
  onDeleteRecipe: (id: number) => void;
  onAddToGrocery: (recipe: AppRecipe) => number;
};

function getSourceLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "Created";
  if (recipe.origin === "imported") return "Imported";
  return "Library";
}

function getRecipeTags(recipe: AppRecipe) {
  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];

  return [
    ...(recipe.category
      ? [capitalize(recipe.category.replace(/-/g, " "))]
      : []),
    ...(recipe.mealType ? [capitalize(recipe.mealType)] : []),
    ...tags.map((tag) => capitalize(tag.replace(/-/g, " "))),
  ].slice(0, 4);
}

export default function CookbookCard({
  recipe,
  isSaved,
  onRemoveSaved,
  onDeleteRecipe,
  onAddToGrocery,
}: CookbookCardProps) {
  const tags = getRecipeTags(recipe);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const [groceryMessage, setGroceryMessage] = useState<string | null>(null);
  const [rating, setRating] = useState<RecipeRating | null>(null);

  useEffect(() => {
    setRating(getRecipeRating(recipe.id));
  }, [recipe.id]);

  useEffect(() => {
    const refreshRating = () => setRating(getRecipeRating(recipe.id));

    window.addEventListener("focus", refreshRating);
    window.addEventListener("storage", refreshRating);

    return () => {
      window.removeEventListener("focus", refreshRating);
      window.removeEventListener("storage", refreshRating);
    };
  }, [recipe.id]);

  const instructions = recipe.instructions ?? [];

  const visibleIngredients = showAllIngredients
    ? recipe.ingredients
    : recipe.ingredients.slice(0, 5);

  const visibleInstructions = showAllInstructions
    ? instructions
    : instructions.slice(0, 2);

  const hiddenIngredientsCount =
    recipe.ingredients.length - visibleIngredients.length;
  const hiddenInstructionsCount =
    instructions.length - visibleInstructions.length;

  const handleAddToGroceryClick = () => {
    const addedCount = onAddToGrocery(recipe);

    if (addedCount === 0) {
      setGroceryMessage("All ingredients are already in your grocery list.");
    } else {
      setGroceryMessage(
        `Added ${addedCount} ingredient${addedCount === 1 ? "" : "s"} to grocery.`,
      );
    }

    window.setTimeout(() => {
      setGroceryMessage(null);
    }, 3000);
  };

  return (
    <article className="group overflow-hidden rounded-4xl border border-stone-200/80 bg-white shadow-xl transition duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-2xl dark:border-white/10 dark:bg-[#17120f]/95 dark:hover:bg-[#1d1713]">
      <div className="grid min-h-full lg:grid-cols-[320px_minmax(0,1fr)]">
        <Link
          href={`/recipes/${recipe.id}`}
          className="relative block min-h-72 overflow-hidden bg-stone-100 dark:bg-[#231b15] lg:min-h-full"
        >
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full min-h-72 w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center bg-stone-100 text-sm text-stone-400 dark:bg-[#211915]">
              No image available
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              {getSourceLabel(recipe)}
            </span>

            {isSaved && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500 px-3 py-1 text-xs font-black text-stone-950 shadow-md backdrop-blur-md">
                <span>⭐</span>
                <span>Favorite</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {recipe.cookTime && (
              <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                ⏱ {recipe.cookTime} min
              </span>
            )}

            {recipe.calories !== undefined && (
              <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                🔥 {recipe.calories} kcal
              </span>
            )}

            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              🥕 {recipe.ingredients.length} items
            </span>
          </div>
        </Link>

        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <Link href={`/recipes/${recipe.id}`}>
              <h3 className="text-2xl font-bold tracking-tight text-stone-900 transition hover:text-amber-600 dark:text-[#fff8ef] dark:hover:text-amber-300 md:text-3xl">
                {recipe.title}
              </h3>
            </Link>

            {rating !== null && (
              <div className="mt-3">
                <StarRating value={rating} readOnly size="sm" />
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={`${recipe.id}-tag-${index}`}
                  className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:border-amber-100/10 dark:bg-amber-100/6 dark:text-amber-50/80"
                >
                  {tag}
                </span>
              ))}

              {recipe.servings !== undefined && (
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-white/10 dark:bg-white/4 dark:text-stone-300">
                  👥 {recipe.servings} servings
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-[#211915]/80">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Ingredients
                </h4>

                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                  {recipe.ingredients.length} items
                </span>
              </div>

              <ul className="flex flex-wrap gap-2">
                {visibleIngredients.map((ingredient, index) => (
                  <li
                    key={`${recipe.id}-ingredient-${index}`}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-800 shadow-sm dark:border-white/10 dark:bg-[#2a211b] dark:text-stone-100"
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>

              {recipe.ingredients.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllIngredients((prev) => !prev)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-100 dark:border-amber-100/15 dark:bg-amber-100/6 dark:text-amber-50 cursor-pointer"
                >
                  {showAllIngredients
                    ? "Show fewer ingredients"
                    : `Show ${hiddenIngredientsCount} more ingredients`}
                </button>
              )}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-[#211915]/80">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Instructions
                </h4>

                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                  {instructions.length} steps
                </span>
              </div>

              <ol className="space-y-2">
                {visibleInstructions.map((step, index) => (
                  <li
                    key={`${recipe.id}-instruction-${index}`}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs sm:text-sm leading-relaxed text-stone-800 dark:border-white/10 dark:bg-[#2a211b] dark:text-stone-100"
                  >
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Step {index + 1}
                    </span>
                    <span className={showAllInstructions ? "" : "line-clamp-2"}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              {instructions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllInstructions((prev) => !prev)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-stone-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-100 dark:border-amber-100/15 dark:bg-amber-100/6 dark:text-amber-50 cursor-pointer"
                >
                  {showAllInstructions
                    ? "Show fewer steps"
                    : `Show ${hiddenInstructionsCount} more step${
                        hiddenInstructionsCount === 1 ? "" : "s"
                      }`}
                </button>
              )}
            </section>
          </div>

          {recipe.sourceUrl && (
            <p className="truncate rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500 dark:border-white/10 dark:bg-white/3 dark:text-stone-400">
              Source: {recipe.sourceUrl}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-3 border-t border-stone-200 pt-5 dark:border-white/10">
            <Link
              href={`/recipes/${recipe.id}`}
              className="rounded-2xl bg-stone-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-stone-50 shadow-md transition hover:bg-stone-800 dark:bg-[#fff4e2] dark:text-[#19120e] dark:hover:bg-white"
            >
              View recipe
            </Link>

            <button
              type="button"
              onClick={handleAddToGroceryClick}
              className="rounded-2xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-800 transition hover:bg-stone-200 dark:border-amber-100/15 dark:bg-amber-100/6 dark:text-amber-50 cursor-pointer"
            >
              + Add to grocery
            </button>

            {isSaved && (
              <button
                type="button"
                onClick={() => onRemoveSaved(recipe.id)}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/4 dark:text-stone-200 cursor-pointer"
              >
                Remove from saved
              </button>
            )}

            {(recipe.origin === "user" || recipe.origin === "imported") && (
              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe.id)}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-red-300/15 dark:bg-red-400/10 dark:text-red-100 cursor-pointer"
              >
                Delete recipe
              </button>
            )}
          </div>
          {groceryMessage && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:border-emerald-200/15 dark:bg-emerald-300/10 dark:text-emerald-100">
              {groceryMessage}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
