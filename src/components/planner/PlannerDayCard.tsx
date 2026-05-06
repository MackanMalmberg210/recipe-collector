"use client";

import Link from "next/link";
import { useState } from "react";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
import RecipePickerModal from "./RecipePickerModal";
import {
  MEAL_SLOTS,
  formatMealSlot,
  formatWeekDay,
  getCalorieDifferenceLabel,
  getDayCalories,
} from "../../lib/planner";

type PlannerDayCardProps = {
  day: WeekDay;
  recipes: AppRecipe[];
  dayPlan: DayPlan;
  dailyCalorieTarget: number;
  onSelectRecipe: (
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => void;
  onClearSlot: (day: WeekDay, slot: MealSlot) => void;
  onClearDay: (day: WeekDay) => void;
};

type SlotTheme = {
  icon: string;
  label: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  accentClassName: string;
  badgeClassName: string;
  glowClassName: string;
  accentGlowClassName: string;
};

const SLOT_THEMES: Record<MealSlot, SlotTheme> = {
  breakfast: {
    icon: "☀️",
    label: "Breakfast",
    description: "Start the day",
    emptyTitle: "Add breakfast",
    emptyDescription: "Pick something light, filling, or protein-rich.",
    accentClassName: "border-amber-200/20",
    badgeClassName: "bg-amber-300/10 text-amber-100 border-amber-200/15",
    glowClassName: "bg-amber-400/10",
    accentGlowClassName: "before:bg-amber-300/35",
  },
  lunch: {
    icon: "🥗",
    label: "Lunch",
    description: "Midday fuel",
    emptyTitle: "Add lunch",
    emptyDescription: "Choose a balanced meal to keep the day going.",
    accentClassName: "border-emerald-200/20",
    badgeClassName: "bg-emerald-300/10 text-emerald-100 border-emerald-200/15",
    glowClassName: "bg-emerald-400/10",
    accentGlowClassName: "before:bg-emerald-300/35",
  },
  dinner: {
    icon: "🍽️",
    label: "Dinner",
    description: "Evening meal",
    emptyTitle: "Add dinner",
    emptyDescription: "Plan something satisfying for later.",
    accentClassName: "border-violet-200/20",
    badgeClassName: "bg-rose-300/10 text-rose-100 border-rose-200/15",
    glowClassName: "bg-violet-400/10",
    accentGlowClassName: "before:bg-violet-300/30",
  },
};

function getOriginLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "Your recipe";
  if (recipe.origin === "imported") return "Imported";
  return "Library";
}

function getSlotCalories(recipes: AppRecipe[], recipeId: number | null) {
  if (recipeId === null) return 0;

  return recipes.find((recipe) => recipe.id === recipeId)?.calories ?? 0;
}

