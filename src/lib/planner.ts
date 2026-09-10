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

export const MAIN_MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;
export const SNACK_SLOTS = [
   "morning_snack",
   "afternoon_snack",
   "evening_snack",
] as const;

export const MEAL_SLOTS = [
   "breakfast",
   "morning_snack",
   "lunch",
   "afternoon_snack",
   "dinner",
   "evening_snack",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];
export type MainMealSlot = (typeof MAIN_MEAL_SLOTS)[number];
export type SnackSlot = (typeof SNACK_SLOTS)[number];
export type MealSlot = (typeof MEAL_SLOTS)[number];

export type DayPlan = Record<MealSlot, number | null>;
export type MealPlan = Record<WeekDay, DayPlan>;

export function createEmptyDayPlan(): DayPlan {
   return {
      breakfast: null,
      morning_snack: null,
      lunch: null,
      afternoon_snack: null,
      dinner: null,
      evening_snack: null,
   };
}

export const PLANNER_QUICK_SNACKS_KEY = "plannerQuickSnacks";

export function getStoredQuickSnacks(): AppRecipe[] {
   if (typeof window === "undefined") return [];
   try {
      const raw = localStorage.getItem(PLANNER_QUICK_SNACKS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
   } catch {
      return [];
   }
}

export function saveQuickSnack(snack: {
   title: string;
   calories?: number;
   image?: string;
   portion?: string;
}): AppRecipe {
   const existing = getStoredQuickSnacks();
   const id = -Math.abs(Date.now());
   const newQuickSnack: AppRecipe = {
      id,
      title: snack.title.trim(),
      image: snack.image || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=80",
      calories: snack.calories || 150,
      cookTime: 1,
      servings: 1,
      category: "snack",
      mealType: "snack",
      origin: "user",
      ingredients: [snack.portion || snack.title.trim()],
      instructions: ["Ready to enjoy."],
      tags: ["quick-snack"],
   };

   const next = [newQuickSnack, ...existing.filter((s) => s.id !== id)];
   if (typeof window !== "undefined") {
      localStorage.setItem(PLANNER_QUICK_SNACKS_KEY, JSON.stringify(next));
   }
   return newQuickSnack;
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
      (candidate.morning_snack === null ||
         candidate.morning_snack === undefined ||
         typeof candidate.morning_snack === "number") &&
      (candidate.lunch === null ||
         candidate.lunch === undefined ||
         typeof candidate.lunch === "number") &&
      (candidate.afternoon_snack === null ||
         candidate.afternoon_snack === undefined ||
         typeof candidate.afternoon_snack === "number") &&
      (candidate.dinner === null ||
         candidate.dinner === undefined ||
         typeof candidate.dinner === "number") &&
      (candidate.evening_snack === null ||
         candidate.evening_snack === undefined ||
         typeof candidate.evening_snack === "number")
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
            morning_snack: value.morning_snack ?? null,
            lunch: value.lunch ?? null,
            afternoon_snack: value.afternoon_snack ?? null,
            dinner: value.dinner ?? null,
            evening_snack: value.evening_snack ?? null,
         };
         return acc;
      }

      if (value === null || typeof value === "number") {
         acc[day] = {
            breakfast: null,
            morning_snack: null,
            lunch: null,
            afternoon_snack: null,
            dinner: value,
            evening_snack: null,
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

   // Background cloud sync to Supabase
   import("./sync/cloudSync").then(({ syncCloudMealPlan }) => {
      syncCloudMealPlan(mealPlan).catch(() => {});
   });
}

export async function getStoredMealPlanWithCloud(): Promise<MealPlan> {
   const local = getStoredMealPlan();
   try {
      const { fetchCloudMealPlan } = await import("./sync/cloudSync");
      const cloud = await fetchCloudMealPlan();
      if (cloud) {
         let hasCloud = false;
         const merged = { ...local };
         for (const day of WEEK_DAYS) {
            for (const slot of MEAL_SLOTS) {
               if (cloud[day] && cloud[day][slot] !== null) {
                  merged[day][slot] = cloud[day][slot];
                  hasCloud = true;
               }
            }
         }
         if (hasCloud && typeof window !== "undefined") {
            localStorage.setItem(MEAL_PLANNER_KEY, JSON.stringify(merged));
         }
         return merged;
      }
   } catch {}
   return local;
}

export function clearStoredMealPlan() {
   if (typeof window === "undefined") return;

   localStorage.removeItem(MEAL_PLANNER_KEY);

   // Background clear in Supabase
   import("./sync/cloudSync").then(({ syncCloudMealPlan }) => {
      syncCloudMealPlan(createEmptyMealPlan()).catch(() => {});
   });
}

export function formatWeekDay(day: WeekDay) {
   return day.charAt(0).toUpperCase() + day.slice(1);
}

export function formatMealSlot(slot: MealSlot) {
   switch (slot) {
      case "breakfast":
         return "Breakfast";
      case "morning_snack":
         return "Morning Snack";
      case "lunch":
         return "Lunch";
      case "afternoon_snack":
         return "Afternoon Snack";
      case "dinner":
         return "Dinner";
      case "evening_snack":
         return "Evening Snack";
      default:
         return String(slot).charAt(0).toUpperCase() + String(slot).slice(1);
   }
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

import { canonicalizeIngredients } from "./format";

/**
 * Determines whether a recipe is genuinely suitable for a given main meal slot.
 * Strictly bars snack recipes, quick bites, desserts, and appetizers from main meals,
 * and ensures breakfast, lunch, and dinner only receive appropriate meals.
 */
export function isRecipeSuitableForSlot(
   recipe: AppRecipe,
   slot: "breakfast" | "lunch" | "dinner",
): boolean {
   // RULE 1: Negative IDs (quick snacks) and snack-tagged recipes are NEVER main meals
   if (
      recipe.id < 0 ||
      recipe.mealType === "snack" ||
      recipe.category === "snack" ||
      (recipe.tags && recipe.tags.some((t) => ["quick-snack", "snack", "mellanmål"].includes(t.toLowerCase())))
   ) {
      return false;
   }

   const category = (recipe.category || "").toLowerCase();
   const mealType = (recipe.mealType || "").toLowerCase();
   const title = (recipe.title || "").toLowerCase();

   // Exclude appetizers, dips, rice cakes, chia seed puddings, parfaits, and energy bites from main meals
   if (
      category === "appetizer" ||
      category === "dessert" ||
      title.includes("rice cake") ||
      title.includes("chia seed pudding") ||
      title.includes("energy bites") ||
      title.includes("parfait") ||
      title.includes("dip")
   ) {
      return false;
   }

   if (slot === "breakfast") {
      // Dinners, pastas, noodles, tacos are not breakfast
      if (mealType === "dinner") return false;
      if (category === "pasta" || category === "noodles" || category === "tacos") return false;
      return (
         mealType === "breakfast" ||
         mealType === "brunch" ||
         category === "breakfast" ||
         category === "smoothie" ||
         title.includes("egg") ||
         title.includes("oats") ||
         title.includes("pancake") ||
         title.includes("porridge") ||
         title.includes("toast") ||
         title.includes("shakshuka")
      );
   }

   if (slot === "lunch") {
      // Lunch cannot be breakfast sweet items (pancakes, porridge, smoothie)
      if (
         title.includes("pancake") ||
         title.includes("porridge") ||
         title.includes("smoothie") ||
         category === "smoothie"
      ) {
         return false;
      }
      return (
         mealType === "lunch" ||
         category === "salad" ||
         category === "sandwich" ||
         category === "bowl" ||
         category === "wrap" ||
         category === "noodles" ||
         category === "soup" ||
         category === "pasta" ||
         category === "stir-fry" ||
         (recipe.cookTime !== undefined && recipe.cookTime <= 30 && mealType !== "breakfast")
      );
   }

   if (slot === "dinner") {
      // Dinner cannot be breakfast items or light snacks
      if (
         mealType === "breakfast" ||
         category === "breakfast" ||
         category === "smoothie" ||
         title.includes("pancake") ||
         title.includes("porridge") ||
         title.includes("toast") ||
         title.includes("smoothie")
      ) {
         return false;
      }
      return (
         mealType === "dinner" ||
         category === "main-course" ||
         category === "pasta" ||
         category === "tacos" ||
         category === "curry" ||
         category === "rice" ||
         category === "stir-fry" ||
         category === "soup" ||
         (recipe.cookTime !== undefined && recipe.cookTime >= 15 && mealType !== "lunch")
      );
   }

   return false;
}

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

   // Pre-compute canonical ingredients for all recipes to avoid redundant work in loops
   const recipeIngredientsCache = new Map<number, string[]>();
   for (const r of allRecipes) {
      const canonical = [];
      for (const ing of r.ingredients) {
         const list = canonicalizeIngredients(ing);
         for (const c of list) {
            canonical.push(c.toLowerCase());
         }
      }
      recipeIngredientsCache.set(r.id, canonical);
   }

   // Keep existing valid meals
   WEEK_DAYS.forEach((day) => {
      MEAL_SLOTS.forEach((slot) => {
         const id = currentPlan[day]?.[slot];
         if (id && validIds.has(id)) {
            nextPlan[day][slot] = id;
            usedRecipeIds.add(id);
            const cached = recipeIngredientsCache.get(id);
            if (cached) {
               cached.forEach((c) => plannedIngredientsSet.add(c));
            }
         }
      });
   });

   let filledCount = 0;

   // Fill missing main meal slots intelligently (snacks remain user-optional)
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

      MAIN_MEAL_SLOTS.forEach((slot) => {
         if (nextPlan[day][slot]) return; // Already filled

         // Filter candidates strictly by slot suitability (never snacks)
         const slotFiltered = allRecipes.filter((r) => isRecipeSuitableForSlot(r, slot));
         const pool = slotFiltered.length > 0 ? slotFiltered : allRecipes.filter((r) => r.mealType !== "snack" && r.category !== "snack");

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
            const cached = recipeIngredientsCache.get(recipe.id);
            if (cached) {
               cached.forEach((c) => {
                  if (plannedIngredientsSet.has(c)) overlapCount++;
               });
            }
            score += Math.min(overlapCount * 6, 36);

            return { recipe, score };
         });

         candidateScores.sort((a, b) => b.score - a.score);
         const best = candidateScores[0]?.recipe;

         if (best) {
            nextPlan[day][slot] = best.id;
            usedRecipeIds.add(best.id);
            if (best.category) todayAssignedCategories.add(best.category);
            const cached = recipeIngredientsCache.get(best.id);
            if (cached) {
               cached.forEach((c) => plannedIngredientsSet.add(c));
            }
            filledCount++;
         }
      });
   });

   return { nextPlan, filledCount };
}

