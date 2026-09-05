import type { AppRecipe } from "./types";

export const MEAL_PLANNER_KEY = "mealPlanner";

export const WEEK_DAYS = [
   "monday",
   "tuesday",
   "wednesday",
   "thursday",
   "friday",
   "saturday",
   "sunday",
] as const;

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];
export type MealSlot = (typeof MEAL_SLOTS)[number];

export type DayPlan = Record<MealSlot, number | null>;
export type MealPlan = Record<WeekDay, DayPlan>;

export function createEmptyDayPlan(): DayPlan {
   return {
      breakfast: null,
      lunch: null,
      dinner: null,
   };
}

export function createEmptyMealPlan(): MealPlan {
   return {
      monday: createEmptyDayPlan(),
      tuesday: createEmptyDayPlan(),
      wednesday: createEmptyDayPlan(),
      thursday: createEmptyDayPlan(),
      friday: createEmptyDayPlan(),
      saturday: createEmptyDayPlan(),
      sunday: createEmptyDayPlan(),
   };
}

function isDayPlan(value: unknown): value is DayPlan {
   if (!value || typeof value !== "object") return false;

   const candidate = value as Partial<Record<MealSlot, unknown>>;

   return (
      ("breakfast" in candidate || "lunch" in candidate || "dinner" in candidate) &&
      (candidate.breakfast === null ||
         candidate.breakfast === undefined ||
         typeof candidate.breakfast === "number") &&
      (candidate.lunch === null ||
         candidate.lunch === undefined ||
         typeof candidate.lunch === "number") &&
      (candidate.dinner === null ||
         candidate.dinner === undefined ||
         typeof candidate.dinner === "number")
   );
}

export function normalizeStoredMealPlan(
   parsed: Partial<Record<WeekDay, unknown>>,
): MealPlan {
   const emptyPlan = createEmptyMealPlan();

   return WEEK_DAYS.reduce((acc, day) => {
      const value = parsed[day];

      if (isDayPlan(value)) {
         acc[day] = {
            breakfast: value.breakfast ?? null,
            lunch: value.lunch ?? null,
            dinner: value.dinner ?? null,
         };
         return acc;
      }

      if (value === null || typeof value === "number") {
         acc[day] = {
            breakfast: null,
            lunch: null,
            dinner: value,
         };
         return acc;
      }

      acc[day] = emptyPlan[day];
      return acc;
   }, createEmptyMealPlan());
}

export function getStoredMealPlan(): MealPlan {
   if (typeof window === "undefined") {
      return createEmptyMealPlan();
   }

   const stored = localStorage.getItem(MEAL_PLANNER_KEY);

   if (!stored) {
      return createEmptyMealPlan();
   }

   try {
      const parsed = JSON.parse(stored) as Partial<
         Record<WeekDay, DayPlan | number | null>
      >;

      return normalizeStoredMealPlan(parsed);
   } catch {
      localStorage.removeItem(MEAL_PLANNER_KEY);
      return createEmptyMealPlan();
   }
}

export function saveMealPlan(mealPlan: MealPlan) {
   if (typeof window === "undefined") return;

   localStorage.setItem(MEAL_PLANNER_KEY, JSON.stringify(mealPlan));
}

export function clearStoredMealPlan() {
   if (typeof window === "undefined") return;

   localStorage.removeItem(MEAL_PLANNER_KEY);
}

export function formatWeekDay(day: WeekDay) {
   return day.charAt(0).toUpperCase() + day.slice(1);
}

