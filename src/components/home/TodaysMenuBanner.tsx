"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getStoredMealPlan, MEAL_SLOTS, type MealPlan, type WeekDay, type MealSlot } from "../../lib/planner";
import type { AppRecipe } from "../../lib/types";
import { ClockIcon, FlameIcon, SparklesIcon, PlateIcon } from "../planner/PlannerIcons";

type TodaysMenuBannerProps = {
  allRecipes: AppRecipe[];
};

function getTodayWeekDay(): WeekDay {
  const dayIndex = new Date().getDay();
  const map: WeekDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[dayIndex];
}

function formatDayName(day: WeekDay): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export default function TodaysMenuBanner({ allRecipes }: TodaysMenuBannerProps) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [activeSlot, setActiveSlot] = useState<MealSlot>("dinner");
  const [hasHydrated, setHasHydrated] = useState(false);

  const today = useMemo(() => getTodayWeekDay(), []);

  useEffect(() => {
    setMealPlan(getStoredMealPlan());
    setHasHydrated(true);

    const handleStorage = () => {
      setMealPlan(getStoredMealPlan());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const todayPlan = mealPlan ? mealPlan[today] : null;

  // Find all available meals for today
  const availableMeals = useMemo(() => {
    if (!todayPlan || !allRecipes || allRecipes.length === 0) return [];
    const meals: { slot: MealSlot; label: string; recipe: AppRecipe }[] = [];

    const slotMeta: Record<MealSlot, { label: string }> = {
      breakfast: { label: "Breakfast" },
      morning_snack: { label: "Morning Snack" },
      lunch: { label: "Lunch" },
      afternoon_snack: { label: "Afternoon Snack" },
      dinner: { label: "Dinner" },
      evening_snack: { label: "Evening Snack" },
    };

    MEAL_SLOTS.forEach((slot) => {
      const recipeId = todayPlan[slot];
      if (recipeId !== null && recipeId !== undefined) {
        const found = allRecipes.find((r) => String(r.id) === String(recipeId));
        if (found) {
          meals.push({ slot, label: slotMeta[slot].label, recipe: found });
        }
      }
    });

    return meals;
  }, [todayPlan, allRecipes]);

  // Default to first available slot, preferring dinner
  useEffect(() => {
    if (availableMeals.length > 0) {
      const hasDinner = availableMeals.find((m) => m.slot === "dinner");
      if (hasDinner) {
        setActiveSlot("dinner");
      } else {
        setActiveSlot(availableMeals[0].slot);
      }
    }
  }, [availableMeals]);

  if (!hasHydrated || !todayPlan) return null;

  const currentActiveMeal = availableMeals.find((m) => m.slot === activeSlot) || availableMeals[0];

  // Case A: Meal Planned for today -> Commanding Spotlight Card
  if (currentActiveMeal) {
    const { recipe, label } = currentActiveMeal;

    return (
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none h-full flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group">
        <div className="space-y-5">
          
          {/* Top Badge Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 dark:bg-amber-500" />
              </span>
              <span>Today&apos;s Menu • {formatDayName(today)}</span>
            </div>

            {/* Meal Slot Switcher */}
            {availableMeals.length > 1 ? (
              <div className="flex items-center gap-1.5">
                {availableMeals.map((m) => {
                  const isSelected = activeSlot === m.slot;
                  return (
                    <button
                      key={m.slot}
                      type="button"
                      onClick={() => setActiveSlot(m.slot)}
                      className={`rounded-xl transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-zinc-900 text-white border border-zinc-900 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40 px-3.5 py-1.5 text-xs font-bold shadow-sm"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:bg-white/5 dark:text-stone-400 dark:hover:bg-amber-500/10 dark:hover:border-amber-500/30 dark:hover:text-amber-300 border border-transparent px-3 py-1.5 text-xs font-semibold"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="rounded-xl bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-stone-300 border border-slate-100 dark:border-white/10 px-3 py-1.5 text-xs font-bold">
                {label}
              </span>
            )}
          </div>

          {/* Dish Details Row - Hero Spotlight Layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-7 pt-1">
            {/* Commanding Hero Thumbnail */}
            <div className="relative h-36 w-36 sm:h-44 sm:w-44 lg:h-48 lg:w-48 shrink-0 overflow-hidden rounded-[26px] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#201813] shadow-md group-hover:shadow-lg transition-all duration-500">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-stone-600">
                  <PlateIcon className="h-14 w-14" />
                </div>
              )}
            </div>

            {/* Dish Info & Culinary Context */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-amber-400">
                  {label} Spotlight
                </span>
                <h4 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-950 dark:text-[#fff8ef] leading-tight line-clamp-2 transition-colors">
                  {recipe.title}
                </h4>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-stone-300">
                {recipe.cookTime && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-xs font-bold text-slate-800 dark:text-stone-200">
                    <ClockIcon className="h-4 w-4 text-slate-500 dark:text-amber-400" />
                    <span>{recipe.cookTime} mins</span>
                  </span>
                )}
                {recipe.calories && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-xs font-bold text-slate-800 dark:text-stone-200">
                    <FlameIcon className="h-4 w-4 text-indigo-600 dark:text-amber-400" />
                    <span>{recipe.calories} kcal</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-xs font-bold text-slate-800 dark:text-stone-200">
                  <SparklesIcon className="h-4 w-4 text-slate-500 dark:text-amber-400" />
                  <span>{recipe.ingredients.length} ingredients</span>
                </span>
              </div>

              {/* Featured Ingredients Preview */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg bg-slate-50 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-stone-400 border border-slate-200/60 dark:border-white/5"
                      >
                        {ing.split(",")[0].trim()}
                      </span>
                    ))}
                    {recipe.ingredients.length > 4 && (
                      <span className="self-center text-xs font-medium text-slate-400 dark:text-stone-500 pl-1">
                        +{recipe.ingredients.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-8 flex flex-wrap items-center gap-3 pt-5 border-t border-slate-100 dark:border-white/10">
          <Link
            href={`/recipes/${recipe.id}?cook=true`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 py-3.5 px-6 text-sm font-bold shadow-[0_4px_12px_rgb(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer"
          >
            <svg className="h-5 w-5 shrink-0 text-white dark:text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Cooking</span>
            <span>→</span>
          </Link>

          <Link
            href="/planner"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 dark:border-white/12 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 px-5 py-3.5 text-sm font-bold shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-all active:scale-95 cursor-pointer"
          >
            <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Weekly Plan</span>
          </Link>
        </div>
      </section>
    );
  }

  // Case B: No meal planned for today
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none h-full flex flex-col justify-between transition-all">
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-stone-400">
          <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-amber-400 animate-pulse" />
          <span>Meal Plan • {formatDayName(today)}</span>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-[#fff8ef] tracking-tight leading-snug">
            What are you cooking today?
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-stone-300 leading-relaxed font-medium">
            Your culinary schedule for today is open. Plan tonight&apos;s dinner in your weekly planner or pick a recipe from your personal cookbook.
          </p>
        </div>

        {/* Quick Inspiration Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/saved"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <span>📖 Browse Saved Recipes</span>
            <span>→</span>
          </Link>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <span>🗓️ Open Weekly Calendar</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/10">
        <Link
          href="/planner"
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 py-3.5 px-6 text-sm sm:text-base font-bold shadow-[0_4px_12px_rgb(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer"
        >
          <svg className="h-5 w-5 shrink-0 text-white dark:text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Plan Tonight&apos;s Menu</span>
        </Link>
      </div>
    </section>
  );
}