/**
 * Selects a smart tailored surprise recipe for a single slot.
 * Bars all snack recipes from main meals (breakfast, lunch, dinner).
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

   let pool: AppRecipe[] = [];
   if (slot === "morning_snack" || slot === "afternoon_snack" || slot === "evening_snack") {
      pool = allRecipes.filter((r) => {
         return (
            r.mealType === "snack" ||
            (r.category && ["snack", "smoothie", "bowl", "salad", "appetizer"].includes(r.category)) ||
            (r.tags && r.tags.some((t) => ["snack", "smoothie", "quick"].includes(t.toLowerCase()))) ||
            (r.cookTime !== undefined && r.cookTime <= 15)
         );
      });
   } else {
      pool = allRecipes.filter((r) => isRecipeSuitableForSlot(r, slot));
   }

   if (pool.length === 0) return null;

   const currentId = currentPlan[day]?.[slot];
   const available = pool.filter((r) => !dayExistingIds.has(r.id) && r.id !== currentId);
   const finalPool = available.length > 0 ? available : pool.filter((r) => r.id !== currentId);
   const candidatePool = finalPool.length > 0 ? finalPool : pool;

   return candidatePool[Math.floor(Math.random() * candidatePool.length)] || null;
}

/**
 * Smart Shuffle for a single day:
 * - Selects high-variety, ingredient-synergistic breakfast, lunch, and dinner.
 * - Strictly preserves existing snacks (morning_snack, afternoon_snack, evening_snack).
 * - Strictly prevents snack recipes from landing in main meals.
 * - Guarantees that clicking Shuffle ALWAYS changes the slot's recipe.
 */
