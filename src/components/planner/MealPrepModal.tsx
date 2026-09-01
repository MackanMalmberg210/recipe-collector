"use client";

import { useState, useEffect } from "react";
import type { AppRecipe } from "../../lib/types";
import { WEEK_DAYS, formatWeekDay, type WeekDay } from "../../lib/planner";

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
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 text-stone-900 shadow-2xl transition-all dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100 animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4 dark:border-white/8">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
              Batch Cook & Meal Prep
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Cook extra portions from {formatWeekDay(fromDay)} dinner and fill lunch slots
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer text-base font-bold"
          >
            ✕
          </button>
        </div>

        {/* RECIPE PREVIEW CARD */}
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 dark:border-emerald-500/25 dark:bg-[#15241b]/50">
          <div className="relative h-15 w-15 shrink-0 overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-950 shadow-sm">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">🍲</div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="truncate text-sm sm:text-base font-bold text-stone-950 dark:text-stone-50">
              {recipe.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono">
              {recipe.cookTime && <span>⏱ {recipe.cookTime}m</span>}
              {recipe.calories && <span>• 🔥 {recipe.calories} kcal</span>}
              <span>• {recipe.ingredients.length} ingredients</span>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS & PRESET BUTTONS */}
        <div className="mt-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Select which lunches to fill:
            </label>

            {/* QUICK PRESET PILLS */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset(1)}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/12 transition cursor-pointer"
              >
                Tomorrow (+1)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(2)}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/12 transition cursor-pointer"
              >
                Next 2 days (+2)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(3)}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/8 dark:text-stone-300 dark:hover:bg-white/12 transition cursor-pointer"
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
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 font-bold dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-300 shadow-2xs"
                      : "border-stone-200 bg-stone-50/70 text-stone-600 hover:bg-stone-100 dark:border-white/8 dark:bg-white/4 dark:text-stone-400 dark:hover:bg-white/8"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">{formatWeekDay(day)}</p>
                    <p className="text-[10px] text-stone-400">Lunch slot</p>
                  </div>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-lg text-xs font-black ${
                    isSelected
                      ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-stone-950"
                      : "border border-stone-300 dark:border-white/20"
                  }`}>
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-4 dark:border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedDays.length === 0}
            className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            Fill {selectedDays.length} Lunch{selectedDays.length === 1 ? "" : "es"} 📦
          </button>
        </div>
      </div>
    </div>
  );
}
