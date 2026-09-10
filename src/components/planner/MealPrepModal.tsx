"use client";

import { useState, useEffect } from "react";
import type { AppRecipe } from "../../lib/types";
import { WEEK_DAYS, formatWeekDay, type WeekDay } from "../../lib/planner";
import { ClockIcon, FlameIcon, PlateIcon, MealPrepIcon } from "./PlannerIcons";

type MealPrepModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipe: AppRecipe;
  fromDay: WeekDay;
  onApplyLunches: (selectedDays: WeekDay[]) => void;
};

export default function MealPrepModal({
  isOpen,
  onClose,
  recipe,
  fromDay,
  onApplyLunches,
}: MealPrepModalProps) {
  const fromIndex = WEEK_DAYS.indexOf(fromDay);
  const availableDays = [
    ...WEEK_DAYS.slice(fromIndex + 1),
    ...WEEK_DAYS.slice(0, fromIndex),
  ];

  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([
    availableDays[0] || "tuesday",
  ]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: WeekDay) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleQuickPreset = (count: number) => {
    setSelectedDays(availableDays.slice(0, count));
  };

  const handleApply = () => {
    onApplyLunches(selectedDays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* SOLID HIGH-SPEED BACKDROP */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 transition-opacity duration-200"
      />

      {/* WIDE MODAL DIALOG */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-7 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100 animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/8">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
              Batch Cook & Meal Prep
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 mt-0.5">
              Cook extra portions from {formatWeekDay(fromDay)} dinner and fill lunch slots
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer text-base font-bold"
          >
            ✕
          </button>
        </div>

        {/* RECIPE PREVIEW CARD */}
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-[#15241b]/50">
          <div className="relative h-15 w-15 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-stone-950 shadow-xs">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <PlateIcon className="h-8 w-8 text-slate-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="truncate text-sm sm:text-base font-bold text-slate-950 dark:text-stone-50">
              {recipe.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-stone-400">
              {recipe.cookTime && (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 text-slate-400" />
                  <span>{recipe.cookTime}m</span>
                </span>
              )}
              {recipe.calories && (
                <span className="inline-flex items-center gap-1">
                  • <FlameIcon className="h-3 w-3 text-amber-500" />
                  <span>{recipe.calories} kcal</span>
                </span>
              )}
              <span>• {recipe.ingredients.length} ingredients</span>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS & PRESET BUTTONS */}
        <div className="mt-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500">
              Select which lunches to fill:
            </label>

            {/* QUICK PRESET PILLS */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset(1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/12 transition cursor-pointer"
              >
                Tomorrow (+1)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(2)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/12 transition cursor-pointer"
              >
                Next 2 days (+2)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(3)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/12 transition cursor-pointer"
              >
                Next 3 days (+3)
              </button>
            </div>
          </div>

          {/* DAY CHECKBOXES GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {availableDays.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white font-bold dark:border-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/8 dark:bg-white/4 dark:text-stone-400 dark:hover:bg-white/8"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">{formatWeekDay(day)}</p>
                    <p className={`text-[10px] ${isSelected ? "text-slate-300 dark:text-slate-700" : "text-slate-400"}`}>Lunch slot</p>
                  </div>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-lg text-xs font-black ${
                    isSelected
                      ? "bg-white text-slate-900 dark:bg-slate-950 dark:text-white"
                      : "border border-slate-300 dark:border-white/20"
                  }`}>
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedDays.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <MealPrepIcon className="h-4 w-4 text-white" />
            <span>Fill {selectedDays.length} Lunch{selectedDays.length === 1 ? "" : "es"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
