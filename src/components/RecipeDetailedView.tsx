"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AppRecipe } from "../lib/types";
import RecipeHero from "./recipe-detail/RecipeHero";
import RecipeVideoPlayer from "./recipe-detail/RecipeVideoPlayer";
import RecipeInstructions from "./recipe-detail/RecipeInstructions";
import RecipeJournalPanel from "./recipe-detail/RecipeJournalPanel";
import RecipeIngredientsPanel from "./recipe-detail/RecipeIngredientsPanel";
import RecipeNutritionPanel from "./recipe-detail/RecipeNutritionPanel";
import SimilarRecipesPanel from "./recipe-detail/SimilarRecipesPanel";
import CookModeModal from "./recipe-detail/CookModeModal";
import ShareRecipeModal from "./recipe-detail/ShareRecipeModal";
import ConfirmModal from "./ui/ConfirmModal";
import { useToast } from "./ui/ToastProvider";
import {
  getAllRecipesWithCloud,
  getSavedRecipeIds,
  moveRecipeToTrash,
  restoreRecipeFromTrash,
  saveRecipeId,
  removeSavedRecipe,
} from "../lib/recipes";
import { getRecipeRating } from "../lib/ratings";

type RecipeDetailedViewProps = {
  recipe: AppRecipe;
};

const SELECTED_INGREDIENTS_KEY = "selectedIngredients";
const GROCERY_LIST_KEY = "groceryList";
const SAVED_RECIPES_KEY = "savedRecipes";
const RECENTLY_VIEWED_RECIPES_KEY = "recentlyViewedRecipes";

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

