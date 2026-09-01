export const RECIPE_RATINGS_KEY = "recipeRatings";

export type RecipeRating = 1 | 2 | 3 | 4 | 5;

export type RecipeRatingsMap = Record<number, RecipeRating>;

function isRecipeRating(value: unknown): value is RecipeRating {
   return typeof value === "number" && value >= 1 && value <= 5;
}

let ratingsCache: RecipeRatingsMap | null = null;

export function getRecipeRatings(): RecipeRatingsMap {
   if (typeof window === "undefined") return {};
   if (ratingsCache !== null) return ratingsCache;

   const stored = localStorage.getItem(RECIPE_RATINGS_KEY);

   if (!stored) {
      ratingsCache = {};
      return ratingsCache;
   }

   try {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      const ratings: RecipeRatingsMap = {};

      for (const [key, value] of Object.entries(parsed)) {
         const recipeId = Number(key);

         if (!Number.isFinite(recipeId) || !isRecipeRating(value)) continue;

         ratings[recipeId] = value;
      }

      ratingsCache = ratings;
      return ratings;
   } catch {
      localStorage.removeItem(RECIPE_RATINGS_KEY);
      ratingsCache = {};
      return ratingsCache;
   }
}

export function getRecipeRating(recipeId: number): RecipeRating | null {
   return getRecipeRatings()[recipeId] ?? null;
}

export function saveRecipeRating(
   recipeId: number,
   rating: RecipeRating | null,
) {
   if (typeof window === "undefined") return;

   const ratings = { ...getRecipeRatings() };

   if (rating === null) {
      delete ratings[recipeId];
   } else {
      ratings[recipeId] = rating;
   }

   ratingsCache = ratings;

   if (Object.keys(ratings).length === 0) {
      localStorage.removeItem(RECIPE_RATINGS_KEY);
      return;
   }

   localStorage.setItem(RECIPE_RATINGS_KEY, JSON.stringify(ratings));
}

export const RATING_LABELS: Record<RecipeRating, string> = {
   1: "Poor — wouldn't make again",
   2: "Fair — needs improvement",
   3: "Good — solid recipe",
   4: "Great — would make again",
   5: "Excellent — a favorite",
};
