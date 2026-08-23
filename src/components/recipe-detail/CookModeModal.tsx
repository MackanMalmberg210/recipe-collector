"use client";

import { useState, useEffect } from "react";
import type { AppRecipe } from "../../lib/types";
import { convertIngredient } from "../../lib/unitConverter";
import { getStoredUserSettings, type MeasurementUnitSystem } from "../../lib/settings";

type CookModeModalProps = {
  recipe: AppRecipe;
  isOpen: boolean;
  onClose: () => void;
};

export default function CookModeModal({
  recipe,
  isOpen,
  onClose,
}: CookModeModalProps) {
  const steps = recipe.instructions || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [unitSystem, setUnitSystem] = useState<MeasurementUnitSystem>("metric");

  useEffect(() => {
    setUnitSystem(getStoredUserSettings().unitSystem || "metric");
  }, [isOpen]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Reset step on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsTimerRunning(false);
      setTimerSeconds(null);
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Detect time in current step text (e.g. "3-5 minutes", "20 mins", "1 hour")
  const detectTimeInStep = (text: string): number | null => {
    const minMatch = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:minutes|minute|mins|min)\b/i);
    if (minMatch) {
      const minVal = Number(minMatch[2] || minMatch[1]);
      return minVal * 60;
    }
    const hourMatch = text.match(/(\d+)\s*(?:hours|hour|hrs|hr)\b/i);
    if (hourMatch) {
      return Number(hourMatch[1]) * 3600;
    }
    return null;
  };

  const detectedSeconds = detectTimeInStep(currentStep);

  const startTimerWithSeconds = (secs: number) => {
    setTimerSeconds(secs);
    setIsTimerRunning(true);
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#120e0c] text-stone-100 animate-in fade-in duration-200">
      {/* TOP KITCHEN HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 sm:px-10 bg-[#17120f]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🍳</span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#fff8ef] line-clamp-1">
              Cook Mode: {recipe.title}
            </h2>
            <p className="text-xs text-amber-200/60">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowIngredients(!showIngredients)}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              showIngredients
                ? "border-amber-500 bg-amber-500/20 text-amber-200"
                : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            🥕 Ingredients ({recipe.ingredients.length})
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:bg-white/15 hover:text-white transition cursor-pointer"
            title="Exit Cook Mode"
          >
            ✕
          </button>
        </div>
      </header>

      {/* PROGRESS TRACKER */}
      <div className="h-1.5 w-full bg-white/5">
        <div
          className="h-full bg-amber-400 transition-all duration-300"
          style={{
            width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
          }}
        />
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* STEP CONTENT AREA */}
        <main className="flex flex-1 flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-4xl mx-auto overflow-y-auto">
          <div className="space-y-6 my-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold leading-snug tracking-tight text-[#fff8ef]">
              {currentStep}
            </h3>

            {/* IN-STEP TIMER HELPER */}
            {detectedSeconds && (
              <div className="mt-8 flex flex-wrap items-center gap-4 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-4 sm:p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl">
                  ⏱️
                </div>
                <div className="flex-1 min-w-48">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Step Timer Detected
                  </p>
                  <p className="text-xl font-mono font-bold text-white">
                    {timerSeconds !== null
                      ? formatTimer(timerSeconds)
                      : formatTimer(detectedSeconds)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {timerSeconds === null ? (
                    <button
                      type="button"
                      onClick={() => startTimerWithSeconds(detectedSeconds)}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-stone-950 hover:bg-amber-600 transition cursor-pointer shadow-md"
                    >
                      Start Timer
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                          isTimerRunning
                            ? "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                            : "bg-emerald-400 text-stone-950 font-bold hover:bg-emerald-300"
                        }`}
                      >
                        {isTimerRunning ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTimerRunning(false);
                          setTimerSeconds(null);
                        }}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/15 cursor-pointer"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM STEP CONTROLS (Clean, unambiguous Previous / Next) */}
          <footer className="mt-12 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
            <button
              type="button"
              disabled={isFirstStep}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className={`rounded-2xl border px-6 py-3.5 text-sm font-bold transition cursor-pointer ${
                isFirstStep
                  ? "border-white/5 text-stone-600 cursor-not-allowed"
                  : "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              ← Previous Step
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onClose();
                } else {
                  setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                }
              }}
              className={`rounded-2xl px-8 py-3.5 text-sm font-bold shadow-xl transition cursor-pointer ${
                isLastStep
                  ? "bg-emerald-400 text-stone-950 hover:bg-emerald-300 shadow-emerald-400/20"
                  : "bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-amber-400/20"
              }`}
            >
              {isLastStep ? "Finish Cooking 🎉" : "Next Step →"}
            </button>
          </footer>
        </main>

        {/* SIDE INGREDIENTS SHEET */}
        {showIngredients && (
          <aside className="w-80 sm:w-96 border-l border-white/10 bg-[#17120f] p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <h4 className="text-base font-bold text-[#fff8ef] mb-4">
              Ingredients Quick View
            </h4>
            <ul className="space-y-2.5">
              {recipe.ingredients.map((ing, i) => {
                const { amount, unit, name } = convertIngredient(ing, unitSystem);
                const quantity = [amount, unit].filter(Boolean).join(" ");
                return (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/3 p-3 text-xs text-stone-200"
                  >
                    {quantity && (
                      <span className="rounded-lg bg-amber-400/15 border border-amber-400/25 px-2 py-0.5 font-bold text-amber-300 font-mono shrink-0">
                        {quantity}
                      </span>
                    )}
                    <span className="truncate flex-1">{name || ing}</span>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
