"use client";

import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";

type RecipeHeroProps = {
  recipe: AppRecipe;
  saved: boolean;
  rating?: number | null;
  missingCount: number;
  isAddedToGrocery?: boolean;
  onToggleFavorite: () => void;
  onAddMissingToGroceryList: () => void;
  onUndoAddMissing?: () => void;
  onOpenCookMode: () => void;
  onOpenShareModal: () => void;
  onDeleteRecipe?: () => void;
};

function getSourceLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "Created by you";
  if (recipe.origin === "imported") return "Imported recipe";
  return "Chef's Collection";
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

function getHostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function RecipeHero({
  recipe,
  saved,
  rating,
  missingCount,
  isAddedToGrocery = false,
  onToggleFavorite,
  onAddMissingToGroceryList,
  onUndoAddMissing,
  onOpenCookMode,
  onOpenShareModal,
  onDeleteRecipe,
}: RecipeHeroProps) {
  const tags = getRecipeTags(recipe);
  const displayCalories = recipe.calories ?? recipe.nutrition?.calories;
  const servingsDisplay = recipe.servingsText || (recipe.servings ? `${recipe.servings} servings` : undefined);
  const sourceDomain = getHostname(recipe.sourceUrl);

  return (
    <section className="overflow-hidden rounded-4xl border border-stone-200/90 bg-white shadow-sm dark:border-white/8 dark:bg-[#15110e]/95 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/3">
      <div className="grid lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[500px_minmax(0,1fr)] 2xl:grid-cols-[540px_minmax(0,1fr)]">
        
        {/* HERO IMAGE CONTAINER */}
        <div className="relative h-72 sm:h-80 lg:h-full min-h-[320px] w-full overflow-hidden bg-stone-900">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover transition duration-700 hover:scale-105"
            loading="eager"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* TOP-LEFT ORIGIN BADGE */}
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {getSourceLabel(recipe)}
            </span>
          </div>
        </div>

        {/* HERO DETAILS CONTENT */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 space-y-6">
          <div>
            {/* TOP BAR: RECIPE EXPERIENCE + TOP-RIGHT FAVORITE STAR */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Recipe Experience
                </p>

                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition"
                    title="View original recipe source"
                  >
                    <span>{recipe.sourceName || sourceDomain || "Original site"}</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* FAVORITE STAR IN UPPER RIGHT OF HERO SECTION */}
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={saved ? "Remove from favorites" : "Save to favorites"}
                title={saved ? "Remove from favorites" : "Save to favorites"}
                className="p-1 transition-transform duration-200 hover:scale-125 active:scale-90 cursor-pointer"
              >
                {saved ? (
                  <svg className="h-6 w-6 text-amber-500 fill-amber-500 stroke-amber-500" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-stone-400 hover:text-amber-500 dark:text-stone-500 dark:hover:text-amber-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-stone-950 dark:text-[#fff8ef]">
              {recipe.title}
            </h1>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300 line-clamp-3">
              {recipe.description || "A refined culinary recipe experience designed for real cooking — better planning, smarter grocery flow, and recipes you’ll actually enjoy making."}
            </p>

            {/* TAGS */}
            {tags.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={`${recipe.id}-tag-${index}`}
                    className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-700 dark:border-white/8 dark:bg-white/5 dark:text-stone-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* STATS & METADATA DIRECTLY UNDER TAGS */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300">
              {recipe.cookTime !== undefined && (
                <span className="flex items-center gap-1.5">
                  <span>⏱</span>
                  <span>{recipe.cookTime} min</span>
                </span>
              )}

              {displayCalories !== undefined && (
                <span className="flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{displayCalories} kcal</span>
                </span>
              )}

              {servingsDisplay && (
                <span className="flex items-center gap-1.5">
                  <span>👥</span>
                  <span>{servingsDisplay}</span>
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <span>🥕</span>
                <span>{recipe.ingredients.length} ingredients</span>
              </span>

              {rating !== undefined && rating !== null && rating > 0 && (
                <span className="inline-flex items-center gap-1 font-black text-amber-900 bg-amber-500/20 border border-amber-500/35 px-2.5 py-0.5 rounded-xl text-xs dark:text-amber-300">
                  <span className="text-amber-500">★</span>
                  <span>{rating} / 5</span>
                </span>
              )}
            </div>
          </div>

          {/* INTEGRATED ACTION CONTROLS */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* START COOK MODE */}
            <button
              type="button"
              onClick={onOpenCookMode}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-stone-950 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>👨‍🍳</span>
              <span>Start Cook Mode</span>
            </button>

            {/* ADD MISSING / IN GROCERY */}
            {isAddedToGrocery ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                <span>✓ Added to Grocery List</span>
                {onUndoAddMissing && (
                  <button
                    type="button"
                    onClick={onUndoAddMissing}
                    className="rounded-lg bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs text-stone-800 dark:text-stone-200 hover:bg-black/20 dark:hover:bg-white/20 transition cursor-pointer ml-1"
                  >
                    Undo
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onAddMissingToGroceryList}
                disabled={missingCount === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>🛒</span>
                <span>
                  {missingCount === 0 ? "All in Grocery" : `Add Missing (${missingCount})`}
                </span>
              </button>
            )}

            {/* SHARE BUTTON */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs"
              title="Share Recipe"
              aria-label="Share Recipe"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {/* TRASH (FOR CREATED RECIPES) */}
            {onDeleteRecipe && (
              <button
                type="button"
                onClick={onDeleteRecipe}
                className="inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-rose-200 bg-rose-50/70 text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition cursor-pointer"
                title="Move to Trash"
                aria-label="Move to Trash"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
