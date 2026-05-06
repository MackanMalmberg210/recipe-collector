import type { AppRecipe, RecipeMatchResult, RecipeSortMode } from "./types";


export const SELECTED_INGREDIENTS_KEY = "selectedIngredients";
export const GROCERY_LIST_KEY = "groceryList";
export const SAVED_RECIPES_KEY = "savedRecipes";
export const RECENTLY_VIEWED_KEY = "recentlyViewedRecipes";

export type GroceryItem = {
   name: string;
   bought: boolean;
};

export function normalizeIngredient(value: string) {
   return value.trim().toLowerCase();
}

export function getStoredIngredients(): string[] {
   if (typeof window === "undefined") return [];

   const storedIngredients = localStorage.getItem(SELECTED_INGREDIENTS_KEY);

   if (!storedIngredients) return [];

   try {
      const parsed = JSON.parse(storedIngredients) as string[];
      return parsed.map(normalizeIngredient);
   } catch {
      localStorage.removeItem(SELECTED_INGREDIENTS_KEY);
      return [];
   }
}

export function getStoredGroceryList(): GroceryItem[] {
   if (typeof window === "undefined") return [];

   const storedGroceryList = localStorage.getItem(GROCERY_LIST_KEY);

   if (!storedGroceryList) return [];

   try {
      const parsed = JSON.parse(storedGroceryList) as GroceryItem[];

      return parsed.map((item) => ({
         name: normalizeIngredient(item.name),
         bought: Boolean(item.bought),
      }));
   } catch {
      localStorage.removeItem(GROCERY_LIST_KEY);
      return [];
   }
}

export function getStoredSavedRecipeIds(): number[] {
   if (typeof window === "undefined") return [];

   const storedSavedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);

   if (!storedSavedRecipes) return [];

   try {
      return JSON.parse(storedSavedRecipes) as number[];
   } catch {
      localStorage.removeItem(SAVED_RECIPES_KEY);
      return [];
   }
}

export function getStoredRecentlyViewedIds(): number[] {
   if (typeof window === "undefined") return [];

   const storedRecentlyViewed = localStorage.getItem(RECENTLY_VIEWED_KEY);

   if (!storedRecentlyViewed) return [];

   try {
      return JSON.parse(storedRecentlyViewed) as number[];
   } catch {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      return [];
   }
}

export function getRecipeSuggestions(
   allRecipes: AppRecipe[],
   searchTerm: string,
   limit = 5,
) {
   if (!searchTerm.trim()) return [];

   const normalizedSearch = searchTerm.toLowerCase();

   return allRecipes
      .filter(
         (recipe) =>
            recipe.title.toLowerCase().includes(normalizedSearch) ||
            recipe.ingredients.some((ingredient) =>
               ingredient.toLowerCase().includes(normalizedSearch),
            ),
      )
      .map((recipe) => recipe.title)
      .slice(0, limit);
}

export function getFilteredRecipes(
   allRecipes: AppRecipe[],
   selectedIngredients: string[],
   searchTerm: string,
   hideZeroMatches: boolean,
   sortMode: RecipeSortMode,
): RecipeMatchResult[] {
   const normalizedSearch = searchTerm.toLowerCase();

   return allRecipes
      .map((recipe) => {
         const normalizedRecipeIngredients = recipe.ingredients.map(
            normalizeIngredient,
         );

         const matchedIngredients = selectedIngredients.filter((ingredient) =>
            normalizedRecipeIngredients.includes(ingredient),
         ).length;

         const matchesSearch =
            recipe.title.toLowerCase().includes(normalizedSearch) ||
            recipe.ingredients.some((ingredient) =>
               ingredient.toLowerCase().includes(normalizedSearch),
            );

         return {
            ...recipe,
            matchedIngredients,
            totalIngredients: recipe.ingredients.length,
            matchesSearch,
         };
      })
      .filter((recipe) => recipe.matchesSearch)
      .filter((recipe) =>
         hideZeroMatches && selectedIngredients.length > 0
            ? recipe.matchedIngredients > 0
            : true,
      )
      .sort((a, b) => {
         switch (sortMode) {
            case "cook-time":
               return (
                  (a.cookTime ?? Number.MAX_SAFE_INTEGER) -
                  (b.cookTime ?? Number.MAX_SAFE_INTEGER)
               );

            case "calories":
               return (
                  (a.calories ?? Number.MAX_SAFE_INTEGER) -
                  (b.calories ?? Number.MAX_SAFE_INTEGER)
               );

            case "alphabetical":
               return a.title.localeCompare(b.title);

            case "best-match":
            default:
               if (selectedIngredients.length > 0) {
                  if (b.matchedIngredients !== a.matchedIngredients) {
                     return b.matchedIngredients - a.matchedIngredients;
                  }

                  return (
                     (a.cookTime ?? Number.MAX_SAFE_INTEGER) -
                     (b.cookTime ?? Number.MAX_SAFE_INTEGER)
                  );
               }

               return a.title.localeCompare(b.title);
         }
      });
}

export function getRecentImportedRecipes(
   allRecipes: AppRecipe[],
   limit = 3,
) {
   return allRecipes
      .filter((recipe) => recipe.origin === "imported")
      .sort((a, b) => b.id - a.id)
      .slice(0, limit);
}

export function getSavedPreviewRecipes(
   allRecipes: AppRecipe[],
   savedRecipeIds: number[],
   limit = 3,
) {
   return allRecipes
      .filter((recipe) => savedRecipeIds.includes(recipe.id))
      .slice(0, limit);
}

export function getRecentlyViewedRecipes(
   allRecipes: AppRecipe[],
   recentlyViewedIds: number[],
   limit = 3,
) {
   return recentlyViewedIds
      .map((id) => allRecipes.find((recipe) => recipe.id === id))
      .filter((recipe): recipe is AppRecipe => recipe !== undefined)
      .slice(0, limit);
}

export function addRecipeIngredientsToGrocery(ingredients: string[]) {
   if (typeof window === "undefined") return 0;

   const storedGroceryList = localStorage.getItem(GROCERY_LIST_KEY);

   let groceryList: { name: string; bought: boolean }[] = [];

   if (storedGroceryList) {
      try {
         groceryList = JSON.parse(storedGroceryList);
      } catch {
         localStorage.removeItem(GROCERY_LIST_KEY);
      }
   }

   const existingIngredients = new Set(
      groceryList.map((item) => normalizeIngredient(item.name)),
   );

   const newItems = ingredients
      .map((ingredient) => normalizeIngredient(ingredient))
      .filter((ingredient) => ingredient && !existingIngredients.has(ingredient))
      .map((ingredient) => ({
         name: ingredient,
         bought: false,
      }));

   localStorage.setItem(
      GROCERY_LIST_KEY,
      JSON.stringify([...groceryList, ...newItems]),
   );

   return newItems.length;
}