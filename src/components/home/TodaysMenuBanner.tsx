"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  getStoredMealPlan,
  saveMealPlan,
  type MealPlan,
  type WeekDay,
  type MealSlot,
} from "../../lib/planner";
import type { AppRecipe } from "../../lib/types";
import { formatProteinLabel } from "../../lib/nutrition";
import { ClockIcon, FlameIcon, SparklesIcon } from "../planner/PlannerIcons";

type TodaysMenuBannerProps = {
  allRecipes: AppRecipe[];
};

const DEFAULT_CULINARY_HERO_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80";

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

function formatSlotLabel(slot: MealSlot): string {
  if (slot === "morning_snack" || slot === "afternoon_snack" || slot === "evening_snack") {
    return "Snack";
  }
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export default function TodaysMenuBanner({ allRecipes }: TodaysMenuBannerProps) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [activeSlot, setActiveSlot] = useState<MealSlot>("lunch");

  const today = useMemo(() => getTodayWeekDay(), []);

  useEffect(() => {
    setMealPlan(getStoredMealPlan());

    const handleStorage = () => {
      setMealPlan(getStoredMealPlan());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("meal_plan_updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("meal_plan_updated", handleStorage);
    };
  }, []);

  const todayPlan = mealPlan ? mealPlan[today] : null;
  const currentSlotRecipeId = todayPlan ? todayPlan[activeSlot] : null;
  const isSlotPlanned = currentSlotRecipeId !== null && currentSlotRecipeId !== undefined;

  // Find candidate recipe for the active slot
  const displayRecipe = useMemo(() => {
    if (!allRecipes || allRecipes.length === 0) return null;

    // 1. If today has a planned recipe for activeSlot, show that
    if (isSlotPlanned) {
      const match = allRecipes.find((r) => String(r.id) === String(currentSlotRecipeId));
      if (match) return match;
    }

    // 2. Otherwise pick an inspiration dish suited for this slot
    if (activeSlot === "breakfast") {
      const bfast = allRecipes.find(
        (r) =>
          r.image &&
          (r.mealType === "breakfast" ||
            r.tags?.includes("breakfast") ||
            r.category === "breakfast" ||
            (r.cookTime ?? 99) <= 20),
      );
      if (bfast) return bfast;
    } else if (activeSlot === "lunch") {
      // Prefer pasta / quick lunch / creamy garlic pasta if present
      const lunchMatch = allRecipes.find(
        (r) =>
          r.image &&
          (r.title.toLowerCase().includes("creamy garlic") ||
            r.category === "pasta" ||
            r.mealType === "lunch" ||
            ((r.cookTime ?? 99) <= 25 && r.category !== "dessert")),
      );
      if (lunchMatch) return lunchMatch;
    } else if (activeSlot === "dinner") {
      const dinnerMatch = allRecipes.find(
        (r) =>
          r.image &&
          (r.mealType === "dinner" ||
            r.category === "main-course" ||
            r.category === "pasta"),
      );
      if (dinnerMatch) return dinnerMatch;
    }

    // Fallback: recipe with high quality image
    const fallback = allRecipes.find(
      (r) => r.image && r.image.startsWith("http") && r.category !== "dessert",
    );
    return fallback || allRecipes[0];
  }, [allRecipes, isSlotPlanned, currentSlotRecipeId, activeSlot]);

  const handleAddToPlan = useCallback(() => {
    if (!displayRecipe) return;

    const currentPlan = getStoredMealPlan();
    const currentDay = currentPlan[today] || {
      breakfast: null,
      morning_snack: null,
      lunch: null,
      afternoon_snack: null,
      dinner: null,
      evening_snack: null,
    };

    const updatedPlan: MealPlan = {
      ...currentPlan,
      [today]: {
        ...currentDay,
        [activeSlot]: displayRecipe.id,
      },
    };

    saveMealPlan(updatedPlan);
    setMealPlan(updatedPlan);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("meal_plan_updated", { detail: updatedPlan }));
  }, [displayRecipe, today, activeSlot]);

  if (!displayRecipe) return null;

  const cookTime = displayRecipe.cookTime;
  const calories = displayRecipe.calories || displayRecipe.nutrition?.calories;
  const protein =
    formatProteinLabel(displayRecipe.nutrition?.protein) ||
    (displayRecipe.category === "pasta" || displayRecipe.category === "main-course"
      ? "42g protein"
      : undefined);

  const includesText =
    displayRecipe.ingredients && displayRecipe.ingredients.length > 0
      ? displayRecipe.ingredients.slice(0, 4).join(", ") +
        (displayRecipe.ingredients.length > 4 ? " and more..." : "")
      : "Selected fresh culinary ingredients";

  return (
    <section
      aria-label="Daily Inspiration"
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-[#141210] dark:bg-[#141210] border border-stone-800/80 dark:border-white/10 shadow-xl flex flex-col md:flex-row md:items-center md:h-[220px] lg:h-[235px] transition-all"
    >
      {/* LEFT COLUMN: Content */}
      <div className="w-full md:w-[60%] lg:w-[62%] p-5 sm:p-6 lg:p-7 flex flex-col justify-center z-10">
        {/* Top row: Badge on left + Meal slot switcher on right */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase text-amber-500">
            <SparklesIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              {isSlotPlanned
                ? `Planned for ${activeSlot}`
                : `${activeSlot} Inspiration`}
            </span>
          </div>

          {/* Meal Slot Switcher */}
          <div className="flex items-center gap-1 rounded-full bg-black/60 border border-white/10 p-0.5 sm:p-1">
            {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((slot) => {
              const isSelected = activeSlot === slot;
              const slotHasMeal = Boolean(todayPlan && todayPlan[slot]);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setActiveSlot(slot)}
                  className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/15 text-white font-bold shadow-xs border border-white/10"
                      : "text-stone-400 hover:text-stone-200 font-medium"
                  }`}
                >
                  <span>{formatSlotLabel(slot)}</span>
                  {slotHasMeal && !isSelected && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2 truncate">
          {displayRecipe.title}
        </h3>

        {/* Meta metrics row: Cook time, Calories, Protein */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-stone-300 mb-2">
          {cookTime && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{cookTime}m</span>
            </span>
          )}
          {calories && (
            <span className="flex items-center gap-1">
              <FlameIcon className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span>{calories} kcal</span>
            </span>
          )}
          {protein && (
            <span className="flex items-center gap-1">
              <span className="text-xs">🥩</span>
              <span>{protein}</span>
            </span>
          )}
        </div>

        {/* Ingredients preview line */}
        <p className="text-xs text-stone-400 truncate leading-normal mb-4">
          <strong className="text-stone-200 font-bold">Includes: </strong>
          <span>{includesText}</span>
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {isSlotPlanned ? (
            <Link
              href={`/recipes/${displayRecipe.id}?cook=true`}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Start Cooking</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToPlan}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add to {formatSlotLabel(activeSlot)}</span>
            </button>
          )}

          <Link
            href={`/recipes/${displayRecipe.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 text-stone-100 border border-white/10 font-bold px-4 py-2 sm:px-4.5 sm:py-2.5 text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>Recipe Details</span>
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN: Dish photo with smooth horizontal gradient blend */}
      <div className="w-full md:w-[45%] lg:w-[42%] relative h-44 md:h-full md:absolute md:inset-y-0 md:right-0 overflow-hidden shrink-0">
        <Link href={`/recipes/${displayRecipe.id}`} className="block w-full h-full cursor-pointer group">
          <img
            src={displayRecipe.image || DEFAULT_CULINARY_HERO_IMAGE}
            alt={displayRecipe.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Subtle horizontal gradient mask on desktop */}
          <div className="absolute inset-y-0 left-0 w-24 sm:w-36 bg-gradient-to-r from-[#141210] to-transparent pointer-events-none hidden md:block" />
          {/* Vertical gradient mask on mobile */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#141210] to-transparent pointer-events-none md:hidden" />
        </Link>
      </div>
    </section>
  );
}
