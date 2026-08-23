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
  isHoverActive?: boolean;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onRemoveSaved: (id: number) => void;
  onToggleSave?: (id: number) => void;
  onDeleteRecipe: (recipe: AppRecipe) => void;
  onRestoreRecipe?: (id: number) => void;
  onAddToGrocery: (recipe: AppRecipe) => number;
  onQuickPeek?: (recipe: AppRecipe) => void;
};

function getSourceLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "My Creation";
  if (recipe.origin === "imported") return "Imported";
  return "Chef Collection";
}

export default function CookbookGridCard({
  recipe,
  isSaved,
  isTrashMode = false,
  isHoverActive = false,
  onHoverEnter,
  onHoverLeave,
  onToggleSave,
  onDeleteRecipe,
  onRestoreRecipe,
  onAddToGrocery,
}: CookbookGridCardProps) {
  const [rating, setRating] = useState<RecipeRating | null>(null);
  const [groceryMessage, setGroceryMessage] = useState<string | null>(null);

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

  const handleAddToGroceryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const addedCount = onAddToGrocery(recipe);

    if (addedCount === 0) {
      setGroceryMessage("In list");
    } else {
      setGroceryMessage(`+${addedCount}`);
    }

    window.setTimeout(() => {
      setGroceryMessage(null);
    }, 2500);
  };

  const formattedCategory = recipe.category
    ? capitalize(recipe.category.replace(/-/g, " "))
    : null;

  return (
    <article className="group/card relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-amber-400/30">
      
      {/* 🖼️ MEDIA HEADER */}
      <div
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        className="group/media relative h-52 w-full overflow-hidden bg-stone-100 dark:bg-stone-950"
      >
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
        </Link>

        {/* Ambient Bottom Gradient for Badge Contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top-Left Badges */}
        <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5 z-10">
          <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            {getSourceLabel(recipe)}
          </span>

          {isTrashMode && (
            <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
              🗑️ In Trash
            </span>
          )}
        </div>

        {/* TOP-RIGHT FAVORITE STAR TOGGLE (NO background container box, pure SVG!) */}
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
            className="absolute right-3.5 top-3.5 z-20 transition-transform duration-200 hover:scale-125 active:scale-90 cursor-pointer"
          >
            {isSaved ? (
              <svg className="h-6 w-6 text-amber-400 drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] fill-amber-400 stroke-amber-400" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-white/90 hover:text-amber-400 drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
          </button>
        )}

        {/* Bottom Image Stats */}
        <div className={`absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-[11px] font-bold text-white z-10 transition-opacity duration-200 ${isHoverActive ? "opacity-0" : "opacity-100"}`}>
          <div className="flex items-center gap-1.5">
            {recipe.cookTime && (
              <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 backdrop-blur-md">
                ⏱ {recipe.cookTime}m
              </span>
            )}
            <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 backdrop-blur-md">
              🥕 {recipe.ingredients.length} items
            </span>
          </div>

          {rating !== null && rating > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/30 px-2.5 py-0.5 text-amber-300 backdrop-blur-md font-bold">
              ★ {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* 📝 BODY DETAILS & ACTIONS */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex-1">
          <Link href={isTrashMode ? "#" : `/recipes/${recipe.id}`}>
            <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-stone-950 transition group-hover/card:text-amber-600 dark:text-stone-50 dark:group-hover/card:text-amber-400">
              {recipe.title}
            </h3>
          </Link>

          {/* Tags / Category Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {formattedCategory && (
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 dark:border-white/8 dark:bg-white/4 dark:text-stone-300">
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
                  className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <span>↩ Restore</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe)}
                className="flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer whitespace-nowrap"
                title="Permanently delete"
              >
                <span>Delete Forever</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary Action: View Recipe */}
              <Link
                href={`/recipes/${recipe.id}`}
                className="flex-1 flex h-9 items-center justify-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98] whitespace-nowrap"
              >
                <span>View recipe</span>
                <span className="text-sm">→</span>
              </Link>

              {/* Compact Grocery Button: 🛒+ */}
              <button
                type="button"
                onClick={handleAddToGroceryClick}
                className="flex h-9 items-center justify-center gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25 cursor-pointer shrink-0 active:scale-[0.98]"
                title="Add ingredients to grocery list"
                aria-label="Add ingredients to grocery list"
              >
                {groceryMessage ? (
                  <span className="font-extrabold text-[11px]">{groceryMessage}</span>
                ) : (
                  <span className="text-xs font-black">🛒+</span>
                )}
              </button>

              {/* Trash Trigger */}
              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
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
      </div>
    </article>
  );
}
