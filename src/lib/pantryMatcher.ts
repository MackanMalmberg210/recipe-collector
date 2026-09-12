import type { AppRecipe } from "./types";
import type { PantryItem } from "./groceries";
import { sanitizeCulinaryText } from "./culinaryTextSanitizer";

export type PantryRecipeMatch = {
  recipe: AppRecipe;
  totalIngredientsCount: number;
  matchedIngredientsCount: number;
  missingIngredientsCount: number;
  matchPercentage: number;
  matchedItems: string[];
  missingItems: string[];
};

// Common kitchen generic words to ignore during matching
const STOP_WORDS = new Set([
  "and", "or", "fresh", "freshly", "dried", "chopped", "finely", "diced", "sliced",
  "minced", "crushed", "melted", "divided", "to", "taste", "for", "serving", "garnish",
  "optional", "peeled", "halved", "packed", "cups", "cup", "tbsp", "tsp", "tablespoon",
  "tablespoons", "teaspoon", "teaspoons", "oz", "ounce", "ounces", "lb", "lbs", "pound",
  "pounds", "gram", "grams", "g", "kg", "ml", "dl", "cl", "l", "pinch", "dash", "clove",
  "cloves", "can", "cans", "stalk", "stalks", "bunch", "bunches", "sprig", "sprigs", "st",
  "msk", "tsk", "krm", "färsk", "fryst", "hackad", "skivad", "riven", "tärnad"
]);

function extractIngredientKeywords(ingredientText: string): string[] {
  const sanitized = sanitizeCulinaryText(ingredientText).toLowerCase();
  // Remove numbers and fraction symbols
  const withoutNumbers = sanitized.replace(/[\d\/\.\,\-\–\—\(\)]+/g, " ");
  const tokens = withoutNumbers
    .split(/[\s,.-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return tokens;
}

export function calculateRecipePantryMatch(
  recipe: AppRecipe,
  inStockPantryItems: PantryItem[],
  precomputedPantryKeywords?: string[]
): PantryRecipeMatch {
  const pantryKeywords = precomputedPantryKeywords || inStockPantryItems
    .filter((p) => p.inStock)
    .map((p) => p.name.toLowerCase().trim());

  const ingredients = recipe.ingredients || [];
  const totalCount = Math.max(1, ingredients.length);

  const matchedItems: string[] = [];
  const missingItems: string[] = [];

  ingredients.forEach((ing) => {
    const rawClean = sanitizeCulinaryText(ing).trim();
    if (!rawClean) return;

    const ingTokens = extractIngredientKeywords(rawClean);
    const rawLower = rawClean.toLowerCase();

    // Check if any in-stock pantry item matches this ingredient
    const hasMatch = pantryKeywords.some((pantryWord) => {
      if (rawLower.includes(pantryWord) || pantryWord.includes(rawLower)) return true;
      const pantryTokens = pantryWord.split(/\s+/);
      return pantryTokens.some((pt) => pt.length >= 3 && ingTokens.includes(pt));
    });

    if (hasMatch) {
      matchedItems.push(rawClean);
    } else {
      missingItems.push(rawClean);
    }
  });

  const matchedCount = matchedItems.length;
  const missingCount = missingItems.length;
  const matchPercentage = Math.round((matchedCount / totalCount) * 100);

  return {
    recipe,
    totalIngredientsCount: totalCount,
    matchedIngredientsCount: matchedCount,
    missingIngredientsCount: missingCount,
    matchPercentage,
    matchedItems,
    missingItems,
  };
}

export function findBestPantryMatches(
  recipes: AppRecipe[],
  pantryItems: PantryItem[],
  minMatchPercentage: number = 20
): PantryRecipeMatch[] {
  const inStock = pantryItems.filter((p) => p.inStock);
  if (inStock.length === 0 || recipes.length === 0) return [];

  const pantryKeywords = inStock.map((p) => p.name.toLowerCase().trim());

  // Deduplicate recipes by ID so identical recipes never compete or swap
  const uniqueRecipesMap = new Map<number | string, AppRecipe>();
  for (const r of recipes) {
    if (r && r.id != null && !uniqueRecipesMap.has(r.id)) {
      uniqueRecipesMap.set(r.id, r);
    }
  }

  const evaluated = Array.from(uniqueRecipesMap.values()).map((recipe) =>
    calculateRecipePantryMatch(recipe, inStock, pantryKeywords)
  );

  // Filter recipes that have at least some match and sort by highest match percentage with rock-solid tie-breakers
  return evaluated
    .filter((m) => m.matchedIngredientsCount > 0 && m.matchPercentage >= minMatchPercentage)
    .sort((a, b) => {
      // 1. Highest match percentage first
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      // 2. Fewest missing ingredients first
      if (a.missingIngredientsCount !== b.missingIngredientsCount) {
        return a.missingIngredientsCount - b.missingIngredientsCount;
      }
      // 3. Most matched ingredients first (e.g. 5/5 matched is richer than 1/1)
      if (b.matchedIngredientsCount !== a.matchedIngredientsCount) {
        return b.matchedIngredientsCount - a.matchedIngredientsCount;
      }
      // 4. Stable alphabetical title tie-breaker
      const titleA = (a.recipe.title || "").trim();
      const titleB = (b.recipe.title || "").trim();
      const titleDiff = titleA.localeCompare(titleB, "sv", { sensitivity: "base" });
      if (titleDiff !== 0) return titleDiff;
      // 5. Absolute ID tie-breaker
      return String(a.recipe.id).localeCompare(String(b.recipe.id));
    });
}

export function rollRandomPantryRecipe(matches: PantryRecipeMatch[]): PantryRecipeMatch | null {
  if (!matches || matches.length === 0) return null;
  // Weight towards top 50% matches
  const pool = matches.slice(0, Math.max(3, Math.ceil(matches.length * 0.6)));
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || matches[0];
}
