"use client";

import { useState, useRef, useEffect } from "react";
import type { AppRecipe } from "../../lib/types";
import CookbookGridCard from "./CookbookGridCard";
import CookbookListRow from "./CookbookListRow";
import type { ViewMode } from "./SavedToolbar";

type CookbookGridProps = {
  recipes: AppRecipe[];
  savedRecipeIds: number[];
  viewMode?: ViewMode;
  isTrashMode?: boolean;
  onRemoveSaved: (id: number) => void;
  onToggleSave?: (id: number) => void;
  onDeleteRecipe: (recipe: AppRecipe) => void;
  onRestoreRecipe?: (id: number) => void;
  onAddToGrocery: (recipe: AppRecipe) => number;
  onQuickPeek?: (recipe: AppRecipe) => void;
};

export default function CookbookGrid({
  recipes,
  savedRecipeIds,
  viewMode = "grid",
  isTrashMode = false,
  onRemoveSaved,
  onToggleSave,
  onDeleteRecipe,
  onRestoreRecipe,
  onAddToGrocery,
  onQuickPeek,
}: CookbookGridProps) {
  // WARM HOVER SYSTEM: Instant switching between recipes once warm
  const [activeHoverId, setActiveHoverId] = useState<number | null>(null);
  const isWarmRef = useRef(false);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleHoverEnter = (id: number) => {
    if (isTrashMode) return;

    // Clear any cooldown reset timer
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }

    if (isWarmRef.current) {
      // Warm state: Instant switch (0ms delay!)
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      setActiveHoverId(id);
    } else {
      // Cold state: 300ms intent delay
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      startTimerRef.current = setTimeout(() => {
        isWarmRef.current = true;
        setActiveHoverId(id);
      }, 300);
    }
  };

  const handleHoverLeave = (id: number) => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }

    setActiveHoverId((prev) => (prev === id ? null : prev));

    // Keep warm for 400ms grace period so moving to adjacent items is instant
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      isWarmRef.current = false;
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  return (
    <section className="space-y-6">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <CookbookGridCard
              key={recipe.id}
              recipe={recipe}
              isSaved={savedRecipeIds.includes(recipe.id)}
              isTrashMode={isTrashMode}
              isHoverActive={activeHoverId === recipe.id}
              onHoverEnter={() => handleHoverEnter(recipe.id)}
              onHoverLeave={() => handleHoverLeave(recipe.id)}
              onRemoveSaved={onRemoveSaved}
              onToggleSave={onToggleSave}
              onDeleteRecipe={onDeleteRecipe}
              onRestoreRecipe={onRestoreRecipe}
              onAddToGrocery={onAddToGrocery}
              onQuickPeek={onQuickPeek}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {recipes.map((recipe) => (
            <CookbookListRow
              key={recipe.id}
              recipe={recipe}
              isSaved={savedRecipeIds.includes(recipe.id)}
              isTrashMode={isTrashMode}
              isHoverActive={activeHoverId === recipe.id}
              onHoverEnter={() => handleHoverEnter(recipe.id)}
              onHoverLeave={() => handleHoverLeave(recipe.id)}
              onRemoveSaved={onRemoveSaved}
              onToggleSave={onToggleSave}
              onDeleteRecipe={onDeleteRecipe}
              onRestoreRecipe={onRestoreRecipe}
              onAddToGrocery={onAddToGrocery}
              onQuickPeek={onQuickPeek}
            />
          ))}
        </div>
      )}
    </section>
  );
}
