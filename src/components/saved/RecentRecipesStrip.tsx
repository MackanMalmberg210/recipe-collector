"use client";

import Link from "next/link";
import type { AppRecipe } from "../../lib/types";

type RecentRecipesStripProps = {
  recipes: AppRecipe[];
};

function getRecipeTimestamp(recipe: AppRecipe) {
  const record = recipe as AppRecipe & {
    createdAt?: string | number;
    importedAt?: string | number;
    savedAt?: string | number;
  };

  const candidate = record.createdAt ?? record.importedAt ?? record.savedAt;

  if (typeof candidate === "number") return candidate;

  if (typeof candidate === "string") {
    const parsed = new Date(candidate).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getSourceLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "Created";
  if (recipe.origin === "imported") return "Imported";
  return "Library";
}

export default function RecentRecipesStrip({
  recipes,
}: RecentRecipesStripProps) {
  const recentRecipes = [...recipes]
    .sort((a, b) => getRecipeTimestamp(b) - getRecipeTimestamp(a))
    .slice(0, 4);

  if (recentRecipes.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-300">
            Recently added
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-[#fff8ef]">
            Pick up where you left off
          </h2>
        </div>

        <p className="max-w-xl text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          Your newest imported, saved and created recipes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {recentRecipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
            <article className="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#17120f]/85 dark:hover:bg-[#1d1713]">
              <div className="relative h-44 overflow-hidden bg-stone-100 dark:bg-[#231b15]">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-stone-400">
                    No image available
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="absolute left-3 top-3">
                  <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                    {getSourceLabel(recipe)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-stone-900 transition group-hover:text-amber-600 dark:text-[#fff8ef] dark:group-hover:text-amber-300">
                  {recipe.title}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {recipe.cookTime && (
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/10 dark:bg-white/4">
                      ⏱ {recipe.cookTime} min
                    </span>
                  )}

                  {recipe.servings !== undefined && (
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/10 dark:bg-white/4">
                      👥 {recipe.servings}
                    </span>
                  )}

                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/10 dark:bg-white/4">
                    🥕 {recipe.ingredients.length}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
