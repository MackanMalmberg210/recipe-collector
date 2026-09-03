"use client";

import type { AppRecipe } from "../../lib/types";

type RecipeHeroProps = {
  recipe: AppRecipe;
  saved: boolean;
  rating?: number | null;
  missingCount: number;
  isAddedToGrocery: boolean;
  onToggleFavorite: () => void;
  onAddMissingToGroceryList: () => void;
  onUndoAddMissing: () => void;
  onOpenCookMode: () => void;
  onOpenShareModal: () => void;
  onDeleteRecipe?: () => void;
};

function getHostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export default function RecipeHero({
  recipe,
  saved,
  rating,
  missingCount,
  isAddedToGrocery,
  onToggleFavorite,
  onAddMissingToGroceryList,
  onUndoAddMissing,
  onOpenCookMode,
  onOpenShareModal,
  onDeleteRecipe,
}: RecipeHeroProps) {
  const n = recipe.nutrition;
  const displayCalories = recipe.calories ?? n?.calories;
  const servingsDisplay = recipe.servingsText || (recipe.servings ? `${recipe.servings} servings` : undefined);
  const sourceDomain = getHostname(recipe.sourceUrl);

  const hasNutritionData = Boolean(
    displayCalories || n?.protein || n?.carbohydrates || n?.fat
  );

  return (
    <section className="overflow-hidden rounded-4xl border border-stone-200/90 bg-white shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[490px_minmax(0,1fr)] 2xl:grid-cols-[530px_minmax(0,1fr)]">
        
        {/* HERO IMAGE CONTAINER */}
        <div className="relative h-72 sm:h-80 lg:h-full min-h-[320px] w-full overflow-hidden bg-stone-900">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover transition duration-700 hover:scale-105"
            loading="eager"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </div>

        {/* HERO DETAILS CONTENT */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="space-y-4">
            {/* TOP BAR: RECIPE DETAILS + SOURCE LINK + TOP-RIGHT FAVORITE STAR */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
                  Recipe Details
                </p>

                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition"
                    title="View original recipe source"
                  >
                    <span>{recipe.sourceName || sourceDomain || "Original site"}</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* FAVORITE STAR */}
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={saved ? "Remove from favorites" : "Save to favorites"}
                title={saved ? "Remove from favorites" : "Save to favorites"}
                className="p-1 transition-transform duration-200 hover:scale-125 active:scale-90 cursor-pointer"
              >
                <span className={`text-2xl sm:text-3xl leading-none transition-all drop-shadow-sm ${saved ? "text-amber-400" : "text-stone-500 hover:text-amber-400"}`}>
                  {saved ? "★" : "☆"}
                </span>
              </button>
            </div>

            {/* TITLE */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9] leading-tight break-words">
              {recipe.title}
            </h1>

            {/* DESCRIPTION */}
            {recipe.description && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-[#d6d3d1] leading-relaxed line-clamp-3">
                {recipe.description}
              </p>
            )}

            {/* QUICK STATS CHIPS */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600 dark:text-[#d6d3d1] pt-1">
              {recipe.cookTime && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-[#2e2722] dark:bg-[#24201c]">
                  <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{recipe.cookTime} mins</span>
                </span>
              )}

              {servingsDisplay && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-[#2e2722] dark:bg-[#24201c]">
                  <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{servingsDisplay}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-[#2e2722] dark:bg-[#24201c]">
                <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{recipe.ingredients.length} ingredients</span>
              </span>

              {rating !== undefined && rating !== null && rating > 0 && (
                <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-500/20 border border-amber-500/35 px-2.5 py-1 rounded-xl text-xs dark:text-amber-300">
                  <span className="text-amber-400">★</span>
                  <span>{rating} / 5</span>
                </span>
              )}
            </div>

            {/* INTEGRATED MACRO & NUTRITION FACTS */}
            {hasNutritionData && (
              <div className="pt-2">
                <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 p-3.5 dark:border-[#2e2722] dark:bg-[#141210] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                      <span>Nutrition &amp; Macros</span>
                    </span>
                    <span className="text-[10px] text-stone-400 lowercase dark:text-[#78716c]">per serving</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl border border-stone-200/90 bg-white p-2 text-center dark:border-[#2e2722] dark:bg-[#1f1b18]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">Calories</span>
                      <span className="text-sm sm:text-base font-black text-stone-900 dark:text-[#fafaf9]">
                        {displayCalories ? `${displayCalories} kcal` : "—"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200/90 bg-white p-2 text-center dark:border-[#2e2722] dark:bg-[#1f1b18]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">Protein</span>
                      <span className="text-sm sm:text-base font-black text-stone-900 dark:text-[#fafaf9]">
                        {n?.protein || "—"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200/90 bg-white p-2 text-center dark:border-[#2e2722] dark:bg-[#1f1b18]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">Carbs</span>
                      <span className="text-sm sm:text-base font-black text-stone-900 dark:text-[#fafaf9]">
                        {n?.carbohydrates || "—"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-stone-200/90 bg-white p-2 text-center dark:border-[#2e2722] dark:bg-[#1f1b18]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">Fats</span>
                      <span className="text-sm sm:text-base font-black text-stone-900 dark:text-[#fafaf9]">
                        {n?.fat || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-[#2e2722] pt-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenCookMode}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-4.5 py-2.5 text-xs sm:text-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Start Cook Mode</span>
              </button>

              <button
                type="button"
                onClick={onOpenShareModal}
                className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-50 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] dark:hover:text-[#fafaf9] transition cursor-pointer shadow-2xs active:scale-95"
              >
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </div>

            {onDeleteRecipe && (
              <button
                type="button"
                onClick={onDeleteRecipe}
                aria-label="Delete recipe"
                title="Delete recipe"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-600 hover:border-rose-300 dark:border-[#26201b] dark:bg-[#12100e] dark:text-rose-400/90 dark:hover:bg-[#1c1412] dark:hover:border-rose-900/60 dark:hover:text-rose-300 transition cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
