"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";
import StarRating from "../StarRating";

type QuickPeekModalProps = {
  recipe: AppRecipe | null;
  onClose: () => void;
  onAddToGrocery: (recipe: AppRecipe) => void;
};

export default function QuickPeekModal({
  recipe,
  onClose,
  onAddToGrocery,
}: QuickPeekModalProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (!recipe) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [recipe]);

  if (!recipe) return null;

  const instructions = recipe.instructions ?? [];
  const formattedCategory = recipe.category
    ? capitalize(recipe.category.replace(/-/g, " "))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 sm:p-7"
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
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-950">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">
                🍲
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {formattedCategory && (
                <span className="rounded-full bg-stone-100 dark:bg-white/8 px-2.5 py-0.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                  {formattedCategory}
                </span>
              )}
              {recipe.mealType && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold capitalize text-amber-800 dark:text-amber-300">
                  {recipe.mealType}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
              {recipe.title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
              {recipe.cookTime && <span>⏱ {recipe.cookTime} mins</span>}
              {recipe.calories && <span>• 🔥 {recipe.calories} kcal</span>}
              {recipe.servings && <span>• 👥 {recipe.servings} servings</span>}
            </div>
          </div>
        </div>

        {/* Body (Ingredients + Steps Preview) */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 border-t border-stone-100 pt-5 dark:border-white/8">
          {/* Ingredients list */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <span>🥕 Key Ingredients</span>
              <span className="text-[11px] font-normal text-stone-400">
                ({recipe.ingredients.length})
              </span>
            </h3>
            <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 scrollbar-thin">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="capitalize">{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions preview */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
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
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25 cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Add Ingredients to Grocery</span>
          </button>

          <Link
            href={`/recipes/${recipe.id}`}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-5 py-2.5 text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95"
          >
            <span>Open Full Recipe</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
