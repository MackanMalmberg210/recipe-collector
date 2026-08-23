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

type PlannerDayCardProps = {
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
  onApplyMealPrep: (fromDay: WeekDay, recipe: AppRecipe, targetDays: WeekDay[]) => void;
  // Drag and Drop props
  onDragMealStart: (day: WeekDay, slot: MealSlot, recipeId: number) => void;
  onDropMeal: (targetDay: WeekDay, targetSlot: MealSlot) => void;
  isDraggingActive: boolean;
};

const SLOT_CONFIG: Record<MealSlot, { icon: string; label: string }> = {
  breakfast: { icon: "☀️", label: "Breakfast" },
  lunch: { icon: "🥗", label: "Lunch" },
  dinner: { icon: "🍽️", label: "Dinner" },
};

export default function PlannerDayCard({
  day,
  recipes,
  dayPlan,
  previousDayDinnerRecipe,
  dailyCalorieTarget,
  onSelectRecipe,
  onClearSlot,
  onClearDay,
  onSurpriseMeal,
  onApplyMealPrep,
  onDragMealStart,
  onDropMeal,
  isDraggingActive,
}: PlannerDayCardProps) {
  const [activePickerSlot, setActivePickerSlot] = useState<MealSlot | null>(null);
  const [mealPrepRecipe, setMealPrepRecipe] = useState<AppRecipe | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<MealSlot | null>(null);

  const dayCalories = getDayCalories(recipes, dayPlan);
  const plannedMealsCount = MEAL_SLOTS.filter((slot) => dayPlan[slot] !== null).length;
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
    <div className={`flex flex-col rounded-3xl border transition-all duration-300 ${
      isToday()
        ? "border-amber-500/40 bg-[#1a1410] shadow-[0_16px_50px_rgba(251,191,36,0.12)] ring-1 ring-amber-500/40"
        : "border-white/10 bg-[#16120f]/95 hover:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
    }`}>
      {/* DAY CARD HEADER */}
      <header className="border-b border-white/8 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#fff8ef]">
              {formatWeekDay(day)}
            </h3>
            {isToday() && (
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                Today
              </span>
            )}
          </div>

          {plannedMealsCount > 0 && (
            <button
              type="button"
              onClick={() => onClearDay(day)}
              className="text-xs font-semibold text-stone-500 hover:text-rose-400 transition cursor-pointer"
              title="Clear all meals for this day"
            >
              Clear day
            </button>
          )}
        </div>

        {/* CALORIE TRACKER PROGRESS */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-stone-300 font-bold">
              {dayCalories > 0 ? `🔥 ${dayCalories} kcal` : "0 kcal"}
            </span>
            <span className="text-stone-500 text-[11px]">
              target {dailyCalorieTarget}
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/6">
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
      </header>

      {/* 3 MEAL SLOTS (Breakfast, Lunch, Dinner) */}
      <div className="flex-1 p-3 sm:p-4 space-y-3.5">
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
              className={`space-y-1.5 transition rounded-2xl ${
                isSlotDragOver
                  ? "ring-2 ring-amber-400 bg-amber-400/10 p-1"
                  : ""
              }`}
            >
              {/* SLOT HEADER */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70 flex items-center gap-1.5">
                  <span>{icon}</span>
                  <span>{label}</span>
                </span>

                {recipe && (
                  <button
                    type="button"
                    onClick={() => onClearSlot(day, slot)}
                    className="text-xs text-stone-500 hover:text-rose-400 transition cursor-pointer"
                    title={`Remove ${label}`}
                  >
                    ✕
                  </button>
                )}
              </div>

              {recipe ? (
                /* FILLED MEAL CARD (Draggable with rich hover) */
                <div
                  draggable
                  onDragStart={() => onDragMealStart(day, slot, recipe.id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#211915]/90 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-[#281e18] hover:shadow-lg hover:shadow-black/50 cursor-grab active:cursor-grabbing"
                  title="Drag to move or swap meal"
                >
                  <div className="flex gap-3">
                    {/* THUMBNAIL */}
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-900 shadow-inner"
                    >
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-108"
                      />
                    </Link>

                    {/* DETAILS */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="line-clamp-2 text-xs sm:text-sm font-bold text-stone-100 group-hover:text-amber-300 transition leading-snug"
                        >
                          {recipe.title}
                        </Link>
                        <p className="mt-1 text-[11px] text-stone-400 font-mono">
                          {recipe.cookTime ? `⏱ ${recipe.cookTime}m • ` : ""}
                          {recipe.calories ? `🔥 ${recipe.calories} kcal` : `${recipe.ingredients.length} ing.`}
                        </p>
                      </div>

                      {/* QUICK ACTION BAR */}
                      <div className="flex items-center gap-3 pt-1.5 border-t border-white/5 mt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setActivePickerSlot(slot)}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                        >
                          Swap ↻
                        </button>

                        {slot === "dinner" && (
                          <button
                            type="button"
                            onClick={() => setMealPrepRecipe(recipe)}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center gap-1"
                            title="Distribute leftovers / meal prep to lunches"
                          >
                            <span>🥡</span>
                            <span>Matlådor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* EMPTY MEAL SLOT */
                <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-white/12 bg-white/2 p-3 text-center transition hover:border-amber-400/40 hover:bg-white/4">
                  <button
                    type="button"
                    onClick={() => setActivePickerSlot(slot)}
                    className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold text-stone-300 hover:text-amber-300 transition cursor-pointer"
                  >
                    <span>+</span>
                    <span>Add {label}</span>
                  </button>

                  <div className="flex items-center justify-center gap-3 border-t border-white/5 pt-2 text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => onSurpriseMeal(day, slot)}
                      className="hover:text-amber-300 transition cursor-pointer font-medium"
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
                          className="hover:text-emerald-300 transition cursor-pointer font-medium"
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

      {/* MEAL PREP MODAL (Multi-lunch distribution) */}
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
