"use client";

import React, { memo } from "react";
import type { AppRecipe } from "../../../lib/types";
import { ClockIcon, FlameIcon, PlateIcon, CheckIcon } from "../PlannerIcons";

type RecipeCardProps = {
  recipe: AppRecipe;
  isSelected: boolean;
  isRecommended?: boolean;
  onSelect: (recipe: AppRecipe) => void;
};

export const RecipeCard = memo(function RecipeCard({
  recipe,
  isSelected,
  isRecommended = false,
  onSelect,
}: RecipeCardProps) {
  const { title, image, cookTime, calories, category } = recipe;

  // Single badge priority: RECOMMENDED if recommended; otherwise category if concise
  const singleBadge = isRecommended
    ? "RECOMMENDED"
    : category && category !== "snack" && category.length <= 12
    ? category.toUpperCase()
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(recipe)}
      aria-pressed={isSelected}
      aria-label={`Select ${title}, ${cookTime ? `${cookTime} min, ` : ""}${calories ? `${calories} kcal` : ""}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border text-left transition-all duration-150 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] motion-safe:hover:-translate-y-0.5 ${
        isSelected
          ? "border-[#F59E0B] bg-[#1C1917] shadow-[0_0_22px_rgba(245,158,11,0.18)] ring-1 ring-[#F59E0B]/50"
          : "border-[#35312D] bg-[#1C1917] hover:border-[#4A443E] hover:bg-[#211E1B] hover:shadow-md"
      }`}
    >
      <div className="w-full">
        {/* 4:3 Aspect Ratio Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#151311]">
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#78716C]">
              <PlateIcon className="h-10 w-10 text-[#78716C]" />
            </div>
          )}

          {/* Top Gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Optional Single Badge (Strictly max 1 badge per specification) */}
          {singleBadge && (
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <span
                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                  isRecommended
                    ? "bg-[#F59E0B] text-stone-950 font-black"
                    : "bg-black/70 backdrop-blur-xs text-[#F5F5F4] border border-white/10"
                }`}
              >
                {singleBadge}
              </span>
            </div>
          )}

          {/* Selected Checkmark Feedback Indicator */}
          {isSelected && (
            <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-stone-950 text-xs font-black shadow-sm">
              <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="p-4 space-y-2">
          <h4 className="line-clamp-2 text-[15px] sm:text-base font-semibold text-[#F5F5F4] leading-snug tracking-tight">
            {title}
          </h4>

          {/* Lightweight Inline Secondary Metadata: "1 min · 105 kcal" */}
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#A8A29E]">
            {cookTime !== undefined && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5 text-[#78716C]" />
                <span>{cookTime} min</span>
              </span>
            )}
            {cookTime !== undefined && calories !== undefined && (
              <span className="text-[#78716C]">·</span>
            )}
            {calories !== undefined && (
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="h-3.5 w-3.5 text-[#F59E0B]" />
                <span>{calories} kcal</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between border-t border-[#35312D]/70 px-4 py-2.5 text-[13px] font-semibold bg-[#1C1917]/80">
        <span
          className={
            isSelected
              ? "text-[#F59E0B] font-bold"
              : "text-[#A8A29E] group-hover:text-[#F5F5F4] transition-colors"
          }
        >
          {isSelected ? "Currently selected" : "Select"}
        </span>
        <span
          aria-hidden="true"
          className={`transition-transform duration-150 ${
            isSelected
              ? "text-[#F59E0B]"
              : "text-[#A8A29E] group-hover:text-[#F5F5F4] group-hover:translate-x-0.5 motion-reduce:transform-none"
          }`}
        >
          {isSelected ? "✓" : "→"}
        </span>
      </div>
    </button>
  );
});
