"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
import RecipePickerModal from "./RecipePickerModal";
import MealPrepModal from "./MealPrepModal";
import {
  MEAL_SLOTS,
  formatMealSlot,
  formatWeekDay,
  getDayCalories,
} from "../../lib/planner";

type PlannerDayRowProps = {
  day: WeekDay;
  recipes: AppRecipe[];
  dayPlan: DayPlan;
  previousDayDinnerRecipe?: AppRecipe | null;
  dailyCalorieTarget: number;
  onSelectRecipe: (
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => void;
  onClearSlot: (day: WeekDay, slot: MealSlot) => void;
  onClearDay: (day: WeekDay) => void;
  onSurpriseMeal: (day: WeekDay, slot: MealSlot) => void;
  onShuffleDay: (day: WeekDay) => void;
  onApplyMealPrep: (fromDay: WeekDay, recipe: AppRecipe, targetDays: WeekDay[]) => void;
  onDragMealStart: (day: WeekDay, slot: MealSlot, recipeId: number) => void;
  onDropMeal: (targetDay: WeekDay, targetSlot: MealSlot) => void;
};

const SLOT_CONFIG: Record<MealSlot, { icon: string; label: string }> = {
  breakfast: { icon: "☀️", label: "Breakfast" },
  lunch: { icon: "🥗", label: "Lunch" },
  dinner: { icon: "🍽️", label: "Dinner" },
};

export default function PlannerDayRow({
  day,
  recipes,
  dayPlan,
  previousDayDinnerRecipe,
  dailyCalorieTarget,
  onSelectRecipe,
  onClearSlot,
  onClearDay,
  onSurpriseMeal,
  onShuffleDay,
  onApplyMealPrep,
  onDragMealStart,
  onDropMeal,
}: PlannerDayRowProps) {
  const [activePickerSlot, setActivePickerSlot] = useState<MealSlot | null>(null);
  const [mealPrepRecipe, setMealPrepRecipe] = useState<AppRecipe | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<MealSlot | null>(null);

  const dayCalories = getDayCalories(recipes, dayPlan);
  const plannedMealsCount = MEAL_SLOTS.filter((slot) => Boolean(dayPlan[slot])).length;
  const progressPercentage = dailyCalorieTarget
    ? Math.min(Math.round((dayCalories / dailyCalorieTarget) * 100), 100)
    : 0;

  const isToday = () => {
    const days: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayIndex = new Date().getDay();
    return days[todayIndex] === day;
  };

  const getRecipeById = (id: number | null) => {
    if (!id) return null;
    return recipes.find((r) => r.id === id) || null;
  };

  return (
    <div
      className={`rounded-4xl border p-4 sm:p-5 lg:p-6 transition-all duration-300 ${
        isToday()
          ? "border-amber-500/45 bg-[#191410] shadow-[0_20px_70px_rgba(251,191,36,0.12)] ring-1 ring-amber-500/40"
          : "border-white/10 bg-[#16120f]/95 hover:border-white/20 shadow-[0_14px_50px_rgba(0,0,0,0.25)]"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        
        {/* DAY BADGE & CALORIES */}
        <div className="flex flex-row items-center justify-between lg:flex-col lg:items-start lg:justify-between lg:w-56 xl:w-64 lg:shrink-0 lg:pr-6 lg:border-r lg:border-white/8 gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#fff8ef]">
                {formatWeekDay(day)}
              </h3>
              {isToday() && (
                <span className="rounded-md bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                  Today
                </span>
              )}
            </div>

            {/* CALORIE METRIC */}
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono">
                <span className="text-stone-200 font-bold">
                  {dayCalories > 0 ? `🔥 ${dayCalories} kcal` : "0 kcal"}
                </span>
                <span className="text-stone-500 text-[11px]">
                  / {dailyCalorieTarget}
                </span>
              </div>

              <div className="h-2 w-32 sm:w-40 lg:w-48 overflow-hidden rounded-full bg-white/6">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dayCalories > dailyCalorieTarget
                      ? "bg-amber-500 shadow-sm"
                      : dayCalories > 0
                      ? "bg-emerald-400 shadow-sm shadow-emerald-400/30"
                      : "bg-transparent"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* DAY SHORTCUTS */}
          <div className="flex items-center gap-3 text-xs text-stone-400 pt-1">
            <button
              type="button"
              onClick={() => onShuffleDay(day)}
              className="hover:text-amber-300 transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
              title="Shuffle all 3 meals for this day"
            >
              <span>🎲</span>
              <span>Shuffle Day</span>
            </button>

            {plannedMealsCount > 0 && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onClearDay(day)}
                  className="hover:text-rose-400 transition cursor-pointer text-xs"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3 MEAL SLOTS (Breakfast, Lunch, Dinner in full widescreen width) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 flex-1 min-w-0">
          {MEAL_SLOTS.map((slot) => {
            const recipeId = dayPlan[slot];
            const recipe = getRecipeById(recipeId);
            const { icon, label } = SLOT_CONFIG[slot];
            const isSlotDragOver = dragOverSlot === slot;

            return (
              <div
                key={slot}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlot(slot);
                }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSlot(null);
                  onDropMeal(day, slot);
                }}
                className={`flex flex-col justify-between rounded-3xl border min-h-36 sm:min-h-40 transition-colors duration-100 ${
                  isSlotDragOver
                    ? "ring-2 ring-amber-400 bg-amber-400/15 border-amber-400 p-3 scale-[1.02]"
                    : recipe
                    ? "border-white/10 bg-[#211915]/90 hover:border-amber-400/40 hover:bg-[#281e18] p-3.5 sm:p-4 shadow-md"
                    : "border-dashed border-white/12 bg-white/2 hover:border-amber-400/40 hover:bg-white/4 p-3.5 sm:p-4"
                }`}
              >
                {/* SLOT HEADER */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70 flex items-center gap-1.5">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </span>

                  {recipe && (
                    <button
                      type="button"
                      onClick={() => onClearSlot(day, slot)}
                      className="text-xs text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer p-0.5"
                      title={`Remove ${label}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {recipe ? (
                  /* FILLED MEAL CARD */
                  <div
                    draggable
                    onDragStart={() => onDragMealStart(day, slot, recipe.id)}
                    className="flex flex-col justify-between flex-1 cursor-grab active:cursor-grabbing min-w-0"
                    title="Drag to swap or move meal"
                  >
                    <div className="flex gap-3.5 items-center">
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="relative h-16 w-16 sm:h-18 sm:w-18 2xl:h-20 2xl:w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-900 shadow-inner"
                      >
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="h-full w-full object-cover transition-transform duration-150 hover:scale-105"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="line-clamp-2 text-xs sm:text-sm 2xl:text-base font-bold text-stone-100 hover:text-amber-300 transition-colors duration-100 leading-snug"
                        >
                          {recipe.title}
                        </Link>
                        <p className="mt-1 text-[11px] sm:text-xs text-stone-400 font-mono">
                          {recipe.cookTime ? `⏱ ${recipe.cookTime}m • ` : ""}
                          {recipe.calories ? `🔥 ${recipe.calories} kcal` : `${recipe.ingredients.length} ing.`}
                        </p>
                      </div>
                    </div>

                    {/* CARD BOTTOM ACTION BAR */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setActivePickerSlot(slot)}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors duration-100 cursor-pointer"
                      >
                        Swap ↻
                      </button>

                      {slot === "dinner" && (
                        <button
                          type="button"
                          onClick={() => setMealPrepRecipe(recipe)}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center gap-1"
                          title="Distribute leftovers / meal prep to lunches"
                        >
                          <span>🥡</span>
                          <span>Matlådor</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* EMPTY MEAL SLOT */
                  <div className="flex flex-col justify-between flex-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => setActivePickerSlot(slot)}
                      className="flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-bold text-stone-300 hover:text-amber-300 transition cursor-pointer"
                    >
                      <span>+</span>
                      <span>Add {label}</span>
                    </button>

                    <div className="flex items-center justify-center gap-3 border-t border-white/5 pt-2 text-xs text-stone-500">
                      <button
                        type="button"
                        onClick={() => onSurpriseMeal(day, slot)}
                        className="hover:text-amber-300 transition cursor-pointer font-semibold text-xs"
                        title="Surprise me with a random recipe"
                      >
                        🎲 Surprise
                      </button>

                      {slot === "lunch" && previousDayDinnerRecipe && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => onSelectRecipe(day, slot, previousDayDinnerRecipe.id)}
                            className="hover:text-emerald-300 transition cursor-pointer font-semibold text-xs"
                            title={`Use yesterday's dinner (${previousDayDinnerRecipe.title})`}
                          >
                            🥡 Leftovers
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RECIPE PICKER MODAL */}
      {activePickerSlot && (
        <RecipePickerModal
          isOpen={Boolean(activePickerSlot)}
          onClose={() => setActivePickerSlot(null)}
          recipes={recipes}
          slot={activePickerSlot}
          selectedRecipeId={dayPlan[activePickerSlot]}
          onSelectRecipe={(id) => {
            onSelectRecipe(day, activePickerSlot, id);
            setActivePickerSlot(null);
          }}
          onClearRecipe={() => {
            onClearSlot(day, activePickerSlot);
            setActivePickerSlot(null);
          }}
        />
      )}

      {/* MEAL PREP MODAL */}
      {mealPrepRecipe && (
        <MealPrepModal
          isOpen={Boolean(mealPrepRecipe)}
          onClose={() => setMealPrepRecipe(null)}
          recipe={mealPrepRecipe}
          fromDay={day}
          onApplyLunches={(targetDays) => {
            onApplyMealPrep(day, mealPrepRecipe, targetDays);
            setMealPrepRecipe(null);
          }}
        />
      )}
    </div>
  );
}
