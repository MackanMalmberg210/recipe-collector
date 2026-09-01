"use client";

import { memo } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
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
  plannedDinnerRecipeIds?: Set<number>;
  dailyCalorieTarget: number;
  onOpenPicker: (day: WeekDay, slot: MealSlot) => void;
  onOpenMealPrep: (day: WeekDay, recipe: AppRecipe) => void;
  onClearSlot: (day: WeekDay, slot: MealSlot) => void;
  onClearDay: (day: WeekDay) => void;
  onSurpriseMeal: (day: WeekDay, slot: MealSlot) => void;
  onShuffleDay: (day: WeekDay) => void;
  onSelectLeftovers: (day: WeekDay, slot: MealSlot, recipeId: number) => void;
  onDragMealStart: (day: WeekDay, slot: MealSlot, recipeId: number) => void;
  onDropMeal: (targetDay: WeekDay, targetSlot: MealSlot) => void;
};

// Unified Bento / Meal Prep Icon
function MealPrepIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function PlannerDayRow({
  day,
  recipes,
  dayPlan,
  previousDayDinnerRecipe,
  plannedDinnerRecipeIds,
  dailyCalorieTarget,
  onOpenPicker,
  onOpenMealPrep,
  onClearSlot,
  onClearDay,
  onSurpriseMeal,
  onShuffleDay,
  onSelectLeftovers,
  onDragMealStart,
  onDropMeal,
}: PlannerDayRowProps) {
  const dayCalories = getDayCalories(recipes, dayPlan);
  const plannedMealsCount = MEAL_SLOTS.filter((slot) => {
    const id = dayPlan[slot];
    return Boolean(id && recipes.some((r) => r.id === id));
  }).length;

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
      className={`rounded-3xl border p-5 sm:p-6 transition-colors duration-150 shadow-sm ${
        isToday()
          ? "border-amber-500/60 bg-amber-500/[0.03] dark:bg-[#191411] dark:border-amber-500/40 ring-1 ring-amber-500/30"
          : "border-stone-200/90 bg-white dark:border-white/[0.08] dark:bg-[#15110e]"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
        
        {/* DAY BADGE & CALORIES (LEFT COLUMN) */}
        <div className="flex flex-row items-center justify-between lg:flex-col lg:items-start lg:justify-between lg:w-48 xl:w-52 lg:shrink-0 lg:pr-6 lg:border-r lg:border-stone-200/80 dark:lg:border-white/8 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-stone-950 dark:text-stone-50">
                {formatWeekDay(day)}
              </h3>
              {isToday() && (
                <span className="rounded-lg bg-amber-500 text-stone-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>

            {/* CALORIE METRIC */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono">
                <span className="text-stone-900 dark:text-stone-200 font-bold">
                  {dayCalories > 0 ? `🔥 ${dayCalories} kcal` : "0 kcal"}
                </span>
                <span className="text-stone-400 dark:text-stone-500 text-xs">
                  / {dailyCalorieTarget}
                </span>
              </div>

              <div className="h-2 w-36 sm:w-40 overflow-hidden rounded-full bg-stone-200 dark:bg-white/8">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    dayCalories > dailyCalorieTarget
                      ? "bg-amber-500 shadow-xs"
                      : dayCalories > 0
                      ? "bg-emerald-500 dark:bg-emerald-400 shadow-xs"
                      : "bg-transparent"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* DAY SHORTCUTS */}
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 pt-2">
            <button
              type="button"
              onClick={() => onShuffleDay(day)}
              className="hover:text-amber-700 dark:hover:text-amber-300 transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
              title="Shuffle all 3 meals for this day"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Shuffle</span>
            </button>

            {plannedMealsCount > 0 && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onClearDay(day)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer text-xs font-semibold"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3 FULL-FEATURED CULINARY SHOWCASE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 flex-1 min-w-0">
          {MEAL_SLOTS.map((slot) => {
            const recipeId = dayPlan[slot];
            const recipe = getRecipeById(recipeId);
            const isLeftoverLunch =
              slot === "lunch" &&
              Boolean(
                recipe && (
                  (previousDayDinnerRecipe && recipe.id === previousDayDinnerRecipe.id) ||
                  (plannedDinnerRecipeIds && plannedDinnerRecipeIds.has(recipe.id))
                )
              );

            return (
              <div
                key={slot}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onDropMeal(day, slot);
                }}
                className={`group/slot relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-100 ease-out shadow-sm ${
                  recipe
                    ? "border-stone-200/90 bg-white hover:border-amber-500/60 hover:shadow-lg dark:border-white/10 dark:bg-[#1a1411] dark:hover:border-amber-400/50 dark:hover:bg-[#201915]"
                    : "border-dashed border-stone-300 bg-stone-50/40 hover:border-amber-500/50 hover:bg-stone-50/80 dark:border-white/10 dark:bg-white/2 dark:hover:border-amber-400/40 dark:hover:bg-white/5"
                }`}
              >
                {recipe ? (
                  /* FILLED RECIPE SHOWCASE CARD */
                  <div
                    draggable
                    onDragStart={() => onDragMealStart(day, slot, recipe.id)}
                    className="flex flex-col justify-between flex-1 cursor-grab active:cursor-grabbing min-h-52 sm:min-h-56"
                    title="Drag to swap or move meal"
                  >
                    <div>
                      {/* HERO PHOTO WITH FLOATING BADGES */}
                      <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-stone-200 dark:bg-stone-900">
                        {recipe.image ? (
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            style={{ transform: "translateZ(0)", willChange: "transform" }}
                            className="h-full w-full object-cover transition-transform duration-150 ease-out group-hover/slot:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">🍲</div>
                        )}

                        {/* Top Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />

                        {/* Floating Slot Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500 text-stone-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm">
                            <span>{formatMealSlot(slot)}</span>
                          </span>

                          {isLeftoverLunch && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 text-stone-950 px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm">
                              <MealPrepIcon className="h-3 w-3" />
                              <span>Leftovers</span>
                            </span>
                          )}
                        </div>

                        {/* Floating Quick Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearSlot(day, slot);
                          }}
                          className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-xl bg-black/60 text-white/80 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-sm"
                          title={`Remove ${formatMealSlot(slot)}`}
                        >
                          ✕
                        </button>
                      </div>

                      {/* CARD DETAILS (ELEVATED TITLE, NO FOOD CATEGORY) */}
                      <div className="p-3.5 sm:p-4 space-y-2">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="line-clamp-2 text-sm sm:text-base font-bold text-stone-950 group-hover/slot:text-amber-600 dark:text-stone-50 dark:group-hover/slot:text-amber-400 transition-colors duration-100 leading-snug"
                        >
                          {recipe.title}
                        </Link>

                        <div className="flex items-center gap-2">
                          {recipe.cookTime !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-white/6 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/6">
                              ⏱ {recipe.cookTime}m
                            </span>
                          )}
                          {recipe.calories !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-white/6 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/6">
                              🔥 {recipe.calories} kcal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER ACTION BAR */}
                    <div className="flex items-center justify-between border-t border-stone-100 dark:border-white/8 px-3.5 py-2.5 sm:px-4 bg-stone-50/70 dark:bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => onOpenPicker(day, slot)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors duration-100 cursor-pointer"
                      >
                        <span>Swap</span>
                        <span>↻</span>
                      </button>

                      {slot === "dinner" && (
                        <button
                          type="button"
                          onClick={() => onOpenMealPrep(day, recipe)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25 transition-colors duration-100 cursor-pointer shadow-2xs"
                          title="Distribute extra portions to lunches"
                        >
                          <MealPrepIcon className="h-3.5 w-3.5" />
                          <span>Prep for Lunches</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* BELOVED EMPTY MEAL SLOT CARD */
                  <div className="flex flex-col justify-between flex-1 p-6 text-center min-h-52 sm:min-h-56">
                    <div className="flex items-center justify-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                        {formatMealSlot(slot)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenPicker(day, slot)}
                      style={{ transform: "translateZ(0)", willChange: "transform" }}
                      className="my-auto flex flex-col items-center justify-center gap-2 py-4 text-stone-600 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition-all duration-150 ease-out cursor-pointer group-hover/slot:scale-105"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200/70 dark:bg-white/8 text-lg font-bold">
                        +
                      </div>
                      <span className="text-sm font-extrabold">
                        Plan {formatMealSlot(slot)}
                      </span>
                    </button>

                    <div className="flex items-center justify-center gap-3 border-t border-stone-200/60 dark:border-white/6 pt-3 text-xs text-stone-400">
                      <button
                        type="button"
                        onClick={() => onSurpriseMeal(day, slot)}
                        className="hover:text-amber-700 dark:hover:text-amber-400 transition cursor-pointer font-semibold text-xs flex items-center gap-1"
                        title="Surprise me with a tailored recipe"
                      >
                        <span>🎲</span>
                        <span>Surprise</span>
                      </button>

                      {slot === "lunch" && previousDayDinnerRecipe && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => onSelectLeftovers(day, slot, previousDayDinnerRecipe.id)}
                            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer font-semibold text-xs flex items-center gap-1"
                            title={`Use yesterday's dinner (${previousDayDinnerRecipe.title})`}
                          >
                            <MealPrepIcon className="h-3 w-3" />
                            <span>Leftovers</span>
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
    </div>
  );
}

export default memo(PlannerDayRow);
