"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AppRecipe } from "../../lib/types";
import type { PantryItem } from "../../lib/groceries";
import {
  findBestPantryMatches,
  rollRandomPantryRecipe,
  type PantryRecipeMatch,
} from "../../lib/pantryMatcher";
import { sanitizeCulinaryText } from "../../lib/culinaryTextSanitizer";
import { parseIngredientString } from "../../lib/ingredientParser";

type CookWhatIHaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  pantryItems: PantryItem[];
  onAddMissingToGroceryList: (ingredients: string[], recipeTitle: string, recipeId: number | string) => void;
};

export default function CookWhatIHaveModal({
  isOpen,
  onClose,
  recipes,
  pantryItems,
  onAddMissingToGroceryList,
}: CookWhatIHaveModalProps) {
  const [highlightedMatch, setHighlightedMatch] = useState<PantryRecipeMatch | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const matches = findBestPantryMatches(recipes, pantryItems, 12);
  const inStockCount = pantryItems.filter((p) => p.inStock).length;

  const handleRollDice = () => {
    const rolled = rollRandomPantryRecipe(matches);
    if (rolled) {
      setHighlightedMatch(rolled);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 transition-opacity duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl 2xl:max-w-6xl max-h-[90vh] overflow-hidden rounded-4xl border border-white/12 bg-[#16120f] shadow-[0_25px_80px_rgba(0,0,0,0.85)] cursor-default animate-in zoom-in-95 duration-150"
      >
        
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-white/8 bg-[#1d1612]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V20H6v-6.13zM6 17h12" />
              </svg>
              <span>Pantry Matcher</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#fff8ef] tracking-tight">
              {highlightedMatch ? "Recommended Dinner" : "What You Can Cook Tonight"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Matched against your <strong className="text-amber-300 font-bold">{inStockCount} pantry staples</strong>. Ranked by ingredient availability.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {matches.length > 1 && (
              <button
                type="button"
                onClick={handleRollDice}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-4.5 py-2.5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 active:scale-95 cursor-pointer"
                title={highlightedMatch ? "Pick another recipe" : "Pick a random high-scoring dinner recipe"}
              >
                <svg className="h-4 w-4 shrink-0 text-stone-950 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{highlightedMatch ? "Pick Another" : "Pick for Me"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY (100% NATIVE COMPOSITOR SCROLL) */}
        <div
          style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
          className="p-6 sm:p-8 overflow-y-auto overscroll-contain space-y-6 flex-1"
        >
          
          {/* CASE A: SPOTLIGHT PICK HERO SHOWCASE */}
          {highlightedMatch ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Back to list toggle */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setHighlightedMatch(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-stone-300 hover:text-white transition cursor-pointer"
                >
                  <span>←</span>
                  <span>View all {matches.length} matches</span>
                </button>
              </div>

              {/* Big Spotlight Card */}
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#241a14] via-[#1b1410] to-[#14100d] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
                
                <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start relative z-10">
                  
                  {/* Large Appetizing Image */}
                  <div className="relative h-60 sm:h-72 w-full md:w-80 rounded-3xl overflow-hidden shrink-0 border border-white/12 bg-stone-900 shadow-xl">
                    <Image
                      src={highlightedMatch.recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352"}
                      alt={highlightedMatch.recipe.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover"
                    />
                    <div className="absolute top-3.5 left-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wide shadow-md ${
                          highlightedMatch.missingIngredientsCount === 0
                            ? "bg-emerald-500 text-stone-950 font-bold"
                            : "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 border border-amber-600/50 shadow-sm font-bold"
                        }`}
                      >
                        {highlightedMatch.missingIngredientsCount === 0 ? (
                          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                            <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.627 12 12 0-6.627 5.627-12 12-12-6.627 0-12-5.627-12-12z" />
                          </svg>
                        )}
                        <span>
                          {highlightedMatch.missingIngredientsCount === 0
                            ? "100% In Stock"
                            : `${highlightedMatch.matchPercentage}% Match`}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Recipe Content & Actions */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                        <span>Spotlight Recommendation</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-[#fff8ef] mt-1 tracking-tight leading-snug">
                        {highlightedMatch.recipe.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-400 mt-1 flex-wrap">
                        {highlightedMatch.recipe.cookTime && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-3.5 w-3.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                            </svg>
                            <span>{highlightedMatch.recipe.cookTime} mins</span>
                            <span>•</span>
                          </span>
                        )}
                        <span>
                          {highlightedMatch.missingIngredientsCount === 0
                            ? "You have everything needed in your pantry!"
                            : `Missing ${highlightedMatch.missingIngredientsCount} of ${highlightedMatch.recipe.ingredients.length} ingredients`}
                        </span>
                      </div>
                    </div>

                    {/* Missing Ingredients Section */}
                    {highlightedMatch.missingItems.length > 0 && (
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/8 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                          Missing items to buy:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {highlightedMatch.missingItems.map((raw, idx) => {
                            const parsed = parseIngredientString(raw);
                            const candidate = parsed.name || raw;
                            const cleanName = sanitizeCulinaryText(candidate)
                              .replace(/,\s*.*$/, "")
                              .replace(/^\d+[\d\s\/\.]*\s*(?:tbsp|tsp|cup|c\.|oz|lb|g|kg|ml|slices|cloves)?\.?\s*/i, "")
                              .trim();
                            return (
                              <span
                                key={idx}
                                className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-300"
                              >
                                {cleanName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      {highlightedMatch.missingItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddMissingToGroceryList(
                              highlightedMatch.missingItems,
                              highlightedMatch.recipe.title,
                              highlightedMatch.recipe.id
                            );
                            onClose();
                          }}
                          className="w-full sm:flex-1 rounded-2xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 py-3 text-xs sm:text-sm font-bold text-amber-300 transition cursor-pointer text-center"
                        >
                          + Add {highlightedMatch.missingIngredientsCount} Missing to List
                        </button>
                      )}

                      <Link
                        href={`/recipes/${highlightedMatch.recipe.id}`}
                        onClick={onClose}
                        className="w-full sm:flex-1 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs sm:text-sm font-bold text-stone-950 transition text-center border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] active:scale-95"
                      >
                        Cook This Recipe →
                      </Link>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          ) : matches.length === 0 ? (
            /* CASE B: NO MATCHES */
            <div className="text-center py-20 space-y-4">
              <span className="text-5xl">🥫</span>
              <h3 className="text-xl font-bold text-stone-200">No close recipe matches found</h3>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                Try marking more of your items as in-stock in the <strong className="text-amber-300">Pantry</strong> tab, or save more recipes into your cookbook!
              </p>
            </div>
          ) : (
            /* CASE C: MULTI-COLUMN GRID OF ALL MATCHES */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {matches.map((match) => {
                const { recipe, matchPercentage, missingIngredientsCount, missingItems } = match;
                const isFullMatch = missingIngredientsCount === 0;

                // Clean up missing ingredients for elegant chips
                const cleanMissingNames = missingItems.map((raw) => {
                  const parsed = parseIngredientString(raw);
                  const candidate = parsed.name || raw;
                  return sanitizeCulinaryText(candidate)
                    .replace(/,\s*.*$/, "")
                    .replace(/^\d+[\d\s\/\.]*\s*(?:tbsp|tsp|cup|c\.|oz|lb|g|kg|ml|slices|cloves)?\.?\s*/i, "")
                    .trim();
                });

                return (
                  <div
                    key={recipe.id}
                    className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#1f1915]/95 p-5 sm:p-6 shadow-xl space-y-5 hover:border-amber-400/40 hover:bg-[#231c17] transition duration-200"
                  >
                    <div className="space-y-4">
                      
                      {/* HEADER: IMAGE, BADGE, TITLE & STATS */}
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 sm:h-22 sm:w-22 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-stone-900 shadow-md">
                          <Image
                            src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352"}
                            alt={recipe.title}
                            fill
                            sizes="88px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          {/* HIGH CONTRAST CLEAR MATCH BADGE */}
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold tracking-wide ${
                                isFullMatch
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {isFullMatch ? (
                                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                  <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.627 12 12 0-6.627 5.627-12 12-12-6.627 0-12-5.627-12-12z" />
                                </svg>
                              )}
                              <span>{isFullMatch ? "100% In Stock" : `${matchPercentage}% Match`}</span>
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-[#fff8ef] leading-snug line-clamp-2">
                            {recipe.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium flex-wrap">
                            {recipe.cookTime && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="h-3.5 w-3.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <circle cx="12" cy="12" r="9" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                                </svg>
                                <span>{recipe.cookTime} mins</span>
                                <span>•</span>
                              </span>
                            )}
                            <span>
                              {isFullMatch
                                ? "You have everything needed!"
                                : `Missing ${missingIngredientsCount} of ${recipe.ingredients.length} ingredients`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* MISSING INGREDIENTS CLEAN CHIPS */}
                      {!isFullMatch && cleanMissingNames.length > 0 && (
                        <div className="pt-3 border-t border-white/8 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
                            <span>Missing to buy:</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {cleanMissingNames.slice(0, 5).map((cleanName, idx) => (
                              <span
                                key={idx}
                                className="rounded-xl bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 text-xs font-semibold text-rose-300"
                              >
                                {cleanName}
                              </span>
                            ))}
                            {cleanMissingNames.length > 5 && (
                              <span className="text-xs text-stone-400 self-center font-bold px-1">
                                +{cleanMissingNames.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-white/8">
                      {!isFullMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddMissingToGroceryList(missingItems, recipe.title, recipe.id);
                            onClose();
                          }}
                          className="w-full sm:flex-1 rounded-2xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 py-2.5 text-xs font-bold text-amber-300 transition cursor-pointer text-center"
                        >
                          + Add {missingIngredientsCount} Missing
                        </button>
                      )}

                      <Link
                        href={`/recipes/${recipe.id}`}
                        onClick={onClose}
                        className="w-full sm:flex-1 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-2.5 text-xs font-bold text-stone-950 transition text-center border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] active:scale-95"
                      >
                        View Recipe →
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
