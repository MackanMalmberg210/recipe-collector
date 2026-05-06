"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllRecipes } from "../lib/recipes";
import type { AppRecipe, RecipeSortMode } from "../lib/types";
import HomeHero from "../components/home/HomeHero";
import HomeSectionNav from "../components/home/HomeSectionNav";
import PantrySearchSection from "../components/home/PantrySearchSection";
import RecipeMatchesSection from "../components/home/RecipeMatchesSection";
import PlannerPreviewSection from "../components/home/PlannerPreviewSection";
import KitchenHubSection from "../components/home/KitchenHubSection";
import {
  GROCERY_LIST_KEY,
  SELECTED_INGREDIENTS_KEY,
  getFilteredRecipes,
  getRecipeSuggestions,
  getRecentImportedRecipes,
  getSavedPreviewRecipes,
  getStoredGroceryList,
  getStoredIngredients,
  getStoredRecentlyViewedIds,
  getStoredSavedRecipeIds,
  getRecentlyViewedRecipes,
  normalizeIngredient,
} from "../lib/home";
import {
  countPlannedMeals,
  createEmptyMealPlan,
  getPlannedRecipeSummaries,
  getStoredMealPlan,
  type MealPlan,
} from "../lib/planner";

type GroceryItem = {
  name: string;
  bought: boolean;
};

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hideZeroMatches, setHideZeroMatches] = useState(false);
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<number[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>(createEmptyMealPlan());
  const [sortMode, setSortMode] = useState<RecipeSortMode>("best-match");

  useEffect(() => {
    setSelectedIngredients(getStoredIngredients());
    setGroceryList(getStoredGroceryList());
    setSavedRecipeIds(getStoredSavedRecipeIds());
    setRecentlyViewedIds(getStoredRecentlyViewedIds());
    setMealPlan(getStoredMealPlan());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    localStorage.setItem(
      SELECTED_INGREDIENTS_KEY,
      JSON.stringify(selectedIngredients),
    );
  }, [selectedIngredients, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(groceryList));
  }, [groceryList, hasHydrated]);

  useEffect(() => {
    const handleFocus = () => {
      setGroceryList(getStoredGroceryList());
      setSavedRecipeIds(getStoredSavedRecipeIds());
      setRecentlyViewedIds(getStoredRecentlyViewedIds());
      setMealPlan(getStoredMealPlan());
      setAllRecipes(getAllRecipes());
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    setAllRecipes(getAllRecipes());
  }, []);

  const handleAddIngredient = (ingredient: string) => {
    const normalizedIngredient = normalizeIngredient(ingredient);

    if (!normalizedIngredient) return;

    setSelectedIngredients((prev) =>
      prev.includes(normalizedIngredient)
        ? prev
        : [...prev, normalizedIngredient],
    );
  };

  const handleRemoveIngredient = (ingredient: string) => {
    const normalizedIngredient = normalizeIngredient(ingredient);

    setSelectedIngredients((prev) =>
      prev.filter((item) => item !== normalizedIngredient),
    );
  };

  const handleRemoveGroceryItem = (name: string) => {
    const normalizedName = normalizeIngredient(name);

    setGroceryList((prev) =>
      prev.filter((item) => item.name !== normalizedName),
    );
  };

  const handleToggleBought = (name: string) => {
    const normalizedName = normalizeIngredient(name);

    setGroceryList((prev) =>
      prev.map((item) =>
        item.name === normalizedName ? { ...item, bought: !item.bought } : item,
      ),
    );
  };

  const handleClearGroceryList = () => {
    setGroceryList([]);
  };

  const suggestions = useMemo(
    () => getRecipeSuggestions(allRecipes, searchTerm),
    [allRecipes, searchTerm],
  );

  const filteredRecipes = useMemo(
    () =>
      getFilteredRecipes(
        allRecipes,
        selectedIngredients,
        searchTerm,
        hideZeroMatches,
        sortMode,
      ),
    [allRecipes, selectedIngredients, searchTerm, hideZeroMatches, sortMode],
  );

  const importedRecipes = useMemo(
    () => allRecipes.filter((recipe) => recipe.origin === "imported"),
    [allRecipes],
  );

  const recentImportedRecipes = useMemo(
    () => getRecentImportedRecipes(allRecipes, 6),
    [allRecipes],
  );

  const savedPreviewRecipes = useMemo(
    () => getSavedPreviewRecipes(allRecipes, savedRecipeIds, 6),
    [allRecipes, savedRecipeIds],
  );

  const recentlyViewedRecipes = useMemo(
    () => getRecentlyViewedRecipes(allRecipes, recentlyViewedIds, 6),
    [allRecipes, recentlyViewedIds],
  );

  const plannedMealsCount = useMemo(
    () => countPlannedMeals(mealPlan),
    [mealPlan],
  );

  const plannedRecipeSummaries = useMemo(
    () => getPlannedRecipeSummaries(allRecipes, mealPlan),
    [allRecipes, mealPlan],
  );

  const daysRemaining = 7 - plannedMealsCount;

  return (
    <main className="min-h-screen bg-[#0f0d0b] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-96 w-96 rounded-full bg-amber-400/8 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[15%] h-80 w-80 rounded-full bg-orange-500/6 blur-3xl" />
      </div>

      <div className="relative px-6 py-8 xl:px-10">
        <div className="mx-auto w-full max-w-425">
          <HomeHero
            totalRecipes={allRecipes.length}
            selectedIngredientsCount={selectedIngredients.length}
            groceryItemsCount={groceryList.length}
            importedRecipesCount={importedRecipes.length}
          />

          <HomeSectionNav />

          <PlannerPreviewSection
            plannedMealsCount={plannedMealsCount}
            daysRemaining={daysRemaining}
            plannedRecipes={plannedRecipeSummaries}
          />

          <KitchenHubSection
            savedRecipes={savedPreviewRecipes}
            importedRecipes={recentImportedRecipes}
            recentlyViewedRecipes={recentlyViewedRecipes}
            savedRecipeIds={savedRecipeIds}
          />

          <PantrySearchSection
            selectedIngredients={selectedIngredients}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            suggestions={suggestions}
            matchedRecipesCount={
              filteredRecipes.filter((recipe) => recipe.matchedIngredients > 0)
                .length
            }
          />

          <RecipeMatchesSection
            filteredRecipes={filteredRecipes}
            selectedIngredients={selectedIngredients}
            hideZeroMatches={hideZeroMatches}
            onHideZeroMatchesChange={setHideZeroMatches}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            groceryList={groceryList}
            onToggleBought={handleToggleBought}
            onRemoveGroceryItem={handleRemoveGroceryItem}
            onClearGroceryList={handleClearGroceryList}
          />
        </div>
      </div>
    </main>
  );
}