export default function RecipeDetailedView({
  recipe,
}: RecipeDetailedViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, info } = useToast();

  const [isFavorite, setIsFavorite] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<number[]>([]);
  const [storedIngredients, setStoredIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [isCookModeOpen, setIsCookModeOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddedToGrocery, setIsAddedToGrocery] = useState(false);
  const [lastAddedItems, setLastAddedItems] = useState<string[]>([]);
  const [recipeRating, setRecipeRating] = useState<number | null>(null);

  // Load rating and listen for updates
  useEffect(() => {
    setRecipeRating(getRecipeRating(recipe.id));

    const handleRatingUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ recipeId: number; rating: number }>;
      if (customEvent.detail && customEvent.detail.recipeId === recipe.id) {
        setRecipeRating(customEvent.detail.rating);
      }
    };

    window.addEventListener("recipe_rating_updated", handleRatingUpdated);
    return () => {
      window.removeEventListener("recipe_rating_updated", handleRatingUpdated);
    };
  }, [recipe.id]);

  // Load pantry ingredients
  useEffect(() => {
    const localIngredients = localStorage.getItem(SELECTED_INGREDIENTS_KEY);
    if (!localIngredients) return;

    try {
      const parsed = JSON.parse(localIngredients) as string[];
      setStoredIngredients(parsed.map(normalizeIngredient));
    } catch {
      localStorage.removeItem(SELECTED_INGREDIENTS_KEY);
    }
  }, []);

  // Check if recipe is favorited
  useEffect(() => {
    const savedIds = getSavedRecipeIds();
    setSavedRecipeIds(savedIds);
    setIsFavorite(savedIds.includes(recipe.id));
  }, [recipe.id]);

  // Load all recipes for recommendation shelf
  useEffect(() => {
    getAllRecipesWithCloud().then((recipes) => {
      setAllRecipes(recipes);
    });
  }, []);

  // Save to recently viewed
  useEffect(() => {
    const storedRecentRecipes = localStorage.getItem(RECENTLY_VIEWED_RECIPES_KEY);
    let parsed: number[] = [];

    if (storedRecentRecipes) {
      try {
        parsed = JSON.parse(storedRecentRecipes) as number[];
      } catch {
        localStorage.removeItem(RECENTLY_VIEWED_RECIPES_KEY);
      }
    }

    const updated = [
      recipe.id,
      ...parsed.filter((id) => id !== recipe.id),
    ].slice(0, 8);

    localStorage.setItem(RECENTLY_VIEWED_RECIPES_KEY, JSON.stringify(updated));
  }, [recipe.id]);

  const queryIngredients = useMemo(() => {
    const param = searchParams.get("ingredients");
    if (!param) return [];
    return param.split(",").map(normalizeIngredient).filter(Boolean);
  }, [searchParams]);

  const activePantryIngredients = useMemo(() => {
    return queryIngredients.length > 0 ? queryIngredients : storedIngredients;
  }, [queryIngredients, storedIngredients]);

  const matchedSelectedIngredients = useMemo(() => {
    return recipe.ingredients.filter((ingredient) => {
      const normalizedRecipeIngredient = normalizeIngredient(ingredient);
      return activePantryIngredients.some(
        (selected) =>
          normalizedRecipeIngredient.includes(selected) ||
          selected.includes(normalizedRecipeIngredient),
      );
    });
  }, [recipe.ingredients, activePantryIngredients]);

  // Automatically check off ingredients matched from pantry on load
  useEffect(() => {
    if (matchedSelectedIngredients.length > 0) {
      setCheckedIngredients(
        matchedSelectedIngredients.map((item) => normalizeIngredient(item)),
      );
    }
  }, [matchedSelectedIngredients]);

  const toggleIngredient = (ingredient: string) => {
    const normalized = normalizeIngredient(ingredient);
    setCheckedIngredients((prev) =>
      prev.includes(normalized)
        ? prev.filter((item) => item !== normalized)
        : [...prev, normalized],
    );
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeSavedRecipe(recipe.id);
      setIsFavorite(false);
      setSavedRecipeIds((prev) => prev.filter((id) => id !== recipe.id));
      info("Removed from your Favorites.");
    } else {
      saveRecipeId(recipe.id);
      setIsFavorite(true);
      setSavedRecipeIds((prev) => [...prev, recipe.id]);
      success("Added to your Favorites! ★");
    }
  };

  const handleToggleSimilarFavorite = (id: number) => {
    if (savedRecipeIds.includes(id)) {
      removeSavedRecipe(id);
      setSavedRecipeIds((prev) => prev.filter((savedId) => savedId !== id));
      if (id === recipe.id) setIsFavorite(false);
      info("Removed from your Favorites.");
    } else {
      saveRecipeId(id);
      setSavedRecipeIds((prev) => [...prev, id]);
      if (id === recipe.id) setIsFavorite(true);
      success("Added to your Favorites! ★");
    }
  };

  const checkedCount = checkedIngredients.length;
  const totalCount = recipe.ingredients.length;
  const missingCount = Math.max(0, totalCount - checkedCount);
  const progressPercentage = totalCount
    ? Math.round((checkedCount / totalCount) * 100)
    : 0;

  // Check if missing ingredients are already in the grocery list
  const missingIngredients = useMemo(() => {
    return recipe.ingredients.filter(
      (ingredient) => !checkedIngredients.includes(normalizeIngredient(ingredient)),
    );
  }, [recipe.ingredients, checkedIngredients]);

  const handleAddMissingToGroceryList = () => {
    if (missingIngredients.length === 0) {
      info("You already have all ingredients checked off!");
      return;
    }

    const existingList = localStorage.getItem(GROCERY_LIST_KEY);
    let parsedList: { name: string; bought: boolean }[] = [];

    if (existingList) {
      try {
        parsedList = JSON.parse(existingList) as { name: string; bought: boolean }[];
      } catch {
        localStorage.removeItem(GROCERY_LIST_KEY);
      }
    }

    const existingNames = new Set(
      parsedList.map((item) => normalizeIngredient(item.name)),
    );

    const newItems = missingIngredients
      .filter((ingredient) => !existingNames.has(normalizeIngredient(ingredient)))
      .map((ingredient) => ({
        name: ingredient,
        bought: false,
      }));

    if (newItems.length === 0) {
      info("All missing ingredients are already in your grocery list! 🛒");
      return;
    }

    const updated = [...parsedList, ...newItems];
    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updated));
    setLastAddedItems(newItems.map((i) => normalizeIngredient(i.name)));
    setIsAddedToGrocery(true);

    window.dispatchEvent(
      new CustomEvent("grocery_items_updated", {
        detail: { count: newItems.length },
      }),
    );

    success(`Added ${newItems.length} missing ingredient${newItems.length === 1 ? "" : "s"} to grocery list! 🛒`);
  };

  const handleUndoAddMissing = () => {
    if (lastAddedItems.length === 0) return;
    const existingList = localStorage.getItem(GROCERY_LIST_KEY);
    if (!existingList) return;

    try {
      const parsedList = JSON.parse(existingList) as { name: string; bought: boolean }[];
      const filtered = parsedList.filter(
        (item) => !lastAddedItems.includes(normalizeIngredient(item.name)),
      );
      localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(filtered));
      setIsAddedToGrocery(false);
      setLastAddedItems([]);
      window.dispatchEvent(new CustomEvent("grocery_items_updated"));
      info("Removed added ingredients from grocery list.");
    } catch {
      // Ignore
    }
  };

  const handleDeleteRecipe = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setIsDeleteModalOpen(false);
    moveRecipeToTrash(recipe);

    success(`"${recipe.title}" moved to Trash`, {
      label: "Undo",
      onClick: () => {
        restoreRecipeFromTrash(recipe.id);
        success(`"${recipe.title}" restored!`);
      },
    });

    router.push("/saved");
  };

  return (
    <main className="min-h-screen bg-[#fbf9f5] px-4 py-8 text-stone-900 transition dark:bg-[#0e0c0a] dark:text-[#fff8ef] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* TOP BACK BREADCRUMB */}
        <div>
          <Link
            href="/saved"
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-300/90 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-stone-700 shadow-2xs hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          >
            <span>←</span>
            <span>Back to Cookbook</span>
          </Link>
        </div>

        {/* HERO SECTION (INTEGRATED ACTION CONTROLS & FAVORITE STAR) */}
        <RecipeHero
          recipe={recipe}
          saved={isFavorite}
          rating={recipeRating}
          missingCount={missingCount}
          isAddedToGrocery={isAddedToGrocery}
          onToggleFavorite={handleToggleFavorite}
          onAddMissingToGroceryList={handleAddMissingToGroceryList}
          onUndoAddMissing={handleUndoAddMissing}
          onOpenCookMode={() => setIsCookModeOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onDeleteRecipe={recipe.origin !== "mock" ? handleDeleteRecipe : undefined}
        />

        {/* HOLISTIC 2-COLUMN CULINARY LAYOUT */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1.1fr_450px] 2xl:grid-cols-[1.25fr_480px]">
          
          {/* LEFT COLUMN: ACTIVE COOKING FLOW */}
          <div className="space-y-8 min-w-0">
            {/* 1. Video Player (renders only if video exists, 0 space if absent) */}
            <RecipeVideoPlayer recipe={recipe} />

            {/* 2. Step-by-Step Instructions with Cooking Highlights */}
            <RecipeInstructions
              steps={recipe.instructions || []}
              onOpenCookMode={() => setIsCookModeOpen(true)}
            />

            {/* 3. Combined Cooking Journal (Ratings & Chef's Note Card) */}
            <RecipeJournalPanel recipeId={recipe.id} />
          </div>

          {/* RIGHT COLUMN: KITCHEN SIDEBAR (STICKY) */}
          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            {/* 1. Ingredients with Clean Straight-Line Alignment & Scaler */}
            <RecipeIngredientsPanel
              ingredients={recipe.ingredients}
              ingredientGroups={recipe.ingredientGroups}
              baseServings={recipe.servings || 4}
              checkedIngredients={checkedIngredients}
              checkedCount={checkedCount}
              totalCount={totalCount}
              missingCount={missingCount}
              progressPercentage={progressPercentage}
              matchedSelectedIngredientsCount={matchedSelectedIngredients.length}
              onToggleIngredient={toggleIngredient}
              onAddMissingToGroceryList={handleAddMissingToGroceryList}
              onUndoAddMissing={handleUndoAddMissing}
              isAddedToGrocery={isAddedToGrocery}
            />

            {/* 2. Full Nutrition Profile */}
            <RecipeNutritionPanel recipe={recipe} />
          </aside>
        </div>

        {/* HORIZONTAL DISCOVERY SHELF: SIMILAR RECIPES */}
        <SimilarRecipesPanel
          currentRecipe={recipe}
          recipes={allRecipes}
          savedRecipeIds={savedRecipeIds}
          onToggleSave={handleToggleSimilarFavorite}
        />
      </div>

      {/* FULLSCREEN COOK MODE MODAL */}
      <CookModeModal
        recipe={recipe}
        isOpen={isCookModeOpen}
        onClose={() => setIsCookModeOpen(false)}
      />

      {/* RICH MULTI-CHANNEL SHARE MODAL */}
      <ShareRecipeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        recipe={recipe}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Move Recipe to Trash?"
        description={`"${recipe.title}" will be moved to your Trash. You can restore it anytime within 30 days.`}
        confirmLabel="Move to Trash"
        cancelLabel="Keep Recipe"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </main>
  );
}
