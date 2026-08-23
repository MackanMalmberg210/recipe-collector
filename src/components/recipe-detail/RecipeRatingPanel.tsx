"use client";

import { useEffect, useState } from "react";
import StarRating from "../StarRating";
import {
  RATING_LABELS,
  getRecipeRating,
  saveRecipeRating,
  type RecipeRating,
} from "../../lib/ratings";

type RecipeRatingPanelProps = {
  recipeId: number;
};

export default function RecipeRatingPanel({ recipeId }: RecipeRatingPanelProps) {
  const [rating, setRating] = useState<RecipeRating | null>(null);

  useEffect(() => {
    setRating(getRecipeRating(recipeId));
  }, [recipeId]);

  const handleRatingChange = (nextRating: RecipeRating | null) => {
    setRating(nextRating);
    saveRecipeRating(recipeId, nextRating);
  };

  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        Your rating
      </p>

      <h2 className="text-2xl font-semibold text-[#fff8ef]">
        How was this recipe?
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-400">
        Rate it after trying it out. Consider taste, ease of preparation, and
        overall satisfaction.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StarRating value={rating} onChange={handleRatingChange} size="lg" />

        {rating !== null && (
          <button
            type="button"
            onClick={() => handleRatingChange(null)}
            className="text-sm font-medium text-stone-500 transition hover:text-stone-300"
          >
            Clear rating
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-stone-400">
        {rating !== null
          ? RATING_LABELS[rating]
          : "Tap a star to save your rating locally."}
      </p>
    </section>
  );
}
