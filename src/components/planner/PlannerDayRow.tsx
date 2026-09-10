"use client";

import { memo } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
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
  SunriseIcon,
  AfternoonSnackIcon,
  MoonIcon,
  SnackShelfIcon,
  RefreshIcon,
  CloseIcon,
  PlusIcon,
  CheckIcon,
} from "./PlannerIcons";

const MAIN_SLOT_CONFIG: Record<
  "breakfast" | "lunch" | "dinner",
  { Icon: React.ComponentType<{ className?: string }> }
> = {
  breakfast: { Icon: SunIcon },
  lunch: { Icon: BowlIcon },
  dinner: { Icon: DinnerIcon },
};

const SNACK_SLOT_CONFIG: {
  slot: MealSlot;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slot: "morning_snack", label: "Morning Snack", Icon: SunIcon },
  { slot: "afternoon_snack", label: "Afternoon Snack", Icon: AfternoonSnackIcon },
  { slot: "evening_snack", label: "Evening Snack", Icon: MoonIcon },
];

type PlannerDayRowProps = {
  day: WeekDay;
  recipes: AppRecipe[];
  dayPlan: DayPlan;
  previousDayDinnerRecipe?: AppRecipe | null;
  plannedDinnerRecipeIds?: Set<number>;
  plannedLunchRecipeIds?: Set<number>;
  dailyCalorieTarget: number;
  onOpenPicker: (day: WeekDay, slot: MealSlot) => void;
  onOpenMealPrep: (day: WeekDay, recipe: AppRecipe) => void;
  onClearSlot: (day: WeekDay, slot: MealSlot) => void;
  onClearDay: (day: WeekDay) => void;
  onSurpriseMeal: (day: WeekDay, slot: MealSlot) => void;
  onShuffleDay: (day: WeekDay) => void;
  onSelectLeftovers: (day: WeekDay, slot: MealSlot, recipeId: number) => void;
};

