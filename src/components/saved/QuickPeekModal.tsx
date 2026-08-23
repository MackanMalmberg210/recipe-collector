"use client";

import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";
import StarRating from "../StarRating";

type QuickPeekModalProps = {
  recipe: AppRecipe | null;
  onClose: () => void;
  onAddToGrocery: (recipe: AppRecipe) => number;
};

export default function QuickPeekModal({
  recipe,
  onClose,
  onAddToGrocery,
}: QuickPeekModalProps) {
  if (!recipe) return null;

  const instructions = recipe.instructions ?? [];
  const formattedCategory = recipe.category
    ? capitalize(recipe.category.replace(/-/g, " "))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20 cursor-pointer"
        >
          ✕
        </button>

        {/* Header with image & title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-sm"
            />
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {formattedCategory && <span>{formattedCategory}</span>}
              {recipe.mealType && (
                <span className="capitalize">• {recipe.mealType}</span>
              )}
            </div>

            <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-2xl mt-1">
              {recipe.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-stone-500 dark:text-stone-400">
              {recipe.cookTime && <span>⏱ {recipe.cookTime} mins</span>}
              {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
              {recipe.servings && <span>👥 {recipe.servings} servings</span>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-stone-100 dark:bg-white/8" />

        {/* 2-column preview for Ingredients & Instructions */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Ingredients list */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center justify-between">
              <span>🥕 Ingredients</span>
              <span className="text-[11px] font-normal text-stone-400">
                ({recipe.ingredients.length})
              </span>
            </h3>
            <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 scrollbar-thin">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center justify-between">
              <span>📝 Instructions</span>
              <span className="text-[11px] font-normal text-stone-400">
                ({instructions.length} steps)
              </span>
            </h3>
            <ol className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 scrollbar-thin">
              {instructions.slice(0, 3).map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="line-clamp-3">{step}</span>
                </li>
              ))}
              {instructions.length > 3 && (
                <li className="text-xs text-stone-400 italic">
                  + {instructions.length - 3} more steps in full recipe...
                </li>
              )}
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 dark:border-white/8">
          <button
            type="button"
            onClick={() => onAddToGrocery(recipe)}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-bold text-stone-800 transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5 cursor-pointer"
          >
            🛒 Add Ingredients to Grocery List
          </button>

          <Link
            href={`/recipes/${recipe.id}`}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-sm transition hover:bg-amber-400 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
          >
            <span>Open Full Recipe</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
