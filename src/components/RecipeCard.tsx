"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecipeRating, RecipeRating } from "../lib/ratings";
import StarRating from "./StarRating";

type RecipeCardProps = {
  id: number;
  title: string;
  image: string;
  cookTime?: number;
  calories?: number;
  matchedIngredients: number;
  totalIngredients: number;
  selectedIngredients: string[];
  isBestMatch?: boolean;
  origin?: "mock" | "imported" | "user";
  ingredients?: string[];
};

export default function RecipeCard({
  id,
  title,
  image,
  cookTime,
  calories,
  matchedIngredients,
  totalIngredients,
  selectedIngredients,
  isBestMatch,
  origin,
  ingredients = [],
}: RecipeCardProps) {
  const router = useRouter();
  const [rating, setRating] = useState<RecipeRating | null>(null);

  useEffect(() => {
    setRating(getRecipeRating(id));
  }, [id]);

  const handleClick = () => {
    const query = selectedIngredients.length
      ? `?ingredients=${selectedIngredients.join(",")}`
      : "";

    router.push(`/recipes/${id}${query}`);
  };

  return (
    <div
      suppressHydrationWarning
      onClick={handleClick}
      className="group relative flex flex-col justify-between cursor-pointer overflow-hidden rounded-4xl border border-stone-200/90 bg-white text-stone-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl dark:border-white/10 dark:bg-stone-900/90 dark:text-white dark:hover:border-amber-400/40 dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
    >
      {/* STATIC ROCK-SOLID IMAGE CONTAINER - NO SCALING JITTER */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-100 dark:bg-stone-950">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover block transition-opacity duration-200 group-hover:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

        {isBestMatch && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-stone-950 shadow-md">
            <span>✨</span> Best match
          </div>
        )}

        {origin === "imported" && (
          <div className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-stone-950 shadow-md">
            Imported
          </div>
        )}

        {origin === "user" && (
          <div className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-stone-900/80 px-3 py-1 text-xs font-bold text-stone-100 shadow-md backdrop-blur-sm">
            Your recipe
          </div>
        )}

        {/* BOTTOM IMAGE STATS BAR */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-2">
            {cookTime !== undefined && (
              <span className="rounded-full bg-black/40 px-2.5 py-0.5 backdrop-blur-md">
                ⏱ {cookTime} min
              </span>
            )}
            {calories !== undefined && (
              <span className="rounded-full bg-black/40 px-2.5 py-0.5 backdrop-blur-md">
                🔥 {calories} kcal
              </span>
            )}
          </div>

          {rating !== null && (
            <div className="rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-md">
              <StarRating value={rating} readOnly size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* CONTENT DETAILS */}
      <div className="flex flex-col justify-between flex-1 p-5 space-y-3">
        <div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-stone-900 transition-colors duration-200 group-hover:text-amber-600 dark:text-stone-50 dark:group-hover:text-amber-300">
            {title}
          </h3>

          {ingredients.length > 0 && (
            <p className="mt-1 line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
              {ingredients.slice(0, 4).join(" • ")}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-white/6 flex items-center justify-between">
          {selectedIngredients.length > 0 ? (
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Matches {matchedIngredients} of {totalIngredients} ingredients
            </div>
          ) : (
            <div className="text-xs font-semibold text-stone-400 dark:text-stone-500">
              {totalIngredients} ingredients
            </div>
          )}

          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:translate-x-1">
            View recipe →
          </span>
        </div>
      </div>
    </div>
  );
}
