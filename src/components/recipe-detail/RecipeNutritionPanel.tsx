"use client";

import type { AppRecipe } from "../../lib/types";

type RecipeNutritionPanelProps = {
  recipe: AppRecipe;
};

export default function RecipeNutritionPanel({
  recipe,
}: RecipeNutritionPanelProps) {
  const n = recipe.nutrition;
  const displayCalories = recipe.calories ?? n?.calories;
  const hasNutritionData = n !== undefined || displayCalories !== undefined;

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#17120f]/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
        Nutrition Facts
      </p>

      <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-stone-950 dark:text-[#fff8ef]">
        Nutrient Profile
      </h2>

      {hasNutritionData ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
          {displayCalories !== undefined && (
            <NutritionCard label="Calories" value={`${displayCalories} kcal`} highlight />
          )}
          {n?.protein && (
            <NutritionCard label="Protein" value={n.protein} />
          )}
          {n?.carbohydrates && (
            <NutritionCard label="Total Carbs" value={n.carbohydrates} />
          )}
          {n?.fat && (
            <NutritionCard label="Total Fat" value={n.fat} />
          )}
          {n?.saturatedFat && (
            <NutritionCard label="Saturated Fat" value={n.saturatedFat} />
          )}
          {n?.fiber && (
            <NutritionCard label="Dietary Fiber" value={n.fiber} />
          )}
          {n?.sugar && (
            <NutritionCard label="Sugars" value={n.sugar} />
          )}
          {n?.sodium && (
            <NutritionCard label="Sodium" value={n.sodium} />
          )}
          {n?.cholesterol && (
            <NutritionCard label="Cholesterol" value={n.cholesterol} />
          )}
          {n?.potassium && (
            <NutritionCard label="Potassium" value={n.potassium} />
          )}
          {n?.vitaminC && (
            <NutritionCard label="Vitamin C" value={n.vitaminC} />
          )}
          {n?.vitaminA && (
            <NutritionCard label="Vitamin A" value={n.vitaminA} />
          )}
          {n?.iron && (
            <NutritionCard label="Iron" value={n.iron} />
          )}
          {n?.phosphorus && (
            <NutritionCard label="Phosphorus" value={n.phosphorus} />
          )}
        </div>
      ) : (
        <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
          No nutrition data available for this recipe yet.
        </p>
      )}
    </section>
  );
}

function NutritionCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        highlight
          ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          : "border-stone-200 bg-stone-50/60 hover:bg-stone-100/80 dark:border-white/10 dark:bg-[#211915]/80 dark:hover:bg-[#261d17]"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">{label}</p>
      <p className="mt-1.5 text-base font-extrabold text-stone-950 dark:text-[#fff8ef]">{value}</p>
    </div>
  );
}
