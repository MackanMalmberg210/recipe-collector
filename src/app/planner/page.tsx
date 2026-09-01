"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import PlannerDayRow from "../../components/planner/PlannerDayRow";
import PlannerRecipeDeck from "../../components/planner/PlannerRecipeDeck";
import PlannerGroceryModal from "../../components/planner/PlannerGroceryModal";
import RecipePickerModal from "../../components/planner/RecipePickerModal";
import MealPrepModal from "../../components/planner/MealPrepModal";
import { getAllRecipesWithCloud } from "../../lib/recipes";
import type { AppRecipe } from "../../lib/types";
import {
  WEEK_DAYS,
  clearStoredMealPlan,
  createEmptyMealPlan,
  getStoredDailyCalorieTarget,
  getStoredMealPlan,
  saveDailyCalorieTarget,
  saveMealPlan,
  sanitizeMealPlan,
  smartAutoPlanWeek,
  smartSurpriseMeal,
  type MealPlan,
  type MealSlot,
  type WeekDay,
} from "../../lib/planner";
import { useToast } from "../../components/ui/ToastProvider";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function PlannerPage() {
  const { success, info } = useToast();
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>(createEmptyMealPlan());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2200);
  const [isClearWeekModalOpen, setIsClearWeekModalOpen] = useState(false);
  const [isPantryOpen, setIsPantryOpen] = useState(false);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);

  // Singleton Modal States
  const [activePicker, setActivePicker] = useState<{ day: WeekDay; slot: MealSlot } | null>(null);
  const [activeMealPrep, setActiveMealPrep] = useState<{ day: WeekDay; recipe: AppRecipe } | null>(null);

  // Drag and drop state
  const [draggedRecipe, setDraggedRecipe] = useState<{
    recipeId: number;
    fromDay?: WeekDay;
    fromSlot?: MealSlot;
  } | null>(null);

  useEffect(() => {
    getAllRecipesWithCloud().then((recipes) => {
      setAllRecipes(recipes);
      const stored = getStoredMealPlan();
      const sanitized = sanitizeMealPlan(stored, recipes);
      setMealPlan(sanitized);

      // Preload & warm browser cache for all recipe images so scrolling is 100% instant
      if (typeof window !== "undefined") {
        recipes.forEach((r) => {
          if (r.image) {
            const img = new window.Image();
            img.src = r.image;
          }
        });
      }
    });
    setDailyCalorieTarget(getStoredDailyCalorieTarget());
    setHasHydrated(true);
  }, []);

  const plannedMealsCount = useMemo(() => {
    return Object.values(mealPlan).reduce((acc, dayPlan) => {
      const b = Boolean(dayPlan.breakfast && allRecipes.some((r) => r.id === dayPlan.breakfast));
      const l = Boolean(dayPlan.lunch && allRecipes.some((r) => r.id === dayPlan.lunch));
      const d = Boolean(dayPlan.dinner && allRecipes.some((r) => r.id === dayPlan.dinner));
      return acc + (b ? 1 : 0) + (l ? 1 : 0) + (d ? 1 : 0);
    }, 0);
  }, [mealPlan, allRecipes]);

  const plannedDinnerRecipeIds = useMemo(() => {
    const ids = new Set<number>();
    Object.values(mealPlan).forEach((dayPlan) => {
      if (dayPlan.dinner) ids.add(dayPlan.dinner);
    });
    return ids;
  }, [mealPlan]);

  const updateMealPlan = useCallback((newPlan: MealPlan) => {
    setMealPlan(newPlan);
    saveMealPlan(newPlan);
  }, []);

  const handleSelectRecipe = useCallback((
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => {
    setMealPlan((prev) => {
      const next = {
        ...prev,
        [day]: {
          ...prev[day],
          [slot]: recipeId,
        },
      };
      saveMealPlan(next);
      return next;
    });
  }, []);

  const handleClearSlot = useCallback((day: WeekDay, slot: MealSlot) => {
    handleSelectRecipe(day, slot, null);
  }, [handleSelectRecipe]);

  const handleClearDay = useCallback((day: WeekDay) => {
    setMealPlan((prev) => {
      const next = {
        ...prev,
        [day]: {
          breakfast: null,
          lunch: null,
          dinner: null,
        },
      };
      saveMealPlan(next);
      return next;
    });
  }, []);

  const handleSurpriseMeal = useCallback((day: WeekDay, slot: MealSlot) => {
    if (allRecipes.length === 0) return;
    const recipe = smartSurpriseMeal(day, slot, mealPlan, allRecipes);
    if (recipe) {
      handleSelectRecipe(day, slot, recipe.id);
      success(`Surprise! Added "${recipe.title}" for ${day} ${slot}! ✨`);
    }
  }, [allRecipes, mealPlan, handleSelectRecipe, success]);

  const handleShuffleDay = useCallback((day: WeekDay) => {
    if (allRecipes.length === 0) return;
    const b = smartSurpriseMeal(day, "breakfast", mealPlan, allRecipes);
    const l = smartSurpriseMeal(day, "lunch", mealPlan, allRecipes);
    const d = smartSurpriseMeal(day, "dinner", mealPlan, allRecipes);

    setMealPlan((prev) => {
      const next = {
        ...prev,
        [day]: {
          breakfast: b?.id ?? null,
          lunch: l?.id ?? null,
          dinner: d?.id ?? null,
        },
      };
      saveMealPlan(next);
      return next;
    });
    success(`Shuffled meals for ${day}! 🎲`);
  }, [allRecipes, mealPlan, success]);

  const handleApplyMealPrep = useCallback((
    fromDay: WeekDay,
    recipe: AppRecipe,
    targetDays: WeekDay[],
  ) => {
    setMealPlan((prev) => {
      const next = { ...prev };
      targetDays.forEach((targetDay) => {
        next[targetDay] = {
          ...next[targetDay],
          lunch: recipe.id,
        };
      });
      saveMealPlan(next);
      return next;
    });
    success(`Applied ${recipe.title} to ${targetDays.length} lunch slot${targetDays.length === 1 ? "" : "s"}! 🍱`);
  }, [success]);

  const handleDayMealDragStart = useCallback((
    day: WeekDay,
    slot: MealSlot,
    recipeId: number,
  ) => {
    setDraggedRecipe({ recipeId, fromDay: day, fromSlot: slot });
  }, []);

  const handleDeckDragStart = useCallback((recipeId: number) => {
    setDraggedRecipe({ recipeId });
  }, []);

  const handleDropMeal = useCallback((targetDay: WeekDay, targetSlot: MealSlot) => {
    if (!draggedRecipe) return;

    const { recipeId, fromDay, fromSlot } = draggedRecipe;

    if (fromDay && fromSlot) {
      // Swapping two meals between slots
      const currentTargetRecipeId = mealPlan[targetDay][targetSlot];

      setMealPlan((prev) => {
        const next = {
          ...prev,
          [targetDay]: {
            ...prev[targetDay],
            [targetSlot]: recipeId,
          },
          [fromDay]: {
            ...prev[fromDay],
            [fromSlot]: currentTargetRecipeId,
          },
        };
        saveMealPlan(next);
        return next;
      });
    } else {
      // Direct drag from cookbook deck
      handleSelectRecipe(targetDay, targetSlot, recipeId);
    }

    setDraggedRecipe(null);
  }, [draggedRecipe, mealPlan, handleSelectRecipe]);

  const handleConfirmClearWeek = () => {
    const empty = createEmptyMealPlan();
    clearStoredMealPlan();
    setMealPlan(empty);
    setIsClearWeekModalOpen(false);
    info("Cleared weekly meal plan.");
  };

  const handleAutoSuggestWeek = () => {
    if (allRecipes.length === 0) return;
    const { nextPlan, filledCount } = smartAutoPlanWeek(mealPlan, allRecipes);
    updateMealPlan(nextPlan);

    if (filledCount === 0) {
      info("Your week is already completely planned!");
    } else {
      success(`Auto-planned ${filledCount} distinct meal${filledCount === 1 ? "" : "s"} for your week! ✨`);
    }
  };

  if (!hasHydrated) {
    return (
      <main className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#16120f] p-8 text-stone-400">
            Loading your weekly planner...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 xl:px-10 text-stone-950 dark:text-stone-100">
      <div className="relative mx-auto flex w-full max-w-7xl 2xl:max-w-[1820px] flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col gap-4 rounded-3xl border border-stone-200/90 bg-white dark:border-white/[0.08] dark:bg-[#16120f]/95 p-5 sm:p-6 shadow-sm dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* USP TYPOGRAPHY HEADER */}
              <div className="flex items-center gap-2 mb-1 text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Weekly Meal Planner</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fff8ef]">
                Take the stress out of daily cooking.
              </h1>
              
              <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Save time, eat healthier, and streamline your weekly groceries • <strong className="text-stone-800 dark:text-stone-200">{plannedMealsCount}/21</strong> meals planned • Target: <strong className="text-stone-800 dark:text-stone-200">{dailyCalorieTarget}</strong> kcal/day
              </p>
            </div>

            {/* STREAMLINED ACTION TOOLBAR */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* COOKBOOK RECIPES BUTTON */}
              <button
                type="button"
                onClick={() => setIsPantryOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-amber-500/50 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-stone-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:border-amber-400/40 dark:hover:bg-white/8 transition cursor-pointer shadow-xs active:scale-95"
                title="Browse Cookbook recipes"
              >
                <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Cookbook</span>
                <span className="rounded-full bg-amber-500 text-stone-950 px-2 py-0.2 text-[10px] font-black shadow-xs">
                  {allRecipes.length}
                </span>
              </button>

              {/* SUGGEST MEALS */}
              <button
                type="button"
                onClick={handleAutoSuggestWeek}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 dark:border-amber-500/25 dark:bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs active:scale-95"
              >
                <span>✨</span>
                <span>Suggest Meals</span>
              </button>

              {/* SEND TO GROCERY LIST (BRAND AMBER GRADIENT) */}
              <button
                type="button"
                onClick={() => setIsGroceryModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-4.5 py-2.5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition cursor-pointer active:scale-95"
              >
                <svg className="h-4 w-4 shrink-0 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Send to Grocery</span>
              </button>

              {/* DAILY CALORIE TARGET INPUT - CENTERED */}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                <span className="text-stone-500 dark:text-stone-400">Target:</span>
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
                  className="w-16 rounded-xl bg-white dark:bg-black/50 py-1 text-center font-mono font-bold text-amber-700 dark:text-amber-300 border border-stone-300 dark:border-white/12 focus:outline-none focus:border-amber-500 text-xs shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-stone-400 dark:text-stone-500">kcal</span>
              </div>

              {/* CLEAR WEEK */}
              {plannedMealsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearWeekModalOpen(true)}
                  aria-label="Clear entire week"
                  title="Clear entire week plan"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-stone-200 bg-stone-50 text-stone-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition cursor-pointer active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 7-DAY TIMELINE */}
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
                plannedDinnerRecipeIds={plannedDinnerRecipeIds}
                dailyCalorieTarget={dailyCalorieTarget}
                onOpenPicker={(d, slot) => setActivePicker({ day: d, slot })}
                onOpenMealPrep={(d, recipe) => setActiveMealPrep({ day: d, recipe })}
                onClearSlot={handleClearSlot}
                onClearDay={handleClearDay}
                onSurpriseMeal={handleSurpriseMeal}
                onShuffleDay={handleShuffleDay}
                onSelectLeftovers={handleSelectRecipe}
                onDragMealStart={handleDayMealDragStart}
                onDropMeal={handleDropMeal}
              />
            );
          })}
        </div>

        {/* BACK TO TOP BUTTON (CENTERED AT BOTTOM) */}
        <div className="flex justify-center pt-8 pb-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white px-5 py-2.5 text-xs font-extrabold text-stone-700 shadow-xs hover:border-amber-500 hover:bg-amber-500/5 hover:text-amber-700 dark:border-white/12 dark:bg-[#16120f] dark:text-stone-300 dark:hover:border-amber-400/50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-all cursor-pointer"
            title="Scroll back to top"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Back to Top</span>
          </button>
        </div>
      </div>

      {/* SINGLETON RECIPE PICKER MODAL */}
      {activePicker && (
        <RecipePickerModal
          isOpen={Boolean(activePicker)}
          onClose={() => setActivePicker(null)}
          recipes={allRecipes}
          slot={activePicker.slot}
          selectedRecipeId={mealPlan[activePicker.day][activePicker.slot]}
          onSelectRecipe={(recipeId) => {
            handleSelectRecipe(activePicker.day, activePicker.slot, recipeId);
            setActivePicker(null);
          }}
          onClearRecipe={() => {
            handleClearSlot(activePicker.day, activePicker.slot);
            setActivePicker(null);
          }}
        />
      )}

      {/* SINGLETON MEAL PREP MODAL */}
      {activeMealPrep && (
        <MealPrepModal
          isOpen={Boolean(activeMealPrep)}
          onClose={() => setActiveMealPrep(null)}
          recipe={activeMealPrep.recipe}
          fromDay={activeMealPrep.day}
          onApplyLunches={(targetDays) => {
            handleApplyMealPrep(activeMealPrep.day, activeMealPrep.recipe, targetDays);
            setActiveMealPrep(null);
          }}
        />
      )}

      {/* SLIDE-OUT RECIPE PANTRY DRAWER */}
      <PlannerRecipeDeck
        isOpen={isPantryOpen}
        onClose={() => setIsPantryOpen(false)}
        recipes={allRecipes}
        onDragStart={handleDeckDragStart}
      />

      {/* CHOOSE DESTINATION GROCERY LIST MODAL */}
      <PlannerGroceryModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        recipes={allRecipes}
        mealPlan={mealPlan}
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
