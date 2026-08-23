"use client";

import { useState } from "react";
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
  // Suggest the next days in chronological order
  const availableDays = [
    ...WEEK_DAYS.slice(fromIndex + 1),
    ...WEEK_DAYS.slice(0, fromIndex),
  ];

  // Default select the immediate next day
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([
    availableDays[0] || "tuesday",
  ]);

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
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* MODAL DIALOG */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#17120f] p-6 text-stone-100 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 text-xl font-bold">
              🥡
            </span>
            <div>
              <h3 className="text-base font-bold text-[#fff8ef]">
                Meal Prep / Matlådor
              </h3>
              <p className="text-xs text-amber-200/70">
                Batch-cooking from {formatWeekDay(fromDay)} dinner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:bg-white/15 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* RECIPE PREVIEW CARD */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#211915]/80 p-3">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-12 w-12 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-xs sm:text-sm font-bold text-[#fff8ef]">
              {recipe.title}
            </h4>
            <p className="text-[11px] text-stone-400">
              {recipe.cookTime ? `⏱ ${recipe.cookTime}m • ` : ""}
              {recipe.calories ? `🔥 ${recipe.calories} kcal` : `${recipe.ingredients.length} ingredients`}
            </p>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Select lunch slots to fill:
            </label>

            {/* QUICK PRESET PILLS */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset(2)}
                className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                Next 2 days
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(3)}
                className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                Next 3 days
              </button>
            </div>
          </div>

          {/* DAY CHECKBOXES */}
          <div className="grid grid-cols-2 gap-2">
            {availableDays.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-200 shadow-sm"
                      : "border-white/8 bg-white/3 text-stone-400 hover:bg-white/6 hover:text-stone-200"
                  }`}
                >
                  <span>{formatWeekDay(day)} Lunch</span>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-md text-[10px] font-bold ${
                    isSelected ? "bg-amber-500 text-stone-950" : "border border-white/20"
                  }`}>
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedDays.length === 0}
            className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-600 transition cursor-pointer shadow-lg shadow-amber-400/20 disabled:opacity-40"
          >
            Fill {selectedDays.length} Lunch{selectedDays.length === 1 ? "" : "es"} 🥡
          </button>
        </div>
      </div>
    </div>
  );
}
