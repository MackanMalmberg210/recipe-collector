"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize, cleanIngredientName } from "../../lib/format";
import { getRecipeRating, type RecipeRating } from "../../lib/ratings";

type CookbookListRowProps = {
  recipe: AppRecipe;
  isSaved: boolean;
  isTrashMode?: boolean;
  isHoverActive?: boolean;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onRemoveSaved: (id: number) => void;
  onToggleSave?: (id: number) => void;
  onDeleteRecipe: (recipe: AppRecipe) => void;
  onRestoreRecipe?: (id: number) => void;
  onAddToGrocery: (recipe: AppRecipe) => void;
  onQuickPeek?: (recipe: AppRecipe) => void;
};

export default function CookbookListRow({
  recipe,
  isSaved,
  isTrashMode = false,
  onToggleSave,
  onDeleteRecipe,
  onRestoreRecipe,
  onAddToGrocery,
}: CookbookListRowProps) {
  const [prevRecipeId, setPrevRecipeId] = useState(recipe.id);
  const [rating, setRating] = useState<RecipeRating | null>(() => getRecipeRating(recipe.id));

  if (prevRecipeId !== recipe.id) {
    setPrevRecipeId(recipe.id);
    setRating(getRecipeRating(recipe.id));
  }

  useEffect(() => {
    const refreshRating = () => setRating(getRecipeRating(recipe.id));
    window.addEventListener("focus", refreshRating);
    window.addEventListener("storage", refreshRating);
    return () => {
      window.removeEventListener("focus", refreshRating);
      window.removeEventListener("storage", refreshRating);
    };
  }, [recipe.id]);

  const formattedCategory = recipe.category
    ? capitalize(recipe.category.replace(/-/g, " "))
    : null;

  return (
    <article
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0 120px",
        contain: "paint",
      }}
      className="group/row relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-[28px] border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-colors duration-150 hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-[#151210] dark:hover:border-amber-400/30 dark:hover:bg-[#191411]"
    >
      {/* LEFT: Photo + Main Info */}
      <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
        {/* Large Cinematic Photo Thumbnail */}
        <Link
          href={isTrashMode ? "#" : `/recipes/${recipe.id}`}
          className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-stone-950 block shadow-xs group-hover/row:opacity-95"
          title="View recipe"
        >
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full w-full object-cover block"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-slate-400 dark:text-stone-600">
              🍲
            </div>
          )}
        </Link>

        {/* Text Details */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Top Badges (Category & Meal Type) */}
          <div className="flex flex-wrap items-center gap-2">
            {formattedCategory && (
              <span className="rounded-full bg-slate-100 dark:bg-white/8 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-stone-300">
                {formattedCategory}
              </span>
            )}
            {recipe.mealType && (
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold capitalize text-slate-800 dark:bg-amber-500/10 dark:text-amber-300 dark:border-transparent">
                {recipe.mealType}
              </span>
            )}
            {recipe.isPublic && (
              <span className="rounded-full bg-emerald-50 border border-emerald-300/90 px-2 py-0.5 text-[11px] font-bold text-emerald-950 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 flex items-center gap-1">
                <span>🌍</span>
                <span>Public</span>
              </span>
            )}
            {Boolean(rating && rating > 0) && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                <span>★</span>
                <span>{rating}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-stone-50 transition-colors group-hover/row:text-slate-700 dark:group-hover/row:text-amber-400 line-clamp-1">
            <Link href={isTrashMode ? "#" : `/recipes/${recipe.id}`}>
              {recipe.title}
            </Link>
          </h3>

          {/* Metrics & Key Ingredients preview */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-stone-400 font-medium">
            {recipe.cookTime && (
              <span className="flex items-center gap-1">
                <span>⏱</span>
                <span>{recipe.cookTime} mins</span>
              </span>
            )}
            {recipe.calories && (
              <span className="flex items-center gap-1">
                <span>🔥</span>
                <span>{recipe.calories} kcal</span>
              </span>
            )}
            {recipe.ingredients.length > 0 && (
              <span className="hidden md:inline-flex items-center gap-1 text-slate-400 dark:text-stone-500 truncate max-w-xs">
                <span>•</span>
                <span className="truncate">{recipe.ingredients.slice(0, 3).map(cleanIngredientName).join(", ")}</span>
                {recipe.ingredients.length > 3 && <span className="shrink-0">+{recipe.ingredients.length - 3}</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Actions Toolbar */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/6 w-full sm:w-auto justify-end">
        {isTrashMode ? (
          <>
            {onRestoreRecipe && (
              <button
                type="button"
                onClick={() => onRestoreRecipe(recipe.id)}
                className="flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <span>↩ Restore</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onDeleteRecipe(recipe)}
              className="flex h-9.5 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer whitespace-nowrap"
              title="Permanently delete"
            >
              <span>Delete Forever</span>
            </button>
          </>
        ) : (
          <>
            {/* Favorite Star */}
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(recipe.id)}
                title={isSaved ? "Remove from favorites" : "Save to favorites"}
                aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              >
                {isSaved ? (
                  <svg className="h-5 w-5 text-amber-500 fill-amber-500 stroke-amber-500" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-slate-400 hover:text-amber-500 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )}
              </button>
            )}

            {/* Primary Action: View Recipe (Obsidian CTA) */}
            <Link
              href={`/recipes/${recipe.id}`}
              className="flex h-9.5 items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 font-bold shadow-xs dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 px-4 text-xs transition active:scale-[0.98] whitespace-nowrap"
            >
              <span>View recipe</span>
              <span className="text-sm font-black text-white dark:text-stone-950">→</span>
            </Link>

            {/* Secondary Action: Grocery Button with SVG */}
            <button
              type="button"
              onClick={() => onAddToGrocery(recipe)}
              className="flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:border-emerald-500 px-3 text-xs font-bold transition active:scale-[0.98] cursor-pointer shrink-0"
              title="Add ingredients to grocery list"
              aria-label="Add ingredients to grocery list"
            >
              <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-black text-white">+</span>
            </button>

            {/* Trash Trigger */}
            <button
              type="button"
              onClick={() => onDeleteRecipe(recipe)}
              className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
              title="Move to Trash"
              aria-label="Move to Trash"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </article>
  );
}
