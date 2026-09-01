"use client";

import Link from "next/link";
import type { AppRecipe } from "../../lib/types";

type SimilarRecipesPanelProps = {
  currentRecipe: AppRecipe;
  recipes: AppRecipe[];
  savedRecipeIds?: number[];
  onToggleSave?: (id: number) => void;
};

function getSimilarityScore(currentRecipe: AppRecipe, recipe: AppRecipe) {
  if (currentRecipe.id === recipe.id) return -1;

  let score = 0;

  if (
    currentRecipe.category &&
    recipe.category &&
    currentRecipe.category === recipe.category
  ) {
    score += 4;
  }

  if (
    currentRecipe.mealType &&
    recipe.mealType &&
    currentRecipe.mealType === recipe.mealType
  ) {
    score += 3;
  }

  const currentTags = new Set(currentRecipe.tags ?? []);
  const recipeTags = recipe.tags ?? [];

  for (const tag of recipeTags) {
    if (currentTags.has(tag)) score += 2;
  }

  const currentIngredients = new Set(
    currentRecipe.ingredients.map((ingredient) =>
      ingredient.trim().toLowerCase(),
    ),
  );

  for (const ingredient of recipe.ingredients) {
    if (currentIngredients.has(ingredient.trim().toLowerCase())) {
      score += 1;
    }
  }

  return score;
}

export default function SimilarRecipesPanel({
  currentRecipe,
  recipes,
  savedRecipeIds = [],
  onToggleSave,
}: SimilarRecipesPanelProps) {
  const similarRecipes = [...recipes]
    .map((recipe) => ({
      recipe,
      score: getSimilarityScore(currentRecipe, recipe),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.recipe);

  if (similarRecipes.length === 0) {
    return null;
  }

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#17120f]/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            More Culinary Ideas
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fff8ef]">
            You might also like
          </h2>
        </div>

        <span className="text-[11px] text-stone-400 dark:text-stone-500 italic">
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
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200 bg-stone-50/50 p-3.5 transition duration-300 hover:border-amber-400/30 hover:bg-stone-100/80 dark:border-white/10 dark:bg-[#211915]/80 dark:hover:bg-[#281e18] shadow-2xs"
            >
              <div>
                {/* THUMBNAIL */}
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-stone-200 dark:bg-[#2a211b]">
                  <Link href={`/recipes/${recipe.id}`} className="block h-full w-full">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>

                  {/* FAVORITE STAR (TOP-RIGHT, PURE SVG) */}
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

                  {recipe.cookTime && (
                    <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm">
                      <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{recipe.cookTime}m</span>
                    </span>
                  )}
                </div>

                {/* CONTENT */}
                <div className="mt-3">
                  <Link href={`/recipes/${recipe.id}`} className="block">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-900 group-hover:text-amber-600 dark:text-[#fff8ef] dark:group-hover:text-amber-400 transition">
                      {recipe.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    {recipe.ingredients.length} ingredients • {recipe.servings || 4} servings
                  </p>
                </div>
              </div>

              {/* ACTION BUTTON WITH SIGNATURE STYLING */}
              <div className="mt-4 pt-2.5 border-t border-stone-200/80 dark:border-white/5 flex items-center justify-between">
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] py-2 px-3 text-xs transition-all duration-150 active:scale-95 cursor-pointer"
                >
                  <span>View Recipe</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
