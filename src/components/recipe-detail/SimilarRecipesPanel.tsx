"use client";

import Link from "next/link";
import type { AppRecipe } from "../../lib/types";

type SimilarRecipesPanelProps = {
  currentRecipe: AppRecipe;
  recipes: AppRecipe[];
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
}: SimilarRecipesPanelProps) {
  const similarRecipes = [...recipes]
    .map((recipe) => ({
      recipe,
      score: getSimilarityScore(currentRecipe, recipe),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.recipe);

  if (similarRecipes.length === 0) {
    return (
      <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
          Similar recipes
        </p>

        <h2 className="text-2xl font-semibold text-[#fff8ef]">
          Nothing similar yet
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-400">
          As your cookbook grows, related recipes will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        Similar recipes
      </p>

      <h2 className="text-2xl font-semibold text-[#fff8ef]">
        You might also like
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-400">
        Based on shared ingredients, tags, meal type and category.
      </p>

      <div className="mt-5 space-y-3">
        {similarRecipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
            <article className="group grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-3xl border border-white/10 bg-[#211915]/80 p-3 transition hover:border-amber-100/20 hover:bg-[#261d17]">
              <div className="overflow-hidden rounded-2xl bg-[#2a211b]">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-22 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#fff8ef]">
                  {recipe.title}
                </h3>

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-400">
                  {recipe.cookTime !== undefined && (
                    <span>⏱ {recipe.cookTime} min</span>
                  )}
                  {recipe.calories !== undefined && (
                    <span>🔥 {recipe.calories} kcal</span>
                  )}
                </div>

                <p className="mt-2 text-xs font-medium text-amber-100/70">
                  View recipe →
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
