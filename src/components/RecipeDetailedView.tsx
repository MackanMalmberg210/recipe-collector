"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AppRecipe } from "../lib/types";
import RecipeActionBar from "./recipe-detail/RecipeActionBar";
import RecipeHero from "./recipe-detail/RecipeHero";
import RecipeIngredientsPanel from "./recipe-detail/RecipeIngredientsPanel";
import RecipeInstructions from "./recipe-detail/RecipeInstructions";
import RecipeNutritionPanel from "./recipe-detail/RecipeNutritionPanel";
import RecipeNotices from "./recipe-detail/RecipeNotices";
import { getAllRecipes } from "../lib/recipes";
import RecipeNotesPanel from "./recipe-detail/RecipeNotesPanel";
import SimilarRecipesPanel from "./recipe-detail/SimilarRecipesPanel";

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
  const searchParams = useSearchParams();

  const [saved, setSaved] = useState(false);
  const [storedIngredients, setStoredIngredients] = useState<string[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [groceryFeedback, setGroceryFeedback] = useState("");
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);

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

  useEffect(() => {
    const storedSavedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);

    if (!storedSavedRecipes) return;

    try {
      const parsed = JSON.parse(storedSavedRecipes) as number[];
      setSaved(parsed.includes(recipe.id));
    } catch {
      localStorage.removeItem(SAVED_RECIPES_KEY);
    }
  }, [recipe.id]);

  useEffect(() => {
    setAllRecipes(getAllRecipes());
  }, []);

  useEffect(() => {
    const storedRecentRecipes = localStorage.getItem(
      RECENTLY_VIEWED_RECIPES_KEY,
    );

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
    ].slice(0, 5);

    localStorage.setItem(RECENTLY_VIEWED_RECIPES_KEY, JSON.stringify(updated));
  }, [recipe.id]);

  const queryIngredients = useMemo(() => {
    const param = searchParams.get("ingredients");
    if (!param) return [];

    return param.split(",").map(normalizeIngredient).filter(Boolean);
  }, [searchParams]);

  const activeSelectedIngredients =
    queryIngredients.length > 0 ? queryIngredients : storedIngredients;

  const normalizedRecipeIngredients = useMemo(
    () => recipe.ingredients.map(normalizeIngredient),
    [recipe.ingredients],
  );

  const matchedSelectedIngredients = useMemo(() => {
    const selectedSet = new Set(activeSelectedIngredients);

    return normalizedRecipeIngredients.filter((ingredient) =>
      selectedSet.has(ingredient),
    );
  }, [normalizedRecipeIngredients, activeSelectedIngredients]);

  useEffect(() => {
    setCheckedIngredients(matchedSelectedIngredients);
  }, [matchedSelectedIngredients, recipe.id]);

  const toggleIngredient = (ingredient: string) => {
    const normalizedIngredient = normalizeIngredient(ingredient);

    setCheckedIngredients((prev) =>
      prev.includes(normalizedIngredient)
        ? prev.filter((item) => item !== normalizedIngredient)
        : [...prev, normalizedIngredient],
    );
  };

  const handleToggleSaved = () => {
    const storedSavedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);

    let parsed: number[] = [];

    if (storedSavedRecipes) {
      try {
        parsed = JSON.parse(storedSavedRecipes) as number[];
      } catch {
        localStorage.removeItem(SAVED_RECIPES_KEY);
      }
    }

    const alreadySaved = parsed.includes(recipe.id);

    const updated = alreadySaved
      ? parsed.filter((id) => id !== recipe.id)
      : [...parsed, recipe.id];

    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updated));
    setSaved(!alreadySaved);
  };

  const checkedCount = checkedIngredients.length;
  const totalCount = recipe.ingredients.length;
  const missingCount = totalCount - checkedCount;

  const progressPercentage = totalCount
    ? Math.round((checkedCount / totalCount) * 100)
    : 0;

  const sortedIngredients = useMemo(() => {
    return [...recipe.ingredients].sort((a, b) => {
      const aChecked = checkedIngredients.includes(normalizeIngredient(a));
      const bChecked = checkedIngredients.includes(normalizeIngredient(b));

      if (aChecked === bChecked) return a.localeCompare(b);

      return aChecked ? -1 : 1;
    });
  }, [recipe.ingredients, checkedIngredients]);

  const missingIngredients = sortedIngredients.filter(
    (ingredient) =>
      !checkedIngredients.includes(normalizeIngredient(ingredient)),
  );

  const handleAddMissingToGroceryList = () => {
    if (missingIngredients.length === 0) {
      setGroceryFeedback("You already have everything for this recipe.");
      return;
    }

    const existingList = localStorage.getItem(GROCERY_LIST_KEY);

    let parsedList: { name: string; bought: boolean }[] = [];

    if (existingList) {
      try {
        parsedList = JSON.parse(existingList) as {
          name: string;
          bought: boolean;
        }[];
      } catch {
        localStorage.removeItem(GROCERY_LIST_KEY);
      }
    }

    const existingNames = new Set(
      parsedList.map((item) => normalizeIngredient(item.name)),
    );

    const newItems = missingIngredients
      .map((ingredient) => normalizeIngredient(ingredient))
      .filter((ingredient) => !existingNames.has(ingredient))
      .map((ingredient) => ({
        name: ingredient,
        bought: false,
      }));

    localStorage.setItem(
      GROCERY_LIST_KEY,
      JSON.stringify([...parsedList, ...newItems]),
    );

    if (newItems.length === 0) {
      setGroceryFeedback("Those ingredients are already in your grocery list.");
      return;
    }

    setGroceryFeedback(
      `Added ${newItems.length} ingredient${newItems.length === 1 ? "" : "s"} to your grocery list.`,
    );
  };

  const instructionSteps =
    recipe.instructions && recipe.instructions.length > 0
      ? recipe.instructions
      : [
          "Prepare all ingredients and place them within reach.",
          "Cook according to the recipe method and timing.",
          "Serve immediately and adjust seasoning to taste.",
        ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0d0b] px-6 py-8 text-white xl:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-96 w-96 rounded-full bg-orange-400/8 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[15%] h-80 w-80 rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-425 flex-col gap-8">
        <RecipeHero recipe={recipe} saved={saved} />

        <RecipeActionBar
          saved={saved}
          groceryFeedback={groceryFeedback}
          missingCount={missingCount}
          onToggleSaved={handleToggleSaved}
          onAddMissingToGroceryList={handleAddMissingToGroceryList}
        />

        <RecipeNotices
          groceryFeedback={groceryFeedback}
          matchedSelectedIngredientsCount={matchedSelectedIngredients.length}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-8">
            <RecipeInstructions steps={instructionSteps} />

            <div className="grid gap-8 lg:grid-cols-2">
              <RecipeNotesPanel recipeId={recipe.id} />
              <SimilarRecipesPanel
                currentRecipe={recipe}
                recipes={allRecipes}
              />
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <RecipeIngredientsPanel
              ingredients={sortedIngredients}
              checkedIngredients={checkedIngredients}
              checkedCount={checkedCount}
              totalCount={totalCount}
              missingCount={missingCount}
              progressPercentage={progressPercentage}
              matchedSelectedIngredientsCount={
                matchedSelectedIngredients.length
              }
              onToggleIngredient={toggleIngredient}
            />

            <RecipeNutritionPanel recipe={recipe} />
          </aside>
        </div>
      </div>
    </main>
  );
}
