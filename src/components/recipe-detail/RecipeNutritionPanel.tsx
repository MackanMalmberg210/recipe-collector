"use client";

import type { AppRecipe } from "../../lib/types";

type RecipeNutritionPanelProps = {
  recipe: AppRecipe;
};

export default function RecipeNutritionPanel({
  recipe,
}: RecipeNutritionPanelProps) {
  const displayCalories = recipe.calories ?? recipe.nutrition?.calories;
  const hasNutritionData =
    recipe.nutrition !== undefined || displayCalories !== undefined;

  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        Nutrition
      </p>

      <h2 className="mb-5 text-2xl font-semibold text-[#fff8ef]">Overview</h2>

      {hasNutritionData ? (
        <div className="grid grid-cols-2 gap-3">
          {displayCalories !== undefined && (
            <NutritionCard label="Calories" value={displayCalories} />
          )}
          {recipe.nutrition?.protein && (
            <NutritionCard label="Protein" value={recipe.nutrition.protein} />
          )}
          {recipe.nutrition?.carbohydrates && (
            <NutritionCard
              label="Carbs"
              value={recipe.nutrition.carbohydrates}
            />
          )}
          {recipe.nutrition?.fat && (
            <NutritionCard label="Fat" value={recipe.nutrition.fat} />
          )}
          {recipe.nutrition?.sodium && (
            <NutritionCard label="Sodium" value={recipe.nutrition.sodium} />
          )}
          {recipe.nutrition?.fiber && (
            <NutritionCard label="Fiber" value={recipe.nutrition.fiber} />
          )}
        </div>
      ) : (
        <p className="text-sm leading-6 text-stone-400">
          No nutrition data available for this recipe yet.
        </p>
      )}
    </section>
  );
}

function NutritionCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#211915]/80 p-4">
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-[#fff8ef]">{value}</p>
    </div>
  );
}
