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
  MEAL_SLOTS,
  clearStoredMealPlan,
  createEmptyMealPlan,
  createEmptyDayPlan,
  getStoredDailyCalorieTarget,
  getStoredMealPlan,
  getStoredMealPlanWithCloud,
  saveDailyCalorieTarget,
  saveMealPlan,
  sanitizeMealPlan,
  smartAutoPlanWeek,
  smartSurpriseMeal,
  smartShuffleDay,
  formatWeekDay,
  getStoredQuickSnacks,
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


  useEffect(() => {
    getAllRecipesWithCloud().then((recipes) => {
      const quickSnacks = getStoredQuickSnacks();
      const combined = [...recipes, ...quickSnacks];
      setAllRecipes(combined);
      getStoredMealPlanWithCloud().then((stored) => {
        const sanitized = sanitizeMealPlan(stored, combined);
        setMealPlan(sanitized);
      });

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
      let count = 0;
      for (const slot of MEAL_SLOTS) {
        if (dayPlan[slot] && allRecipes.some((r) => r.id === dayPlan[slot])) {
          count++;
        }
      }
      return acc + count;
    }, 0);
  }, [mealPlan, allRecipes]);

  const plannedDinnerRecipeIds = useMemo(() => {
    const ids = new Set<number>();
    Object.values(mealPlan).forEach((dayPlan) => {
      if (dayPlan.dinner) ids.add(dayPlan.dinner);
    });
    return ids;
  }, [mealPlan]);

  const plannedLunchRecipeIds = useMemo(() => {
    const ids = new Set<number>();
    Object.values(mealPlan).forEach((dayPlan) => {
      if (dayPlan.lunch) ids.add(dayPlan.lunch);
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
    createdRecipe?: AppRecipe,
  ) => {
    if (createdRecipe) {
      setAllRecipes((prev) => [createdRecipe, ...prev.filter((r) => r.id !== createdRecipe.id)]);
    }
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
        [day]: createEmptyDayPlan(),
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
    const newDayPlan = smartShuffleDay(day, mealPlan, allRecipes);

    setMealPlan((prev) => {
      const next = {
        ...prev,
        [day]: newDayPlan,
      };
      saveMealPlan(next);
      return next;
    });
    success(`Shuffled meals for ${formatWeekDay(day)}! 🎲`);
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
      <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#16120f] p-8 text-stone-400">
            Loading your weekly planner...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FCFCFC] px-4 py-6 sm:px-6 xl:px-10 text-slate-900 transition-colors duration-300 dark:bg-[#0A0A0A] dark:text-stone-100">
      <div className="relative mx-auto flex w-full max-w-7xl 2xl:max-w-[1820px] flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col gap-4 rounded-[32px] border border-slate-200/90 bg-white dark:border-white/[0.08] dark:bg-[#151210] p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              {/* USP TYPOGRAPHY HEADER */}
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-bold text-slate-800 dark:text-stone-300">
                <svg className="h-3.5 w-3.5 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Weekly Meal Planner</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
                Take the stress out of daily cooking.
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-stone-400">
                <span>Save time, eat healthier, and streamline your weekly groceries</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-bold text-slate-900 dark:text-stone-100">
                  {plannedMealsCount}/21 planned
                </span>
                <span>•</span>
                <span>Target: <strong className="text-slate-900 dark:text-stone-100">{dailyCalorieTarget}</strong> kcal/day</span>
              </div>
            </div>

            {/* STREAMLINED ACTION TOOLBAR */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* COOKBOOK RECIPES BUTTON */}
              <button
                type="button"
                onClick={() => setIsPantryOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 px-3.5 text-xs sm:text-sm font-bold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs active:scale-95"
                title="Browse Cookbook recipes"
              >
                <svg className="h-4 w-4 shrink-0 text-slate-600 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Cookbook</span>
                <span className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-2 py-0.2 text-[10px] font-black shadow-xs">
                  {allRecipes.length}
                </span>
              </button>

              {/* SUGGEST MEALS */}
              <button
                type="button"
                onClick={handleAutoSuggestWeek}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 text-xs sm:text-sm border border-slate-900 shadow-xs dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition cursor-pointer active:scale-95"
              >
                <span>✨</span>
                <span>Suggest Meals</span>
              </button>

              {/* SEND TO GROCERY LIST (SOLID HIGH CONTRAST EMERALD) */}
              <button
                type="button"
                onClick={() => setIsGroceryModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 px-4.5 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Send to Grocery</span>
              </button>

              {/* DAILY CALORIE TARGET INPUT */}
              <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                <span className="text-slate-500 dark:text-stone-400">Target:</span>
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
                  className="w-14 rounded-lg bg-white dark:bg-black/50 py-0.5 text-center font-mono font-bold text-slate-900 dark:text-stone-100 border border-slate-300 dark:border-white/12 focus:outline-none focus:border-slate-900 text-xs shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-stone-500">kcal</span>
              </div>

              {/* CLEAR WEEK */}
              {plannedMealsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearWeekModalOpen(true)}
                  aria-label="Clear entire week"
                  title="Clear entire week plan"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/10 dark:bg-white/5 dark:text-rose-400 dark:hover:bg-rose-500/10 transition cursor-pointer active:scale-95 shadow-xs"
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
        <div className="space-y-6">
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
                plannedLunchRecipeIds={plannedLunchRecipeIds}
                dailyCalorieTarget={dailyCalorieTarget}
                onOpenPicker={(d, slot) => setActivePicker({ day: d, slot })}
                onOpenMealPrep={(d, recipe) => setActiveMealPrep({ day: d, recipe })}
                onClearSlot={handleClearSlot}
                onClearDay={handleClearDay}
                onSurpriseMeal={handleSurpriseMeal}
                onShuffleDay={handleShuffleDay}
                onSelectLeftovers={handleSelectRecipe}
              />
            );
          })}
        </div>

        {/* BACK TO TOP BUTTON (CENTERED AT BOTTOM) */}
        <div className="flex justify-center pt-8 pb-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 dark:border-white/12 dark:bg-[#151210] dark:text-stone-300 dark:hover:bg-white/10 transition-all cursor-pointer"
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
          onSelectRecipe={(recipeId, createdRecipe) => {
            handleSelectRecipe(activePicker.day, activePicker.slot, recipeId, createdRecipe);
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
    </div>
  );
}
