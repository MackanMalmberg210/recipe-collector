"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";

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
    <article className="group overflow-hidden rounded-4xl border border-white/10 bg-[#17120f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)] ring-1 ring-white/3 transition duration-300 hover:-translate-y-1 hover:border-amber-200/20 hover:bg-[#1d1713] hover:shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
      <div className="grid min-h-full lg:grid-cols-[320px_minmax(0,1fr)]">
        <Link
          href={`/recipes/${recipe.id}`}
          className="relative block min-h-72 overflow-hidden bg-[#231b15] lg:min-h-full"
        >
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full min-h-72 w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center bg-[#211915] text-sm text-stone-500">
              No image available
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
              {getSourceLabel(recipe)}
            </span>

            {isSaved && (
              <span className="rounded-full border border-emerald-200/20 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100 shadow-sm backdrop-blur-md">
                Saved
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {recipe.cookTime && (
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-stone-100 backdrop-blur-md">
                ⏱ {recipe.cookTime} min
              </span>
            )}

            {recipe.calories !== undefined && (
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-stone-100 backdrop-blur-md">
                🔥 {recipe.calories} kcal
              </span>
            )}

            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-stone-100 backdrop-blur-md">
              🥕 {recipe.ingredients.length}
            </span>
          </div>
        </Link>

        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <Link href={`/recipes/${recipe.id}`}>
              <h3 className="text-2xl font-semibold tracking-tight text-[#fff8ef] transition hover:text-amber-100 md:text-3xl">
                {recipe.title}
              </h3>
            </Link>

            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={`${recipe.id}-tag-${index}`}
                  className="rounded-full border border-amber-100/10 bg-amber-100/6 px-3 py-1 text-xs font-medium text-amber-50/80"
                >
                  {tag}
                </span>
              ))}

              {recipe.servings !== undefined && (
                <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-medium text-stone-300">
                  👥 {recipe.servings} servings
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-[#211915]/80 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100/55">
                  Ingredients
                </h4>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                  {recipe.ingredients.length} items
                </span>
              </div>

              <ul className="flex flex-wrap gap-2">
                {visibleIngredients.map((ingredient, index) => (
                  <li
                    key={`${recipe.id}-ingredient-${index}`}
                    className="rounded-full border border-white/10 bg-[#2a211b] px-3 py-1.5 text-sm text-stone-100 shadow-sm"
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>

              {recipe.ingredients.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllIngredients((prev) => !prev)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-amber-100/15 bg-amber-100/6 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-100/10"
                >
                  {showAllIngredients
                    ? "Show fewer ingredients"
                    : `Show ${hiddenIngredientsCount} more ingredients`}
                </button>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#211915]/80 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100/55">
                  Instructions
                </h4>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                  {instructions.length} steps
                </span>
              </div>

              <ol className="space-y-2">
                {visibleInstructions.map((step, index) => (
                  <li
                    key={`${recipe.id}-instruction-${index}`}
                    className="rounded-2xl border border-white/10 bg-[#2a211b] px-4 py-3 text-sm leading-6 text-stone-100"
                  >
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-amber-300/80">
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
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-amber-100/15 bg-amber-100/6 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-100/10"
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
            <p className="truncate rounded-2xl border border-white/10 bg-white/3 px-3 py-2 text-xs text-stone-400">
              {recipe.sourceUrl}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-3 border-t border-white/10 pt-5">
            <Link
              href={`/recipes/${recipe.id}`}
              className="rounded-2xl bg-[#fff4e2] px-4 py-2.5 text-sm font-bold text-[#19120e] shadow-sm transition hover:bg-white"
            >
              View recipe
            </Link>

            <button
              type="button"
              onClick={handleAddToGroceryClick}
              className="rounded-2xl border border-amber-100/15 bg-amber-100/6 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-100/10 cursor-pointer"
            >
              Add to grocery
            </button>

            {isSaved && (
              <button
                type="button"
                onClick={() => onRemoveSaved(recipe.id)}
                className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-stone-200 transition hover:bg-white/8 cursor-pointer"
              >
                Delete recipe
              </button>
            )}

            {(recipe.origin === "user" || recipe.origin === "imported") && (
              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe.id)}
                className="rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-400/15 cursor-pointer"
              >
                Delete recipe
              </button>
            )}
          </div>
          {groceryMessage && (
            <div className="rounded-2xl border border-emerald-200/15 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
              {groceryMessage}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
