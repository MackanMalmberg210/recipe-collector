"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getStoredMealPlan, type MealPlan, type WeekDay, type MealSlot } from "../../lib/planner";
import type { AppRecipe } from "../../lib/types";

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
    const meals: { slot: MealSlot; label: string; icon: string; recipe: AppRecipe }[] = [];

    const slotMeta: Record<MealSlot, { label: string; icon: string }> = {
      breakfast: { label: "Breakfast", icon: "🍳" },
      lunch: { label: "Lunch", icon: "🥗" },
      dinner: { label: "Dinner", icon: "🥩" },
    };

    (["breakfast", "lunch", "dinner"] as MealSlot[]).forEach((slot) => {
      const recipeId = todayPlan[slot];
      if (recipeId !== null && recipeId !== undefined) {
        const found = allRecipes.find((r) => String(r.id) === String(recipeId));
        if (found) {
          meals.push({ slot, ...slotMeta[slot], recipe: found });
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
      <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#16120f]/95 dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between transition-all hover:border-amber-400/40 dark:hover:border-amber-400/30 group">
        <div className="space-y-4">
          
          {/* Top Badge Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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
                      className={`rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/50 dark:border-amber-400/40 px-3 py-1 text-xs font-bold shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 dark:bg-white/5 dark:text-stone-400 dark:hover:bg-amber-500/10 dark:hover:border-amber-500/30 dark:hover:text-amber-300 border border-stone-200 dark:border-white/8 px-2 py-0.5 text-[11px] font-medium"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="rounded-lg bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300 border border-stone-200 dark:border-white/10 px-2.5 py-0.5 text-xs font-semibold">
                {label}
              </span>
            )}
          </div>

          {/* Dish Details Row */}
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="relative h-22 w-22 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 dark:border-white/10 dark:bg-stone-900 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">
                  🍲
                </div>
              )}
            </div>

            {/* Dish Info */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <h4 className="text-lg sm:text-xl font-bold text-stone-950 dark:text-[#fff8ef] leading-snug line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                {recipe.title}
              </h4>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400">
                {recipe.cookTime && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 dark:bg-white/5">
                    <span>⏱️</span>
                    <span>{recipe.cookTime} mins</span>
                  </span>
                )}
                {recipe.calories && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 dark:bg-white/5">
                    <span>🔥</span>
                    <span>{recipe.calories} kcal</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 dark:bg-white/5">
                  <span>🥕</span>
                  <span>{recipe.ingredients.length} items</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-stone-100 dark:border-white/6">
          <Link
            href={`/recipes/${recipe.id}?cook=true`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 py-3 px-5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer"
          >
            <svg className="h-4.5 w-4.5 shrink-0 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Cooking</span>
            <span>→</span>
          </Link>

          <Link
            href="/planner"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300/90 bg-stone-50 hover:bg-stone-100 text-stone-800 dark:border-white/12 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Weekly Plan</span>
          </Link>
        </div>
      </section>
    );
  }

  // Case B: No meal planned for today
  return (
    <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#16120f]/95 dark:shadow-[0_166px_50px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between transition-all hover:border-amber-400/40 dark:hover:border-amber-400/30">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Today&apos;s Meal Plan • {formatDayName(today)}</span>
        </div>

        <h3 className="text-xl font-extrabold text-stone-950 dark:text-[#fff8ef] tracking-tight">
          What are you cooking today?
        </h3>

        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          Your meal schedule for tonight is open. Pick a dish from your cookbook or generate your week&apos;s schedule.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100 dark:border-white/6">
        <Link
          href="/planner"
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 py-3 px-5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer"
        >
          <svg className="h-4.5 w-4.5 shrink-0 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Plan Tonight&apos;s Menu</span>
        </Link>
      </div>
    </section>
  );
}