function PlannerDayRow({
  day,
  recipes,
  dayPlan,
  previousDayDinnerRecipe,
  plannedDinnerRecipeIds,
  plannedLunchRecipeIds,
  dailyCalorieTarget,
  onOpenPicker,
  onOpenMealPrep,
  onClearSlot,
  onClearDay,
  onSurpriseMeal,
  onShuffleDay,
  onSelectLeftovers,
}: PlannerDayRowProps) {
  const dayCalories = getDayCalories(recipes, dayPlan);
  const remainingCalories = dailyCalorieTarget - dayCalories;
  const isOverTarget = remainingCalories < 0;

  const plannedMainMealsCount = MAIN_MEAL_SLOTS.filter((slot) => {
    const id = dayPlan[slot];
    return Boolean(id && recipes.some((r) => r.id === id));
  }).length;

  const plannedSnacksCount = SNACK_SLOT_CONFIG.filter(({ slot }) => {
    const id = dayPlan[slot];
    return Boolean(id && recipes.some((r) => r.id === id));
  }).length;

  const plannedMealsCount = plannedMainMealsCount + plannedSnacksCount;

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
      className={`rounded-3xl border p-5 sm:p-6 transition-all duration-150 shadow-md ${
        isToday()
          ? "border-amber-500/50 bg-stone-50/80 dark:border-amber-500/35 dark:bg-[#1B1612] dark:shadow-[0_8px_32px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/20"
          : "border-stone-300/90 bg-white dark:border-[#38312B] dark:bg-[#171310] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
        
        {/* DAY BADGE & CALORIES (LEFT COLUMN - TIGHTENED & BALANCED) */}
        <div className="flex flex-col justify-start lg:w-48 xl:w-52 lg:shrink-0 lg:pr-6 lg:border-r lg:border-stone-200/80 dark:lg:border-white/8 gap-3.5">
          {/* Header: Day Name + Today Badge */}
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-stone-950 dark:text-stone-50">
              {formatWeekDay(day)}
            </h3>
            {isToday() && (
              <span className="rounded-lg bg-amber-500 text-stone-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                Today
              </span>
            )}
          </div>

          {/* Calorie Breakdown & Progress */}
          <div className="space-y-2">
            <div className="space-y-0.5">
              <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <FlameIcon className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{dayCalories.toLocaleString("en-US")} kcal</span>
              </div>
              <div className="text-xs text-stone-400 dark:text-stone-500 font-medium pl-5.5">
                of {dailyCalorieTarget.toLocaleString("en-US")} kcal
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full max-w-[170px] overflow-hidden rounded-full bg-stone-200/80 dark:bg-white/8">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverTarget
                    ? "bg-amber-500 shadow-xs"
                    : dayCalories > 0
                    ? "bg-emerald-500 dark:bg-emerald-400 shadow-xs"
                    : "bg-transparent"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Remaining / Over target text */}
            <p
              className={`text-xs font-semibold ${
                isOverTarget
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {isOverTarget
                ? `${Math.abs(remainingCalories).toLocaleString("en-US")} kcal over target`
                : `${remainingCalories.toLocaleString("en-US")} kcal remaining`}
            </p>
          </div>

          {/* Secondary Info: Planned Counts (Quiet, unobtrusive) */}
          <div className="space-y-1 pt-1.5 border-t border-stone-100 dark:border-white/[0.04] text-[11px] text-stone-400 dark:text-stone-500">
            <div className="flex items-center justify-between">
              <span>Meals planned</span>
              <span className="font-semibold text-stone-600 dark:text-stone-400 font-mono">
                {plannedMainMealsCount} of 3
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Snacks planned</span>
              <span className="font-semibold text-stone-600 dark:text-stone-400 font-mono">
                {plannedSnacksCount} of 3
              </span>
            </div>
          </div>

          {/* DAY SHORTCUTS (Shuffle & Clear - Grouped neatly below stats) */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-100 dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => onShuffleDay(day)}
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/6 dark:hover:text-stone-200 transition-colors cursor-pointer active:scale-95 focus-visible:outline-none"
              title="Shuffle all 3 meals for this day"
            >
              <RefreshIcon className="h-3.5 w-3.5 text-stone-400" />
              <span>Shuffle</span>
            </button>

            {plannedMealsCount > 0 && (
              <button
                type="button"
                onClick={() => onClearDay(day)}
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-stone-400 hover:bg-rose-500/10 hover:text-rose-600 dark:text-stone-500 dark:hover:bg-rose-500/15 dark:hover:text-rose-400 transition-colors cursor-pointer active:scale-95 focus-visible:outline-none"
                title="Clear all meals and snacks for this day"
              >
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT MAIN SECTION: 3 MEALS + DEDICATED SNACKS SUB-SHELF */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          
          {/* 3 FULL-FEATURED CULINARY SHOWCASE COLUMNS (Equal Height, Clean Alignment) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 min-w-0">
            {MAIN_MEAL_SLOTS.map((slot) => {
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
              const isLunchesPrepped =
                slot === "dinner" &&
                Boolean(recipe && plannedLunchRecipeIds && plannedLunchRecipeIds.has(recipe.id));
              const { Icon: SlotIcon } = MAIN_SLOT_CONFIG[slot];

              return (
                <div
                  key={slot}
                  className={`group/slot relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-colors duration-150 shadow-sm min-h-[280px] sm:min-h-[290px] ${
                    recipe
                      ? "border-stone-200/90 bg-white hover:border-stone-300 hover:shadow-md dark:border-white/[0.08] dark:bg-[#1a1411] dark:hover:border-white/20"
                      : "border-dashed border-stone-300/80 bg-stone-50/40 hover:border-stone-400/80 hover:bg-stone-50/70 dark:border-white/10 dark:bg-white/2 dark:hover:border-white/20"
                  }`}
                >
                  {recipe ? (
                    /* FILLED RECIPE SHOWCASE CARD */
                    <div className="flex flex-col justify-between flex-1">

                      <div>
                        {/* HERO PHOTO WITH FLOATING BADGES (Fixed height across cards) */}
                        <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-stone-200 dark:bg-stone-900">
                          {recipe.image ? (
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              style={{ transform: "translateZ(0)", willChange: "transform" }}
                              className="h-full w-full object-cover transition-transform duration-150 ease-out group-hover/slot:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-400">
                              <PlateIcon className="h-10 w-10 text-stone-400" />
                            </div>
                          )}

                          {/* Top Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />

                          {/* Floating Category Slot Badge (Pill preserved for meal categories) */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500 text-stone-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm">
                              <SlotIcon className="h-3 w-3" />
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
                            className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-xl bg-black/60 text-white/80 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer shadow-sm focus-visible:outline-none"
                            title={`Remove ${formatMealSlot(slot)}`}
                          >
                            <CloseIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* CARD DETAILS */}
                        <div className="p-3.5 sm:p-4 space-y-2">
                          {/* Consistent height anchor for recipe title */}
                          <div className="min-h-[40px] sm:min-h-[44px]">
                            <Link
                              href={`/recipes/${recipe.id}`}
                              className="line-clamp-2 text-sm sm:text-base font-bold text-stone-950 hover:text-amber-600 dark:text-stone-50 dark:hover:text-amber-400 transition-colors duration-150 leading-snug focus-visible:outline-none focus-visible:underline"
                            >
                              {recipe.title}
                            </Link>
                          </div>

                          {/* Metadata: Lightweight secondary inline text (Priority 2 & 9: NO PILLS) */}
                          <div className="flex items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400 font-medium">
                            {recipe.cookTime !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <ClockIcon className="h-3.5 w-3.5 text-stone-400" />
                                <span>{recipe.cookTime} min</span>
                              </span>
                            )}
                            {recipe.cookTime !== undefined && recipe.calories !== undefined && (
                              <span className="text-stone-300 dark:text-white/20">·</span>
                            )}
                            {recipe.calories !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <FlameIcon className="h-3.5 w-3.5 text-amber-500" />
                                <span>{recipe.calories} kcal</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CARD FOOTER ACTION BAR (Fixed h-11 height aligning across cards) */}
                      <div className="h-11 flex items-center justify-between border-t border-stone-100 dark:border-white/8 px-3.5 sm:px-4 bg-stone-50/70 dark:bg-white/[0.02]">
                        <button
                          type="button"
                          onClick={() => onOpenPicker(day, slot)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 transition-colors duration-100 cursor-pointer focus-visible:outline-none"
                        >
                          <span>Swap</span>
                          <RefreshIcon className="h-3 w-3 opacity-70" />
                        </button>

                        {slot === "dinner" && (
                          isLunchesPrepped ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckIcon className="h-3.5 w-3.5" />
                              <span>Lunches prepped</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenMealPrep(day, recipe)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20 transition-colors duration-100 cursor-pointer shadow-2xs active:scale-95 focus-visible:outline-none"
                              title="Distribute extra portions to lunches"
                            >
                              <MealPrepIcon className="h-3.5 w-3.5" />
                              <span>Prep for Lunches</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    /* EMPTY MEAL SLOT CARD (Matching exact vertical layout and h-11 footer) */
                    <div className="flex flex-col justify-between flex-1 min-h-[280px] sm:min-h-[290px]">
                      {/* Slot Header */}
                      <div className="p-4 pb-0 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                          <SlotIcon className="h-3.5 w-3.5" />
                          <span>{formatMealSlot(slot)}</span>
                        </span>
                      </div>

                      {/* Centered Plan Action */}
                      <button
                        type="button"
                        onClick={() => onOpenPicker(day, slot)}
                        className="my-auto flex flex-col items-center justify-center gap-2.5 py-6 px-4 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition-colors cursor-pointer group/planbtn focus-visible:outline-none"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200/70 dark:bg-white/8 text-stone-700 dark:text-stone-300 group-hover/planbtn:bg-amber-500/15 group-hover/planbtn:text-amber-600 dark:group-hover/planbtn:text-amber-400 transition-colors">
                          <PlusIcon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-extrabold tracking-tight">
                          Plan {formatMealSlot(slot)}
                        </span>
                      </button>

                      {/* Aligned Footer Bar */}
                      <div className="h-11 flex items-center justify-center gap-3 border-t border-stone-200/60 dark:border-white/6 px-4 text-xs text-stone-400">
                        <button
                          type="button"
                          onClick={() => onSurpriseMeal(day, slot)}
                          className="hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer font-semibold text-xs flex items-center gap-1.5 focus-visible:outline-none"
                          title="Surprise me with a tailored recipe"
                        >
                          <DiceIcon className="h-3.5 w-3.5 text-stone-400" />
                          <span>Surprise</span>
                        </button>

                        {slot === "lunch" && previousDayDinnerRecipe && (
                          <>
                            <span className="text-stone-300 dark:text-white/20">•</span>
                            <button
                              type="button"
                              onClick={() => onSelectLeftovers(day, slot, previousDayDinnerRecipe.id)}
                              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer font-semibold text-xs flex items-center gap-1.5 focus-visible:outline-none"
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

          {/* DEDICATED SNACKS & QUICK BITES SUB-SHELF (Tightened spacing below meals) */}
          <div className="border-t border-stone-200/70 dark:border-white/6 pt-2.5 mt-0">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <SnackShelfIcon className="h-3.5 w-3.5 text-amber-500" />
                <span>Snacks & Quick Bites</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SNACK_SLOT_CONFIG.map(({ slot, label, Icon: SnackIcon }) => {
                const snackRecipeId = dayPlan[slot];
                const snackRecipe = getRecipeById(snackRecipeId);

                return (
                  <div key={slot} className="w-full">
                    {snackRecipe ? (
                      /* FILLED SNACK CARD */
                      <div
                        className="w-full h-20 sm:h-[84px] flex items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white dark:border-white/[0.08] dark:bg-[#1a1411] p-3 shadow-xs hover:border-stone-300 dark:hover:border-white/20 transition-colors group/snack"
                      >
                        {/* THUMBNAIL (Square aspect-ratio) */}
                        <div className="relative aspect-square h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 flex items-center justify-center">
                          {snackRecipe.image ? (
                            <img
                              src={snackRecipe.image}
                              alt={snackRecipe.title}
                              className="h-full w-full object-cover group-hover/snack:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <PlateIcon className="h-7 w-7 text-stone-400" />
                          )}
                        </div>

                        {/* DETAILS */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <SnackIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 truncate">
                              {label}
                            </span>
                          </div>
                          <p className="truncate text-xs sm:text-sm font-bold text-stone-950 dark:text-stone-50 transition-colors">
                            {snackRecipe.title}
                          </p>
                          {snackRecipe.calories ? (
                            <div className="flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400">
                              <FlameIcon className="h-3 w-3 text-amber-500 shrink-0" />
                              <span className="font-semibold text-stone-700 dark:text-stone-300">{snackRecipe.calories} kcal</span>
                            </div>
                          ) : null}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenPicker(day, slot)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-white/10 dark:hover:text-stone-200 transition-colors cursor-pointer focus-visible:outline-none"
                            title={`Swap ${label}`}
                          >
                            <RefreshIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearSlot(day, slot);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors cursor-pointer focus-visible:outline-none"
                            title={`Remove ${label}`}
                          >
                            <CloseIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* EMPTY SNACK BUTTON - ALIGNED & SUBSTANTIAL */
                      <button
                        type="button"
                        onClick={() => onOpenPicker(day, slot)}
                        className="w-full h-20 sm:h-[84px] flex items-center justify-between rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/40 hover:border-stone-400/80 hover:bg-stone-50/70 px-3.5 sm:px-4 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group/snackbtn focus-visible:outline-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200/60 dark:bg-white/6 text-stone-500 dark:text-stone-400 group-hover/snackbtn:bg-stone-300/40 dark:group-hover/snackbtn:bg-white/10 transition-colors">
                            <SnackIcon className="h-4 w-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <span className="block text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 group-hover/snackbtn:text-stone-950 dark:group-hover/snackbtn:text-stone-100 transition-colors truncate">
                              Add {label}
                            </span>
                            <span className="block text-[11px] text-stone-400 dark:text-stone-500 truncate">
                              Plan a snack
                            </span>
                          </div>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-stone-200 dark:border-white/10 bg-white/70 dark:bg-white/4 text-stone-400 group-hover/snackbtn:border-stone-400 dark:group-hover/snackbtn:border-white/20 group-hover/snackbtn:text-stone-600 dark:group-hover/snackbtn:text-stone-300 transition-colors">
                          <PlusIcon className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PlannerDayRow);
