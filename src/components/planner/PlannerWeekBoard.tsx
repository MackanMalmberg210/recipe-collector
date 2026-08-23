"use client";

import { useState } from "react";
import PlannerDayCard from "./PlannerDayCard";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
import { WEEK_DAYS } from "../../lib/planner";

type PlannerWeekBoardProps = {
  recipes: AppRecipe[];
  mealPlan: Record<WeekDay, DayPlan>;
  dailyCalorieTarget: number;
  viewMode?: "spacious" | "panoramic";
  onSelectRecipe: (
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => void;
  onClearSlot: (day: WeekDay, slot: MealSlot) => void;
  onClearDay: (day: WeekDay) => void;
  onSurpriseMeal: (day: WeekDay, slot: MealSlot) => void;
  onApplyMealPrep: (fromDay: WeekDay, recipe: AppRecipe, targetDays: WeekDay[]) => void;
  onMoveMeal: (
    fromDay: WeekDay,
    fromSlot: MealSlot,
    toDay: WeekDay,
    toSlot: MealSlot,
  ) => void;
};

export default function PlannerWeekBoard({
  recipes,
  mealPlan,
  dailyCalorieTarget,
  viewMode = "spacious",
  onSelectRecipe,
  onClearSlot,
  onClearDay,
  onSurpriseMeal,
  onApplyMealPrep,
  onMoveMeal,
}: PlannerWeekBoardProps) {
  const [draggedMeal, setDraggedMeal] = useState<{
    day: WeekDay;
    slot: MealSlot;
    recipeId: number;
  } | null>(null);

  // Helper to get previous day's dinner recipe
  const getPreviousDayDinnerRecipe = (dayIndex: number) => {
    const prevIndex = dayIndex === 0 ? WEEK_DAYS.length - 1 : dayIndex - 1;
    const prevDay = WEEK_DAYS[prevIndex];
    const prevDinnerId = mealPlan[prevDay]?.dinner;
    if (!prevDinnerId) return null;
    return recipes.find((r) => r.id === prevDinnerId) || null;
  };

  const handleDragStart = (day: WeekDay, slot: MealSlot, recipeId: number) => {
    setDraggedMeal({ day, slot, recipeId });
  };

  const handleDrop = (targetDay: WeekDay, targetSlot: MealSlot) => {
    if (!draggedMeal) return;
    onMoveMeal(draggedMeal.day, draggedMeal.slot, targetDay, targetSlot);
    setDraggedMeal(null);
  };

  return (
    <div
      className={
        viewMode === "panoramic"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7"
          : "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      }
    >
      {WEEK_DAYS.map((day, index) => {
        const dayPlan = mealPlan[day];
        const prevDinner = getPreviousDayDinnerRecipe(index);

        return (
          <PlannerDayCard
            key={day}
            day={day}
            recipes={recipes}
            dayPlan={dayPlan}
            previousDayDinnerRecipe={prevDinner}
            dailyCalorieTarget={dailyCalorieTarget}
            onSelectRecipe={onSelectRecipe}
            onClearSlot={onClearSlot}
            onClearDay={onClearDay}
            onSurpriseMeal={onSurpriseMeal}
            onApplyMealPrep={onApplyMealPrep}
            onDragMealStart={handleDragStart}
            onDropMeal={handleDrop}
            isDraggingActive={Boolean(draggedMeal)}
          />
        );
      })}
    </div>
  );
}
