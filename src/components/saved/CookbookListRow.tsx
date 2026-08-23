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
  onAddToGrocery: (recipe: AppRecipe) => number;
  onQuickPeek?: (recipe: AppRecipe) => void;
};

export default function CookbookListRow({
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
}: CookbookListRowProps) {
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

  const instructions = recipe.instructions ?? [];

  return (
    <article
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      className={`group/row relative flex flex-col justify-between rounded-2xl border bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-300 ease-out dark:bg-[#151210] ${
        isHoverActive && !isTrashMode
          ? "border-amber-500/50 bg-stone-50/90 shadow-lg dark:border-amber-400/40 dark:bg-[#1a1512]"
          : "border-stone-200/90 hover:border-amber-500/30 hover:bg-stone-50/60 dark:border-white/[0.08] dark:hover:border-white/14 dark:hover:bg-[#191411]"
      }`}
    >
      {/* Top Primary Bar (Thumbnail + Info + Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        {/* Left: Thumbnail & Main Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* 64x64 Thumbnail */}
          <Link
            href={isTrashMode ? "#" : `/recipes/${recipe.id}`}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-950 block group/thumb"
            title="View recipe"
          >
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover block transition duration-300 group-hover/thumb:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">
                🍲
              </div>
            )}
          </Link>

          {/* Title and metadata */}
          <div className="min-w-0 flex-1">
            <Link href={isTrashMode ? "#" : `/recipes/${recipe.id}`} className="inline-block max-w-full">
              <h3 className="truncate text-base font-bold text-stone-950 transition group-hover/row:text-amber-600 dark:text-stone-50 dark:group-hover/row:text-amber-400">
                {recipe.title}
              </h3>
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400 font-medium">
              {recipe.cookTime && (
                <span className="flex items-center gap-1">
                  <span>⏱</span>
                  <span>{recipe.cookTime}m</span>
                </span>
              )}

              <span>•</span>
              <span>{recipe.ingredients.length} ingredients</span>

              {formattedCategory && (
                <>
                  <span>•</span>
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700 dark:bg-white/6 dark:text-stone-300">
                    {formattedCategory}
                  </span>
                </>
              )}

              {rating !== null && rating > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <span>★</span>
                    <span>{rating.toFixed(1)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          {isTrashMode ? (
            <>
              {onRestoreRecipe && (
                <button
                  type="button"
                  onClick={() => onRestoreRecipe(recipe.id)}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 active:scale-[0.98] cursor-pointer"
                >
                  <span>↩ Restore</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteRecipe(recipe)}
                className="flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer"
                title="Permanently delete"
              >
                <span>Delete Forever</span>
              </button>
            </>
          ) : (
            <>
              {/* Favorite Star (No background container box) */}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(recipe.id)}
                  title={isSaved ? "Remove from favorites" : "Save to favorites"}
                  aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
                  className="flex h-9 w-9 items-center justify-center transition-transform duration-200 hover:scale-125 active:scale-90 cursor-pointer"
                >
                  {isSaved ? (
                    <svg className="h-5 w-5 text-amber-500 fill-amber-500 stroke-amber-500" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-stone-400 hover:text-amber-500 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Primary Action: View Recipe */}
              <Link
                href={`/recipes/${recipe.id}`}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98] whitespace-nowrap"
              >
                <span>View recipe</span>
                <span className="text-sm">→</span>
              </Link>

              {/* Secondary Action: 🛒+ */}
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

      {/* ✨ SMOOTH IN-PLACE EXPANDING PREVIEW DRAWER (Pushes content naturally, clean ingredient names) */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isHoverActive && !isTrashMode
            ? "grid-rows-[1fr] opacity-100 mt-3.5 pt-3.5 border-t border-stone-200/80 dark:border-white/10"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] text-xs">
            {/* Clean Ingredients column (No quantities/units!) */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                🥕 Key Ingredients ({recipe.ingredients.length}):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                {recipe.ingredients.slice(0, 6).map((ing, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800 dark:bg-white/8 dark:text-stone-200"
                  >
                    {cleanIngredientName(ing)}
                  </span>
                ))}
                {recipe.ingredients.length > 6 && (
                  <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                    +{recipe.ingredients.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Step 1 instruction column */}
            {instructions.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                  📝 Step 1:
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed italic">
                  {instructions[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
