"use client";

import Link from "next/link";
import type { AppRecipe } from "../../lib/types";

type SimilarRecipesPanelProps = {
  currentRecipe: AppRecipe;
  recipes: AppRecipe[];
  savedRecipeIds?: number[];
  onToggleSave?: (recipeId: number) => void;
};

export default function SimilarRecipesPanel({
  currentRecipe,
  recipes,
  savedRecipeIds = [],
  onToggleSave,
}: SimilarRecipesPanelProps) {
  // Find up to 4 similar recipes (excluding current) based on shared category/tags or random fallback
  const getSimilarRecipes = (): AppRecipe[] => {
    const otherRecipes = recipes.filter((r) => r.id !== currentRecipe.id);
    if (otherRecipes.length === 0) return [];

    const currentCat = (currentRecipe.category || "").toLowerCase();
    const currentMeal = (currentRecipe.mealType || "").toLowerCase();
    const currentIngredients = new Set(
      currentRecipe.ingredients.map((i) => i.toLowerCase())
    );

    // Score other recipes
    const scored = otherRecipes.map((recipe) => {
      let score = 0;
      const cat = (recipe.category || "").toLowerCase();
      const meal = (recipe.mealType || "").toLowerCase();

      if (cat && currentCat && cat === currentCat) score += 3;
      if (meal && currentMeal && meal === currentMeal) score += 2;

      // Shared ingredients score
      recipe.ingredients.forEach((ing) => {
        if (currentIngredients.has(ing.toLowerCase())) {
          score += 1;
        }
      });

      return { recipe, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Pick top 4
    return scored.slice(0, 4).map((s) => s.recipe);
  };

  const similarRecipes = getSimilarRecipes();

  if (similarRecipes.length === 0) {
    return null;
  }

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
            Related Dishes &amp; Pairings
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
            You might also enjoy
          </h2>
        </div>

        <span className="text-[11px] text-stone-400 dark:text-[#a8a29e] italic">
          Based on ingredients &amp; category
        </span>
      </div>

      {/* HORIZONTAL DISCOVERY GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {similarRecipes.map((recipe) => {
          const isSaved = savedRecipeIds.includes(recipe.id);

          return (
            <article
              key={recipe.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-50/60 p-3.5 transition duration-300 hover:border-amber-500/40 hover:bg-stone-100 dark:border-[#2e2722] dark:bg-[#24201c] dark:hover:bg-[#2d2823] shadow-2xs"
            >
              <div>
                {/* THUMBNAIL */}
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-stone-900">
                  <Link href={`/recipes/${recipe.id}`} className="block h-full w-full">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>

                  {/* FAVORITE STAR */}
                  {onToggleSave && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSave(recipe.id);
                      }}
                      title={isSaved ? "Remove from favorites" : "Save to favorites"}
                      aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
                      className="absolute top-2.5 right-2.5 z-10 p-1 transition-transform duration-200 hover:scale-125 active:scale-90 cursor-pointer drop-shadow-sm"
                    >
                      {isSaved ? (
                        <svg className="h-5 w-5 text-amber-500 fill-amber-500 stroke-amber-500" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-white/90 hover:text-amber-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* DETAILS */}
                <div className="mt-3 space-y-1">
                  <Link href={`/recipes/${recipe.id}`} className="block">
                    <h3 className="line-clamp-1 font-bold text-sm text-stone-900 dark:text-[#fafaf9] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {recipe.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-[#a8a29e]">
                    {recipe.cookTime && <span>⏱ {recipe.cookTime}m</span>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
