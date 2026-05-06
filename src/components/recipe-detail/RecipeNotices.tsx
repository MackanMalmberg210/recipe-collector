"use client";

type RecipeNoticesProps = {
  groceryFeedback: string;
  matchedSelectedIngredientsCount: number;
};

export default function RecipeNotices({
  groceryFeedback,
  matchedSelectedIngredientsCount,
}: RecipeNoticesProps) {
  if (!groceryFeedback && matchedSelectedIngredientsCount === 0) return null;

  return (
    <div className="space-y-3">
      {groceryFeedback && (
        <div className="rounded-3xl border border-emerald-200/15 bg-emerald-300/10 px-5 py-4 text-sm font-medium text-emerald-100 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          {groceryFeedback}
        </div>
      )}

      {matchedSelectedIngredientsCount > 0 && (
        <div className="rounded-3xl border border-amber-100/15 bg-amber-100/6 px-5 py-4 text-sm font-medium text-amber-50 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          You already have {matchedSelectedIngredientsCount} ingredient
          {matchedSelectedIngredientsCount === 1 ? "" : "s"} for this recipe.
        </div>
      )}
    </div>
  );
}
