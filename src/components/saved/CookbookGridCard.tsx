"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";
import { getRecipeRating, type RecipeRating } from "../../lib/ratings";

type CookbookGridCardProps = {
  recipe: AppRecipe;
  isSaved: boolean;
  isTrashMode?: boolean;
  onRemoveSaved: (id: number) => void;
  onToggleSave?: (id: number) => void;
  onDeleteRecipe: (recipe: AppRecipe) => void;
  onRestoreRecipe?: (id: number) => void;
  onAddToGrocery: (recipe: AppRecipe) => void;
  onQuickPeek?: (recipe: AppRecipe) => void;
};

function getSourceLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "My Creation";
  if (recipe.origin === "imported") return "Imported";
  return null;
}

export default function CookbookGridCard({
  recipe,
  isSaved,
  isTrashMode = false,
  onToggleSave,
  onDeleteRecipe,
  onRestoreRecipe,
  onAddToGrocery,
}: CookbookGridCardProps) {
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

  const sourceLabel = getSourceLabel(recipe);

  const formattedCategory = recipe.category
    ? capitalize(recipe.category.replace(/-/g, " "))
    : null;

  return (
    <article
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0 400px",
        contain: "paint",
      }}
      className="group/card relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-amber-400/30"
    >
      
      {/* 🖼️ MEDIA HEADER */}
      <div className="group/media relative h-52 w-full overflow-hidden bg-stone-100 dark:bg-stone-950">
        <Link href={isTrashMode ? "#" : `/recipes/${recipe.id}`} className="block h-full w-full">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full w-full object-cover block transition-opacity duration-200 group-hover/media:opacity-95"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-stone-400 dark:text-stone-500">
              <span className="text-3xl">🍲</span>
              <span className="mt-1 text-xs font-semibold">No photo</span>
            </div>
          )}

          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </Link>

        {/* TOP BADGES */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {sourceLabel ? (
            <span className="rounded-full bg-black/75 border border-white/20 px-2.5 py-0.5 text-[10px] font-bold text-stone-100 shadow-sm">
              {sourceLabel}
            </span>
          ) : (
            <div />
          )}

          {/* Favorite Star (Quick Toggle) */}
          {!isTrashMode && onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(recipe.id);
              }}
              title={isSaved ? "Remove from favorites" : "Save to favorites"}
              aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
              className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/75 border border-white/10 text-white transition hover:scale-110 hover:bg-black/90 active:scale-95 cursor-pointer shadow-md"
            >
              {isSaved ? (
                <svg className="h-4.5 w-4.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ) : (
                <svg className="h-4.5 w-4.5 text-white/80 hover:text-amber-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* BOTTOM IMAGE STATS BAR */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white/90 pointer-events-none">
          <div className="flex items-center gap-2">
            {recipe.cookTime && (
              <span className="rounded-md bg-black/75 px-2 py-0.5">
                ⏱ {recipe.cookTime} min
              </span>
            )}
            {recipe.calories && (
              <span className="rounded-md bg-black/75 px-2 py-0.5">
                🔥 {recipe.calories} kcal
              </span>
            )}
          </div>

          {Boolean(rating && rating > 0) && (
            <div className="flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-amber-300">
              <span>★</span>
              <span className="font-bold">{rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* 📝 CARD BODY */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="line-clamp-2 text-base sm:text-lg font-bold tracking-tight text-stone-950 dark:text-stone-100 group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors">
            <Link href={isTrashMode ? "#" : `/recipes/${recipe.id}`}>
              {recipe.title}
            </Link>
          </h3>

          {/* Tags / Categories */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {formattedCategory && (
              <span className="rounded-full bg-stone-100 dark:bg-white/8 px-2.5 py-0.5 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                {formattedCategory}
              </span>
            )}

            {recipe.mealType && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold capitalize text-amber-800 dark:text-amber-300">
                {recipe.mealType}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-stone-100 pt-3.5 dark:border-white/6">
          {isTrashMode ? (
            <>
              {onRestoreRecipe && (
                <button
                  type="button"
                  onClick={() => onRestoreRecipe(recipe.id)}
                  className="flex-1 flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <span>↩ Restore</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe)}
                className="flex h-9.5 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer whitespace-nowrap"
                title="Permanently delete"
              >
                <span>Delete Forever</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary Action: View Recipe (Brand Amber Gradient) */}
              <Link
                href={`/recipes/${recipe.id}`}
                className="flex-1 flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-3.5 text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-[0.98] whitespace-nowrap"
              >
                <span>View recipe</span>
                <span className="text-sm font-black">→</span>
              </Link>

              {/* Large, Clear Grocery Button: Shopping Cart + Plus SVG */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToGrocery(recipe);
                }}
                className="flex h-9.5 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25 cursor-pointer shrink-0 active:scale-[0.98]"
                title="Add ingredients to grocery list"
                aria-label="Add ingredients to grocery list"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-black">+</span>
              </button>

              {/* Trash Trigger */}
              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe)}
                className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
                title="Move to Trash"
                aria-label="Move to Trash"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
