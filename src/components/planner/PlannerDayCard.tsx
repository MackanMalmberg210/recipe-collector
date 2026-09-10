"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
import RecipePickerModal from "./RecipePickerModal";
import MealPrepModal from "./MealPrepModal";
import {
  MEAL_SLOTS,
  MAIN_MEAL_SLOTS,
  formatMealSlot,
  formatWeekDay,
  getDayCalories,
} from "../../lib/planner";
import {
  FlameIcon,
  ClockIcon,
  PlateIcon,
  DiceIcon,
  MealPrepIcon,
  SunIcon,
  BowlIcon,
  DinnerIcon,
  AppleIcon,
  AfternoonSnackIcon,
  MoonIcon,
  SnackShelfIcon,
  RefreshIcon,
  CloseIcon,
  SunriseIcon,
  PlusIcon,
} from "./PlannerIcons";

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
  onDragMealStart?: (day: WeekDay, slot: MealSlot, recipeId: number) => void;
  onDropMeal?: (targetDay: WeekDay, targetSlot: MealSlot) => void;
  isDraggingActive?: boolean;
};

const MAIN_SLOT_CONFIG: Record<
  "breakfast" | "lunch" | "dinner",
  { Icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  breakfast: { Icon: SunIcon, label: "Breakfast" },
  lunch: { Icon: BowlIcon, label: "Lunch" },
  dinner: { Icon: DinnerIcon, label: "Dinner" },
};