export function formatMealSlot(slot: MealSlot) {
   return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export function getRecipeById(recipes: AppRecipe[], id: number | null) {
   if (id === null) return null;
   return recipes.find((recipe) => recipe.id === id) ?? null;
}

/**
 * Sanitizes meal plan against actual loaded recipes so deleted/ghost recipes are cleared
 */
export function sanitizeMealPlan(mealPlan: MealPlan, allRecipes: AppRecipe[]): MealPlan {
   if (allRecipes.length === 0) return mealPlan;

   const validIds = new Set(allRecipes.map((r) => r.id));
   let hasChanges = false;
   const cleanPlan = createEmptyMealPlan();

   WEEK_DAYS.forEach((day) => {
      MEAL_SLOTS.forEach((slot) => {
         const recipeId = mealPlan[day]?.[slot];
         if (recipeId && validIds.has(recipeId)) {
            cleanPlan[day][slot] = recipeId;
         } else {
            cleanPlan[day][slot] = null;
            if (recipeId) hasChanges = true;
         }
      });
   });

   if (hasChanges) {
      saveMealPlan(cleanPlan);
   }

   return cleanPlan;
}

import { canonicalizeIngredients, capitalize } from "./format";

/**
 * Smart Auto-Planner: avoids duplicate meals, optimizes slots, and maximizes ingredient overlap for budget efficiency
 */
export function smartAutoPlanWeek(
   currentPlan: MealPlan,
   allRecipes: AppRecipe[],
): { nextPlan: MealPlan; filledCount: number } {
   if (allRecipes.length === 0) return { nextPlan: currentPlan, filledCount: 0 };

   const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
   const validIds = new Set(recipeMap.keys());
   const nextPlan = createEmptyMealPlan();
   const usedRecipeIds = new Set<number>();
   const plannedIngredientsSet = new Set<string>();

   // Keep existing valid meals
   WEEK_DAYS.forEach((day) => {
      MEAL_SLOTS.forEach((slot) => {
         const id = currentPlan[day]?.[slot];
         if (id && validIds.has(id)) {
            nextPlan[day][slot] = id;
            usedRecipeIds.add(id);
            const r = recipeMap.get(id);
            r?.ingredients.forEach((ing) => {
               const list = canonicalizeIngredients(ing);
               list.forEach((c) => plannedIngredientsSet.add(c.toLowerCase()));
            });
         }
      });
   });

   let filledCount = 0;

   // Fill missing slots intelligently
   WEEK_DAYS.forEach((day) => {
      const todayAssignedCategories = new Set<string>();

      // Check what categories are already used today
      MEAL_SLOTS.forEach((slot) => {
         const id = nextPlan[day][slot];
         if (id) {
            const r = recipeMap.get(id);
            if (r?.category) todayAssignedCategories.add(r.category);
         }
      });

      MEAL_SLOTS.forEach((slot) => {
         if (nextPlan[day][slot]) return; // Already filled

         // Filter candidates by slot suitability
         const slotFiltered = allRecipes.filter((r) => {
            if (slot === "breakfast") {
               return (
                  r.mealType === "breakfast" ||
                  (r.category && ["breakfast", "bowl"].includes(r.category)) ||
                  (r.cookTime !== undefined && r.cookTime <= 20)
               );
            }
            if (slot === "lunch") {
               return (
                  r.mealType === "lunch" ||
                  (r.category && ["salad", "sandwich", "soup", "bowl", "stir-fry"].includes(r.category)) ||
                  (r.cookTime !== undefined && r.cookTime <= 30)
               );
            }
            // Dinner
            return (
               r.mealType === "dinner" ||
               (r.category && ["main-course", "pasta", "rice", "stir-fry"].includes(r.category)) ||
               r.cookTime === undefined ||
               r.cookTime >= 20
            );
         });

         const pool = slotFiltered.length > 0 ? slotFiltered : allRecipes;

         // Rank candidates by:
         // 1) Not used this week
         // 2) Not same category as today
         // 3) Ingredient overlap with existing planned meals (reduces grocery shopping list!)
         const candidateScores = pool.map((recipe) => {
            let score = 0;
            const isUnused = !usedRecipeIds.has(recipe.id);
            if (isUnused) score += 100;

            const isDifferentCategory = !recipe.category || !todayAssignedCategories.has(recipe.category);
            if (isDifferentCategory) score += 50;

            // Ingredient overlap bonus (smart budget saving)
            let overlapCount = 0;
            recipe.ingredients.forEach((ing) => {
               const list = canonicalizeIngredients(ing);
               list.forEach((c) => {
                  if (plannedIngredientsSet.has(c.toLowerCase())) overlapCount++;
               });
            });
            score += Math.min(overlapCount * 6, 36);

            return { recipe, score };
         });

         candidateScores.sort((a, b) => b.score - a.score);
         const best = candidateScores[0]?.recipe;

         if (best) {
            nextPlan[day][slot] = best.id;
            usedRecipeIds.add(best.id);
            if (best.category) todayAssignedCategories.add(best.category);
            best.ingredients.forEach((ing) => {
               const list = canonicalizeIngredients(ing);
               list.forEach((c) => plannedIngredientsSet.add(c.toLowerCase()));
            });
            filledCount++;
         }
      });
   });

   return { nextPlan, filledCount };
}

/**
 * Smart Surprise Meal for a specific slot
 */
export function smartSurpriseMeal(
   day: WeekDay,
   slot: MealSlot,
   currentPlan: MealPlan,
   allRecipes: AppRecipe[],
): AppRecipe | null {
   if (allRecipes.length === 0) return null;

   const dayExistingIds = new Set(
      MEAL_SLOTS.map((s) => currentPlan[day]?.[s]).filter(Boolean),
   );

   const slotFiltered = allRecipes.filter((r) => {
      if (slot === "breakfast") {
         return (
            r.mealType === "breakfast" ||
            (r.category && ["breakfast", "bowl"].includes(r.category)) ||
            (r.cookTime !== undefined && r.cookTime <= 20)
         );
      }
      if (slot === "lunch") {
         return (
            r.mealType === "lunch" ||
            (r.category && ["salad", "sandwich", "soup", "bowl", "stir-fry"].includes(r.category)) ||
            (r.cookTime !== undefined && r.cookTime <= 30)
         );
      }
      return (
         r.mealType === "dinner" ||
         (r.category && ["main-course", "pasta", "rice", "stir-fry"].includes(r.category)) ||
         r.cookTime === undefined ||
         r.cookTime >= 20
      );
   });

   const pool = slotFiltered.length > 0 ? slotFiltered : allRecipes;

   // Prioritize not used today
   const available = pool.filter((r) => !dayExistingIds.has(r.id));
   const finalPool = available.length > 0 ? available : pool;

   return finalPool[Math.floor(Math.random() * finalPool.length)] || null;
}

export function getPlannedRecipes(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
): AppRecipe[] {
   return WEEK_DAYS.flatMap((day) =>
      MEAL_SLOTS.map((slot) => mealPlan[day]?.[slot]),
   )
      .filter((recipeId): recipeId is number => recipeId !== null && recipeId !== undefined)
      .map((recipeId) => allRecipes.find((recipe) => recipe.id === recipeId))
      .filter((recipe): recipe is AppRecipe => recipe !== undefined);
}

export function countPlannedMeals(mealPlan: MealPlan) {
   return WEEK_DAYS.reduce((total, day) => {
      return (
         total +
         MEAL_SLOTS.filter((slot) => mealPlan[day]?.[slot] !== null && mealPlan[day]?.[slot] !== undefined).length
      );
   }, 0);
}

export function getMealSlotCalories(
   recipes: AppRecipe[],
   recipeId: number | null,
) {
   if (recipeId === null) return 0;

   const recipe = recipes.find((item) => item.id === recipeId);
   return recipe?.calories ?? 0;
}

export function getDayCalories(
   recipes: AppRecipe[],
   dayPlan: DayPlan,
) {
   return MEAL_SLOTS.reduce((total, slot) => {
      return total + getMealSlotCalories(recipes, dayPlan[slot]);
   }, 0);
}

export function getWeekCalories(
   recipes: AppRecipe[],
   mealPlan: MealPlan,
) {
   return WEEK_DAYS.reduce((total, day) => {
      return total + getDayCalories(recipes, mealPlan[day]);
   }, 0);
}

export const DAILY_CALORIE_TARGET_KEY = "dailyCalorieTarget";

export function getStoredDailyCalorieTarget() {
   if (typeof window === "undefined") return 2200;

   const stored = localStorage.getItem(DAILY_CALORIE_TARGET_KEY);

   if (!stored) return 2200;

   const parsed = Number(stored);

   return Number.isNaN(parsed) || parsed <= 0 ? 2200 : parsed;
}

export function saveDailyCalorieTarget(target: number) {
   if (typeof window === "undefined") return;

   localStorage.setItem(DAILY_CALORIE_TARGET_KEY, String(target));
}

export function getCalorieDifferenceLabel(
   dayCalories: number,
   targetCalories: number,
) {
   const difference = dayCalories - targetCalories;

   if (difference === 0) return "On target";
   if (difference > 0) return `${difference} kcal over`;
   return `${Math.abs(difference)} kcal under`;
}

export type PlannerGroceryItem = {
   name: string;
   recipes: AppRecipe[];
};

export function getUniquePlannedIngredients(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
): PlannerGroceryItem[] {
   const plannedRecipes = getPlannedRecipes(allRecipes, mealPlan);
   const ingredientMap = new Map<string, PlannerGroceryItem>();

   for (const recipe of plannedRecipes) {
      for (const ingredient of recipe.ingredients) {
         const canonicalList = canonicalizeIngredients(ingredient);

         for (const item of canonicalList) {
            const key = item.toLowerCase().trim();
            if (!key) continue;

            const existingItem = ingredientMap.get(key);

            if (existingItem) {
               if (!existingItem.recipes.some((r) => r.id === recipe.id)) {
                  existingItem.recipes.push(recipe);
               }
               continue;
            }

            ingredientMap.set(key, {
               name: item,
               recipes: [recipe],
            });
         }
      }
   }

   return Array.from(ingredientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
   );
}