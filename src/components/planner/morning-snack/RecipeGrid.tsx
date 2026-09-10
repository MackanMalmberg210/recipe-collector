"use client";

import React from "react";
import type { AppRecipe } from "../../../lib/types";
import { RecipeCard } from "./RecipeCard";
import { type SnackSlot, getSnackSlotConfig } from "./morningSnackFilter";

type RecipeGridProps = {
  recipes: AppRecipe[];
  selectedRecipeId: number | null;
  recommendedIds?: Set<number>;
  totalAvailableCount: number;
  showAllCookbook: boolean;
  slot?: SnackSlot;
  onToggleBrowseCookbook: () => void;
  onSelectRecipe: (recipe: AppRecipe) => void;
};

export function RecipeGrid({
  recipes,
  selectedRecipeId,
  recommendedIds = new Set(),
  totalAvailableCount,
  showAllCookbook,
  slot = "morning_snack",
  onToggleBrowseCookbook,
  onSelectRecipe,
}: RecipeGridProps) {
  const config = getSnackSlotConfig(slot);

  return (
    <div className="space-y-3.5">
      {/* Result Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold text-[#F5F5F4] tracking-tight">
            {showAllCookbook ? "All Cookbook Recipes" : config.gridTitle}
          </h3>
          <span className="text-xs font-medium text-[#78716C]">
            {totalAvailableCount} {totalAvailableCount === 1 ? "recipe" : "recipes"}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleBrowseCookbook}
          className="text-xs font-semibold text-[#F59E0B] hover:text-[#FBBF24] transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
        >
          <span>{showAllCookbook ? "← Filter snacks" : "Browse cookbook →"}</span>
        </button>
      </div>

      {/* 3-Column Responsive Grid with 16px (gap-4) spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isSelected={recipe.id === selectedRecipeId}
            isRecommended={recommendedIds.has(recipe.id)}
            onSelect={onSelectRecipe}
          />
        ))}
      </div>
    </div>
  );
}