const SNACK_SLOTS: {
  slot: MealSlot;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slot: "morning_snack", label: "Morning Snack", Icon: SunIcon },
  { slot: "afternoon_snack", label: "Afternoon Snack", Icon: AfternoonSnackIcon },
  { slot: "evening_snack", label: "Evening Snack", Icon: MoonIcon },
];

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
            <span className="text-stone-300 font-bold inline-flex items-center gap-1">
              <FlameIcon className="h-3 w-3 text-amber-400" />
              <span>{dayCalories > 0 ? `${dayCalories} kcal` : "0 kcal"}</span>
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

      {/* 3 MAIN MEAL SLOTS */}
      <div className="flex-1 p-3 sm:p-4 space-y-3">
        {MAIN_MEAL_SLOTS.map((slot) => {
          const recipeId = dayPlan[slot];
          const recipe = getRecipeById(recipeId);
          const { Icon: SlotIcon, label } = MAIN_SLOT_CONFIG[slot];
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
                onDropMeal?.(day, slot);
              }}
              className={`space-y-1.5 transition rounded-2xl ${
                isSlotDragOver ? "ring-2 ring-amber-400 bg-amber-400/10 p-1" : ""
              }`}
            >
              {/* SLOT HEADER */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70 flex items-center gap-1.5">
                  <SlotIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span>{label}</span>
                </span>

                {recipe && (
                  <button
                    type="button"
                    onClick={() => onClearSlot(day, slot)}
                    className="text-stone-500 hover:text-rose-400 transition cursor-pointer p-0.5"
                    title={`Remove ${label}`}
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                )}
              </div>

              {recipe ? (
                /* FILLED MEAL CARD */
                <div
                  draggable={Boolean(onDragMealStart)}
                  onDragStart={() => onDragMealStart?.(day, slot, recipe.id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#211915]/90 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-[#281e18] hover:shadow-lg hover:shadow-black/50 cursor-grab active:cursor-grabbing"
                  title="Drag to move or swap meal"
                >
                  <div className="flex gap-3">
                    {/* THUMBNAIL */}
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-900 shadow-inner flex items-center justify-center"
                    >
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-108"
                        />
                      ) : (
                        <PlateIcon className="h-7 w-7 text-stone-600" />
                      )}
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
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-400 font-mono">
                          {recipe.cookTime !== undefined && (
                            <span className="inline-flex items-center gap-0.5">
                              <ClockIcon className="h-2.5 w-2.5 text-stone-400" />
                              <span>{recipe.cookTime}m</span>
                            </span>
                          )}
                          {recipe.calories !== undefined && (
                            <span className="inline-flex items-center gap-0.5">
                              <FlameIcon className="h-2.5 w-2.5 text-amber-500" />
                              <span>{recipe.calories} kcal</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* QUICK ACTION BAR */}
                      <div className="flex items-center gap-3 pt-1.5 border-t border-white/5 mt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setActivePickerSlot(slot)}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Swap</span>
                          <RefreshIcon className="h-2.5 w-2.5" />
                        </button>

                        {slot === "dinner" && (
                          <button
                            type="button"
                            onClick={() => setMealPrepRecipe(recipe)}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center gap-1"
                            title="Distribute leftovers / meal prep to lunches"
                          >
                            <MealPrepIcon className="h-3 w-3" />
                            <span>Prep Lunches</span>
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
                    className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold text-stone-300 hover:text-amber-300 transition cursor-pointer"
                  >
                    <span>+</span>
                    <span>Add {label}</span>
                  </button>

                  <div className="flex items-center justify-center gap-3 border-t border-white/5 pt-2 text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => onSurpriseMeal(day, slot)}
                      className="hover:text-amber-300 transition cursor-pointer font-medium inline-flex items-center gap-1"
                      title="Surprise me with a random recipe"
                    >
                      <DiceIcon className="h-3 w-3" />
                      <span>Surprise</span>
                    </button>

                    {slot === "lunch" && previousDayDinnerRecipe && (
                      <>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => onSelectRecipe(day, slot, previousDayDinnerRecipe.id)}
                          className="hover:text-emerald-300 transition cursor-pointer font-medium inline-flex items-center gap-1"
                          title={`Use yesterday's dinner (${previousDayDinnerRecipe.title})`}
                        >
                          <MealPrepIcon className="h-3 w-3 text-emerald-400" />
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

        {/* OPTIONAL SNACKS SECTION */}
        <div className="pt-2.5 border-t border-white/8 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
              <SnackShelfIcon className="h-3 w-3 text-amber-400" />
              <span>Snacks</span>
            </div>
            <span className="text-[9px] text-stone-500 font-medium">Optional</span>
          </div>

          <div className="space-y-1.5">
            {SNACK_SLOTS.map(({ slot, label, Icon: SnackIcon }) => {
              const snackRecipeId = dayPlan[slot];
              const snackRecipe = getRecipeById(snackRecipeId);
              const isSnackDragOver = dragOverSlot === slot;

              return (
                <div key={slot}>
                  {snackRecipe ? (
                    <div
                      draggable={Boolean(onDragMealStart)}
                      onDragStart={() => onDragMealStart?.(day, slot, snackRecipe.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSlot(slot);
                      }}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSlot(null);
                        onDropMeal?.(day, slot);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-[#1e1713] p-2.5 shadow-xs hover:border-amber-400/40 transition-all cursor-grab active:cursor-grabbing group/snackcard ${
                        isSnackDragOver ? "ring-2 ring-amber-400 bg-amber-400/10" : ""
                      }`}
                      title="Drag to move or swap snack"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-900 border border-white/10 flex items-center justify-center">
                          {snackRecipe.image ? (
                            <img
                              src={snackRecipe.image}
                              alt={snackRecipe.title}
                              className="h-full w-full object-cover group-hover/snackcard:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <PlateIcon className="h-5 w-5 text-stone-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <SnackIcon className="h-3 w-3 text-amber-400 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300/80 truncate">
                              {label}
                            </span>
                          </div>
                          <p className="truncate text-xs font-bold text-stone-100 group-hover/snackcard:text-amber-300 transition-colors">
                            {snackRecipe.title}
                          </p>
                          {snackRecipe.calories ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-stone-400">
                              <FlameIcon className="h-2.5 w-2.5 text-amber-500" />
                              <span>{snackRecipe.calories} kcal</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActivePickerSlot(slot)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-white/10 hover:text-amber-300 transition cursor-pointer"
                          title={`Swap ${label}`}
                        >
                          <RefreshIcon className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onClearSlot(day, slot)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                          title={`Remove ${label}`}
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActivePickerSlot(slot)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSlot(slot);
                      }}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSlot(null);
                        onDropMeal?.(day, slot);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-amber-400/30 hover:bg-white/[0.04] p-2 text-xs font-bold text-stone-400 transition cursor-pointer group/snackbtn ${
                        isSnackDragOver ? "ring-2 ring-amber-400 bg-amber-400/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <SnackIcon className="h-3.5 w-3.5 text-stone-400 group-hover/snackbtn:text-amber-400 transition-colors" />
                        <span className="text-xs font-bold text-stone-300 group-hover/snackbtn:text-amber-300 transition-colors">
                          Add {label}
                        </span>
                      </div>
                      <PlusIcon className="h-3.5 w-3.5 text-stone-500 group-hover/snackbtn:text-amber-400 transition-colors" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
