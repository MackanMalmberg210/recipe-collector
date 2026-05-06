"use client";

import { useEffect, useMemo, useState } from "react";
import CookbookEmptyState from "../../components/saved/CookbookEmptyState";
import CookbookGrid from "../../components/saved/CookbookGrid";
import RecentRecipesStrip from "../../components/saved/RecentRecipesStrip";
import SavedHero from "../../components/saved/SavedHero";
import SavedStats from "../../components/saved/SavedStats";
import SavedToolbar, {
  type SortMode,
  type SourceFilter,
} from "../../components/saved/SavedToolbar";
import {
  getAllRecipes,
  getImportedRecipes,
  getSavedRecipeIds,
  getUserRecipes,
  removeImportedRecipe,
  removeSavedRecipe,
  removeUserRecipe,
} from "../../lib/recipes";
import type { AppRecipe } from "../../lib/types";
import { addRecipeIngredientsToGrocery } from "../../lib/home";

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getRecipeTimestamp(recipe: AppRecipe) {
  const record = recipe as AppRecipe & {
    createdAt?: string | number;
    importedAt?: string | number;
    savedAt?: string | number;
  };

  const candidate = record.createdAt ?? record.importedAt ?? record.savedAt;

  if (typeof candidate === "number") return candidate;

  if (typeof candidate === "string") {
    const parsed = new Date(candidate).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getRecipeSearchTokens(recipe: AppRecipe) {
  return [
    recipe.title,
    ...recipe.ingredients,
    ...(recipe.tags ?? []),
    ...(recipe.category ? [recipe.category] : []),
    ...(recipe.mealType ? [recipe.mealType] : []),
  ];
}

function getSourceFilterValue(recipe: AppRecipe): SourceFilter {
  if (recipe.origin === "user") return "created";
  if (recipe.origin === "imported") return "imported";
  return "saved";
}

export default function SavedRecipesPage() {
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<AppRecipe[]>([]);
  const [importedRecipes, setImportedRecipes] = useState<AppRecipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [groceryFeedback, setGroceryFeedback] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      setSavedRecipeIds(getSavedRecipeIds());
      setAllRecipes(getAllRecipes());
      setUserRecipes(getUserRecipes());
      setImportedRecipes(getImportedRecipes());
      setHasHydrated(true);
    };

    loadData();

    const handleFocus = () => loadData();
    const handleStorage = () => loadData();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const savedRecipes = useMemo(() => {
    if (savedRecipeIds.length === 0) return [];

    return allRecipes.filter((recipe) => savedRecipeIds.includes(recipe.id));
  }, [allRecipes, savedRecipeIds]);

  const cookbookRecipes = useMemo(() => {
    const byId = new Map<number, AppRecipe>();

    savedRecipes.forEach((recipe) => {
      byId.set(recipe.id, recipe);
    });

    userRecipes.forEach((recipe) => {
      byId.set(recipe.id, recipe);
    });

    importedRecipes.forEach((recipe) => {
      byId.set(recipe.id, recipe);
    });

    return Array.from(byId.values());
  }, [savedRecipes, userRecipes, importedRecipes]);

  const filteredRecipes = useMemo(() => {
    const query = normalizeText(searchQuery);

    const filtered = cookbookRecipes.filter((recipe) => {
      const matchesSource =
        sourceFilter === "all" || getSourceFilterValue(recipe) === sourceFilter;

      if (!matchesSource) return false;

      if (!query) return true;

      const searchableText = getRecipeSearchTokens(recipe)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    const sorted = [...filtered];

    sorted.sort((a, b) => {
      if (sortMode === "alphabetical") {
        return a.title.localeCompare(b.title);
      }

      if (sortMode === "cookTime") {
        const aCookTime = a.cookTime ?? Number.MAX_SAFE_INTEGER;
        const bCookTime = b.cookTime ?? Number.MAX_SAFE_INTEGER;
        return aCookTime - bCookTime;
      }

      if (sortMode === "oldest") {
        return getRecipeTimestamp(a) - getRecipeTimestamp(b);
      }

      return getRecipeTimestamp(b) - getRecipeTimestamp(a);
    });

    return sorted;
  }, [cookbookRecipes, searchQuery, sourceFilter, sortMode]);

  const handleAddToGrocery = (recipe: AppRecipe) => {
    return addRecipeIngredientsToGrocery(recipe.ingredients);
  };

  const handleRemoveSaved = (id: number) => {
    removeSavedRecipe(id);
    setSavedRecipeIds((prev) => prev.filter((savedId) => savedId !== id));
  };

  const handleDeleteRecipe = (id: number) => {
    const recipe = cookbookRecipes.find((item) => item.id === id);

    if (!recipe) return;

    if (recipe.origin === "user") {
      removeUserRecipe(id);
      setUserRecipes((prev) => prev.filter((item) => item.id !== id));
      setAllRecipes((prev) => prev.filter((item) => item.id !== id));
    }

    if (recipe.origin === "imported") {
      removeImportedRecipe(id);
      setImportedRecipes((prev) => prev.filter((item) => item.id !== id));
      setAllRecipes((prev) => prev.filter((item) => item.id !== id));
    }

    setSavedRecipeIds((prev) => prev.filter((savedId) => savedId !== id));
  };

  if (!hasHydrated) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0f0d0b] px-6 py-8 text-white xl:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute right-[-8%] top-[10%] h-96 w-96 rounded-full bg-orange-400/8 blur-3xl" />
          <div className="absolute bottom-[-8%] left-[15%] h-80 w-80 rounded-full bg-emerald-500/6 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-425">
          <div className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-8 text-stone-300 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            Loading your cookbook...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0d0b] px-6 py-8 text-white xl:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-96 w-96 rounded-full bg-orange-400/8 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[15%] h-80 w-80 rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-425 flex-col gap-8">
        <SavedHero />

        <SavedStats
          totalCount={cookbookRecipes.length}
          savedCount={savedRecipes.length}
          importedCount={importedRecipes.length}
          userCount={userRecipes.length}
        />

        <SavedToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          resultCount={filteredRecipes.length}
        />

        {groceryFeedback && (
          <div className="rounded-3xl border border-emerald-200/15 bg-emerald-300/10 px-5 py-4 text-sm font-medium text-emerald-100 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            {groceryFeedback}
          </div>
        )}

        {cookbookRecipes.length > 0 && (
          <RecentRecipesStrip recipes={cookbookRecipes} />
        )}

        {filteredRecipes.length === 0 ? (
          <CookbookEmptyState hasRecipes={cookbookRecipes.length > 0} />
        ) : (
          <CookbookGrid
            recipes={filteredRecipes}
            savedRecipeIds={savedRecipeIds}
            onRemoveSaved={handleRemoveSaved}
            onDeleteRecipe={handleDeleteRecipe}
            onAddToGrocery={handleAddToGrocery}
          />
        )}
      </div>
    </main>
  );
}
