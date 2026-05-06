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

type LegacyMealPlan = Record<WeekDay, number | null>;

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
         // Bakåtkompatibilitet med gamla modellen:
         // monday: 12 -> monday.dinner = 12
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

export function getPlannedRecipes(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
): AppRecipe[] {
   return WEEK_DAYS.flatMap((day) =>
      MEAL_SLOTS.map((slot) => mealPlan[day][slot]),
   )
      .filter((recipeId): recipeId is number => recipeId !== null)
      .map((recipeId) => allRecipes.find((recipe) => recipe.id === recipeId))
      .filter((recipe): recipe is AppRecipe => recipe !== undefined);
}

export function countPlannedMeals(mealPlan: MealPlan) {
   return WEEK_DAYS.reduce((total, day) => {
      return (
         total +
         MEAL_SLOTS.filter((slot) => mealPlan[day][slot] !== null).length
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

export function getPlannedRecipeSummaries(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
   limit = 3,
) {
   return WEEK_DAYS.flatMap((day) =>
      MEAL_SLOTS.map((slot) => {
         const recipeId = mealPlan[day][slot];
         if (recipeId === null) return null;

         const recipe = allRecipes.find((item) => item.id === recipeId);
         if (!recipe) return null;

         return {
            day,
            slot,
            recipe,
         };
      }),
   )
      .filter(
         (
            item,
         ): item is {
            day: WeekDay;
            slot: MealSlot;
            recipe: AppRecipe;
         } => item !== null,
      )
      .slice(0, limit);
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

function normalizeIngredient(value: string) {
   return value.trim().toLowerCase();
}

export function getUniquePlannedIngredients(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
): PlannerGroceryItem[] {
   const plannedRecipes = getPlannedRecipes(allRecipes, mealPlan);
   const ingredientMap = new Map<string, PlannerGroceryItem>();

   for (const recipe of plannedRecipes) {
      for (const ingredient of recipe.ingredients) {
         const normalizedIngredient = normalizeIngredient(ingredient);

         if (!normalizedIngredient) continue;

         const existingItem = ingredientMap.get(normalizedIngredient);

         if (existingItem) {
            if (!existingItem.recipes.some((item) => item.id === recipe.id)) {
               existingItem.recipes.push(recipe);
            }

            continue;
         }

         ingredientMap.set(normalizedIngredient, {
            name: normalizedIngredient,
            recipes: [recipe],
         });
      }
   }

   return Array.from(ingredientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
   );
}

export function getPlannedIngredientsCount(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
) {
   return getUniquePlannedIngredients(allRecipes, mealPlan).length;
}

export function getAverageDailyCalories(
   allRecipes: AppRecipe[],
   mealPlan: MealPlan,
) {
   return Math.round(getWeekCalories(allRecipes, mealPlan) / WEEK_DAYS.length);
}

export function getPlannedMealSlotsCount(mealPlan: MealPlan) {
   return WEEK_DAYS.length * MEAL_SLOTS.length;
}

export function getPlannerCompletionPercentage(mealPlan: MealPlan) {
   const plannedMeals = countPlannedMeals(mealPlan);
   const totalSlots = getPlannedMealSlotsCount(mealPlan);

   if (totalSlots === 0) return 0;

   return Math.round((plannedMeals / totalSlots) * 100);
}