"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";
import { capitalizeFirstLetter } from "../../lib/culinaryTextSanitizer";

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
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-[0_16px_40px_rgb(0,0,0,0.09)] dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 sm:p-7"
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
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-stone-100 dark:bg-stone-950">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
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

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
              {recipe.cookTime && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                  </svg>
                  <span>{recipe.cookTime} mins</span>
                </span>
              )}
              {recipe.calories && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <span>{recipe.calories} kcal</span>
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{recipe.servings} servings</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body (Ingredients + Steps Preview) */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 border-t border-stone-100 pt-5 dark:border-white/8">
          {/* Ingredients list */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <span>Key Ingredients</span>
              <span className="text-[11px] font-normal text-stone-400">
                ({recipe.ingredients.length})
              </span>
            </h3>
            <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 scrollbar-thin">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{capitalizeFirstLetter(ing)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions preview */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <span>Instructions</span>
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
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:border-emerald-500 px-4 py-2.5 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Add Ingredients to Grocery</span>
          </button>

          <Link
            href={`/recipes/${recipe.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/60 transition active:scale-95"
          >
            <span>Open Full Recipe</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
