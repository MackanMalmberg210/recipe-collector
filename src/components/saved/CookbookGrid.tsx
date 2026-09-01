"use client";

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
  onAddToGrocery: (recipe: AppRecipe) => void;
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
        <div className="space-y-3.5 sm:space-y-4">
          {recipes.map((recipe) => (
            <CookbookListRow
              key={recipe.id}
              recipe={recipe}
              isSaved={savedRecipeIds.includes(recipe.id)}
              isTrashMode={isTrashMode}
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
