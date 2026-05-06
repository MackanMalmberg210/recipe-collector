"use client";

import type { AppRecipe } from "../../lib/types";
import CookbookCard from "./CookbookCard";

type CookbookGridProps = {
  recipes: AppRecipe[];
  savedRecipeIds: number[];
  onRemoveSaved: (id: number) => void;
  onDeleteRecipe: (id: number) => void;
  onAddToGrocery: (recipe: AppRecipe) => number;
};

export default function CookbookGrid({
  recipes,
  savedRecipeIds,
  onRemoveSaved,
  onDeleteRecipe,
  onAddToGrocery,
}: CookbookGridProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
            All recipes
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-[#fff8ef]">
            Your cookbook collection
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-stone-400">
          Open a recipe, add ingredients to your grocery list, or keep your
          collection tidy.
        </p>
      </div>

      <div className="grid gap-6">
        {recipes.map((recipe) => (
          <CookbookCard
            key={recipe.id}
            recipe={recipe}
            isSaved={savedRecipeIds.includes(recipe.id)}
            onRemoveSaved={onRemoveSaved}
            onDeleteRecipe={onDeleteRecipe}
            onAddToGrocery={onAddToGrocery}
          />
        ))}
      </div>
    </section>
  );
}
