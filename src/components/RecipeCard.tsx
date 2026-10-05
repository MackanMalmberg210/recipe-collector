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
  isPublic?: boolean;
  authorName?: string;
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
  isPublic,
  authorName,
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
      className="group relative flex flex-col justify-between cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/90 bg-white text-slate-900 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:bg-[#151311] dark:text-white dark:hover:border-amber-500/35 dark:hover:bg-[#1a1715] dark:hover:shadow-[0_16px_36px_rgba(245,158,11,0.06)] isolate"
    >
      {/* TALL CINEMATIC APPETIZING IMAGE CONTAINER */}
      <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-slate-900 dark:bg-[#151311]">
        <img
          src={image}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover object-center block transform transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* TOP BADGES: REFINED ACCENTED OBSIDIAN PILLS */}
        <div className="absolute left-3.5 top-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10">
          {isBestMatch ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-white shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Best match</span>
            </div>
          ) : (
            <div />
          )}

          {isPublic && authorName ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-semibold text-white shadow-xs">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>By {authorName}</span>
            </div>
          ) : origin === "imported" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/85 backdrop-blur-md border border-amber-500/30 px-3 py-1 text-xs font-semibold text-white shadow-xs">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Imported</span>
            </div>
          ) : origin === "user" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-md border border-amber-500/20 px-3 py-1 text-xs font-bold text-stone-950 shadow-xs">
              <span>My Recipe</span>
            </div>
          ) : null}
        </div>

        {/* BOTTOM FLOATING STATS BAR */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs font-medium text-white pointer-events-none">
          <div className="flex items-center gap-2">
            {cookTime !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 text-xs font-medium text-white shadow-xs">
                <svg className="h-3.5 w-3.5 text-amber-300/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{cookTime}m</span>
              </span>
            )}
            {calories !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 text-xs font-medium text-white shadow-xs">
                <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                <span>{calories} kcal</span>
              </span>
            )}
          </div>

          {rating !== null && (
            <div className="rounded-xl bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 shadow-xs">
              <StarRating value={rating} readOnly size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* CONTENT DETAILS */}
      <div className="relative z-10 -mt-px flex flex-col justify-between flex-1 p-5 space-y-3.5 bg-white dark:bg-[#151311] rounded-b-[24px]">
        <div>
          <h3 className="line-clamp-2 text-lg sm:text-xl font-bold leading-snug antialiased text-slate-950 transition-colors duration-200 group-hover:text-amber-600 dark:text-stone-100 dark:group-hover:text-amber-400">
            {title}
          </h3>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          {selectedIngredients.length > 0 ? (
            <div className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Matches {matchedIngredients} of {totalIngredients} ingredients
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-stone-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80 shrink-0" />
              <span>{totalIngredients} ingredients</span>
            </div>
          )}

          <span className="text-xs sm:text-sm font-semibold text-slate-950 dark:text-stone-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-all duration-200 group-hover:translate-x-1 flex items-center gap-1">
            <span>View recipe</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(RecipeCard);

