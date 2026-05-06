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
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
            Recently added
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-[#fff8ef]">
            Pick up where you left off
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-stone-400">
          Your newest imported, saved and created recipes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {recentRecipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
            <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#17120f]/85 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ring-1 ring-white/3 transition duration-300 hover:-translate-y-1 hover:border-amber-100/20 hover:bg-[#1d1713]">
              <div className="relative h-48 overflow-hidden bg-[#231b15]">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-stone-500">
                    No image available
                  </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />

                <div className="absolute left-4 top-4">
                  <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                    {getSourceLabel(recipe)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-[#fff8ef] transition group-hover:text-amber-100">
                  {recipe.title}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs text-stone-300">
                  {recipe.cookTime && (
                    <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1">
                      ⏱ {recipe.cookTime} min
                    </span>
                  )}

                  {recipe.servings !== undefined && (
                    <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1">
                      👥 {recipe.servings}
                    </span>
                  )}

                  <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1">
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