export default function PlannerDayCard({
  day,
  recipes,
  dayPlan,
  dailyCalorieTarget,
  onSelectRecipe,
  onClearSlot,
  onClearDay,
}: PlannerDayCardProps) {
  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot | null>(null);

  const dayCalories = getDayCalories(recipes, dayPlan);
  const hasAnyMeal = MEAL_SLOTS.some((slot) => dayPlan[slot] !== null);
  const plannedMealsCount = MEAL_SLOTS.filter(
    (slot) => dayPlan[slot] !== null,
  ).length;
  const calorieLabel = getCalorieDifferenceLabel(
    dayCalories,
    dailyCalorieTarget,
  );

  const progressPercentage = dailyCalorieTarget
    ? Math.min(Math.round((dayCalories / dailyCalorieTarget) * 100), 100)
    : 0;

  function handleSelectRecipe(recipeId: number) {
    if (!activeMealSlot) return;

    onSelectRecipe(day, activeMealSlot, recipeId);
    setActiveMealSlot(null);
  }

  function handleClearActiveSlot() {
    if (!activeMealSlot) return;

    onClearSlot(day, activeMealSlot);
    setActiveMealSlot(null);
  }

  return (
    <>
      <section className="rounded-4xl bg-linear-to-br from-amber-100/10 via-white/4 to-black/20 p-1 shadow-[0_30px_100px_rgba(0,0,0,0.38)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_42px_130px_rgba(0,0,0,0.52)]">
        <div className="rounded-4xl border border-white/6 bg-[#17120f]/95 p-5 ring-1 ring-white/4">
          <div className="mb-5 grid grid-cols-[1fr_auto] gap-4">
            <div className="pl-1">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-amber-100/15 bg-amber-100/10 px-3 py-1 text-xs font-bold uppercase tracking-3 text-amber-100/70">
                  Daily plan
                </span>

                <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs font-medium text-stone-400">
                  {hasAnyMeal ? "Planning" : "Empty"}
                </span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#fff8ef]">
                {formatWeekDay(day)}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-stone-200 ring-1 ring-white/8">
                  {plannedMealsCount}/3 meals planned
                </span>

                {hasAnyMeal ? (
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-200/15">
                    In progress
                  </span>
                ) : (
                  <span className="rounded-full bg-white/4 px-3 py-1 text-xs font-medium text-stone-400 ring-1 ring-white/6">
                    Empty day
                  </span>
                )}
              </div>

              <p className="mt-3 pl-1 text-xs text-stone-500">{calorieLabel}</p>
            </div>

            {hasAnyMeal && (
              <button
                type="button"
                onClick={() => onClearDay(day)}
                className="self-start rounded-xl bg-white/4 px-3 py-2 text-xs font-medium text-stone-400 ring-1 ring-white/8 transition hover:bg-red-400/10 hover:text-red-100 hover:ring-red-300/15"
              >
                Reset
              </button>
            )}
          </div>

          {hasAnyMeal ? (
            <div className="mb-5 ml-1 rounded-3xl bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-3 text-stone-500">
                    Calorie progress
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#fff8ef]">
                    {dayCalories} / {dailyCalorieTarget} kcal
                  </p>
                </div>

                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-stone-200 ring-1 ring-white/8">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/7">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-300 to-amber-200 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                <span>0 kcal</span>
                <span>{dailyCalorieTarget} kcal target</span>
              </div>
            </div>
          ) : (
            <div className="mb-5 ml-1 rounded-xl bg-white/3 px-4 py-3 text-xs text-stone-500 ring-1 ring-white/6">
              Add a meal to start building this day.
            </div>
          )}

          <div className="ml-1 space-y-4">
            {MEAL_SLOTS.map((slot) => {
              const selectedRecipe =
                recipes.find((recipe) => recipe.id === dayPlan[slot]) ?? null;

              const theme = SLOT_THEMES[slot];
              const slotCalories = getSlotCalories(recipes, dayPlan[slot]);

              return (
                <div
                  key={`${day}-${slot}`}
                  className={`relative overflow-hidden rounded-3xl bg-[#1f1712] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_45px_rgba(0,0,0,0.18)] ring-1 ring-white/7 transition before:absolute before:bottom-4 before:left-0 before:top-4 before:w-1 before:rounded-r-full hover:bg-[#241b15] hover:ring-white/10 ${theme.accentGlowClassName}`}
                >
                  <div
                    className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${theme.glowClassName}`}
                  />

                  <div className="relative mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-lg ${theme.badgeClassName}`}
                      >
                        {theme.icon}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#fff8ef]">
                          {theme.label}
                        </p>

                        <p className="mt-0.5 text-xs text-stone-500">
                          {selectedRecipe
                            ? `${slotCalories} kcal`
                            : theme.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRecipe ? (
                    <div className="space-y-3">
                      <Link
                        href={`/recipes/${selectedRecipe.id}`}
                        className="group/card block overflow-hidden rounded-3xl bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/8 transition hover:bg-black/35 hover:ring-amber-100/15"
                      >
                        <div className="relative h-32 overflow-hidden bg-[#2a211b]">
                          <img
                            src={selectedRecipe.image}
                            alt={selectedRecipe.title}
                            className="h-full w-full object-cover transition duration-500 group-hover/card:scale-105"
                          />

                          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />

                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur ${theme.badgeClassName}`}
                            >
                              {theme.label}
                            </span>

                            <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-medium text-stone-100 backdrop-blur">
                              {getOriginLabel(selectedRecipe)}
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="line-clamp-2 text-base font-bold leading-tight text-white">
                              {selectedRecipe.title}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-3">
                          <div className="rounded-2xl bg-white/4 px-3 py-2 ring-1 ring-white/6">
                            <p className="text-xs text-stone-500">Time</p>
                            <p className="mt-1 text-sm font-semibold text-[#fff8ef]">
                              {selectedRecipe.cookTime !== undefined
                                ? `${selectedRecipe.cookTime} min`
                                : "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white/4 px-3 py-2 ring-1 ring-white/6">
                            <p className="text-xs text-stone-500">Calories</p>
                            <p className="mt-1 text-sm font-semibold text-[#fff8ef]">
                              {selectedRecipe.calories ?? 0} kcal
                            </p>
                          </div>
                        </div>
                      </Link>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveMealSlot(slot)}
                          className="rounded-2xl bg-white/5 px-3 py-2.5 text-xs font-semibold text-stone-200 ring-1 ring-white/8 transition hover:bg-white/8 hover:ring-amber-100/15"
                        >
                          Change
                        </button>

                        <button
                          type="button"
                          onClick={() => onClearSlot(day, slot)}
                          className="rounded-2xl bg-white/4 px-3 py-2.5 text-xs font-semibold text-stone-300 ring-1 ring-white/8 transition hover:bg-red-400/10 hover:text-red-100 hover:ring-red-300/15"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveMealSlot(slot)}
                      className="group/add relative w-full overflow-hidden rounded-2xl bg-black/25 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/8 transition hover:bg-black/35 hover:ring-amber-100/15"
                    >
                      <div
                        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition group-hover/add:opacity-100 ${theme.glowClassName}`}
                      />

                      <div className="relative flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#fff8ef]">
                            {theme.emptyTitle}
                          </p>

                          <p className="mt-1 text-xs text-stone-500">
                            {theme.emptyDescription}
                          </p>
                        </div>

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-lg transition group-hover/add:scale-105 ${theme.badgeClassName}`}
                        >
                          +
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {activeMealSlot && (
        <RecipePickerModal
          isOpen={activeMealSlot !== null}
          onClose={() => setActiveMealSlot(null)}
          recipes={recipes}
          slot={activeMealSlot}
          selectedRecipeId={dayPlan[activeMealSlot]}
          onSelectRecipe={handleSelectRecipe}
          onClearRecipe={handleClearActiveSlot}
        />
      )}
    </>
  );
}
