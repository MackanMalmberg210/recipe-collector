import {
   normalizeSpoonacularRecipe,
   type SpoonacularRecipeInput,
} from "./recipeNormalizer";
import type { AppRecipe } from "./types";

const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

type SpoonacularImportResponse = SpoonacularRecipeInput;

type SpoonacularSearchResponse = {
   results?: SpoonacularRecipeInput[];
};

function getSpoonacularApiKey() {
   return process.env.SPOONACULAR_API_KEY;
}

function createSpoonacularUrl(path: string, params: Record<string, string>) {
   const apiKey = getSpoonacularApiKey();

   if (!apiKey) {
      throw new Error("Missing SPOONACULAR_API_KEY environment variable.");
   }

   const url = new URL(`${SPOONACULAR_BASE_URL}${path}`);

   url.searchParams.set("apiKey", apiKey);

   for (const [key, value] of Object.entries(params)) {
      if (value) {
         url.searchParams.set(key, value);
      }
   }

   return url;
}

async function fetchSpoonacular<T>(url: URL): Promise<T> {
   const response = await fetch(url, {
      headers: {
         Accept: "application/json",
      },
      next: {
         revalidate: 60 * 60,
      },
   });

   if (!response.ok) {
      throw new Error(`Spoonacular request failed with status ${response.status}.`);
   }

   return response.json() as Promise<T>;
}

export async function importRecipeFromUrl(urlToImport: string): Promise<AppRecipe> {
   const url = createSpoonacularUrl("/recipes/extract", {
      url: urlToImport,
      addRecipeNutrition: "true",
   });

   const data = await fetchSpoonacular<SpoonacularImportResponse>(url);

   return normalizeSpoonacularRecipe(data, "imported");
}

export async function searchRecipes(query: string): Promise<AppRecipe[]> {
   const url = createSpoonacularUrl("/recipes/complexSearch", {
      query,
      number: "12",
      addRecipeInformation: "true",
      addRecipeNutrition: "true",
      fillIngredients: "true",
   });

   const data = await fetchSpoonacular<SpoonacularSearchResponse>(url);

   return (data.results ?? []).map((recipe) =>
      normalizeSpoonacularRecipe(recipe, "imported"),
   );
}