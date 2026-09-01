"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecipeRating, type RecipeRating } from "../lib/ratings";
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
  priority?: boolean;
};

function RecipeCard({
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
  priority = true,
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
      onClick={handleClick}
      className="group relative flex flex-col justify-between cursor-pointer overflow-hidden rounded-3xl border border-stone-200/90 bg-white text-stone-900 shadow-sm transform-gpu transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl dark:border-white/10 dark:bg-[#181310] dark:text-white dark:hover:border-amber-400/40 dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      {/* TALL CINEMATIC APPETIZING IMAGE CONTAINER */}
      <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-stone-200/80 dark:bg-[#221a15]">
        <img
          src={image}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover block transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* TOP BADGES */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {isBestMatch ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#052e16]/90 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300 shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Best match</span>
            </div>
          ) : (
            <div />
          )}

          {origin === "imported" && (
            <div className="inline-flex items-center gap-1 rounded-full bg-[#3b1702]/90 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 shadow-md">
              <span>Imported</span>
            </div>
          )}

          {origin === "user" && (
            <div className="inline-flex items-center gap-1 rounded-full bg-[#1c1917]/90 border border-white/20 px-3 py-1 text-xs font-bold text-stone-100 shadow-md">
              <span>Your recipe</span>
            </div>
          )}
        </div>

        {/* BOTTOM FLOATING STATS BAR */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white pointer-events-none">
          <div className="flex items-center gap-1.5">
            {cookTime !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#0c0907]/85 border border-white/15 px-2.5 py-1 text-[11px] font-bold text-stone-200 shadow-xs">
                <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{cookTime} min</span>
              </span>
            )}
            {calories !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#0c0907]/85 border border-white/15 px-2.5 py-1 text-[11px] font-bold text-stone-200 shadow-xs">
                <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                <span>{calories} kcal</span>
              </span>
            )}
          </div>

          {rating !== null && (
            <div className="rounded-lg bg-[#0c0907]/85 border border-white/15 px-2 py-1 shadow-xs">
              <StarRating value={rating} readOnly size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* CONTENT DETAILS */}
      <div className="flex flex-col justify-between flex-1 p-5 space-y-4">
        <div>
          <h3 className="line-clamp-2 text-lg sm:text-xl font-bold leading-snug tracking-tight text-stone-900 transition-colors duration-200 group-hover:text-amber-600 dark:text-stone-100 dark:group-hover:text-amber-300">
            {title}
          </h3>
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-white/8 flex items-center justify-between">
          {selectedIngredients.length > 0 ? (
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Matches {matchedIngredients} of {totalIngredients} ingredients
            </div>
          ) : (
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {totalIngredients} ingredients
            </div>
          )}

          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1">
            <span>View recipe</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(RecipeCard);
