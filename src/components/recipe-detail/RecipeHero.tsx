"use client";

import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { capitalize } from "../../lib/format";

type RecipeHeroProps = {
  recipe: AppRecipe;
  saved: boolean;
};

function getSourceLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "Created by you";
  if (recipe.origin === "imported") return "Imported recipe";
  return "Recipe library";
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

export default function RecipeHero({ recipe, saved }: RecipeHeroProps) {
  const tags = getRecipeTags(recipe);
  const displayCalories = recipe.calories ?? recipe.nutrition?.calories;

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[#15110e]/90 shadow-[0_30px_120px_rgba(0,0,0,0.4)] ring-1 ring-white/3">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-130 overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.2)_40%,rgba(0,0,0,0.65)_100%)]" />

          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
              {getSourceLabel(recipe)}
            </span>

            {saved && (
              <span className="rounded-full border border-emerald-200/20 bg-emerald-300/15 px-4 py-2 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between p-8 md:p-10">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-amber-100/45">
              Recipe experience
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#fff8ef] md:text-6xl">
              {recipe.title}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-stone-400 md:text-lg">
              A refined recipe experience designed for real cooking — better
              planning, smarter grocery flow, and recipes you’ll actually come
              back to.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={`${recipe.id}-tag-${index}`}
                  className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-sm text-stone-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 border-t border-white/8 pt-6">
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-stone-300">
                {recipe.cookTime !== undefined && (
                  <span>⏱ {recipe.cookTime} min</span>
                )}

                {displayCalories !== undefined && (
                  <span>🔥 {displayCalories} kcal</span>
                )}

                {recipe.servings !== undefined && (
                  <span>👥 {recipe.servings} servings</span>
                )}

                <span>🥕 {recipe.ingredients.length} ingredients</span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/saved"
              className="rounded-2xl bg-[#fff4e2] px-5 py-3 text-sm font-bold text-[#17120e] transition hover:bg-white"
            >
              Back to cookbook
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/8"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
