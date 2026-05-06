"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

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
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    const query = selectedIngredients.length
      ? `?ingredients=${selectedIngredients.join(",")}`
      : "";

    router.push(`/recipes/${id}${query}`);
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    setShowPreview(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const previewIngredients = ingredients.slice(0, 6);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/8 bg-stone-900/80 text-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    >
      <div className="relative">
        <img src={image} alt={title} className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        {isBestMatch && (
          <div className="absolute left-3 top-3 z-10 inline-flex rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-stone-950 shadow-md">
            Best match
          </div>
        )}

        {origin === "imported" && (
          <div className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 shadow-md">
            Imported
          </div>
        )}

        {origin === "user" && (
          <div className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-100 shadow-md">
            Your recipe
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-stone-50">
            {title}
          </h3>
        </div>

        <div className="flex justify-between text-sm text-stone-400">
          <span>{cookTime !== undefined ? `⏱ ${cookTime} min` : "⏱ —"}</span>
          <span>{calories !== undefined ? `🔥 ${calories} kcal` : "🔥 —"}</span>
        </div>

        <div className="text-sm font-medium text-emerald-300">
          Matches {matchedIngredients} of your ingredients
        </div>

        <div className="text-xs text-stone-500">
          {totalIngredients} total ingredients
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(10,10,10,0.08)_0%,rgba(12,10,8,0.82)_35%,rgba(12,10,8,0.96)_100%)] p-5 transition-all duration-300 ${
          showPreview ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="truncate text-sm font-semibold text-stone-50">
              Quick preview
            </h4>

            <span className="text-xs text-stone-400">
              {matchedIngredients}/{totalIngredients} matched
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2 text-xs text-stone-300">
            {cookTime !== undefined && (
              <span className="rounded-full bg-white/6 px-2.5 py-1">
                ⏱ {cookTime} min
              </span>
            )}
            {calories !== undefined && (
              <span className="rounded-full bg-white/6 px-2.5 py-1">
                🔥 {calories} kcal
              </span>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-400">
              Ingredients
            </p>

            {previewIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {previewIngredients.map((ingredient) => (
                  <span
                    key={`${id}-${ingredient}`}
                    className="rounded-full border border-white/8 bg-white/6 px-2.5 py-1 text-xs text-stone-200"
                  >
                    {capitalizeWords(ingredient)}
                  </span>
                ))}

                {ingredients.length > 6 && (
                  <span className="rounded-full border border-white/8 bg-white/6 px-2.5 py-1 text-xs text-stone-400">
                    +{ingredients.length - 6} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                No ingredients preview available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
