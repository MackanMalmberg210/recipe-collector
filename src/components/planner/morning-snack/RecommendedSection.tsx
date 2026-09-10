"use client";

import React from "react";
import type { AppRecipe } from "../../../lib/types";
import { RecipeCard } from "./RecipeCard";
import { SparklesIcon } from "../PlannerIcons";
import { type SnackSlot, getSnackSlotConfig } from "./morningSnackFilter";

type RecommendedSectionProps = {
  recipes: AppRecipe[];
  selectedRecipeId: number | null;
  slot?: SnackSlot;
  title?: string;
  onSelectRecipe: (recipe: AppRecipe) => void;
};

export function RecommendedSection({
  recipes,
  selectedRecipeId,
  slot = "morning_snack",
  title,
  onSelectRecipe,
}: RecommendedSectionProps) {
  if (recipes.length === 0) return null;

  const sectionTitle = title ?? getSnackSlotConfig(slot).recommendedTitle;

  return (
    <div className="space-y-3 pb-6 border-b border-[#35312D]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-[#F59E0B] shrink-0" />
          <h3 className="text-base font-semibold text-[#F5F5F4] tracking-tight">
            {sectionTitle}
          </h3>
        </div>
        <span className="text-xs font-medium text-[#A8A29E]">
          Top {recipes.length} picks
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={`recommended-${recipe.id}`}
            recipe={recipe}
            isSelected={recipe.id === selectedRecipeId}
            isRecommended={true}
            onSelect={onSelectRecipe}
          />
        ))}
      </div>
    </div>
  );
}
