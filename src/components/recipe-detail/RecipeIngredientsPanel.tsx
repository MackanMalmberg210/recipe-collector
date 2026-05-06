"use client";

import { capitalize } from "../../lib/format";

type RecipeIngredientsPanelProps = {
  ingredients: string[];
  checkedIngredients: string[];
  checkedCount: number;
  totalCount: number;
  missingCount: number;
  progressPercentage: number;
  matchedSelectedIngredientsCount: number;
  onToggleIngredient: (ingredient: string) => void;
};

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

export default function RecipeIngredientsPanel({
  ingredients,
  checkedIngredients,
  checkedCount,
  totalCount,
  missingCount,
  progressPercentage,
  matchedSelectedIngredientsCount,
  onToggleIngredient,
}: RecipeIngredientsPanelProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        Ingredients
      </p>

      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#fff8ef]">
            What you need
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            {missingCount === 0
              ? "You have everything checked off."
              : `${missingCount} ingredient${missingCount === 1 ? "" : "s"} missing.`}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-stone-300">
          {checkedCount}/{totalCount}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-stone-400">
          <span>Ready progress</span>
          <span>{progressPercentage}%</span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-white/6">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {matchedSelectedIngredientsCount > 0 && (
        <p className="mb-5 rounded-2xl border border-emerald-200/15 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          You already have {matchedSelectedIngredientsCount} ingredient
          {matchedSelectedIngredientsCount === 1 ? "" : "s"} for this recipe.
        </p>
      )}

      <ul className="space-y-3">
        {ingredients.map((ingredient) => {
          const normalizedIngredient = normalizeIngredient(ingredient);
          const isChecked = checkedIngredients.includes(normalizedIngredient);

          return (
            <li
              key={normalizedIngredient}
              className={`rounded-2xl border px-4 py-3 transition ${
                isChecked
                  ? "border-emerald-200/15 bg-emerald-300/10"
                  : "border-white/10 bg-[#211915]/80 hover:bg-[#261d17]"
              }`}
            >
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleIngredient(ingredient)}
                    className="h-4 w-4 accent-emerald-400"
                  />

                  <span
                    className={`truncate text-sm ${
                      isChecked
                        ? "text-emerald-100 line-through"
                        : "text-stone-100"
                    }`}
                  >
                    {capitalize(ingredient)}
                  </span>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    isChecked
                      ? "bg-emerald-300/10 text-emerald-100"
                      : "bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {isChecked ? "Ready" : "Missing"}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
