"use client";

import { useEffect, useMemo, useState } from "react";
import PlannerDayRow from "../../components/planner/PlannerDayRow";
import PlannerRecipeDeck from "../../components/planner/PlannerRecipeDeck";
import { getAllRecipesWithCloud } from "../../lib/recipes";
import type { AppRecipe } from "../../lib/types";
import {
  WEEK_DAYS,
  MEAL_SLOTS,
  clearStoredMealPlan,
  createEmptyMealPlan,
  getStoredDailyCalorieTarget,
  getStoredMealPlan,
  saveDailyCalorieTarget,
  saveMealPlan,
  getUniquePlannedIngredients,
  type MealPlan,
  type MealSlot,
  type WeekDay,
} from "../../lib/planner";
import { GROCERY_LIST_KEY } from "../../lib/home";
import { useToast } from "../../components/ui/ToastProvider";
import ConfirmModal from "../../components/ui/ConfirmModal";

type GroceryItem = {
  name: string;
  bought: boolean;
};

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

export default function PlannerPage() {
  const { success, info } = useToast();
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>(createEmptyMealPlan());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2200);
  const [isClearWeekModalOpen, setIsClearWeekModalOpen] = useState(false);
  const [isPantryOpen, setIsPantryOpen] = useState(false);

  // Drag and drop state
  const [draggedRecipe, setDraggedRecipe] = useState<{
    recipeId: number;
    fromDay?: WeekDay;
    fromSlot?: MealSlot;
  } | null>(null);

  useEffect(() => {
    getAllRecipesWithCloud().then((recipes) => {
      setAllRecipes(recipes);
    });
    setMealPlan(getStoredMealPlan());
    setDailyCalorieTarget(getStoredDailyCalorieTarget());
    setHasHydrated(true);
  }, []);

  const plannedMealsCount = useMemo(() => {
    return Object.values(mealPlan).reduce((acc, dayPlan) => {
      const b = Boolean(dayPlan.breakfast);
      const l = Boolean(dayPlan.lunch);
      const d = Boolean(dayPlan.dinner);
      return acc + (b ? 1 : 0) + (l ? 1 : 0) + (d ? 1 : 0);
    }, 0);
  }, [mealPlan]);

  const handleSelectRecipe = (
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => {
    const nextPlan = {
      ...mealPlan,
      [day]: {
        ...mealPlan[day],
        [slot]: recipeId,
      },
    };

    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
  };

  const handleClearSlot = (day: WeekDay, slot: MealSlot) => {
    handleSelectRecipe(day, slot, null);
  };

  const handleClearDay = (day: WeekDay) => {
    const nextPlan = {
      ...mealPlan,
      [day]: {
        breakfast: null,
        lunch: null,
        dinner: null,
      },
    };

    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
    info(`Cleared all meals for ${day}.`);
  };

  const handleConfirmClearWeek = () => {
    const emptyPlan = createEmptyMealPlan();
    setMealPlan(emptyPlan);
    clearStoredMealPlan();
    setIsClearWeekModalOpen(false);
    success("Cleared the entire week plan.");
  };

  const handleSurpriseMeal = (day: WeekDay, slot: MealSlot) => {
    if (allRecipes.length === 0) return;
    const random = allRecipes[Math.floor(Math.random() * allRecipes.length)];
    handleSelectRecipe(day, slot, random.id);
    success(`Selected "${random.title}" for ${day} ${slot}! 🎲`);
  };

  // Atomic shuffle of a specific day's meals
  const handleShuffleDay = (day: WeekDay) => {
    if (allRecipes.length === 0) return;

    const breakfastPool = allRecipes.filter((r) => r.cookTime !== undefined && r.cookTime <= 20);
    const lunchPool = allRecipes.filter((r) => r.cookTime !== undefined && r.cookTime <= 30);

    const b = (breakfastPool.length > 0 ? breakfastPool : allRecipes)[
      Math.floor(Math.random() * (breakfastPool.length || allRecipes.length))
    ];
    const l = (lunchPool.length > 0 ? lunchPool : allRecipes)[
      Math.floor(Math.random() * (lunchPool.length || allRecipes.length))
    ];
    const d = allRecipes[Math.floor(Math.random() * allRecipes.length)];

    const nextPlan = {
      ...mealPlan,
      [day]: {
        breakfast: b.id,
        lunch: l.id,
        dinner: d.id,
      },
    };

    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
    success(`Shuffled full meal plan for ${day}! 🎲`);
  };

  // Drag and Drop handlers
  const handleDeckDragStart = (recipeId: number) => {
    setDraggedRecipe({ recipeId });
  };

  const handleDayMealDragStart = (day: WeekDay, slot: MealSlot, recipeId: number) => {
    setDraggedRecipe({ recipeId, fromDay: day, fromSlot: slot });
  };

  const handleDropMeal = (targetDay: WeekDay, targetSlot: MealSlot) => {
    if (!draggedRecipe) return;

    if (draggedRecipe.fromDay && draggedRecipe.fromSlot) {
      // Swapping or moving from another day/slot
      const sourceRecipeId = mealPlan[draggedRecipe.fromDay][draggedRecipe.fromSlot];
      const targetRecipeId = mealPlan[targetDay][targetSlot];

      const nextPlan = {
        ...mealPlan,
        [draggedRecipe.fromDay]: {
          ...mealPlan[draggedRecipe.fromDay],
          [draggedRecipe.fromSlot]: targetRecipeId,
        },
        [targetDay]: {
          ...mealPlan[targetDay],
          [targetSlot]: sourceRecipeId,
        },
      };

      setMealPlan(nextPlan);
      saveMealPlan(nextPlan);
      success(`Moved meal to ${targetDay} ${targetSlot}! ↔️`);
    } else {
      // Dropping fresh from the recipe pantry
      handleSelectRecipe(targetDay, targetSlot, draggedRecipe.recipeId);
      const recipe = allRecipes.find((r) => r.id === draggedRecipe.recipeId);
      success(`Added "${recipe?.title || "recipe"}" to ${targetDay} ${targetSlot}! ✨`);
    }

    setDraggedRecipe(null);
  };

  // Apply batch cooked meal prep (Matlådor)
  const handleApplyMealPrep = (
    fromDay: WeekDay,
    recipe: AppRecipe,
    targetDays: WeekDay[],
  ) => {
    const nextPlan = { ...mealPlan };

    targetDays.forEach((day) => {
      nextPlan[day] = {
        ...nextPlan[day],
        lunch: recipe.id,
      };
    });

    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
    success(`Filled ${targetDays.length} lunch${targetDays.length === 1 ? "" : "es"} with "${recipe.title}"! 🥡`);
  };

  // Auto-Plan Week (formerly Magic Plan Week)
  const handleAutoPlanWeek = () => {
    if (allRecipes.length === 0) return;

    const nextPlan = { ...mealPlan };
    let filledCount = 0;

    WEEK_DAYS.forEach((day) => {
      MEAL_SLOTS.forEach((slot) => {
        if (!nextPlan[day][slot]) {
          const pool = allRecipes.filter((r) => {
            if (slot === "breakfast") return r.cookTime !== undefined && r.cookTime <= 20;
            if (slot === "lunch") return r.cookTime !== undefined && r.cookTime <= 30;
            return true;
          });

          const chosen = pool.length > 0
            ? pool[Math.floor(Math.random() * pool.length)]
            : allRecipes[Math.floor(Math.random() * allRecipes.length)];

          nextPlan[day] = {
            ...nextPlan[day],
            [slot]: chosen.id,
          };
          filledCount++;
        }
      });
    });

    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
    success(`Auto-planned ${filledCount} meals for your week! ✨`);
  };

  // Send all week's ingredients to grocery list
  const handleAddPlannedIngredientsToGroceryList = () => {
    const plannedItems = getUniquePlannedIngredients(allRecipes, mealPlan);

    if (plannedItems.length === 0) {
      info("No planned meals to extract ingredients from. Plan some meals first!");
      return;
    }

    const storedGroceryList = localStorage.getItem(GROCERY_LIST_KEY);
    let currentGroceryList: GroceryItem[] = [];

    if (storedGroceryList) {
      try {
        currentGroceryList = JSON.parse(storedGroceryList) as GroceryItem[];
      } catch {
        currentGroceryList = [];
      }
    }

    const existingNames = new Set(
      currentGroceryList.map((item) => normalizeIngredient(item.name)),
    );

    const newItems: GroceryItem[] = plannedItems
      .filter((item) => !existingNames.has(normalizeIngredient(item.name)))
      .map((item) => ({
        name: item.name,
        bought: false,
      }));

    if (newItems.length === 0) {
      info("All ingredients for this week are already in your grocery list! 🛒");
      return;
    }

    const updatedGroceryList = [...currentGroceryList, ...newItems];
    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updatedGroceryList));

    // Trigger the micro-animation on the floating grocery drawer
    window.dispatchEvent(
      new CustomEvent("grocery_items_updated", {
        detail: { count: newItems.length },
      }),
    );

    success(`Added ${newItems.length} week ingredients to your grocery list! 🛒`);
  };

  if (!hasHydrated) {
    return (
      <main className="relative min-h-screen bg-[#110d0b] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-[#16120f] p-8 text-stone-400">
            Loading your weekly meal planner...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#110d0b] px-4 py-6 sm:px-6 lg:px-8 text-stone-100">
      <div className="relative mx-auto flex w-full max-w-7xl 2xl:max-w-[1820px] 3xl:max-w-[2200px] flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#16120f]/95 p-5 sm:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* CLEAN TYPOGRAPHY HEADER (No clunky box background) */}
              <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                <span>🗓️</span>
                <span>Weekly Culinary Timeline</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fff8ef]">
                Plan your week around meals you love.
              </h1>
              
              <p className="mt-1 text-xs sm:text-sm text-stone-400">
                {plannedMealsCount}/21 meals planned • Target: {dailyCalorieTarget} kcal/day
              </p>
            </div>

            {/* STREAMLINED ACTION TOOLBAR */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* RECIPE DECK DRAWER TOGGLE */}
              <button
                type="button"
                onClick={() => setIsPantryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-200 hover:bg-white/10 hover:border-amber-400/40 hover:text-white transition cursor-pointer shadow-xs active:scale-95"
                title="Browse Recipe Deck"
              >
                <span>📚</span>
                <span>Recipe Deck</span>
                <span className="rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-300">
                  {allRecipes.length}
                </span>
              </button>

              {/* AUTO-PLAN WEEK */}
              <button
                type="button"
                onClick={handleAutoPlanWeek}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-300 hover:bg-amber-400/20 hover:border-amber-400/50 transition cursor-pointer shadow-xs active:scale-95"
              >
                <span>⚡</span>
                <span>Auto-Plan</span>
              </button>

              {/* SEND TO GROCERY LIST */}
              <button
                type="button"
                onClick={handleAddPlannedIngredientsToGroceryList}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-stone-950 hover:bg-amber-600 hover:shadow-md hover:shadow-amber-400/30 active:scale-95 transition cursor-pointer"
              >
                <span>🛒</span>
                <span>Send to Grocery</span>
              </button>

              {/* DAILY CALORIE TARGET INPUT */}
              <label className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-300">
                <span className="text-stone-400">Target:</span>
                <input
                  type="number"
                  min="500"
                  step="50"
                  value={dailyCalorieTarget}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 2000;
                    setDailyCalorieTarget(val);
                    saveDailyCalorieTarget(val);
                  }}
                  className="w-14 rounded-lg bg-black/40 px-1 py-0.5 text-center font-mono font-bold text-amber-300 border border-white/10 focus:outline-none focus:border-amber-400 text-xs"
                />
                <span className="text-[10px] text-stone-500">kcal</span>
              </label>

              {/* CLEAR WEEK */}
              {plannedMealsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearWeekModalOpen(true)}
                  aria-label="Clear entire week"
                  title="Clear entire week plan"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-2xl border border-white/10 bg-white/5 text-stone-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 7-DAY TIMELINE (Monday -> Sunday in full width) */}
        <div className="space-y-4">
          {WEEK_DAYS.map((day, index) => {
            const dayPlan = mealPlan[day];
            const prevIndex = index === 0 ? WEEK_DAYS.length - 1 : index - 1;
            const prevDay = WEEK_DAYS[prevIndex];
            const prevDinnerId = mealPlan[prevDay]?.dinner;
            const prevDinner = prevDinnerId ? allRecipes.find((r) => r.id === prevDinnerId) : null;

            return (
              <PlannerDayRow
                key={day}
                day={day}
                recipes={allRecipes}
                dayPlan={dayPlan}
                previousDayDinnerRecipe={prevDinner}
                dailyCalorieTarget={dailyCalorieTarget}
                onSelectRecipe={handleSelectRecipe}
                onClearSlot={handleClearSlot}
                onClearDay={handleClearDay}
                onSurpriseMeal={handleSurpriseMeal}
                onShuffleDay={handleShuffleDay}
                onApplyMealPrep={handleApplyMealPrep}
                onDragMealStart={handleDayMealDragStart}
                onDropMeal={handleDropMeal}
              />
            );
          })}
        </div>
      </div>

      {/* SLIDE-OUT RECIPE PANTRY DRAWER */}
      <PlannerRecipeDeck
        isOpen={isPantryOpen}
        onClose={() => setIsPantryOpen(false)}
        recipes={allRecipes}
        onDragStart={handleDeckDragStart}
      />

      {/* CLEAR WEEK CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isClearWeekModalOpen}
        title="Clear Entire Week Plan?"
        description="This will remove all planned breakfasts, lunches, and dinners for all 7 days."
        confirmLabel="Clear Week"
        cancelLabel="Keep Plan"
        isDestructive
        onConfirm={handleConfirmClearWeek}
        onCancel={() => setIsClearWeekModalOpen(false)}
      />
    </main>
  );
}
