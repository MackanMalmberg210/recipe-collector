import { recipes as mockRecipes } from "./mockData";
import { normalizeRecipe } from "./recipeNormalizer";
import type {
   AppRecipe,
   SavedImportedRecipe,
   SavedUserRecipe,
} from "./types";

const IMPORTED_RECIPES_KEY = "importedRecipes";
const USER_RECIPES_KEY = "userRecipes";
const SAVED_RECIPES_KEY = "savedRecipes";

export function getMockRecipes(): AppRecipe[] {
   return mockRecipes.map((recipe) =>
      normalizeRecipe({
         ...recipe,
         origin: "mock",
      }),
   );
}

export function getImportedRecipes(): AppRecipe[] {
   if (typeof window === "undefined") return [];

   const storedImportedRecipes = localStorage.getItem(IMPORTED_RECIPES_KEY);

   if (!storedImportedRecipes) return [];

   try {
      const parsed = JSON.parse(storedImportedRecipes) as SavedImportedRecipe[];

      return parsed.map((recipe) =>
         normalizeRecipe({
            ...recipe,
            calories: recipe.nutrition?.calories,
            origin: "imported",
         }),
      );
   } catch {
      localStorage.removeItem(IMPORTED_RECIPES_KEY);
      return [];
   }
}

export function getUserRecipes(): AppRecipe[] {
   if (typeof window === "undefined") return [];

   const storedUserRecipes = localStorage.getItem(USER_RECIPES_KEY);

   if (!storedUserRecipes) return [];

   try {
      const parsed = JSON.parse(storedUserRecipes) as SavedUserRecipe[];

      return parsed.map((recipe) =>
         normalizeRecipe({
            ...recipe,
            origin: "user",
         }),
      );
   } catch {
      localStorage.removeItem(USER_RECIPES_KEY);
      return [];
   }
}

export function getSavedRecipeIds(): number[] {
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

export function saveRecipeId(id: number) {
   if (typeof window === "undefined") return;

   const savedIds = getSavedRecipeIds();

   if (savedIds.includes(id)) return;

   localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify([...savedIds, id]));
}

export function removeSavedRecipe(id: number) {
   if (typeof window === "undefined") return;

   const savedIds = getSavedRecipeIds();
   const updatedSavedIds = savedIds.filter((savedId) => savedId !== id);

   localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedSavedIds));
}

export function removeImportedRecipe(id: number) {
   if (typeof window === "undefined") return;

   const storedImportedRecipes = localStorage.getItem(IMPORTED_RECIPES_KEY);

   if (storedImportedRecipes) {
      try {
         const parsed = JSON.parse(storedImportedRecipes) as SavedImportedRecipe[];
         const updatedImportedRecipes = parsed.filter((recipe) => recipe.id !== id);

         localStorage.setItem(
            IMPORTED_RECIPES_KEY,
            JSON.stringify(updatedImportedRecipes),
         );
      } catch {
         localStorage.removeItem(IMPORTED_RECIPES_KEY);
      }
   }

   removeSavedRecipe(id);
}

export function removeUserRecipe(id: number) {
   if (typeof window === "undefined") return;

   const storedUserRecipes = localStorage.getItem(USER_RECIPES_KEY);

   if (storedUserRecipes) {
      try {
         const parsed = JSON.parse(storedUserRecipes) as SavedUserRecipe[];
         const updatedUserRecipes = parsed.filter((recipe) => recipe.id !== id);

         localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(updatedUserRecipes));
      } catch {
         localStorage.removeItem(USER_RECIPES_KEY);
      }
   }

   removeSavedRecipe(id);
}

export function getAllRecipes(): AppRecipe[] {
   return [...getMockRecipes(), ...getImportedRecipes(), ...getUserRecipes()];
}