export function smartShuffleDay(
   day: WeekDay,
   currentPlan: MealPlan,
   allRecipes: AppRecipe[],
): DayPlan {
   if (allRecipes.length === 0) return currentPlan[day] ?? createEmptyDayPlan();

   const existingDay = currentPlan[day] ?? createEmptyDayPlan();
   // PRESERVE SNACKS 100%
   const newDay: DayPlan = {
      breakfast: existingDay.breakfast,
      morning_snack: existingDay.morning_snack,
      lunch: existingDay.lunch,
      afternoon_snack: existingDay.afternoon_snack,
      dinner: existingDay.dinner,
      evening_snack: existingDay.evening_snack,
   };

   // Collect planned ingredients and used recipe IDs from other days
   const usedRecipeIds = new Set<number>();
   const plannedIngredientsSet = new Set<string>();

   WEEK_DAYS.forEach((d) => {
      if (d === day) return;
      MEAL_SLOTS.forEach((s) => {
         const id = currentPlan[d]?.[s];
         if (id) {
            usedRecipeIds.add(id);
            const r = allRecipes.find((item) => item.id === id);
            if (r) {
               r.ingredients.forEach((ing) => {
                  const canonical = canonicalizeIngredients(ing);
                  canonical.forEach((c) => plannedIngredientsSet.add(c.toLowerCase()));
               });
            }
         }
      });
   });

   const assignedTodayCategories = new Set<string>();
   const assignedTodayIds = new Set<number>();

   const mainSlots: ("breakfast" | "lunch" | "dinner")[] = ["breakfast", "lunch", "dinner"];

   for (const slot of mainSlots) {
      const slotFiltered = allRecipes.filter((r) => isRecipeSuitableForSlot(r, slot));

      // CRITICAL FIX: Exclude the meal currently in this slot so it ALWAYS changes when shuffled!
      const currentSlotId = existingDay[slot];
      const differentCandidates = slotFiltered.filter((r) => r.id !== currentSlotId);
      const pool = differentCandidates.length > 0 ? differentCandidates : slotFiltered;

      if (pool.length === 0) continue;

      // Balanced scoring with dynamic jitter to ensure continuous variety on every click
      const scored = pool.map((recipe) => {
         let score = 50;
         if (!assignedTodayIds.has(recipe.id)) score += 100;
         if (!usedRecipeIds.has(recipe.id)) score += 30;
         if (!recipe.category || !assignedTodayCategories.has(recipe.category)) score += 20;

         let overlap = 0;
         recipe.ingredients.forEach((ing) => {
            const canonical = canonicalizeIngredients(ing);
            canonical.forEach((c) => {
               if (plannedIngredientsSet.has(c.toLowerCase())) overlap++;
            });
         });
         score += Math.min(overlap * 4, 20);

         // Strong random jitter so clicking shuffle introduces continuous rotation
         score += Math.floor(Math.random() * 80);

         return { recipe, score };
      });

      scored.sort((a, b) => b.score - a.score);
      // Pick randomly from the top 3 scored candidates
      const topSlice = scored.slice(0, Math.min(3, scored.length));
      const chosen = topSlice[Math.floor(Math.random() * topSlice.length)]?.recipe;

      if (chosen) {
         newDay[slot] = chosen.id;
         assignedTodayIds.add(chosen.id);
         usedRecipeIds.add(chosen.id);
         if (chosen.category) assignedTodayCategories.add(chosen.category);
         chosen.ingredients.forEach((ing) => {
            const canonical = canonicalizeIngredients(ing);
            canonical.forEach((c) => plannedIngredientsSet.add(c.toLowerCase()));
         });
      }
   }

   return newDay;
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